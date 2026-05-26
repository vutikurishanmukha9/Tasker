from django.conf import settings
from rest_framework import status
from rest_framework.generics import GenericAPIView, ListAPIView, RetrieveUpdateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from accounts.authentication import enforce_csrf
from core.responses import api_response

from .models import User
from .serializers import (
    LoginSerializer,
    ProfileUpdateSerializer,
    SignupSerializer,
    UserListSerializer,
    UserSerializer,
)
from .cookies import clear_auth_cookies, set_auth_cookies, set_csrf_cookie
from .services import authenticate_user, get_tokens_for_user
from .throttles import LoginEmailRateThrottle, SignupRateThrottle, TokenRefreshRateThrottle


class SignupView(GenericAPIView):
    """
    POST /api/v1/auth/signup/

    Register a new user account and set JWT cookies on success.
    """

    serializer_class = SignupSerializer
    permission_classes = [AllowAny]
    throttle_classes = [SignupRateThrottle]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        tokens = get_tokens_for_user(user)

        response = api_response(
            success=True,
            message="Account created successfully.",
            data={"user": UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )
        set_auth_cookies(response, tokens["access"], tokens["refresh"])
        return set_csrf_cookie(request, response)


class LoginView(GenericAPIView):
    """
    POST /api/v1/auth/login/

    Authenticate with email and password and set JWT cookies.
    """

    serializer_class = LoginSerializer
    permission_classes = [AllowAny]
    throttle_classes = [LoginEmailRateThrottle]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = authenticate_user(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )

        if result is None:
            return api_response(
                success=False,
                message="Invalid email or password.",
                errors={"detail": "Unable to authenticate with provided credentials."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        tokens = result.pop("tokens")
        response = api_response(
            success=True,
            message="Login successful.",
            data=result,
        )
        set_auth_cookies(response, tokens["access"], tokens["refresh"])
        return set_csrf_cookie(request, response)


class TokenRefreshCookieView(GenericAPIView):
    """
    POST /api/v1/auth/token/refresh/

    Refresh JWT cookies using the HttpOnly refresh cookie.
    """

    permission_classes = [AllowAny]
    throttle_classes = [TokenRefreshRateThrottle]

    def post(self, request):
        enforce_csrf(request)
        raw_refresh = request.COOKIES.get(settings.JWT_REFRESH_COOKIE_NAME)

        if not raw_refresh:
            return api_response(
                success=False,
                message="Authentication failed.",
                errors={"detail": "Refresh token cookie is missing."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            refresh = RefreshToken(raw_refresh)
            access_token = str(refresh.access_token)

            if api_settings.ROTATE_REFRESH_TOKENS:
                refresh.set_jti()
                refresh.set_exp()
                refresh.set_iat()

            response = api_response(
                success=True,
                message="Token refreshed successfully.",
                data=None,
            )
            set_auth_cookies(response, access_token, str(refresh))
            return set_csrf_cookie(request, response)
        except TokenError:
            response = api_response(
                success=False,
                message="Authentication failed.",
                errors={"detail": "Refresh token is invalid or expired."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
            clear_auth_cookies(response)
            return response


class LogoutView(GenericAPIView):
    """POST /api/v1/auth/logout/ — Clear auth cookies."""

    permission_classes = [AllowAny]

    def post(self, request):
        enforce_csrf(request)
        response = api_response(
            success=True,
            message="Logged out successfully.",
            data=None,
        )
        return clear_auth_cookies(response)


class ProfileView(RetrieveUpdateAPIView):
    """
    GET  /api/v1/auth/profile/ — Retrieve current user's profile.
    PATCH /api/v1/auth/profile/ — Update current user's profile.
    """

    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return ProfileUpdateSerializer
        return UserSerializer

    def retrieve(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object())
        return api_response(
            success=True,
            message="Profile retrieved successfully.",
            data=serializer.data,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return api_response(
            success=True,
            message="Profile updated successfully.",
            data=serializer.data,
        )


class UserListView(ListAPIView):
    """
    GET /api/v1/auth/users/

    Admin: List all users (or filter by project_id).
    Member: Must provide project_id — returns only teammates from that project.
    """

    serializer_class = UserListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        project_id = self.request.query_params.get("project_id")

        if user.is_admin:
            if project_id:
                return User.objects.filter(
                    projects__id=project_id
                ).distinct()
            return User.objects.all()

        # Members must specify a project
        if not project_id:
            return User.objects.none()

        # Only return teammates if the member belongs to the project
        return User.objects.filter(
            projects__id=project_id,
            projects__team_members=user,
        ).distinct()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return api_response(
            success=True,
            message="Users retrieved successfully.",
            data=serializer.data,
        )
