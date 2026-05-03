import logging

from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User

logger = logging.getLogger(__name__)


def create_user(validated_data):
    """
    Create a new user with validated data.

    Returns the created User instance.
    """
    user = User.objects.create_user(**validated_data)
    logger.info("New user registered: %s (role: %s)", user.email, user.role)
    return user


def authenticate_user(email, password):
    """
    Authenticate a user by email and password.

    Returns a dict with user data and JWT tokens on success.
    Returns None on failure.
    """
    user = authenticate(email=email, password=password)

    if user is None:
        logger.warning("Failed login attempt for email: %s", email)
        return None

    if not user.is_active:
        logger.warning("Login attempt for inactive user: %s", email)
        return None

    tokens = get_tokens_for_user(user)
    logger.info("User logged in: %s", email)

    return {
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
        },
        "tokens": tokens,
    }


def get_tokens_for_user(user):
    """Generate JWT access and refresh tokens for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }
