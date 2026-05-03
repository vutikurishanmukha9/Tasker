from rest_framework import serializers

from .models import Task, TaskStatus


class TaskListSerializer(serializers.ModelSerializer):
    """Serializer for task list views with nested project and user names."""

    project_name = serializers.CharField(source="project.name", read_only=True)
    assigned_to_username = serializers.CharField(
        source="assigned_to.username", read_only=True, default=None
    )
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "project",
            "project_name",
            "assigned_to",
            "assigned_to_username",
            "status",
            "due_date",
            "is_overdue",
            "created_at",
        ]


class TaskDetailSerializer(serializers.ModelSerializer):
    """Full task detail serializer including created_by."""

    project_name = serializers.CharField(source="project.name", read_only=True)
    assigned_to_username = serializers.CharField(
        source="assigned_to.username", read_only=True, default=None
    )
    created_by_username = serializers.CharField(
        source="created_by.username", read_only=True, default=None
    )
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "project",
            "project_name",
            "assigned_to",
            "assigned_to_username",
            "created_by",
            "created_by_username",
            "status",
            "due_date",
            "is_overdue",
            "created_at",
        ]


class TaskCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for task creation.

    Validates that assigned_to user is a team member of the specified project.
    """

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "project",
            "assigned_to",
            "status",
            "due_date",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        project = attrs.get("project")
        assigned_to = attrs.get("assigned_to")

        if assigned_to and project:
            if not project.team_members.filter(id=assigned_to.id).exists():
                raise serializers.ValidationError(
                    {
                        "assigned_to": (
                            f"User '{assigned_to.username}' is not a member "
                            f"of project '{project.name}'. "
                            "Add them to the team first."
                        )
                    }
                )

        return attrs


class TaskUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for task updates.

    Admin can update all fields.
    Assigned members can only update status.
    """

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "assigned_to",
            "status",
            "due_date",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        request = self.context.get("request")
        instance = self.instance

        # Members can only update status
        if request and not request.user.is_admin:
            allowed_fields = {"status"}
            update_fields = set(attrs.keys())

            disallowed = update_fields - allowed_fields
            if disallowed:
                raise serializers.ValidationError(
                    {
                        "detail": (
                            f"Members can only update task status. "
                            f"Cannot modify: {', '.join(disallowed)}"
                        )
                    }
                )

        # Validate assignment if changing assigned_to
        assigned_to = attrs.get("assigned_to")
        project = instance.project if instance else None

        if assigned_to and project:
            if not project.team_members.filter(id=assigned_to.id).exists():
                raise serializers.ValidationError(
                    {
                        "assigned_to": (
                            f"User '{assigned_to.username}' is not a member "
                            f"of project '{project.name}'."
                        )
                    }
                )

        return attrs
