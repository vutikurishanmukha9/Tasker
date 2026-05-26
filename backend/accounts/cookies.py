from django.conf import settings
from django.middleware.csrf import get_token


def _cookie_kwargs(max_age, http_only):
    kwargs = {
        "max_age": max_age,
        "secure": settings.JWT_COOKIE_SECURE,
        "httponly": http_only,
        "samesite": settings.JWT_COOKIE_SAMESITE,
        "path": settings.JWT_COOKIE_PATH,
    }
    if settings.JWT_COOKIE_DOMAIN:
        kwargs["domain"] = settings.JWT_COOKIE_DOMAIN
    return kwargs


def set_auth_cookies(response, access_token, refresh_token):
    response.set_cookie(
        settings.JWT_ACCESS_COOKIE_NAME,
        access_token,
        **_cookie_kwargs(settings.JWT_ACCESS_COOKIE_MAX_AGE, True),
    )
    response.set_cookie(
        settings.JWT_REFRESH_COOKIE_NAME,
        refresh_token,
        **_cookie_kwargs(settings.JWT_REFRESH_COOKIE_MAX_AGE, True),
    )
    return response


def set_csrf_cookie(request, response):
    get_token(request)
    return response


def clear_auth_cookies(response):
    delete_kwargs = {
        "path": settings.JWT_COOKIE_PATH,
        "samesite": settings.JWT_COOKIE_SAMESITE,
    }
    if settings.JWT_COOKIE_DOMAIN:
        delete_kwargs["domain"] = settings.JWT_COOKIE_DOMAIN

    response.delete_cookie(settings.JWT_ACCESS_COOKIE_NAME, **delete_kwargs)
    response.delete_cookie(settings.JWT_REFRESH_COOKIE_NAME, **delete_kwargs)
    response.delete_cookie(settings.CSRF_COOKIE_NAME, **delete_kwargs)
    return response
