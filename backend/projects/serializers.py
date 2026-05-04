from rest_framework import serializers

from accounts.models import User
from accounts.serializers import UserListSerializer

from .models import Project


class ProjectListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for project list views."""

    created_by = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()
    team_members = UserListSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "description",
            "created_by",
            "member_count",
            "team_members",
            "created_at",
        ]

    def get_created_by(self, obj):
        return {
            "id": obj.created_by_id,
            "username": obj.created_by.username,
        }

    def get_member_count(self, obj):
        return obj.team_members.count()


class ProjectDetailSerializer(serializers.ModelSerializer):
    """Full project details including team members list."""

    created_by = serializers.SerializerMethodField()
    team_members = UserListSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "description",
            "created_by",
            "team_members",
            "created_at",
        ]

    def get_created_by(self, obj):
        return {
            "id": obj.created_by_id,
            "username": obj.created_by.username,
            "email": obj.created_by.email,
        }


class ProjectCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating projects."""

    team_members = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), many=True, required=False
    )

    class Meta:
        model = Project
        fields = ["id", "name", "description", "team_members"]
        read_only_fields = ["id"]

    def validate_name(self, value):
        """Ensure project name is not empty after stripping whitespace."""
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Project name cannot be empty.")
        return value

    def update(self, instance, validated_data):
        team_members = validated_data.pop("team_members", None)
        instance = super().update(instance, validated_data)

        if team_members is not None:
            from .services import remove_team_member
            current_members = set(instance.team_members.all())
            new_members = set(team_members)

            # Remove members not in the new list (this auto-unassigns tasks via the service)
            for user in current_members - new_members:
                remove_team_member(instance, user.id)

            # Add remaining members
            instance.team_members.set(team_members)

        return instance

    def create(self, validated_data):
        team_members = validated_data.pop("team_members", [])
        instance = super().create(validated_data)
        if team_members:
            instance.team_members.set(team_members)
        return instance


class TeamMemberSerializer(serializers.Serializer):
    """Serializer for add/remove team member actions."""

    user_id = serializers.IntegerField()

    def validate_user_id(self, value):
        from accounts.models import User

        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError("User not found.")
        return value
