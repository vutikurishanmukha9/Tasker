from rest_framework.permissions import BasePermission


class IsProjectAdminOrMemberReadOnly(BasePermission):
    """
    - Admin: Full access to all projects.
    - Member: Read-only access to projects they belong to.
    """

    message = "You do not have permission to perform this action on this project."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Admins always have full access
        if request.user.is_admin:
            return True

        # Members can only read
        return request.method in ("GET", "HEAD", "OPTIONS")

    def has_object_permission(self, request, view, obj):
        # Admins always have full access
        if request.user.is_admin:
            return True

        # Members can only read their own projects
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return obj.team_members.filter(id=request.user.id).exists()

        return False
