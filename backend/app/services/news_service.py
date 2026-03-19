"""News feed service — generates template-based market news that preludes upcoming events."""
from __future__ import annotations
import random
from datetime import datetime, timedelta, timezone
from typing import Any

# ─── Template library ─────────────────────────────────────────────────────────
# Each entry: (headline, body, sentiment)   sentiment: "bullish" | "bearish" | "mixed"
TEMPLATES: dict[str, list[tuple[str, str, str]]] = {
    "inflation": [
        ("Fed Chair Signals 'Persistent Pressure' on Price Stability",
         "Remarks from Jackson Hole suggest the central bank remains vigilant as core PCE holds above target for the fourth consecutive month.",
         "bearish"),
        ("Grocery Prices Hit 15-Year High",
         "The food-at-home index surged 6.3% year-over-year in the latest BLS report, squeezing household budgets across income brackets.",
         "bearish"),
        ("Supply Chain Bottlenecks Resurface in Consumer Goods",
         "Shipping container rates from East Asia jumped 34% this week amid renewed port congestion, threatening to re-ignite goods inflation.",
         "bearish"),
        ("Wage Growth Accelerates in Service Sector",
         "Average hourly earnings rose 4.8% year-over-year in the latest jobs report, keeping alive concerns about a wage-price spiral.",
         "mixed"),
        ("Rent Inflation Remains Sticky Despite Rate Hikes",
         "Shelter costs — the largest component of CPI — continued to climb, lagging the cooling in spot market rents by over 12 months.",
         "bearish"),
        ("Producer Price Index Creeps Higher",
         "PPI rose 0.4% month-over-month, pointing to pipeline pressures that could flow through to consumers in coming quarters.",
         "bearish"),
        ("Import Prices Jump on Dollar Weakness",
         "A 3.2% decline in the DXY index over the past month is beginning to show up in import prices, adding to domestic inflationary pressures.",
         "bearish"),
    ],
    "rate_hike": [
        ("Fed Officials Hint at Additional Tightening",
         "Several FOMC members struck a hawkish tone at this week's regional Fed events, suggesting markets may be underpricing the terminal rate.",
         "bearish"),
        ("Treasury Yields Surge on Hot Jobs Data",
         "The 10-year yield jumped 18 basis points after payrolls smashed expectations, reinforcing bets on a higher-for-longer rate path.",
         "bearish"),
        ("Mortgage Rates Climb to Multi-Decade Highs",
         "The 30-year fixed rate crossed 7.5%, adding roughly $400/month in payments on a median-priced home versus one year ago.",
         "bearish"),
        ("Corporate Debt Refinancing Stress Mounts",
         "Companies face a 'maturity wall' of $1.2 trillion in bonds due by year-end, many issued when rates were near zero.",
         "bearish"),
        ("Money Market Funds Draw Record Inflows as Rate Outlook Rises",
         "Investors poured $78 billion into money market funds this week, seeking safety and yield as rate hike expectations climbed.",
         "mixed"),
    ],
    "rate_cut": [
        ("Fed Signals Possible Policy Pivot",
         "Minutes from the latest FOMC meeting reveal growing discussion of when — not if — rate cuts become appropriate.",
         "bullish"),
        ("Weak Jobs Report Opens Door for Fed Easing",
         "Unemployment ticked up to 4.3%, the highest since 2021, strengthening the case for the Fed to begin its cutting cycle.",
         "bullish"),
        ("Yield Curve Steepens as Rate Cut Bets Increase",
         "The 2-10 spread moved toward normalization this week as traders priced in 75 basis points of cuts over the next 12 months.",
         "bullish"),
        ("Regional Bank Stress Revives 'Fed Put' Expectations",
         "After three mid-size lenders reported deteriorating loan books, markets quickly priced in emergency liquidity support.",
         "mixed"),
        ("Fed Funds Futures Price In Three Cuts by Year-End",
         "Derivatives markets now assign a 78% probability to at least 75 bps of easing before December, a sharp reversal from last month's expectations.",
         "bullish"),
    ],
    "market_crash": [
        ("Volatility Index Spikes to Highest Level Since March 2020",
         "The VIX surged above 40 as equity markets experienced their sharpest single-day drop in four years, rattling investor confidence.",
         "bearish"),
        ("Margin Call Cascade Accelerates Selling Pressure",
         "Prime brokers forced liquidations across levered equity funds as collateral requirements triggered a chain reaction of forced selling.",
         "bearish"),
        ("Circuit Breakers Halt Trading for 15 Minutes",
         "Markets triggered Level 1 circuit breakers for the first time in three years as the S&P 500 fell 7% at the open.",
         "bearish"),
        ("Hedge Fund Exposure to Crowded Longs Creates Air Pocket",
         "Data from Goldman Sachs prime services shows record crowding in a handful of mega-cap tech names — a vulnerability in a risk-off environment.",
         "bearish"),
        ("Liquidity Evaporates in Credit Markets",
         "Bid-ask spreads in high-yield bonds widened to levels not seen since the 2020 COVID panic, signaling severe risk aversion.",
         "bearish"),
        ("Risk Parity Funds Forced to Reduce Exposure Across All Asset Classes",
         "Algorithmic deleveraging by volatility-targeting strategies amplified the selloff as correlations spiked toward 1.0.",
         "bearish"),
    ],
    "market_rally": [
        ("Earnings Season Surprises to the Upside for Third Consecutive Quarter",
         "With 80% of S&P 500 companies reporting, aggregate earnings per share exceeded estimates by 6.2%, fueling a broad-based rally.",
         "bullish"),
        ("Soft Landing Narrative Gains Credibility After CPI Print",
         "Inflation cooled more than expected while job growth remained solid, reviving optimism that the Fed can engineer a gentle deceleration.",
         "bullish"),
        ("Foreign Investor Flows Into US Equities Hit Record",
         "International asset managers increased US equity exposure by $47 billion in the latest week, the largest single-week inflow on record.",
         "bullish"),
        ("Short Squeeze Amplifies Rally in Beaten-Down Sectors",
         "Heavily shorted small-cap and retail stocks surged as bearish bets were unwound, adding momentum to the broader market advance.",
         "bullish"),
        ("AI Infrastructure Spending Cycle Shows No Signs of Slowing",
         "Major cloud providers reiterated aggressive capex plans for AI compute, providing earnings visibility for the semiconductor supply chain.",
         "bullish"),
        ("Buyback Authorizations Surge as Companies Signal Confidence",
         "S&P 500 companies announced $280 billion in share repurchase programs this quarter, the highest since 2022 and a historically bullish signal.",
         "bullish"),
    ],
    "crypto_volatility": [
        ("Bitcoin Futures Open Interest Reaches All-Time High",
         "Derivatives markets are at maximum exposure, a historically mixed signal that has preceded both explosive rallies and sharp corrections.",
         "mixed"),
        ("Crypto Exchange Reports Unusual Withdrawal Spike",
         "Net outflows from major centralized exchanges hit a three-month high, suggesting large holders are moving assets to cold storage.",
         "mixed"),
        ("Stablecoin Supply Contracts for Fourth Consecutive Week",
         "The aggregate market cap of USDT and USDC fell $8 billion, reducing the 'dry powder' available for crypto spot purchases.",
         "bearish"),
        ("Regulatory Clarity Expected as Congress Advances Digital Asset Bill",
         "A bipartisan bill targeting stablecoin oversight and spot ETF rules advanced out of committee, a potential catalyst for institutional adoption.",
         "bullish"),
        ("Bitcoin Miner Capitulation Index Reaches Danger Zone",
         "The hash ribbon indicator — which tracks miner profitability — entered its 'capitulation' zone, historically a precursor to accumulation phases.",
         "mixed"),
        ("Institutional Bitcoin ETF Inflows Accelerate",
         "Spot Bitcoin ETFs collectively recorded $1.2 billion in net inflows over five consecutive sessions, the longest streak since approval.",
         "bullish"),
        ("Crypto Leverage Ratio Hits Cycle High, Raising Liquidation Risk",
         "The estimated leverage ratio across major exchanges reached 0.23, suggesting significant positions could be wiped in a 10-15% drawdown.",
         "bearish"),
    ],
    "gold_move": [
        ("Central Banks Accelerate Gold Reserve Diversification",
         "Emerging market central banks purchased a record 228 tonnes of gold in a single quarter, the fastest accumulation since the Bretton Woods era.",
         "bullish"),
        ("Real Yields Turn Negative, Boosting Gold Appeal",
         "Ten-year TIPS yields fell below zero for the first time in 18 months, removing a key headwind for non-yielding precious metals.",
         "bullish"),
        ("Gold-to-Oil Ratio Hits Three-Year High",
         "The relative value of gold versus crude oil reached levels historically associated with deflationary scares and flight-to-safety positioning.",
         "mixed"),
        ("ETF Gold Holdings Surge as Geopolitical Risks Mount",
         "Physical gold ETFs saw $3.2 billion in inflows over the past five trading sessions, the largest such streak in two years.",
         "bullish"),
        ("Dollar Weakness Supercharges Gold's Upside",
         "As the DXY index retreated from its 2024 highs, gold priced in non-USD currencies broke out to all-time records across 47 countries.",
         "bullish"),
    ],
    "tech_move": [
        ("Semiconductor Inventory Cycle Showing Early Signs of Bottoming",
         "Lead times for specialty chips contracted for the second consecutive quarter, suggesting the worst of the supply overhang may be passing.",
         "bullish"),
        ("Cloud Spending Growth Decelerates as Enterprises Optimize",
         "CFOs across Fortune 500 companies report aggressive cloud cost reduction programs, creating near-term headwinds for hyperscalers.",
         "bearish"),
        ("AI Chip Allocation Tightens, Driving Premium Pricing",
         "Demand for the latest GPU generation is running 6x current supply, forcing model developers to compete for scarce compute resources.",
         "bullish"),
        ("Big Tech Antitrust Scrutiny Intensifies in Washington",
         "The DOJ filed a new competition complaint targeting app store practices, adding regulatory tail risk to the sector's valuation premium.",
         "bearish"),
        ("Developer Activity Index Signals Accelerating AI Adoption",
         "GitHub's annual developer survey shows 73% now use AI coding assistants daily, up from 22% a year ago — a proxy for platform engagement.",
         "bullish"),
        ("Tech Sector P/E Multiple Compresses on Rising Rate Expectations",
         "Growth stocks — particularly those with negative free cash flow — saw multiple contraction as the discount rate outlook shifted higher.",
         "bearish"),
    ],
    "recession_fear": [
        ("Yield Curve Inversion Deepens to 40-Year Extreme",
         "The 2-year / 10-year spread reached -108 basis points, a level last seen in the early 1980s — every prior instance preceded a recession.",
         "bearish"),
        ("Leading Economic Indicators Fall for Twelfth Consecutive Month",
         "The Conference Board's LEI declined 0.6% in the latest reading, extending the longest unbroken decline streak since 2008.",
         "bearish"),
        ("Manufacturing PMI Enters Contraction Territory",
         "The ISM Manufacturing Index fell to 47.3, its sixth sub-50 reading in a row, as new orders and export orders both weakened sharply.",
         "bearish"),
        ("CEO Confidence Survey Hits Post-COVID Low",
         "A quarterly survey of 450 chief executives found the lowest confidence reading since Q2 2020, with capital expenditure intentions falling sharply.",
         "bearish"),
        ("Consumer Credit Card Delinquency Rates Rise for Third Quarter",
         "The share of credit card balances 90+ days past due climbed to 3.1%, the highest since 2012, signaling stress in lower-income households.",
         "bearish"),
        ("Small Business Hiring Intentions Collapse",
         "The NFIB Small Business Optimism Index's employment component fell to its lowest since 2010, suggesting the jobs market is softening beneath the surface.",
         "bearish"),
    ],
    "commodity": [
        ("OPEC+ Surprise Cut Sends Oil Prices Surging",
         "The cartel announced an additional 1 million barrel per day production cut effective next month, blindsiding energy traders and boosting WTI by 7%.",
         "mixed"),
        ("Natural Gas Storage Draw Exceeds Forecasts by Wide Margin",
         "A colder-than-expected weather pattern depleted natural gas inventories at twice the five-year average pace, lifting futures to seasonal highs.",
         "mixed"),
        ("Agricultural Commodity Prices Spike on Black Sea Disruption",
         "Shipping disruptions in the Black Sea corridor — responsible for 30% of global wheat exports — triggered sharp gains in grain futures.",
         "bearish"),
        ("Copper Prices Surge on Green Energy Demand Outlook",
         "Electrification targets across the EU and US require 5x current copper production capacity by 2035, driving speculative positioning in futures.",
         "bullish"),
    ],
    "bond_market": [
        ("Foreign Demand for US Treasuries Weakens at Auction",
         "The latest 10-year auction showed below-average bid-to-cover ratios and minimal foreign participation, pushing yields higher.",
         "bearish"),
        ("Corporate Bond Issuance Surges Ahead of Expected Rate Volatility",
         "Investment-grade companies rushed to market with $48 billion in new bonds this week, locking in current rates before policy uncertainty returns.",
         "mixed"),
        ("High-Yield Spreads Widen to Recession-Level Territory",
         "CCC-rated bond spreads over Treasuries exceeded 1,000 basis points for the first time since the 2020 COVID shock.",
         "bearish"),
        ("Duration Risk Returns to Fixed Income After Yield Spike",
         "Long-dated Treasury ETFs fell 4% this week as the 30-year yield briefly breached 5%, raising questions about bond allocation strategy.",
         "bearish"),
        ("Bond Market Signals Confidence in Fed's Inflation Fight",
         "Break-even inflation expectations embedded in TIPS fell to 2.1%, the lowest since 2021, suggesting the market believes inflation is beaten.",
         "bullish"),
    ],
    "geopolitical": [
        ("Trade Tariff Escalation Threatens Supply Chains",
         "New tariff announcements covering $300 billion in goods prompted swift retaliation, with analysts warning of a 0.4% hit to global GDP.",
         "bearish"),
        ("Sanctions Package Disrupts Energy Export Routes",
         "New financial sanctions on a major oil-producing nation raised fears of supply disruption, triggering a 5% spike in Brent crude prices.",
         "mixed"),
        ("Currency Intervention Signals Growing Dollar Pressure",
         "Finance ministers from G7 nations issued a rare joint statement expressing concern about the dollar's strength and its impact on emerging markets.",
         "mixed"),
        ("Defense Spending Surge Reshapes Government Budget Priorities",
         "G7 governments collectively committed to raising defense budgets by 2% of GDP, shifting capital away from social programs and infrastructure.",
         "mixed"),
    ],
}

