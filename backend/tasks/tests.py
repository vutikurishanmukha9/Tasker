from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from projects.models import Project
from projects.services import remove_team_member
from tasks.models import Task, TaskStatus


@override_settings(
    JWT_COOKIE_SECURE=False,
    CSRF_COOKIE_SECURE=False,
    REST_FRAMEWORK={
        "DEFAULT_AUTHENTICATION_CLASSES": (
            "accounts.authentication.CookieJWTAuthentication",
        ),
        "DEFAULT_PERMISSION_CLASSES": (
            "rest_framework.permissions.IsAuthenticated",
        ),
        "DEFAULT_PAGINATION_CLASS": "core.pagination.StandardPagination",
        "PAGE_SIZE": 2,
        "EXCEPTION_HANDLER": "core.exceptions.custom_exception_handler",
        "DEFAULT_THROTTLE_RATES": {
            "anon": "1000/min",
            "user": "1000/min",
            "login": "1000/min",
            "signup": "1000/min",
            "token_refresh": "1000/min",
        },
    },
)
class TaskHardeningTests(APITestCase):
    def setUp(self):
        self.client = APIClient(enforce_csrf_checks=True)
        User = get_user_model()
        self.admin = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="password12345",
            role="admin",
        )
        self.member = User.objects.create_user(
            username="member",
            email="member@example.com",
            password="password12345",
            role="member",
        )
        self.project = Project.objects.create(
            name="Project",
            description="Demo",
            created_by=self.admin,
        )
        self.project.team_members.add(self.admin, self.member)
        self.task = Task.objects.create(
            title="Task",
            project=self.project,
            assigned_to=self.member,
            created_by=self.admin,
        )

    def authenticate(self, user):
        response = self.client.post(
            "/api/v1/auth/login/",
            {"email": user.email, "password": "password12345"},
            format="json",
        )
        csrf = response.cookies["csrftoken"].value
        return csrf

    def test_member_can_update_only_status(self):
        csrf = self.authenticate(self.member)

        allowed = self.client.patch(
            f"/api/v1/tasks/{self.task.id}/",
            {"status": TaskStatus.IN_PROGRESS},
            format="json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        blocked = self.client.patch(
            f"/api/v1/tasks/{self.task.id}/",
            {"title": "Nope"},
            format="json",
            HTTP_X_CSRFTOKEN=csrf,
        )

        self.assertEqual(allowed.status_code, status.HTTP_200_OK)
        self.assertEqual(blocked.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_can_update_task_fields(self):
        csrf = self.authenticate(self.admin)

        response = self.client.patch(
            f"/api/v1/tasks/{self.task.id}/",
            {"title": "Updated"},
            format="json",
            HTTP_X_CSRFTOKEN=csrf,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.task.refresh_from_db()
        self.assertEqual(self.task.title, "Updated")

    def test_remove_team_member_unassigns_tasks(self):
        success, _message = remove_team_member(self.project, self.member.id)

        self.assertTrue(success)
        self.task.refresh_from_db()
        self.assertIsNone(self.task.assigned_to)

    def test_task_list_is_paginated(self):
        Task.objects.create(
            title="Task 2",
            project=self.project,
            assigned_to=self.member,
            created_by=self.admin,
        )
        Task.objects.create(
            title="Task 3",
            project=self.project,
            assigned_to=self.member,
            created_by=self.admin,
        )
        self.authenticate(self.admin)

        response = self.client.get("/api/v1/tasks/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data["data"])
        self.assertEqual(response.data["data"]["pagination"]["count"], 3)
