import re
from typing import Annotated
from pydantic import AfterValidator

# RFC 5322-compliant permissive email pattern that supports public, internal, and local domains (.local, .internal, etc.)
EMAIL_REGEX = re.compile(
    r"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$"
)


def validate_email_address(value: str) -> str:
    """Validate and normalize email string supporting enterprise, internal, and local domains."""
    if not isinstance(value, str):
        raise ValueError("Email must be a string.")
    cleaned = value.strip().lower()
    if not EMAIL_REGEX.match(cleaned):
        raise ValueError(f"Value '{value}' is not a valid email address.")
    return cleaned


EmailStr = Annotated[str, AfterValidator(validate_email_address)]

