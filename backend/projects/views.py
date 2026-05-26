from rest_framework import status
from rest_framework.decorators import action
from rest_framework.viewsets import ModelViewSet

from core.responses import api_response

from .models import Project
from .permissions import IsProjectAdminOrMemberReadOnly
from .serializers import (
    ProjectCreateUpdateSerializer,
    ProjectDetailSerializer,
    ProjectListSerializer,
    TeamMemberSerializer,
)
from .services import add_team_member, remove_team_member


class ProjectViewSet(ModelViewSet):
    """
    ViewSet for Project CRUD and team member management.

    List:    GET    /api/v1/projects/
    Create:  POST   /api/v1/projects/          (Admin only)
    Detail:  GET    /api/v1/projects/{id}/
    Update:  PUT    /api/v1/projects/{id}/      (Admin only)
    Partial: PATCH  /api/v1/projects/{id}/      (Admin only)
    Delete:  DELETE /api/v1/projects/{id}/      (Admin only)

    Actions:
    - POST /api/v1/projects/{id}/add-member/      (Admin only)
    - POST /api/v1/projects/{id}/remove-member/    (Admin only)
    """

    permission_classes = [IsProjectAdminOrMemberReadOnly]

    def get_queryset(self):
        user = self.request.user

        queryset = Project.objects.select_related("created_by").prefetch_related(
            "team_members"
        )

        if user.is_admin:
            return queryset.all()

        # Members see only projects they belong to
        return queryset.filter(team_members=user).distinct()

    def get_serializer_class(self):
        if self.action == "list":
            return ProjectListSerializer
        if self.action in ("create", "update", "partial_update"):
            return ProjectCreateUpdateSerializer
        return ProjectDetailSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        return api_response(
            success=True,
            message="Project created successfully.",
            data=ProjectDetailSerializer(serializer.instance).data,
            status=status.HTTP_201_CREATED,
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return api_response(
            success=True,
            message="Project retrieved successfully.",
            data=serializer.data,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return api_response(
            success=True,
            message="Project updated successfully.",
            data=ProjectDetailSerializer(serializer.instance).data,
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        project_name = instance.name
        self.perform_destroy(instance)
        return api_response(
            success=True,
            message=f"Project '{project_name}' deleted successfully.",
            status=status.HTTP_200_OK,
        )

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return api_response(
            success=True,
            message="Projects retrieved successfully.",
            data=serializer.data,
        )

    @action(detail=True, methods=["post"], url_path="add-member")
    def add_member(self, request, pk=None):
        """Add a team member to this project. Admin only."""
        if not request.user.is_admin:
            return api_response(
                success=False,
                message="Permission denied.",
                errors={"detail": "Only admins can add team members."},
                status=status.HTTP_403_FORBIDDEN,
            )

        project = self.get_object()
        serializer = TeamMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        success, message = add_team_member(
            project, serializer.validated_data["user_id"]
        )

        if not success:
            return api_response(
                success=False,
                message=message,
                status=status.HTTP_400_BAD_REQUEST,
            )

        project.refresh_from_db()
        return api_response(
            success=True,
            message=message,
            data=ProjectDetailSerializer(project).data,
        )

    @action(detail=True, methods=["post"], url_path="remove-member")
    def remove_member(self, request, pk=None):
        """Remove a team member from this project. Admin only. Auto-unassigns tasks."""
        if not request.user.is_admin:
            return api_response(
                success=False,
                message="Permission denied.",
                errors={"detail": "Only admins can remove team members."},
                status=status.HTTP_403_FORBIDDEN,
            )

        project = self.get_object()
        serializer = TeamMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        success, message = remove_team_member(
            project, serializer.validated_data["user_id"]
        )

        if not success:
            return api_response(
                success=False,
                message=message,
                status=status.HTTP_400_BAD_REQUEST,
            )

        project.refresh_from_db()
        return api_response(
            success=True,
            message=message,
            data=ProjectDetailSerializer(project).data,
        )
