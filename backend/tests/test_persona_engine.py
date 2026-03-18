import numpy as np
import pytest
from app.services.persona_engine import (
    initialize_persona, update_persona, compute_traits,
    encode_action, DIM_P, TRAIT_NAMES,
)


def test_initialize_persona_shape():
    p = initialize_persona()
    assert len(p) == DIM_P


def test_initialize_persona_normalized():
    p = np.array(initialize_persona(), dtype=np.float32)
    norm = np.linalg.norm(p)
    # Should be roughly sqrt(DIM_P) ~ 4
    assert 0.1 < norm < 50


def test_encode_action_one_hot():
    for action, expected_idx in [("left", 0), ("right", 1), ("hold", 2)]:
        a = encode_action(action)
        assert a.shape == (3,)
        assert a[expected_idx] == 1.0
        assert a.sum() == 1.0


def test_update_persona_shape():
    p = np.array(initialize_persona(), dtype=np.float32)
    e = np.random.randn(16).astype(np.float32)
    a = encode_action("right")
    s = np.random.randn(8).astype(np.float32)
    r = 0.5

    p_new = update_persona(p, e, a, s, r)
    assert p_new.shape == (DIM_P,)


def test_update_persona_stable_after_100_updates():
    """Persona values should stay within reasonable range after 100 updates."""
    p = np.array(initialize_persona(), dtype=np.float32)
    for _ in range(100):
        e = np.random.randn(16).astype(np.float32) * 0.5
        a = encode_action(np.random.choice(["left", "right"]))
        s = np.random.randn(8).astype(np.float32) * 0.3
        r = np.random.uniform(-0.5, 1.0)
        p = update_persona(p, e, a, s, r)

    # Values should not explode
    assert np.all(np.abs(p) < 100), f"Persona exploded: max={np.abs(p).max()}"
    assert not np.any(np.isnan(p)), "NaN in persona vector"


def test_compute_traits_range():
    p = np.array(initialize_persona(), dtype=np.float32)
    traits = compute_traits(p)

    assert set(traits.keys()) == set(TRAIT_NAMES)
    for name, val in traits.items():
        assert 0.0 <= val <= 100.0, f"Trait {name}={val} out of [0,100]"


def test_traits_change_after_updates():
    p_init = np.array(initialize_persona(), dtype=np.float32)
    traits_init = compute_traits(p_init)

    # Drive persona with strong right-swipe signals
    p = p_init.copy()
    for _ in range(20):
        e = np.ones(16, dtype=np.float32)
        a = encode_action("right")
        s = np.ones(8, dtype=np.float32)
        p = update_persona(p, e, a, s, 1.0)

    traits_after = compute_traits(p)
    # At least one trait should have changed
    any_changed = any(abs(traits_after[k] - traits_init[k]) > 0.1 for k in TRAIT_NAMES)
    assert any_changed, "Traits did not change after 20 updates"
