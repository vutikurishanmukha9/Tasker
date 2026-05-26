from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from accounts.throttles import TokenRefreshRateThrottle


TEST_THROTTLES = {
    "anon": "1000/min",
    "user": "1000/min",
    "login": "5/min",
    "signup": "1000/min",
    "token_refresh": "1/min",
}


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
        "PAGE_SIZE": 20,
        "EXCEPTION_HANDLER": "core.exceptions.custom_exception_handler",
        "DEFAULT_THROTTLE_CLASSES": [
            "rest_framework.throttling.AnonRateThrottle",
            "rest_framework.throttling.UserRateThrottle",
        ],
        "DEFAULT_THROTTLE_RATES": TEST_THROTTLES,
    },
)
class CookieAuthTests(APITestCase):
    def setUp(self):
        self.client = APIClient(enforce_csrf_checks=True)
        cache.clear()
        self.user = get_user_model().objects.create_user(
            username="member",
            email="member@example.com",
            password="password12345",
        )

    def login(self):
        return self.client.post(
            "/api/v1/auth/login/",
            {"email": self.user.email, "password": "password12345"},
            format="json",
        )

    def test_login_sets_http_only_cookies_without_returning_tokens(self):
        response = self.login()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("ttm_access", response.cookies)
        self.assertIn("ttm_refresh", response.cookies)
        self.assertTrue(response.cookies["ttm_access"]["httponly"])
        self.assertTrue(response.cookies["ttm_refresh"]["httponly"])
        self.assertIn("csrftoken", response.cookies)
        self.assertNotIn("tokens", response.data["data"])

    def test_profile_authenticates_with_access_cookie(self):
        self.login()

        response = self.client.get("/api/v1/auth/profile/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["email"], self.user.email)

    def test_refresh_uses_refresh_cookie_and_replaces_auth_cookies(self):
        login_response = self.login()
        csrf = login_response.cookies["csrftoken"].value

        response = self.client.post(
            "/api/v1/auth/token/refresh/",
            HTTP_X_CSRFTOKEN=csrf,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("ttm_access", response.cookies)
        self.assertIn("ttm_refresh", response.cookies)

    def test_logout_clears_auth_and_csrf_cookies(self):
        login_response = self.login()
        csrf = login_response.cookies["csrftoken"].value

        response = self.client.post(
            "/api/v1/auth/logout/",
            HTTP_X_CSRFTOKEN=csrf,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.cookies["ttm_access"]["max-age"], 0)
        self.assertEqual(response.cookies["ttm_refresh"]["max-age"], 0)
        self.assertEqual(response.cookies["csrftoken"]["max-age"], 0)

    def test_refresh_without_cookie_fails(self):
        response = self.client.post("/api/v1/auth/token/refresh/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unsafe_request_requires_csrf_header(self):
        self.login()

        response = self.client.patch(
            "/api/v1/auth/profile/",
            {"username": "renamed"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unsafe_request_rejects_mismatched_csrf_header(self):
        self.login()

        response = self.client.patch(
            "/api/v1/auth/profile/",
            {"username": "renamed"},
            format="json",
            HTTP_X_CSRFTOKEN="wrong-token",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_login_throttle_blocks_repeated_ip_email_attempts(self):
        for _ in range(5):
            response = self.client.post(
                "/api/v1/auth/login/",
                {"email": "target@example.com", "password": "wrong"},
                format="json",
            )
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        response = self.client.post(
            "/api/v1/auth/login/",
            {"email": "target@example.com", "password": "wrong"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_refresh_throttle_returns_429(self):
        original_rates = TokenRefreshRateThrottle.THROTTLE_RATES
        TokenRefreshRateThrottle.THROTTLE_RATES = {
            **original_rates,
            "token_refresh": "1/min",
        }
        login_response = self.login()
        csrf = login_response.cookies["csrftoken"].value

        try:
            first = self.client.post(
                "/api/v1/auth/token/refresh/",
                HTTP_X_CSRFTOKEN=csrf,
            )
            second = self.client.post(
                "/api/v1/auth/token/refresh/",
                HTTP_X_CSRFTOKEN=csrf,
            )
        finally:
            TokenRefreshRateThrottle.THROTTLE_RATES = original_rates

        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertEqual(second.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
