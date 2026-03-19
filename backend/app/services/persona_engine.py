"""
Persona Engine — numpy only, no external ML dependencies.
16-dimensional persona vector updated via weighted linear combination.
"""
import numpy as np
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.card import Card
    from app.models.game import GameSession

# Dimensions
DIM_P = 16   # persona vector
DIM_E = 16   # encoded event
DIM_S = 8    # encoded state
DIM_A = 3    # encoded action
DIM_TRAITS = 6

# Update rates (can be overridden from GameConfig)
DECAY = 0.98
RATE_E = 0.06
RATE_A = 0.08
RATE_S = 0.04
RATE_R = 0.02

# Deterministic weight matrices (seed=42)
_rng = np.random.default_rng(42)

# Event encoder: maps 16-dim event to 16-dim persona space
W_x = _rng.standard_normal((DIM_P, DIM_E)).astype(np.float32) * 0.1
b_x = _rng.standard_normal(DIM_P).astype(np.float32) * 0.01

# Persona update matrices
W_e = _rng.standard_normal((DIM_P, DIM_E)).astype(np.float32) * 0.1
W_a = _rng.standard_normal((DIM_P, DIM_A)).astype(np.float32) * 0.1
W_s = _rng.standard_normal((DIM_P, DIM_S)).astype(np.float32) * 0.1

# Trait projection: 16-dim persona → 6 traits
H = _rng.standard_normal((DIM_TRAITS, DIM_P)).astype(np.float32) * 0.3
c = np.zeros(DIM_TRAITS, dtype=np.float32)

TRAIT_NAMES = [
    "risk_appetite",
    "fomo_sensitivity",
    "loss_aversion",
    "patience",
    "diversification_bias",
    "overconfidence",
]

# Card band color → one-hot (5 dims): red, green, amber, purple, steel_blue
BAND_COLOR_IDX = {"red": 0, "green": 1, "amber": 2, "purple": 3, "steel_blue": 4}
CARD_TYPE_IDX = {"education": 0, "event": 1, "action": 2}
TOPIC_CATS = ["stocks", "bonds", "crypto", "real_estate", "derivatives"]


def _normalize(v: np.ndarray) -> np.ndarray:
    norm = np.linalg.norm(v)
    if norm < 1e-8:
        return v
    return v / norm * np.sqrt(DIM_P)  # scale to reasonable magnitude


def encode_event(card: "Card") -> np.ndarray:
    """Encode a card into a 16-dim event vector."""
    # type one-hot (3)
    type_oh = np.zeros(3, dtype=np.float32)
    type_oh[CARD_TYPE_IDX.get(card.type if isinstance(card.type, str) else card.type.value, 0)] = 1.0

    # scalar features (3): difficulty, diagnostic_power, stage_min normalized
    scalars = np.array([
        float(card.difficulty),
        float(card.diagnostic_power),
        float(card.stage_min) / 5.0,
    ], dtype=np.float32)

    # band color one-hot (5)
    band_oh = np.zeros(5, dtype=np.float32)
    band_val = card.card_band_color if isinstance(card.card_band_color, str) else card.card_band_color.value
    band_oh[BAND_COLOR_IDX.get(band_val, 4)] = 1.0

    # topic categories (5)
    topics = card.topics if isinstance(card.topics, list) else []
    topic_oh = np.zeros(5, dtype=np.float32)
    for t in topics:
        if t in TOPIC_CATS:
            topic_oh[TOPIC_CATS.index(t)] = 1.0

    x_t = np.concatenate([type_oh, scalars, band_oh, topic_oh])  # 16-dim
    return np.tanh(W_x @ x_t + b_x)


def encode_state(session: "GameSession") -> np.ndarray:
    """Encode game session state into 8-dim vector."""
    capital = float(session.capital)
    peak = float(session.peak_capital) if session.peak_capital > 0 else 10000.0
    capital_norm = min(capital / 20000.0, 2.0)
    drawdown = max(0.0, (peak - capital) / peak)
    stage_norm = float(session.stage) / 5.0
    progress = float(session.progress)

    portfolio = session.portfolio_weights if isinstance(session.portfolio_weights, dict) else {}
    weights = np.array(list(portfolio.values()), dtype=np.float32) if portfolio else np.array([1.0])
    concentration = float(np.max(weights)) if len(weights) > 0 else 1.0

    state = np.array([
        capital_norm,
        0.5,          # cash_ratio placeholder
        0.5,          # risk_level placeholder
        drawdown,
        0.1,          # volatility placeholder
        progress,
        concentration,
        stage_norm,
    ], dtype=np.float32)
    return state


def encode_state_portfolio(portfolio) -> np.ndarray:
    """Encode UserPortfolio state into 8-dim vector (replaces encode_state for continuous play)."""
    capital = float(portfolio.capital)
    peak = float(portfolio.peak_net_worth) if portfolio.peak_net_worth > 0 else 10_000.0
    capital_norm = min(capital / 20_000.0, 2.0)
    drawdown = max(0.0, (peak - capital) / peak)
    stage_norm = float(portfolio.stage) / 5.0
    # Use cards_played as a progress proxy: 100 cards ≈ full stage mastery
    progress = min(float(portfolio.total_cards_played) / 100.0, 1.0)

    weights_dict = portfolio.portfolio_weights if isinstance(portfolio.portfolio_weights, dict) else {}
    weights = np.array(list(weights_dict.values()), dtype=np.float32) if weights_dict else np.array([1.0])
    concentration = float(np.max(weights)) if len(weights) > 0 else 1.0

    return np.array([
        capital_norm,
        0.5,
        0.5,
        drawdown,
        0.1,
        progress,
        concentration,
        stage_norm,
    ], dtype=np.float32)


