from __future__ import annotations

import os
import re
import time
import httpx
from dataclasses import dataclass


@dataclass
class GlossaryEntry:
    definition: str
    why_it_matters: str
    example: str
    common_mistake: str


GLOSSARY: dict[str, GlossaryEntry] = {
    "inflation": GlossaryEntry("A broad rise in prices over time.", "It reduces purchasing power if your money does not grow as fast.", "If inflation is 3%, $100 buys less next year.", "Thinking cash is always risk-free in real terms."),
    "deflation": GlossaryEntry("A broad fall in prices.", "It can increase real debt burdens and slow spending.", "Firms delay hiring when prices keep falling.", "Assuming lower prices are always good for markets."),
    "interest rates": GlossaryEntry("The cost of borrowing money.", "Rates influence stocks, bonds, and household spending.", "Higher rates often pressure long-duration assets.", "Ignoring rate sensitivity in portfolio choices."),
    "fed": GlossaryEntry("The US central bank.", "Its policy affects liquidity, credit, and valuations.", "Rate cuts can support risk assets in crises.", "Treating one Fed statement as a full trend."),
    "recession": GlossaryEntry("A broad economic slowdown.", "Earnings and employment usually weaken.", "Cyclical sectors often underperform in contractions.", "Assuming every recession behaves the same way."),
    "gdp": GlossaryEntry("Gross Domestic Product, a measure of economic output.", "It helps track growth phases and business cycles.", "Rapid GDP rebound can support cyclical recovery.", "Using GDP alone without labor/inflation context."),
    "unemployment": GlossaryEntry("Share of people seeking work but unemployed.", "It impacts demand and corporate revenues.", "High unemployment can prolong weak consumption.", "Expecting labor data to move exactly with stocks."),
    "volatility": GlossaryEntry("How sharply prices move up or down.", "High volatility increases emotional and timing mistakes.", "A stock can swing 5% daily during stress.", "Confusing volatility with permanent loss."),
    "drawdown": GlossaryEntry("A peak-to-trough decline in portfolio value.", "It measures pain and survival risk.", "A 30% drawdown needs a ~43% gain to recover.", "Ignoring recovery math after losses."),
    "liquidity": GlossaryEntry("How easily an asset can be traded without major price impact.", "Low liquidity can force bad exits in crises.", "Thin markets can gap sharply on small orders.", "Assuming quoted prices always equal executable prices."),
    "margin": GlossaryEntry("Borrowing to invest.", "Leverage amplifies gains and losses.", "Margin calls can force selling near bottoms.", "Using leverage without a strict risk budget."),
    "margin call": GlossaryEntry("A demand to add collateral on leveraged positions.", "Failure can trigger forced liquidation.", "Rapid selloffs often include margin-call cascades.", "Believing you can always wait out leverage."),
    "diversification": GlossaryEntry("Spreading investments across assets and risks.", "It reduces single-theme blowups.", "A broad ETF reduces single-stock exposure.", "Owning many correlated assets and calling it diversified."),
    "asset allocation": GlossaryEntry("How you split between stocks, bonds, cash, and others.", "It drives most long-term risk and return behavior.", "A 70/30 mix behaves differently than 90/10.", "Tweaking picks while ignoring allocation."),
    "rebalancing": GlossaryEntry("Returning allocations to target weights.", "It controls drift and concentration risk.", "Trim outperformers and add laggards by rule.", "Only rebalancing after panic, not by plan."),
    "risk tolerance": GlossaryEntry("How much loss and volatility you can handle.", "It should match your horizon and behavior.", "A short horizon often needs less equity risk.", "Choosing aggressive targets you cannot stick with."),
    "time horizon": GlossaryEntry("How long until you need the money.", "It determines suitable risk levels.", "Retirement funds can take more volatility than 1-year goals.", "Using the same portfolio for all goals."),
    "compounding": GlossaryEntry("Returns generating additional returns over time.", "Time magnifies consistent behavior.", "7% growth can double capital roughly every decade.", "Underestimating the cost of delayed investing."),
    "dollar cost averaging": GlossaryEntry("Investing fixed amounts at regular intervals.", "It reduces timing pressure and emotional entries.", "Monthly ETF buys through volatility.", "Expecting DCA to always beat lump sum."),
    "market timing": GlossaryEntry("Trying to predict entry/exit points.", "Mistiming often misses best recovery days.", "Selling in panic can lock losses.", "Assuming one signal can call exact tops/bottoms."),
    "opportunity cost": GlossaryEntry("The value of the next best alternative you skipped.", "Idle capital has hidden cost in long horizons.", "Cash at 1% vs market at 7% compounds a gap.", "Ignoring alternatives when making ""safe"" choices."),
    "etf": GlossaryEntry("Exchange-Traded Fund holding many assets.", "Low-cost diversification for many investors.", "A broad market ETF tracks hundreds of companies.", "Treating every ETF as equally diversified."),
    "index fund": GlossaryEntry("Fund designed to match an index, not beat it.", "It reduces fees and active manager risk.", "S&P 500 index exposure via one product.", "Chasing hot sectors and abandoning core indexing."),
    "stock": GlossaryEntry("Ownership share in a company.", "Equities are key long-term growth assets.", "Owners participate in earnings and valuation changes.", "Assuming price and business quality always match short-term."),
    "bond": GlossaryEntry("A loan to a government or company.", "Adds income and can stabilize portfolios.", "Bond prices usually fall as yields rise.", "Ignoring duration and credit risk differences."),
    "yield": GlossaryEntry("Income return from an asset.", "Higher yield can signal higher risk.", "A risky bond may pay more due to default risk.", "Chasing yield without credit analysis."),
    "duration": GlossaryEntry("Sensitivity of bond prices to rate changes.", "Higher duration means bigger price moves.", "Long bonds can drop sharply when rates jump.", "Owning long duration unknowingly."),
    "credit spread": GlossaryEntry("Extra yield over safer benchmarks.", "Wider spreads often signal rising credit stress.", "Spreads usually widen in recessions.", "Assuming spreads cannot widen further."),
    "default risk": GlossaryEntry("Risk a borrower cannot repay debt.", "It matters more in weak economic regimes.", "High-yield bonds carry higher default risk.", "Buying high yield without balance-sheet checks."),
    "valuation": GlossaryEntry("How expensive an asset is vs fundamentals.", "Valuation affects long-run return potential.", "High multiples require stronger future growth.", "Paying any price for a great story."),
    "earnings": GlossaryEntry("Company profits available to shareholders.", "Earnings support sustainable equity gains.", "Revenue growth without margin support can disappoint.", "Focusing only on top-line growth."),
    "cash flow": GlossaryEntry("Actual cash generated by a business.", "Cash flow quality supports resilience and reinvestment.", "Strong free cash flow can support downturn survival.", "Confusing accounting profit with cash strength."),
    "balance sheet": GlossaryEntry("Snapshot of assets, liabilities, and equity.", "Leverage and liquidity drive survival in shocks.", "Low debt firms often hold up better in stress.", "Ignoring debt maturity and cash runway."),
    "free cash flow": GlossaryEntry("Cash left after operating and capital expenses.", "Supports dividends, buybacks, and debt reduction.", "Consistent FCF often signals business quality.", "Ignoring reinvestment needs behind FCF."),
    "p/e ratio": GlossaryEntry("Price-to-earnings valuation multiple.", "Helps compare valuation across time/peers.", "Higher P/E implies stronger growth expectations.", "Using P/E without growth and rate context."),
    "max drawdown": GlossaryEntry("Largest observed peak-to-trough loss.", "Critical for sizing and behavioral durability.", "A strategy with deep MDD may be hard to hold.", "Using return stats without drawdown context."),
    "stop loss": GlossaryEntry("Rule to exit when loss reaches a threshold.", "Can cap downside in high-volatility trades.", "Sell if price falls 8% from entry.", "Setting stops too tight for normal volatility."),
    "position sizing": GlossaryEntry("How much capital you allocate to one position.", "Sizing controls risk more than prediction quality.", "Cap single positions at a fixed portfolio percent.", "Going oversized on high-conviction narratives."),
    "concentration risk": GlossaryEntry("Risk from too much exposure to one position/theme.", "Single shocks can dominate total results.", "One mega-cap at 40% can drive portfolio fate.", "Mistaking recent winners for permanent safety."),
    "correlation": GlossaryEntry("How assets move relative to each other.", "Low correlation supports diversification.", "Two assets can both rise but with different cycles.", "Assuming labels imply low correlation."),
    "hedging": GlossaryEntry("Reducing risk via offsetting positions.", "Can smooth outcomes during adverse scenarios.", "Using defensive assets when inflation rises.", "Treating hedges as free protection."),
    "safe haven": GlossaryEntry("Assets often favored during stress.", "Can reduce portfolio shock sensitivity.", "Cash and high-quality government bonds are common examples.", "Assuming any asset is always a safe haven."),
    "black swan": GlossaryEntry("Rare, high-impact, hard-to-predict event.", "Requires robust risk frameworks and resilience.", "Pandemic shock rapidly reset market assumptions.", "Building strategies that only work in normal regimes."),
    "tail risk": GlossaryEntry("Risk of extreme negative outcomes.", "Tail events can dominate long-term results.", "Leverage plus illiquidity increases tail damage.", "Ignoring low-probability, high-impact scenarios."),
    "behavioral bias": GlossaryEntry("Systematic thinking errors in decisions.", "Biases often hurt returns more than fees.", "Panic selling after losses is a classic bias outcome.", "Assuming intelligence alone removes bias."),
    "loss aversion": GlossaryEntry("Pain of losses feels stronger than gain pleasure.", "Can trigger bad exits and under-investment.", "Selling after a drop to avoid further discomfort.", "Confusing emotional relief with good strategy."),
    "fomo": GlossaryEntry("Fear of missing out on gains.", "Often causes late entries and poor sizing.", "Buying after a vertical rally without plan.", "Treating crowd excitement as a signal."),
    "overconfidence": GlossaryEntry("Overestimating forecasting or skill accuracy.", "Leads to oversized bets and excess turnover.", "Believing one thesis cannot fail.", "Skipping risk limits after a winning streak."),
    "panic selling": GlossaryEntry("Selling primarily from fear during declines.", "Locks losses and may miss rebounds.", "Dumping assets after sharp red days.", "Acting without pre-defined rules."),
    "great depression": GlossaryEntry("Severe 1930s global economic contraction.", "Teaches leverage, banking, and policy lessons.", "Deflation and bank failures prolonged hardship.", "Assuming modern policy removes all crisis risk."),
    "bank run": GlossaryEntry("Mass withdrawals from banks due to fear.", "Can destabilize the financial system quickly.", "Rumors can trigger liquidity stress even before insolvency.", "Assuming confidence shocks are purely rational."),
    "gold standard": GlossaryEntry("System linking currency value to gold.", "Can limit policy flexibility in crises.", "Countries leaving gold often recovered faster in 1930s.", "Assuming fixed currency rules always increase stability."),
    "tariff": GlossaryEntry("Tax on imported goods.", "Can change trade flows and inflation dynamics.", "Retaliatory tariffs can reduce global demand.", "Ignoring second-round policy effects."),
    "covid shock": GlossaryEntry("Pandemic-era sudden stop in activity and confidence.", "Shows how fast regimes can shift.", "Lockdowns changed demand, labor, and policy at once.", "Assuming linear recovery paths."),
    "reopening boom": GlossaryEntry("Post-restriction surge in activity and demand.", "Can create strong growth and inflation together.", "Travel/services rebounded sharply in many regions.", "Assuming boom leadership stays constant."),
    "supply chain": GlossaryEntry("Network for producing and delivering goods.", "Disruptions can affect inflation and earnings.", "Shipping delays raised costs across sectors.", "Treating bottlenecks as instantly solvable."),
    "stimulus": GlossaryEntry("Government support to households/firms/economy.", "Can stabilize demand during shocks.", "Transfers boosted spending during weak labor markets.", "Ignoring inflation side effects from large stimulus."),
    "soft landing": GlossaryEntry("Slowing inflation without severe recession.", "Markets often reprice quickly around this narrative.", "Equities may rally if disinflation arrives with stable jobs.", "Treating narrative as guaranteed outcome."),
    "emergency fund": GlossaryEntry("Cash buffer for unexpected expenses.", "Protects long-term investments from forced liquidation.", "3-6 months of expenses is a common target.", "Investing aggressively before basic liquidity is set."),
    "net worth": GlossaryEntry("Assets minus liabilities.", "Core measure of long-term financial progress.", "Debt payoff can raise net worth even without returns.", "Focusing only on account balances without liabilities."),
}

