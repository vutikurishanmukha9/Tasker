from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom admin configuration for the User model."""

    list_display = ("email", "username", "role", "is_active", "created_at")
    list_filter = ("role", "is_active", "date_joined")
    search_fields = ("email", "username")
    ordering = ("-created_at",)

    # Fields shown on the user detail/edit page
    fieldsets = (
        (None, {"fields": ("email", "username", "password")}),
        ("Role & Permissions", {"fields": ("role", "is_active", "is_staff", "is_superuser")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )

    # Fields shown on the user creation page
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "username", "role", "password1", "password2"),
            },
        ),
    )
