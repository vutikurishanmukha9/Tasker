"""
Root URL configuration for Team Task Manager.

All API endpoints are versioned under /api/v1/.
"""

from django.contrib import admin
from django.urls import include, path

from tasks.views import DashboardView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("accounts.urls")),
    path("api/v1/projects/", include("projects.urls")),
    path("api/v1/tasks/", include("tasks.urls")),
    path("api/v1/dashboard/", DashboardView.as_view(), name="dashboard"),
]

# ──────────────────────────────────────────────
# Admin Site Configuration
# ──────────────────────────────────────────────
admin.site.site_header = "Team Task Manager Admin"
admin.site.site_title = "TTM Admin"
admin.site.index_title = "Management Dashboard"
