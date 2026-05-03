from rest_framework.response import Response
from rest_framework import status as http_status


def api_response(
    success=True,
    message="",
    data=None,
    errors=None,
    status=http_status.HTTP_200_OK,
):
    """
    Standardized API response envelope.

    All API endpoints should return responses through this helper
    to ensure a consistent JSON structure for the frontend.
    """
    return Response(
        {
            "success": success,
            "message": message,
            "data": data,
            "errors": errors,
            "status_code": status,
        },
        status=status,
    )
