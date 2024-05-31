from typing import Any, Dict
from datetime import datetime

from django import template
from django.urls import reverse

register = template.Library()

@register.inclusion_tag("website/html_snippets/navbar_link.html",
                        takes_context=True)
def navbar_link(context, view_name, page_name=None) -> Dict[str, Any]:

    view_url = reverse(view_name)
    is_active = context["request"].path_info == view_url
    # If no page_name is provided to archor tag use view_name.
    page_name = page_name if page_name is not None else view_name

    return {
        "is_active": is_active,
        "view_url": view_url,
        "page_name": page_name
    }


@register.filter
def datetime_to_iso(date_time: datetime) -> str:
    # Return datetime as an iso string, removing the timezone offset from the end.
    return date_time.isoformat(sep=' ',timespec="seconds").split("+")[0]
