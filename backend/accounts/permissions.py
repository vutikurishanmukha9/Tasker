from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """
    Allows access only to users with the Admin role.

    Used for endpoints that require full administrative privileges
    such as creating projects, managing users, etc.
    """

    message = "Only admin users can perform this action."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_admin
        )


class IsAdminOrReadOnly(BasePermission):
    """
    Admin users have full access.
    Other authenticated users have read-only access.
    """

    message = "Only admin users can modify this resource."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True

        return request.user.is_admin
