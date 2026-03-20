"""Email service — reads SMTP settings from GameConfig at runtime (falls back to env vars)."""
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


async def _get_smtp_config() -> dict:
    """Load SMTP settings from GameConfig DB, falling back to env vars."""
    try:
        from app.database import AsyncSessionLocal
        from app.models.game import GameConfig
        from sqlalchemy import select

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(GameConfig).where(GameConfig.key.in_([
                    "smtp_host", "smtp_port", "smtp_user", "smtp_password",
                    "smtp_from", "smtp_from_name", "email_backend",
                ]))
            )
            rows = {c.key: c.value for c in result.scalars().all()}
    except Exception:
        rows = {}

    return {
        "host":       rows.get("smtp_host", settings.smtp_host),
        "port":       int(rows.get("smtp_port", settings.smtp_port)),
        "user":       rows.get("smtp_user", settings.smtp_user),
        "password":   rows.get("smtp_password", settings.smtp_password),
        "from_addr":  rows.get("smtp_from", settings.smtp_from),
        "from_name":  rows.get("smtp_from_name", settings.smtp_from_name),
        "backend":    rows.get("email_backend", settings.email_backend),
    }


async def _send(to: str, subject: str, html_body: str) -> None:
    cfg = await _get_smtp_config()

    if cfg["backend"] == "console":
        logger.info(f"[EMAIL] To: {to} | Subject: {subject}\n{html_body[:300]}...")
        return

    import emails
    message = emails.Message(
        subject=subject,
        html=html_body,
        mail_from=(cfg["from_name"], cfg["from_addr"]),
    )
    smtp_options = {
        "host": cfg["host"],
        "port": cfg["port"],
        "user": cfg["user"],
        "password": cfg["password"],
        "tls": True,
    }
    response = message.send(to=to, smtp=smtp_options)
    if not response.success:
        logger.error(f"Email to {to} failed: {response.error}")


async def send_verification_email(to: str, token: str, username: str) -> None:
    cfg = await _get_smtp_config()
    frontend_url = settings.frontend_url
    verify_url = f"{frontend_url}/verify-email?token={token}"
    html = _render("email_verify.html", {"username": username, "verify_url": verify_url})
    await _send(to, "Verify your MarketHand account", html)


async def send_password_reset_email(to: str, token: str) -> None:
    frontend_url = settings.frontend_url
    reset_url = f"{frontend_url}/reset-password?token={token}"
    html = _render("password_reset.html", {"reset_url": reset_url})
    await _send(to, "Reset your MarketHand password", html)