# ─── Keyword mapping ─────────────────────────────────────────────────────────
_KEYWORD_MAP: list[tuple[list[str], str]] = [
    (["inflation", "cpi", "pce", "price", "cost of living"], "inflation"),
    (["rate hike", "tightening", "hawkish", "fed raise", "bps higher"], "rate_hike"),
    (["rate cut", "pivot", "dovish", "easing", "fed cut", "lower rates"], "rate_cut"),
    (["crash", "selloff", "plunge", "correction", "bear", "covid", "panic", "circuit breaker"], "market_crash"),
    (["rally", "surge", "bull", "recovery", "rebound", "all-time high"], "market_rally"),
    (["bitcoin", "crypto", "btc", "ethereum", "digital asset", "coinbase", "defi"], "crypto_volatility"),
    (["gold", "precious metal", "safe haven", "bullion", "silver"], "gold_move"),
    (["tech", "nasdaq", "semiconductor", "ai ", "gpu", "software", "cloud", "apple", "microsoft"], "tech_move"),
    (["recession", "gdp contraction", "downturn", "slowdown", "yield curve inversion"], "recession_fear"),
    (["oil", "natural gas", "commodity", "opec", "energy", "wheat", "grain", "copper"], "commodity"),
    (["bond", "treasury", "yield", "fixed income", "duration"], "bond_market"),
    (["tariff", "sanction", "geopolit", "war", "conflict", "trade war"], "geopolitical"),
]


