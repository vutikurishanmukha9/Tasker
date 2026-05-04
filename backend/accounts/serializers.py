from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import User


class SignupSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""

    password = serializers.CharField(
        write_only=True,
        min_length=8,
        validators=[validate_password],
        style={"input_type": "password"},
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "password_confirm", "role"]
        read_only_fields = ["id"]
        extra_kwargs = {
            "email": {"required": True},
            "username": {"required": True},
        }

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password_confirm"):
            raise serializers.ValidationError(
                {"password_confirm": "Passwords do not match."}
            )
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    """Serializer for user login — accepts email + password."""

    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )


class UserSerializer(serializers.ModelSerializer):
    """Full user details serializer (read-only for profile views)."""

    class Meta:
        model = User
        fields = ["id", "username", "email", "role", "created_at"]
        read_only_fields = ["id", "email", "role", "created_at"]


class UserListSerializer(serializers.ModelSerializer):
    """Lightweight user serializer for listing and dropdowns."""

    class Meta:
        model = User
        fields = ["id", "username", "email", "role", "created_at"]
        read_only_fields = fields


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile (username only)."""

    class Meta:
        model = User
        fields = ["id", "username", "email", "role", "created_at"]
        read_only_fields = ["id", "email", "role", "created_at"]
