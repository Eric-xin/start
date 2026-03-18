import logging
from pathlib import Path
from jinja2 import Environment, FileSystemLoader
from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

TEMPLATES_DIR = Path(__file__).parent.parent / "templates"
jinja_env = Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)))


def _render(template_name: str, context: dict) -> str:
    return jinja_env.get_template(template_name).render(**context)


def _send(to: str, subject: str, html_body: str) -> None:
    if settings.email_backend == "console":
        logger.info(f"[EMAIL] To: {to} | Subject: {subject}\n{html_body[:300]}...")
        return

    import emails
    message = emails.Message(
        subject=subject,
        html=html_body,
        mail_from=(settings.smtp_from_name, settings.smtp_from),
    )
    smtp_options = {
        "host": settings.smtp_host,
        "port": settings.smtp_port,
        "user": settings.smtp_user,
        "password": settings.smtp_password,
        "tls": True,
    }
    response = message.send(to=to, smtp=smtp_options)
    if not response.success:
        logger.error(f"Email to {to} failed: {response.error}")


def send_verification_email(to: str, token: str, username: str) -> None:
    verify_url = f"{settings.frontend_url}/verify-email?token={token}"
    html = _render("email_verify.html", {"username": username, "verify_url": verify_url})
    _send(to, "Verify your CardEcon account", html)


def send_password_reset_email(to: str, token: str) -> None:
    reset_url = f"{settings.frontend_url}/reset-password?token={token}"
    html = _render("password_reset.html", {"reset_url": reset_url})
    _send(to, "Reset your CardEcon password", html)