def encode_action(action: str) -> np.ndarray:
    """One-hot encode action: left=0, right=1, hold=2."""
    a = np.zeros(DIM_A, dtype=np.float32)
    idx = {"left": 0, "right": 1, "hold": 2}.get(action, 0)
    a[idx] = 1.0
    return a


def update_persona(
    p_t: np.ndarray,
    e_t: np.ndarray,
    a_t: np.ndarray,
    s_t: np.ndarray,
    r_t: float,
    rates: dict | None = None,
) -> np.ndarray:
    """Update persona vector: p_{t+1} = normalize(decay*p_t + rates*contributions)."""
    decay = rates.get("decay", DECAY) if rates else DECAY
    rate_e = rates.get("event", RATE_E) if rates else RATE_E
    rate_a = rates.get("action", RATE_A) if rates else RATE_A
    rate_s = rates.get("state", RATE_S) if rates else RATE_S
    rate_r = rates.get("reward", RATE_R) if rates else RATE_R

    p_new = (
        decay * p_t
        + rate_e * (W_e @ e_t)
        + rate_a * (W_a @ a_t)
        + rate_s * (W_s @ s_t)
        + rate_r * r_t * np.ones(DIM_P, dtype=np.float32)
    )
    return _normalize(p_new)


def compute_traits(p_t: np.ndarray) -> dict:
    """Project persona to 6 named trait scores in [0, 100]."""
    z = H @ p_t + c
    scores = 50.0 + 50.0 * np.tanh(z)
    return {name: float(scores[i]) for i, name in enumerate(TRAIT_NAMES)}


def initialize_persona() -> np.ndarray:
    """Create a fresh, normalized random persona vector."""
    rng = np.random.default_rng()  # non-deterministic for new users
    p = rng.standard_normal(DIM_P).astype(np.float32)
    return _normalize(p).tolist()


def compute_pca_2d(
    vectors: list[list[float]],
) -> tuple[list[tuple[float, float]], list[float]]:
    """
    Project N persona vectors to 2D using PCA (SVD).
    Returns (coords, variance_explained_ratio) for up to 2 components.
    """
    if not vectors:
        return [], []
    X = np.array(vectors, dtype=np.float32)
    if X.shape[0] == 1:
        return [(0.0, 0.0)], [1.0, 0.0]

    X_centered = X - X.mean(axis=0)
    U, S, Vt = np.linalg.svd(X_centered, full_matrices=False)

    total_var = float(np.sum(S ** 2))
    n_comp = min(2, len(S))
    var_ratio = [float(S[i] ** 2 / total_var) if total_var > 1e-8 else 0.0 for i in range(n_comp)]
    while len(var_ratio) < 2:
        var_ratio.append(0.0)

    coords_2d = X_centered @ Vt[:n_comp].T
    result = []
    for row in coords_2d:
        x = float(row[0]) if len(row) > 0 else 0.0
        y = float(row[1]) if len(row) > 1 else 0.0
        result.append((x, y))

    return result, var_ratio


def interpret_persona(traits: dict) -> str:
    """Generate a natural language interpretation from the 6 trait scores (0–100)."""
    ra = traits.get("risk_appetite", 50)
    fo = traits.get("fomo_sensitivity", 50)
    la = traits.get("loss_aversion", 50)
    di = traits.get("diversification_bias", 50)
    tf = traits.get("patience", 50)   # using patience as trend proxy
    oc = traits.get("overconfidence", 50)

    lines = []

    # Risk appetite
    if ra > 68:
        lines.append("You have a high appetite for risk, actively seeking asymmetric return opportunities even at the cost of significant volatility.")
    elif ra > 52:
        lines.append("You are moderately risk-tolerant, comfortable with market swings when the upside justifies the exposure.")
    elif ra > 35:
        lines.append("You lean toward capital preservation, preferring steady returns over speculative gains.")
    else:
        lines.append("You are strongly risk-averse, prioritizing capital protection above all else.")

    # FOMO
    if fo > 65:
        lines.append("FOMO (fear of missing out) is a notable behavioral pattern — you tend to act quickly on perceived opportunities, sometimes before full due diligence.")
    elif fo < 35:
        lines.append("You are largely immune to market hype and make decisions independently of crowd momentum.")

    # Loss aversion
    if la > 68:
        lines.append("Loss aversion influences your exits — you may hold losing positions longer than optimal to avoid crystallizing a loss.")
    elif la < 32:
        lines.append("You cut losses decisively and show no emotional attachment to underperforming positions.")

    # Diversification
    if di > 68:
        lines.append("Diversification is a core principle for you; you spread exposure across asset classes to reduce idiosyncratic risk.")
    elif di < 32:
        lines.append("You run a concentrated book, making high-conviction bets on a small number of positions.")

    # Patience (used as time-horizon proxy)
    if tf > 65:
        lines.append("Your investment horizon is long-term — you think in years and are comfortable through short-term drawdowns.")
    elif tf < 35:
        lines.append("You prefer shorter holding periods and gravitate toward catalysts with near-term resolution.")

    # Overconfidence
    if oc > 68:
        lines.append("A degree of overconfidence may lead you to under-weight downside scenarios in sizing decisions.")
    elif oc < 32:
        lines.append("You are deliberately humble in your conviction, often building positions more slowly than warranted by the thesis.")

    if not lines:
        lines.append("Your behavioral profile is well-balanced across all dimensions, with no dominant behavioral biases detected.")

    return " ".join(lines)
