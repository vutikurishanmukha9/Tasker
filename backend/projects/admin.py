from django.contrib import admin

from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    """Admin configuration for the Project model."""

    list_display = ("name", "created_by", "member_count", "created_at")
    list_filter = ("created_at",)
    search_fields = ("name", "description")
    readonly_fields = ("created_at",)
    filter_horizontal = ("team_members",)
    ordering = ("-created_at",)

    def member_count(self, obj):
        return obj.team_members.count()

    member_count.short_description = "Members"