TOPIC_HINTS: dict[str, list[str]] = {
    "inflation": ["inflation", "interest rates", "duration"],
    "volatility": ["volatility", "drawdown", "position sizing"],
    "great_depression": ["great depression", "bank run", "deflation"],
    "covid": ["covid shock", "reopening boom", "supply chain"],
    "post_covid_boom": ["reopening boom", "soft landing", "inflation"],
    "stocks": ["stock", "valuation", "earnings"],
    "bonds": ["bond", "yield", "duration"],
    "market_timing": ["market timing", "dollar cost averaging", "rebalancing"],
}

BLOCKED_PATTERNS = [
    "how to manipulate",
    "insider trading",
    "tax evasion",
    "launder",
]

HARDCODED_ANSWERS: dict[str, str] = {
    "what is inflation in simple words?": (
        "Inflation means prices go up over time, so your money buys less than before.\n\n"
        "Simple example: if lunch cost $10 last year and now costs $11, that is inflation.\n\n"
        "Why it matters: if your savings grow slower than inflation, your real purchasing power shrinks."
    ),
    "i am new. what is a stock?": (
        "A stock is a tiny ownership piece of a company.\n\n"
        "If the company grows profits over time, that ownership can become more valuable.\n\n"
        "Simple example: owning stock is like owning a very small slice of a business, not just a random number on a screen."
    ),
    "what does diversification mean?": (
        "Diversification means not putting all your money in one place.\n\n"
        "You spread across different assets so one bad result hurts less overall.\n\n"
        "Simple example: instead of one stock, you hold a broad fund with many companies."
    ),
    "what is risk in investing?": (
        "Risk in investing means outcomes can differ from what you expect, including losing money or facing big ups and downs.\n\n"
        "Simple example: a stock can rise 20% or fall 20% in a year.\n\n"
        "Important point: risk is not just loss, it is uncertainty."
    ),
}


