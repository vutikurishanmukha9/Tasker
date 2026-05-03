from django.contrib import admin

from .models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    """Admin configuration for the Task model."""

    list_display = (
        "title",
        "project",
        "assigned_to",
        "status",
        "due_date",
        "is_overdue_display",
        "created_at",
    )
    list_filter = ("status", "project", "due_date")
    search_fields = ("title", "description")
    readonly_fields = ("created_at", "created_by")
    ordering = ("-created_at",)

    list_select_related = ("project", "assigned_to", "created_by")

    fieldsets = (
        (None, {"fields": ("title", "description")}),
        ("Assignment", {"fields": ("project", "assigned_to", "created_by")}),
        ("Status", {"fields": ("status", "due_date")}),
        ("Timestamps", {"fields": ("created_at",)}),
    )

    def is_overdue_display(self, obj):
        return obj.is_overdue

    is_overdue_display.boolean = True
    is_overdue_display.short_description = "Overdue"
