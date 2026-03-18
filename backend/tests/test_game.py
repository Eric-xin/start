import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import select
from app.models.user import User
from app.models.card import Card, CardType, CardBandColor
from app.models.game import GameSession
from app.core.security import generate_verification_token


async def create_verified_user(db_session, client: AsyncClient, email="game@test.com", username="gamer"):
    """Register + verify a user and return auth headers."""
    resp = await client.post("/api/auth/register", json={
        "email": email, "username": username, "password": "password123"
    })
    # Verify user directly in DB
    result = await db_session.execute(select(User).where(User.email == email))
    user = result.scalar_one()
    user.is_verified = True
    await db_session.flush()

    login_resp = await client.post("/api/auth/login", json={
        "identifier": email, "password": "password123"
    })
    token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}, user


async def seed_test_card(db_session) -> Card:
    card = Card(
        type=CardType.education,
        title="Test Card",
        body="Test body for the game test",
        emoji="🧪",
        stage_min=1, stage_max=5,
        topics=["stocks"],
        linked_traits=["patience"],
        difficulty=0.3, diagnostic_power=0.6,
        base_priority=1.0, cooldown=3,
        left_choice="Left", right_choice="Right",
        left_lesson="Left lesson text here.",
        right_lesson="Right lesson text here.",
        card_band_color=CardBandColor.steel_blue,
        is_active=True,
    )
    db_session.add(card)
    await db_session.flush()
    return card


@pytest.mark.asyncio
async def test_create_session(client: AsyncClient, db_session):
    headers, user = await create_verified_user(db_session, client)
    resp = await client.post("/api/game/sessions", headers=headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["stage"] == 1
    assert data["capital"] == 10000.0
    assert data["investor_rank"] == 1
    assert len(data["persona_vector"]) == 16


@pytest.mark.asyncio
async def test_get_session(client: AsyncClient, db_session):
    headers, user = await create_verified_user(db_session, client,
                                               email="get@test.com", username="getter")
    create_resp = await client.post("/api/game/sessions", headers=headers)
    session_id = create_resp.json()["id"]

    resp = await client.get(f"/api/game/sessions/{session_id}", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == session_id


@pytest.mark.asyncio
async def test_swipe_returns_lesson(client: AsyncClient, db_session):
    headers, user = await create_verified_user(db_session, client,
                                               email="swipe@test.com", username="swiper")
    card = await seed_test_card(db_session)

    create_resp = await client.post("/api/game/sessions", headers=headers)
    session_id = create_resp.json()["id"]

    resp = await client.post(
        f"/api/game/sessions/{session_id}/swipe",
        headers=headers,
        json={"card_id": card.id, "action": "right"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["lesson"] == "Right lesson text here."
    assert "reward" in data
    assert "session" in data


@pytest.mark.asyncio
async def test_persona_updates_after_swipes(client: AsyncClient, db_session):
    headers, user = await create_verified_user(db_session, client,
                                               email="persona@test.com", username="persona_user")
    card = await seed_test_card(db_session)

    create_resp = await client.post("/api/game/sessions", headers=headers)
    session_id = create_resp.json()["id"]
    initial_persona = create_resp.json()["persona_vector"]

    # Do 5 swipes
    for _ in range(5):
        await client.post(
            f"/api/game/sessions/{session_id}/swipe",
            headers=headers,
            json={"card_id": card.id, "action": "right"},
        )

    final_resp = await client.get(f"/api/game/sessions/{session_id}", headers=headers)
    final_persona = final_resp.json()["persona_vector"]

    # Persona should have changed
    changed = any(abs(initial_persona[i] - final_persona[i]) > 0.001 for i in range(16))
    assert changed, "Persona vector should change after swipes"


@pytest.mark.asyncio
async def test_get_persona_traits(client: AsyncClient, db_session):
    headers, user = await create_verified_user(db_session, client,
                                               email="traits@test.com", username="traits_user")
    create_resp = await client.post("/api/game/sessions", headers=headers)
    session_id = create_resp.json()["id"]

    resp = await client.get(f"/api/persona/{session_id}", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    for trait in ["risk_appetite", "fomo_sensitivity", "loss_aversion",
                  "patience", "diversification_bias", "overconfidence"]:
        assert trait in data
        assert 0.0 <= data[trait] <= 100.0