class ChatServiceError(Exception):
    pass


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def _safe_contains(haystack: str, needle: str) -> bool:
    return re.search(rf"\b{re.escape(needle)}\b", haystack) is not None


def find_glossary_term(question: str) -> str | None:
    q = _normalize(question)
    for term in sorted(GLOSSARY.keys(), key=len, reverse=True):
        if _safe_contains(q, term):
            return term
    return None


def _is_card_explanation(question: str) -> bool:
    q = _normalize(question)
    return q.startswith("explain this card:")


def _entry_to_answer(term: str, entry: GlossaryEntry) -> str:
    return (
        f"{term.title()}: {entry.definition}\n\n"
        f"Why it matters: {entry.why_it_matters}\n"
        f"Example: {entry.example}\n"
        f"Common mistake: {entry.common_mistake}"
    )


def glossary_suggestions(question: str, topics: list[str] | None = None, limit: int = 5) -> list[str]:
    q = _normalize(question)
    scores: list[tuple[int, str]] = []

    for term in GLOSSARY:
        score = 0
        for token in q.split(" "):
            if len(token) > 3 and token in term:
                score += 2
        if term in q:
            score += 5
        scores.append((score, term))

    if topics:
        for topic in topics:
            for hint in TOPIC_HINTS.get(topic, []):
                scores.append((6, hint))

    unique_sorted: list[str] = []
    for _, term in sorted(scores, key=lambda x: x[0], reverse=True):
        if term in GLOSSARY and term not in unique_sorted:
            unique_sorted.append(term)
        if len(unique_sorted) >= limit:
            break

    return unique_sorted


