# Game Documentation

## Overview

**Start** is an interactive, educational investment trading card game where players make strategic market decisions to grow their capital. Players evaluate financial market scenarios presented as trading cards and make buy/sell decisions based on their predictions of market movements. The game combines educational financial literacy with engaging gameplay mechanics.

---

## Game Objective

The primary objective is to **maximize capital** by making informed investment decisions across multiple rounds. Players:

1. **Evaluate scenarios** presented as trading cards
2. **Make binary decisions** (left/right actions) predicting market direction or outcomes
3. **Earn/lose capital** based on decision accuracy
4. **Progress through stages** as their financial knowledge improves
5. **Build wealth** by achieving higher capital than starting amount

---

## Core Game Modes

### 1. Single-Player Campaign

Players engage in a story-driven game session with a personalized **investor persona** (e.g., conservative, aggressive, growth-focused). Each session consists of:

- **Progression**: Players advance through 5 stages (difficulty levels)
- **Personalized Content**: Cards are recommended based on player's persona and performance
- **Capital System**: Starting capital of 10,000 currency units
- **Dynamic Market State**: Market conditions change based on player decisions
- **Peak Capital Tracking**: Records the maximum capital achieved during the session

#### Key Mechanics:
- **Swipe Actions**: Players swipe left or right on cards to indicate their decision
- **Card Recommendation System**: Next card is dynamically selected based on:
  - Player's current skill level
  - Financial topics they've explored
  - Persona alignment
  - Diagnostic power (card's ability to assess player knowledge)
- **Investor Rank**: Dynamically updates based on performance
- **Topic Mastery**: Tracks competency in different investment topics

### 2. Arena Mode (Multiplayer)

Players compete in **real-time, turn-based multiplayer matches** against other players. Key features:

- **Room-Based**: 2-8 players per arena (configurable)
- **Shared Card Sequence**: All players see the same pre-determined card sequence
- **Synchronized Rounds**: Everyone plays simultaneously before round results reveal
- **Leaderboard Competition**: Rankings based on capital at end of game
- **WebSocket Communication**: Real-time updates across all connected players

#### Arena Flow:
1. **Host creates room** with game parameters:
   - Number of rounds (typically 10)
   - Starting capital (typically 10,000)
   - Max players
   - Pre-generated card sequence

2. **Players join lobby** with unique 6-character room code

3. **Host starts game** when ready

4. **Turn-based rounds**:
   - All players see current card
   - Each player makes left/right decision
   - When all players have moved → results display
   - Rankings update, move to next round

5. **Final standings** show:
   - Rank
   - Final capital
   - Capital gained/lost vs starting amount

---

## Card System

### Card Structure

Each card represents a financial scenario with:

- **Title & Body**: Brief scenario description (emoji + text)
- **Two Choices**: "Left Choice" and "Right Choice" (e.g., "Buy" vs "Sell")
- **Lessons**: Educational content for each choice
- **Type**: education, event, or action
- **Difficulty**: 0.0–1.0 (ease of prediction)
- **Card Band Color**: Visual indicator (red, green, amber, purple, steel_blue)

### Card Attributes

```
- Title: Short scenario title
- Body: Expanded scenario description
- Left Choice: Action description (e.g., "Short the Market")
- Right Choice: Action description (e.g., "Long the Market")
- Left Lesson: Educational content if player chooses left
- Right Lesson: Educational content if player chooses right
- Emoji: Visual identifier
- Stage Min/Max: Which game stages this card appears in
- Topics: Investment topics covered (e.g., "inflation", "sentiment")
- Linked Traits: Persona traits this card tests
- Difficulty: How hard the prediction is
- Diagnostic Power: How well this card identifies player knowledge
- Alpha: Multiplier for reward calculation
```

### Market Dimensions

Cards influence 5 market dimensions:

- **Sentiment**: Market optimism/pessimism
- **Inflation**: Price level trends
- **Greed**: Risk appetite in market
- **Volatility**: Market uncertainty
- **Fundamentals**: Underlying economic health

Each card has weights for these dimensions that shift market state.

### Card Reward System

When a player makes a decision:

1. **Base reward** determined by card difficulty and correctness of prediction
2. **Market multiplier** applied based on current market state:
   - If market state aligns with decision → positive multiplier
   - If market state opposes decision → reduced reward
3. **Alpha multiplier**: Card-specific scaling factor (default 1.0)
4. **Capital delta** = reward × 200 × alpha
5. **New capital** = max(old capital + delta, minimum floor)

---

## Progression & Advancement

### Stages

Players progress through **5 stages** (1–5) based on performance:

- **Stage 1–2**: Beginner-friendly scenarios
- **Stage 3**: Intermediate market dynamics
- **Stage 4–5**: Advanced, complex market conditions

Card recommendations filter by stage_min/stage_max to match player skill.

### Investor Rank

Tracked throughout the session and updated based on:

- Capital growth
- Accuracy of predictions
- Consistency of decision-making

Higher rank unlocks:
- More complex cards
- Harder scenarios
- Greater capital multipliers

### Topic Mastery

Tracks competency across financial topics:

- **Inflation Strategies**: How to navigate price level changes
- **Market Sentiment**: Reading and acting on market mood
- **Volatility Trading**: Profiting in uncertain markets
- **Fundamentals Analysis**: Evaluating underlying value
- **Risk Management**: Protecting capital

Mastery influences card recommendations.

---

## Persona System

### What is a Persona?

A **persona** is a financial archetype that defines:

- Player's investment philosophy (conservative, aggressive, etc.)
- Risk tolerance
- Preferred market strategies
- Career/background

Players can have **multiple personas** to explore different playstyles.

### Persona Features

- **Vector representation**: Multi-dimensional trait space
- **Persona traits**: Associated with specific financial approaches
- **Linked to cards**: Cards test and reinforce specific traits
- **Dynamic updates**: Persona shifts based on decisions made

Examples:
- **Growth Investor**: High risk tolerance, seeks capital appreciation
- **Value Investor**: Patient, fundamental-analysis focused
- **Swing Trader**: Exploits short-term volatility
- **Conservative**: Capital preservation, lower risk

---

## Reward & Capital System

### Capital Mechanics

- **Starting Capital**: 10,000 (default, configurable)
- **Minimum Floor**: 100 (prevents total ruin)
- **Peak Capital**: Highest capital reached during session
- **Capital Growth**: Primary measure of player success

### Reward Calculation

```
reward = base_reward × market_multiplier × alpha
capital_delta = reward × 200 × alpha
new_capital = max(old_capital + capital_delta, 100)
```

Where:
- `base_reward`: Determined by card difficulty & prediction accuracy
- `market_multiplier`: Adjustment based on current market state
- `alpha`: Card-specific scaling (default 1.0)

### Market State Impact

Market state (sentiment, inflation, greed, volatility, fundamentals) creates dynamic difficulty:

- **Aligned decisions** (decision matches market): Higher multiplier
- **Contrarian decisions** (opposing market): Lower multiplier
- Encourages both trend-following and contrarian strategies

---

## Game Sessions & Data Persistence

### Game Session Model

Each single-player session tracks:

- **Session ID**: Unique identifier
- **User ID**: Player identifier
- **Persona ID**: Associated persona (if any)
- **Stage**: Current progression level (1–5)
- **Capital**: Current wealth
- **Peak Capital**: Maximum reached
- **Progress**: Session completion percentage
- **Game Events**: History of all swipes and results
- **Persona Vector**: Current persona state
- **Topic Mastery**: Competency tracking
- **Portfolio Weights**: Asset allocation

### Game Events

Every swipe creates a **GameEvent**:

- **Card ID**: Which card was swiped
- **Action**: "left" or "right"
- **Reward**: Capital gained/lost
- **Persona Before/After**: Persona state changes
- **Timestamp**: When decision was made

---

## Arena Multiplayer Features

### Room Management

- **Room Code**: 6-character unique identifier (e.g., "A1B2C3")
- **Host**: Player who created and can start the room
- **Max Players**: 2–8 (configurable)
- **Status**: waiting → playing → finished

### Room State

Broadcast to all players via WebSocket includes:

- Current round number
- Total rounds
- All players and their current capital
- Current card being played
- Rankings after each round

### Real-Time Synchronization

- **WebSocket connections** per player
- **Broadcast messaging**: Updates sent to all connected players
- **Connection tracking**: Detects disconnects, marks players as disconnected
- **Automatic round completion**: Once all players act, round finalizes
- **Live rankings**: Updated after every round

### Arena Rewards

- Calculated identically to single-player
- **No market state multiplier** (simplified for multiplayer)
- **Immediate feedback**: Results show after round completes
- **Final standings**: Game over message with rankings

---

## Educational Features

### Lessons & Learning

Each card provides **educational content** (left_lesson & right_lesson) that:

- Explains the market scenario
- Teaches decision-making framework
- Reinforces financial concepts
- Builds understanding of market dynamics

Players can review **session history** to:

- See all past decisions
- Revisit lessons learned
- Analyze performance across topics
- Track persona evolution

### Recommended Learning Path

The **card recommender system** orders cards to:

1. **Diagnose knowledge gaps** (using diagnostic power)
2. **Build foundational understanding** (stage-appropriate difficulty)
3. **Challenge and deepen mastery** (topic mastery alignment)
4. **Reinforce persona traits** (linked traits)

---

## Leaderboards & Achievements

### Leaderboard System

Global ranking tracks:

- **Player ranking**: Based on net wealth gained from game sessions
- **Seasonal leaderboards**: Reset periodically
- **Category rankings**: By persona type, stage completed, topic mastery

### Achievements

Players unlock achievements for:

- Reaching milestones (capital targets)
- Completing stages
- Topic mastery
- Special conditions (e.g., "Streak of 10 correct predictions")

---

## Game UI/UX

### Key Screens

#### Start Page
- Login/register
- Game mode selection

#### Game Lobby
- View active sessions
- Create new session with persona selection
- View arena rooms

#### Single-Player Screen
- **Card Display**: Centered card with title, body, emoji
- **Choice Buttons**: Left and right choice buttons
- **HUD (Heads-Up Display)**:
  - Current capital
  - Net change from session start
  - Current stage
  - Round counter
  - Investor rank

#### Arena Lobby
- Room code display
- Player roster
- Starting capital, round count
- "Ready" button for players
- "Start Game" button for host

#### Arena Play Screen
- Synchronized card display
- Live player standings (capital rankings)
- Left/right decision buttons
- Round number indicator

#### Results/Standings
- Capital change summary
- Player rankings
- Net gain/loss tracking

#### Achievements & Portfolio
- Milestone progress
- Persona details
- Historical performance charts

---

## Technical Architecture

### Backend

- **FastAPI**: RESTful API server
- **PostgreSQL**: Persistent data storage
- **SQLAlchemy ORM**: Database modeling
- **Redis**: Caching and real-time state
- **WebSockets**: Real-time multiplayer communication
- **Alembic**: Database migrations

### Frontend

- **React Native/Expo**: Mobile-first application
- **TypeScript**: Type-safe client code
- **API Integration**: RESTful + WebSocket communication
- **Responsive UI**: Optimized for phones and tablets

### Key Services

- **Game Service**: Core game loop and logic
- **Arena Service**: Multiplayer room and game management
- **Card Recommender**: Intelligent card selection
- **Persona Engine**: Persona tracking and updates
- **Portfolio Service**: Capital and reward calculations
- **Achievement Service**: Milestone tracking

---

## Game Design Philosophy

### Learning First
- Financial literacy through engaging gameplay
- Scenario-based learning (not lecture-based)
- Immediate feedback on decisions

### Replayability
- Different personas → different card recommendations
- Market state variation → multiple valid strategies
- Leaderboards → competitive motivation

### Accessibility
- Progressive difficulty (stages 1–5)
- Clear choice descriptions
- Educational content in lessons
- Adjustable game parameters (capital, rounds)

### Engagement
- Real-time multiplayer (arena mode)
- Achievement systems
- Persona customization
- Session history & analytics

---

## Getting Started for New Players

### Single-Player Campaign

1. Create account
2. Select or create a persona
3. Start new session
4. Swipe left/right on cards to make predictions
5. Watch capital change based on decisions
6. Learn from lessons
7. Advance through stages as skill improves

### Arena Mode

1. Navigate to Arena
2. Create room (set rounds, capital, players) **OR** Join existing room with code
3. Wait for other players (if multiplayer)
4. Host starts game
5. Play through rounds of simultaneous decisions
6. See final rankings and capital results

---

## Future Expansion Ideas

- **Seasonal content**: Time-limited card sets
- **Community tournaments**: Scheduled arena competitions
- **Trading system**: Players trade insights or personas
- **Narrative campaigns**: Story-driven single-player campaigns
- **Custom rooms**: Players design card sequences
- **Social features**: Leaderboard sharing, team play
- **Market simulation modes**: Longer-form market evolution
- **Advanced analytics**: Detailed performance breakdowns

---

## Conclusion

**Start** is an educational, engaging investment game that teaches financial decision-making through interactive scenarios. Whether playing solo campaigns or competing in multiplayer arenas, players develop financial literacy while enjoying competitive and strategic gameplay.

The game's depth comes from:

- **Dynamic market systems** that reward informed decisions
- **Personalized learning** through persona and topic mastery
- **Real-time multiplayer** for competitive excitement
- **Educational integration** that makes learning feel like play

Welcome to the game!
