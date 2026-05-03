from rest_framework.permissions import BasePermission


class IsAdminOrAssignedMember(BasePermission):
    """
    - Admin: Full CRUD access on all tasks.
    - Assigned member: Can read and update status of their assigned tasks.
    """

    message = "You do not have permission to perform this action on this task."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Admins always have access
        if request.user.is_admin:
            return True

        # Members can list (filtered) and read
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True

        # Members can update (status only — enforced in serializer)
        if request.method in ("PUT", "PATCH"):
            return True

        # Members cannot create or delete
        return False

    def has_object_permission(self, request, view, obj):
        # Admins always have full access
        if request.user.is_admin:
            return True

        # Members can only access tasks assigned to them
        if obj.assigned_to_id != request.user.id:
            return False

        # Members cannot delete
        if request.method == "DELETE":
            return False

        return True
