import logging

from rest_framework import status
from rest_framework.exceptions import (
    APIException,
    AuthenticationFailed,
    NotAuthenticated,
    NotFound,
    PermissionDenied,
    ValidationError,
)
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom DRF exception handler that wraps all errors into
    the standardized API response envelope.

    No raw tracebacks are ever exposed to the client.
    """
    # Let DRF handle the exception first to get the standard response
    response = exception_handler(exc, context)

    if response is None:
        # Unhandled exception — log it and return a generic 500
        logger.exception(
            "Unhandled exception in %s",
            context.get("view", "unknown"),
        )
        return _build_error_response(
            message="An unexpected error occurred.",
            errors={"detail": "Internal server error."},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Map specific exception types to clean messages
    if isinstance(exc, ValidationError):
        return _build_error_response(
            message="Validation failed.",
            errors=exc.detail,
            status_code=response.status_code,
        )

    if isinstance(exc, (AuthenticationFailed, NotAuthenticated)):
        logger.warning(
            "Auth failure: %s | View: %s",
            str(exc),
            context.get("view", "unknown"),
        )
        return _build_error_response(
            message="Authentication failed.",
            errors={"detail": str(exc.detail)},
            status_code=response.status_code,
        )

    if isinstance(exc, PermissionDenied):
        return _build_error_response(
            message="Permission denied.",
            errors={"detail": str(exc.detail)},
            status_code=response.status_code,
        )

    if isinstance(exc, NotFound):
        return _build_error_response(
            message="Resource not found.",
            errors={"detail": str(exc.detail)},
            status_code=response.status_code,
        )

    if isinstance(exc, APIException):
        return _build_error_response(
            message="An error occurred.",
            errors=exc.detail,
            status_code=response.status_code,
        )

    return _build_error_response(
        message="An error occurred.",
        errors=response.data,
        status_code=response.status_code,
    )


def _build_error_response(message, errors, status_code):
    """Build a Response object matching the standard API envelope."""
    from rest_framework.response import Response

    return Response(
        {
            "success": False,
            "message": message,
            "data": None,
            "errors": errors,
            "status_code": status_code,
        },
        status=status_code,
    )