async def _llm_fallback(question: str, stage: int | None, topics: list[str]) -> str | None:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return None

    system_prompt = (
        "You are a concise financial education tutor for beginners. "
        "Keep explanations under 120 words. "
        "Use plain language, one short example, and include one 'watch out' mistake. "
        "Never give buy/sell advice."
    )
    user_prompt = (
        f"Question: {question}\n"
        f"Learner stage: {stage or 'unknown'}\n"
        f"Current topics: {', '.join(topics) if topics else 'none'}"
    )

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.2,
        "max_tokens": 220,
    }

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
        content = data["choices"][0]["message"]["content"].strip()
        return content
    except Exception:
        return None


async def explain_term(question: str, stage: int | None = None, topics: list[str] | None = None) -> dict:
    q = _normalize(question)
    for blocked in BLOCKED_PATTERNS:
        if blocked in q:
            raise ChatServiceError("This assistant can only help with educational financial explanations.")

    if q in HARDCODED_ANSWERS:
        return {
            "answer": HARDCODED_ANSWERS[q],
            "source": "hardcoded",
            "term_matched": None,
            "suggestions": glossary_suggestions(question, topics),
        }

    term = find_glossary_term(question)
    if term:
        entry = GLOSSARY[term]
        return {
            "answer": _entry_to_answer(term, entry),
            "source": "glossary",
            "term_matched": term,
            "suggestions": glossary_suggestions(question, topics),
        }

    if _is_card_explanation(question):
        llm_answer = await _llm_fallback(question, stage, topics or [])
        if llm_answer:
            return {
                "answer": llm_answer,
                "source": "llm",
                "term_matched": None,
                "suggestions": glossary_suggestions(question, topics),
            }

    suggestions = glossary_suggestions(question, topics)
    if suggestions:
        first = suggestions[0]
        entry = GLOSSARY[first]
        answer = (
            "I could not find an exact glossary match yet, but this nearby concept should help:\n\n"
            + _entry_to_answer(first, entry)
        )
    else:
        answer = (
            "I could not match that term yet. Try asking with words like inflation, diversification, "
            "volatility, bonds, or market timing."
        )

    return {
        "answer": answer,
        "source": "fallback",
        "term_matched": None,
        "suggestions": suggestions,
    }


# Small in-memory rate limit bucket per user id (process-local)
_RATE_BUCKET: dict[str, list[float]] = {}


def allow_request(user_id: str, max_requests: int = 20, window_seconds: int = 60) -> bool:
    now = time.time()
    timestamps = _RATE_BUCKET.get(user_id, [])
    timestamps = [t for t in timestamps if now - t <= window_seconds]
    if len(timestamps) >= max_requests:
        _RATE_BUCKET[user_id] = timestamps
        return False
    timestamps.append(now)
    _RATE_BUCKET[user_id] = timestamps
    return True
