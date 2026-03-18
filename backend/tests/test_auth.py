import pytest
import pytest_asyncio
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    resp = await client.post("/api/auth/register", json={
        "email": "test@example.com",
        "username": "testuser",
        "password": "securepassword",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "test@example.com"
    assert data["username"] == "testuser"
    assert not data["is_verified"]


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    payload = {"email": "dup@example.com", "username": "user1", "password": "password1"}
    await client.post("/api/auth/register", json=payload)
    payload2 = {"email": "dup@example.com", "username": "user2", "password": "password2"}
    resp = await client.post("/api/auth/register", json=payload2)
    assert resp.status_code == 400
    assert "Email" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_register_duplicate_username(client: AsyncClient):
    await client.post("/api/auth/register", json={
        "email": "a@example.com", "username": "sameuser", "password": "password1"
    })
    resp = await client.post("/api/auth/register", json={
        "email": "b@example.com", "username": "sameuser", "password": "password2"
    })
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await client.post("/api/auth/register", json={
        "email": "login@example.com", "username": "loginuser", "password": "correct"
    })
    resp = await client.post("/api/auth/login", json={
        "identifier": "loginuser", "password": "wrong"
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_returns_token(client: AsyncClient):
    await client.post("/api/auth/register", json={
        "email": "token@example.com", "username": "tokenuser", "password": "mypassword"
    })
    resp = await client.post("/api/auth/login", json={
        "identifier": "token@example.com", "password": "mypassword"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_verify_email(client: AsyncClient, db_session):
    from sqlalchemy import select
    from app.models.user import User

    await client.post("/api/auth/register", json={
        "email": "verify@example.com", "username": "verifyuser", "password": "password123"
    })

    result = await db_session.execute(select(User).where(User.email == "verify@example.com"))
    user = result.scalar_one()
    token = user.email_verify_token

    resp = await client.get(f"/api/auth/verify-email?token={token}")
    assert resp.status_code == 200

    await db_session.refresh(user)
    assert user.is_verified


@pytest.mark.asyncio
async def test_reset_password_flow(client: AsyncClient, db_session):
    from sqlalchemy import select
    from app.models.user import User

    await client.post("/api/auth/register", json={
        "email": "reset@example.com", "username": "resetuser", "password": "oldpassword"
    })

    resp = await client.post("/api/auth/forgot-password", json={"email": "reset@example.com"})
    assert resp.status_code == 200

    result = await db_session.execute(select(User).where(User.email == "reset@example.com"))
    user = result.scalar_one()
    token = user.reset_token

    resp = await client.post("/api/auth/reset-password", json={
        "token": token, "new_password": "newpassword123"
    })
    assert resp.status_code == 200

    # Verify new password works
    login_resp = await client.post("/api/auth/login", json={
        "identifier": "resetuser", "password": "newpassword123"
    })
    assert login_resp.status_code == 200
