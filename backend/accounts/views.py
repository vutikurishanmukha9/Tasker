from rest_framework import status
from rest_framework.generics import GenericAPIView, ListAPIView, RetrieveUpdateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated

from core.responses import api_response

from .models import User
from .permissions import IsAdmin
from .serializers import (
    LoginSerializer,
    ProfileUpdateSerializer,
    SignupSerializer,
    UserListSerializer,
    UserSerializer,
)
from .services import authenticate_user, get_tokens_for_user


class SignupView(GenericAPIView):
    """
    POST /api/v1/auth/signup/

    Register a new user account. Returns JWT tokens on success.
    """

    serializer_class = SignupSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        tokens = get_tokens_for_user(user)

        return api_response(
            success=True,
            message="Account created successfully.",
            data={
                "user": UserSerializer(user).data,
                "tokens": tokens,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(GenericAPIView):
    """
    POST /api/v1/auth/login/

    Authenticate with email and password. Returns JWT tokens.
    """

    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

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

        return api_response(
            success=True,
            message="Login successful.",
            data=result,
        )


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
