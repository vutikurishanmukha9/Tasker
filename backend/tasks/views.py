from django.utils import timezone
from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from accounts.permissions import IsAdmin
from core.responses import api_response

from .models import Task, TaskStatus
from .permissions import IsAdminOrAssignedMember
from .serializers import (
    TaskCreateSerializer,
    TaskDetailSerializer,
    TaskListSerializer,
    TaskUpdateSerializer,
)
from .services import get_dashboard_stats


class TaskViewSet(ModelViewSet):
    """
    ViewSet for Task CRUD operations.

    List:    GET    /api/v1/tasks/               (role-filtered)
    Create:  POST   /api/v1/tasks/               (Admin only)
    Detail:  GET    /api/v1/tasks/{id}/
    Update:  PUT    /api/v1/tasks/{id}/           (Admin or assigned member)
    Partial: PATCH  /api/v1/tasks/{id}/           (Admin or assigned member)
    Delete:  DELETE /api/v1/tasks/{id}/           (Admin only)

    Query params:
    - ?status=todo|in_progress|done
    - ?project=<project_id>
    - ?assigned_to=<user_id>
    - ?overdue=true
    """

    permission_classes = [IsAdminOrAssignedMember]
    pagination_class = None

    def get_queryset(self):
        user = self.request.user

        queryset = Task.objects.select_related(
            "project", "assigned_to", "created_by"
        )

        # Role-based filtering
        if not user.is_admin:
            queryset = queryset.filter(assigned_to=user)

        # Query parameter filters
        params = self.request.query_params

        status_filter = params.get("status")
        if status_filter and status_filter in TaskStatus.values:
            queryset = queryset.filter(status=status_filter)

        project_filter = params.get("project")
        if project_filter:
            queryset = queryset.filter(project_id=project_filter)

        assigned_filter = params.get("assigned_to")
        if assigned_filter and user.is_admin:
            queryset = queryset.filter(assigned_to_id=assigned_filter)

        overdue_filter = params.get("overdue")
        if overdue_filter and overdue_filter.lower() == "true":
            today = timezone.now().date()
            queryset = queryset.filter(due_date__lt=today).exclude(
                status=TaskStatus.DONE
            )

        return queryset

    def get_serializer_class(self):
        if self.action == "list":
            return TaskListSerializer
        if self.action == "create":
            return TaskCreateSerializer
        if self.action in ("update", "partial_update"):
            return TaskUpdateSerializer
        return TaskDetailSerializer

    def get_permissions(self):
        """Admin-only for create and delete."""
        if self.action == "create":
            return [IsAdmin()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        # Return full detail view
        task = Task.objects.select_related(
            "project", "assigned_to", "created_by"
        ).get(id=serializer.instance.id)

        return api_response(
            success=True,
            message="Task created successfully.",
            data=TaskDetailSerializer(task).data,
            status=status.HTTP_201_CREATED,
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return api_response(
            success=True,
            message="Task retrieved successfully.",
            data=serializer.data,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(
            instance, data=request.data, partial=partial
        )
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Return full detail view
        task = Task.objects.select_related(
            "project", "assigned_to", "created_by"
        ).get(id=instance.id)

        return api_response(
            success=True,
            message="Task updated successfully.",
            data=TaskDetailSerializer(task).data,
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        task_title = instance.title
        self.perform_destroy(instance)
        return api_response(
            success=True,
            message=f"Task '{task_title}' deleted successfully.",
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
            message="Tasks retrieved successfully.",
            data=serializer.data,
        )


class DashboardView(GenericAPIView):
    """
    GET /api/v1/dashboard/

    Returns aggregated task statistics:
    - total_tasks
    - completed_tasks
    - pending_tasks
    - overdue_tasks
    - tasks_by_status

    Admin: global stats. Member: own assigned task stats.
    Uses optimized aggregate queries (no N+1).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        stats = get_dashboard_stats(request.user)

        return api_response(
            success=True,
            message="Dashboard data retrieved successfully.",
            data=stats,
        )
