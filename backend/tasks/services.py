import logging

from django.db.models import Count, Q
from django.utils import timezone

from .models import Task, TaskStatus

logger = logging.getLogger(__name__)


def validate_task_assignment(project, user):
    """
    Check that a user is a member of the given project.

    Returns (is_valid: bool, message: str).
    """
    if not project.team_members.filter(id=user.id).exists():
        return False, f"User '{user.username}' is not a member of project '{project.name}'."
    return True, ""


def get_dashboard_stats(user):
    """
    Build aggregated dashboard statistics using optimized queries.

    Admin: global stats across all tasks.
    Member: stats only for their assigned tasks.

    Uses Django's aggregate() with conditional Count to avoid N+1.
    """
    today = timezone.now().date()

    if user.is_admin:
        queryset = Task.objects.all()
    else:
        queryset = Task.objects.filter(assigned_to=user)

    stats = queryset.aggregate(
        total_tasks=Count("id"),
        completed_tasks=Count("id", filter=Q(status=TaskStatus.DONE)),
        pending_tasks=Count(
            "id",
            filter=Q(status__in=[TaskStatus.TODO, TaskStatus.IN_PROGRESS]),
        ),
        overdue_tasks=Count(
            "id",
            filter=Q(due_date__lt=today) & ~Q(status=TaskStatus.DONE),
        ),
    )

    # Tasks grouped by status
    status_counts = (
        queryset.values("status")
        .annotate(count=Count("id"))
        .order_by("status")
    )
    tasks_by_status = {item["status"]: item["count"] for item in status_counts}

    # Ensure all statuses are represented
    for status_choice in TaskStatus:
        if status_choice.value not in tasks_by_status:
            tasks_by_status[status_choice.value] = 0

    stats["tasks_by_status"] = tasks_by_status

    logger.info(
        "Dashboard stats computed for user %s: total=%d, completed=%d, overdue=%d",
        user.email,
        stats["total_tasks"],
        stats["completed_tasks"],
        stats["overdue_tasks"],
    )

    return stats
