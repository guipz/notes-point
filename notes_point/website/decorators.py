from functools import wraps
from typing import Callable, Concatenate, ParamSpec, TypeVar

from django.http import HttpRequest, JsonResponse

from .json_responses import default_response_template

P = ParamSpec("P")
R = TypeVar("R")

# Similiar functionality to django login_required decorator, but this return a json error response.
def login_required_json(func: Callable[Concatenate[HttpRequest, P], R]) -> Callable[Concatenate[HttpRequest, P], R | JsonResponse]:

    @wraps(func)
    def wrapper(request: HttpRequest, *args: P.args, **kwargs: P.kwargs) -> R | JsonResponse:

        if request.user.is_authenticated:
            return func(request, *args, **kwargs)
        
        else:
            return JsonResponse(default_response_template(message="login required."), status=400)

    return wrapper