def _classify_event(label: str, description: str, impact: str) -> list[str]:
    text = (label + " " + description).lower()
    categories: list[str] = []
    for keywords, category in _KEYWORD_MAP:
        if any(kw in text for kw in keywords):
            categories.append(category)
    if not categories:
        categories.append("market_rally" if impact == "positive" else "recession_fear" if impact == "negative" else "bond_market")
    return categories


def generate_news_feed(upcoming_events: list[dict[str, Any]], count: int = 8) -> list[dict[str, Any]]:
    """Build a news feed that preludes upcoming market events."""
    selected: list[dict[str, Any]] = []
    used_categories: set[str] = set()
    now = datetime.now(timezone.utc)

    # First pass: news tied to the upcoming events
    for event in upcoming_events[:6]:
        categories = _classify_event(
            event.get("label", ""),
            event.get("description", ""),
            event.get("impact", "neutral"),
        )
        for cat in categories:
            if cat in used_categories:
                continue
            templates = TEMPLATES.get(cat, [])
            if not templates:
                continue
            tmpl = random.choice(templates)
            hours_ago = random.randint(1, 20)
            selected.append({
                "id": f"{cat}_{random.randint(100, 999)}",
                "headline": tmpl[0],
                "body": tmpl[1],
                "category": cat,
                "sentiment": tmpl[2],
                "urgency": "high" if event.get("impact") in ("positive", "negative") else "medium",
                "timestamp": (now - timedelta(hours=hours_ago)).isoformat(),
            })
            used_categories.add(cat)
            break

    # Fill remaining with random background noise
    all_cats = list(TEMPLATES.keys())
    random.shuffle(all_cats)
    for cat in all_cats:
        if len(selected) >= count:
            break
        if cat in used_categories:
            continue
        templates = TEMPLATES.get(cat, [])
        if not templates:
            continue
        tmpl = random.choice(templates)
        hours_ago = random.randint(4, 60)
        selected.append({
            "id": f"{cat}_{random.randint(100, 999)}",
            "headline": tmpl[0],
            "body": tmpl[1],
            "category": cat,
            "sentiment": tmpl[2],
            "urgency": "low",
            "timestamp": (now - timedelta(hours=hours_ago)).isoformat(),
        })
        used_categories.add(cat)

    urgency_order = {"high": 0, "medium": 1, "low": 2}
    selected.sort(key=lambda x: (urgency_order.get(x["urgency"], 2), x["timestamp"]))
    return selected[:count]
