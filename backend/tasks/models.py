from django.conf import settings
from django.db import models
from django.utils import timezone


class TaskStatus(models.TextChoices):
    """Task status options — used for both model and API validation."""

    TODO = "todo", "To Do"
    IN_PROGRESS = "in_progress", "In Progress"
    DONE = "done", "Done"


class TaskPriority(models.TextChoices):
    """Task priority options."""

    LOW = "low", "Low"
    MEDIUM = "medium", "Medium"
    HIGH = "high", "High"
    URGENT = "urgent", "Urgent"


class Task(models.Model):
    """
    Represents a task within a project.

    Tasks are assigned to team members and tracked through
    status transitions: To Do → In Progress → Done.
    """

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.CASCADE,
        related_name="tasks",
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tasks",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_tasks",
    )
    status = models.CharField(
        max_length=20,
        choices=TaskStatus.choices,
        default=TaskStatus.TODO,
    )
    priority = models.CharField(
        max_length=20,
        choices=TaskPriority.choices,
        default=TaskPriority.MEDIUM,
    )
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["assigned_to"]),
            models.Index(fields=["due_date"]),
            models.Index(fields=["project"]),
            models.Index(fields=["project", "status"]),
        ]

    def __str__(self):
        return self.title

    @property
    def is_overdue(self):
        """A task is overdue if due_date < today AND status is not Done."""
        if not self.due_date:
            return False

        return self.due_date < timezone.now().date() and self.status != TaskStatus.DONE
