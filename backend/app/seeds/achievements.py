"""Achievement seed definitions across 8 categories.

condition_type values used by the achievement checker:
  - total_cards_played    : portfolio.total_cards_played >= value
  - stage_reached         : portfolio.stage >= value
  - capital_reached       : portfolio.capital >= value
  - net_worth_reached     : portfolio.net_worth >= value
  - income_streak         : portfolio.income_streak >= value
  - daily_claims          : count of income claims >= value
  - investor_rank         : portfolio.investor_rank >= value
  - topics_mastered       : len(topics with mastery >= 0.5) >= value
  - right_actions         : count of "right" card plays >= value
  - left_actions          : count of "left" card plays >= value
  - strategies_unlocked   : len(progress.unlocked_strategies) >= value
  - decks_unlocked        : len(progress.unlocked_decks) >= value
  - peak_net_worth        : portfolio.peak_net_worth >= value
"""

SEED_ACHIEVEMENTS = [
    # ── Progress ──────────────────────────────────────────────────────────────
    {"key": "first_card", "category": "progress", "title": "First Steps",
     "description": "Play your first card", "emoji": "👣",
     "tier": "bronze", "condition_type": "total_cards_played", "condition_value": 1},

    {"key": "cards_10", "category": "progress", "title": "Getting Started",
     "description": "Play 10 cards", "emoji": "📚",
     "tier": "bronze", "condition_type": "total_cards_played", "condition_value": 10},

    {"key": "cards_50", "category": "progress", "title": "Dedicated Learner",
     "description": "Play 50 cards", "emoji": "🎓",
     "tier": "silver", "condition_type": "total_cards_played", "condition_value": 50},

    {"key": "cards_100", "category": "progress", "title": "Century Club",
     "description": "Play 100 cards", "emoji": "💯",
     "tier": "gold", "condition_type": "total_cards_played", "condition_value": 100},

    {"key": "cards_250", "category": "progress", "title": "Card Master",
     "description": "Play 250 cards", "emoji": "🃏",
     "tier": "platinum", "condition_type": "total_cards_played", "condition_value": 250},

    # ── Stages ────────────────────────────────────────────────────────────────
    {"key": "stage_2", "category": "stages", "title": "Moving Up",
     "description": "Reach Stage 2", "emoji": "⬆️",
     "tier": "bronze", "condition_type": "stage_reached", "condition_value": 2},

    {"key": "stage_3", "category": "stages", "title": "Intermediate Investor",
     "description": "Reach Stage 3", "emoji": "📈",
     "tier": "silver", "condition_type": "stage_reached", "condition_value": 3},

    {"key": "stage_4", "category": "stages", "title": "Advanced Trader",
     "description": "Reach Stage 4", "emoji": "🚀",
     "tier": "gold", "condition_type": "stage_reached", "condition_value": 4},

    {"key": "stage_5", "category": "stages", "title": "Market Veteran",
     "description": "Reach Stage 5", "emoji": "👑",
     "tier": "platinum", "condition_type": "stage_reached", "condition_value": 5},

    # ── Streaks ───────────────────────────────────────────────────────────────
    {"key": "streak_3", "category": "streaks", "title": "Consistent",
     "description": "Maintain a 3-day income streak", "emoji": "🔥",
     "tier": "bronze", "condition_type": "income_streak", "condition_value": 3},

    {"key": "streak_7", "category": "streaks", "title": "Weekly Warrior",
     "description": "Maintain a 7-day income streak", "emoji": "⚡",
     "tier": "silver", "condition_type": "income_streak", "condition_value": 7},

    {"key": "streak_14", "category": "streaks", "title": "Fortnight Force",
     "description": "Maintain a 14-day income streak", "emoji": "💪",
     "tier": "gold", "condition_type": "income_streak", "condition_value": 14},

    {"key": "streak_30", "category": "streaks", "title": "Monthly Master",
     "description": "Maintain a 30-day income streak", "emoji": "🏅",
     "tier": "platinum", "condition_type": "income_streak", "condition_value": 30},

    # ── Money & Performance ───────────────────────────────────────────────────
    {"key": "capital_12k", "category": "money", "title": "Growing Wealth",
     "description": "Reach $12,000 in capital", "emoji": "💰",
     "tier": "bronze", "condition_type": "capital_reached", "condition_value": 12_000},

    {"key": "capital_15k", "category": "money", "title": "Solid Portfolio",
     "description": "Reach $15,000 in capital", "emoji": "💎",
     "tier": "silver", "condition_type": "capital_reached", "condition_value": 15_000},

    {"key": "capital_20k", "category": "money", "title": "Wealthy Investor",
     "description": "Reach $20,000 in capital", "emoji": "🏦",
     "tier": "gold", "condition_type": "capital_reached", "condition_value": 20_000},

    {"key": "peak_25k", "category": "money", "title": "Peak Performance",
     "description": "Reach a peak net worth of $25,000", "emoji": "⛰️",
     "tier": "platinum", "condition_type": "peak_net_worth", "condition_value": 25_000},

    # ── Investor Rank ─────────────────────────────────────────────────────────
    {"key": "rank_2", "category": "rank", "title": "Apprentice Investor",
     "description": "Reach Investor Rank 2", "emoji": "🥈",
     "tier": "bronze", "condition_type": "investor_rank", "condition_value": 2},

    {"key": "rank_3", "category": "rank", "title": "Skilled Investor",
     "description": "Reach Investor Rank 3", "emoji": "🥇",
     "tier": "silver", "condition_type": "investor_rank", "condition_value": 3},

    {"key": "rank_4", "category": "rank", "title": "Elite Investor",
     "description": "Reach Investor Rank 4", "emoji": "🏆",
     "tier": "gold", "condition_type": "investor_rank", "condition_value": 4},

    # ── Learning Mastery ──────────────────────────────────────────────────────
    {"key": "topics_1", "category": "mastery", "title": "First Mastery",
     "description": "Master your first topic", "emoji": "🧠",
     "tier": "bronze", "condition_type": "topics_mastered", "condition_value": 1},

    {"key": "topics_3", "category": "mastery", "title": "Well Rounded",
     "description": "Master 3 topics", "emoji": "📊",
     "tier": "silver", "condition_type": "topics_mastered", "condition_value": 3},

    {"key": "topics_5", "category": "mastery", "title": "Knowledge Expert",
     "description": "Master 5 topics", "emoji": "🎯",
     "tier": "gold", "condition_type": "topics_mastered", "condition_value": 5},

    # ── Decision Quality ──────────────────────────────────────────────────────
    {"key": "right_10", "category": "decisions", "title": "Prudent Choices",
     "description": "Make 10 right-swipe decisions", "emoji": "👍",
     "tier": "bronze", "condition_type": "right_actions", "condition_value": 10},

    {"key": "right_50", "category": "decisions", "title": "Wise Decisions",
     "description": "Make 50 right-swipe decisions", "emoji": "🦉",
     "tier": "silver", "condition_type": "right_actions", "condition_value": 50},

    {"key": "left_10", "category": "decisions", "title": "Cautious Mind",
     "description": "Make 10 left-swipe decisions", "emoji": "🛡️",
     "tier": "bronze", "condition_type": "left_actions", "condition_value": 10},

    {"key": "left_50", "category": "decisions", "title": "Conservative Strategy",
     "description": "Make 50 left-swipe decisions", "emoji": "🏰",
     "tier": "silver", "condition_type": "left_actions", "condition_value": 50},

    # ── Strategy & Decks ──────────────────────────────────────────────────────
    {"key": "strategies_3", "category": "strategy", "title": "Diversifying",
     "description": "Unlock 3 strategies", "emoji": "🗂️",
     "tier": "silver", "condition_type": "strategies_unlocked", "condition_value": 3},

    {"key": "strategies_5", "category": "strategy", "title": "Full Arsenal",
     "description": "Unlock all 5 strategies", "emoji": "⚔️",
     "tier": "gold", "condition_type": "strategies_unlocked", "condition_value": 5},

    {"key": "decks_3", "category": "strategy", "title": "Deck Collector",
     "description": "Unlock 3 decks", "emoji": "📦",
     "tier": "bronze", "condition_type": "decks_unlocked", "condition_value": 3},

    {"key": "decks_5", "category": "strategy", "title": "Deck Master",
     "description": "Unlock 5 decks", "emoji": "🗃️",
     "tier": "silver", "condition_type": "decks_unlocked", "condition_value": 5},
]
