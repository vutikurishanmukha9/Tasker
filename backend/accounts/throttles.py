from rest_framework.throttling import SimpleRateThrottle


class LoginEmailRateThrottle(SimpleRateThrottle):
    scope = "login"

    def get_cache_key(self, request, view):
        email = str(request.data.get("email", "")).strip().lower()
        ident = self.get_ident(request)
        if not email:
            email = "missing"
        return self.cache_format % {
            "scope": self.scope,
            "ident": f"{ident}:{email}",
        }


class SignupRateThrottle(SimpleRateThrottle):
    scope = "signup"

    def get_cache_key(self, request, view):
        return self.cache_format % {
            "scope": self.scope,
            "ident": self.get_ident(request),
        }


class TokenRefreshRateThrottle(SimpleRateThrottle):
    scope = "token_refresh"

    def get_cache_key(self, request, view):
        return self.cache_format % {
            "scope": self.scope,
            "ident": self.get_ident(request),
        }
