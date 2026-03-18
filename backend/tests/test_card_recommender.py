import pytest
import numpy as np
from unittest.mock import AsyncMock, MagicMock
from app.services.card_recommender import (
    compute_stage_fit, compute_learning_need, compute_diversity,
    compute_difficulty_mismatch, _softmax,
)
from app.models.card import Card, CardType, CardBandColor


def make_card(**kwargs) -> Card:
    defaults = {
        "id": 1,
        "type": CardType.education,
        "title": "Test",
        "body": "Body",
        "emoji": "📊",
        "stage_min": 1,
        "stage_max": 5,
        "topics": ["stocks"],
        "linked_traits": [],
        "difficulty": 0.5,
        "diagnostic_power": 0.5,
        "base_priority": 1.0,
        "cooldown": 5,
        "left_choice": "Left",
        "right_choice": "Right",
        "left_lesson": "Left lesson",
        "right_lesson": "Right lesson",
        "card_band_color": CardBandColor.steel_blue,
        "is_active": True,
    }
    defaults.update(kwargs)
    card = Card()
    for k, v in defaults.items():
        setattr(card, k, v)
    return card


def test_stage_fit_in_range():
    card = make_card(stage_min=2, stage_max=4)
    assert compute_stage_fit(card, 3) > 0.0
    assert compute_stage_fit(card, 1) == 0.0
    assert compute_stage_fit(card, 5) == 0.0


def test_stage_fit_range_zero_to_one():
    card = make_card(stage_min=1, stage_max=5)
    for stage in range(1, 6):
        fit = compute_stage_fit(card, stage)
        assert 0.0 <= fit <= 1.0


def test_learning_need_high_for_low_mastery():
    card = make_card(topics=["stocks"])
    score = compute_learning_need(card, {"stocks": 0.0})
    assert score == 1.0  # mastery=0 → need=1


def test_learning_need_low_for_high_mastery():
    card = make_card(topics=["stocks"])
    score = compute_learning_need(card, {"stocks": 1.0})
    assert score == 0.0  # mastery=1 → need=0


def test_diversity_penalty_same_type():
    card = make_card(type=CardType.education)
    score = compute_diversity(card, "education")
    assert score < 1.0


def test_diversity_bonus_different_type():
    card = make_card(type=CardType.education)
    score = compute_diversity(card, "event")
    assert score == 1.0


def test_softmax_sums_to_one():
    scores = np.array([0.1, 0.5, 0.3, 0.8])
    probs = _softmax(scores)
    assert abs(probs.sum() - 1.0) < 1e-6


def test_softmax_nondeterministic_selection():
    """Softmax sampling should not always pick the same card."""
    scores = np.array([0.3, 0.4, 0.3])
    probs = _softmax(scores)
    choices = set()
    for _ in range(100):
        idx = int(np.random.choice(len(scores), p=probs))
        choices.add(idx)
    assert len(choices) > 1, "Sampling should be non-deterministic"


def test_difficulty_mismatch():
    card = make_card(difficulty=0.8)
    session = MagicMock()
    session.stage = 2  # expected difficulty ~ 0.4
    mismatch = compute_difficulty_mismatch(card, session)
    assert mismatch == pytest.approx(0.4, abs=0.01)
