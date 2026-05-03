from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardPagination(PageNumberPagination):
    """
    Standardized pagination that wraps results in the
    API response envelope.

    Usage:
        ?page=1&page_size=20 (default)
        ?page=2&page_size=50 (custom, max 100)
    """

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response(
            {
                "success": True,
                "message": "Data retrieved successfully.",
                "data": {
                    "results": data,
                    "pagination": {
                        "count": self.page.paginator.count,
                        "page_size": self.get_page_size(self.request),
                        "current_page": self.page.number,
                        "total_pages": self.page.paginator.num_pages,
                        "next": self.get_next_link(),
                        "previous": self.get_previous_link(),
                    },
                },
                "errors": None,
                "status_code": 200,
            }
        )
