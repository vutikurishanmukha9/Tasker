from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.TextChoices):
    """Global user roles for access control."""

    ADMIN = "admin", "Admin"
    MEMBER = "member", "Member"


class User(AbstractUser):
    """
    Custom user model for Team Task Manager.

    Uses email as the primary login identifier.
    Role determines global access level (Admin / Member).
    """

    email = models.EmailField(
        unique=True,
        error_messages={"unique": "A user with this email already exists."},
    )
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.MEMBER,
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return f"{self.username} ({self.email})"

    @property
    def is_admin(self):
        return self.role == Role.ADMIN
