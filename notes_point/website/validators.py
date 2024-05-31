from datetime import datetime, timezone
from django.forms import ValidationError
from django.utils.translation import gettext as _


def future_datetime(datetime_value: datetime) -> None:
    if datetime_value < datetime.now(timezone.utc):
        raise ValidationError(
            _("Datetime is in the past."), code="invalid")
