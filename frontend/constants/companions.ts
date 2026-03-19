export type CompanionId = "bull" | "penny" | "luna" | "dash" | "bear" | "sage";

export type CompanionPhraseContext =
  | "welcome"
  | "correct"
  | "incorrect"
  | "rank_up"
  | "low_capital"
  | "bull_market"
  | "bear_market"
  | "volatile"
  | "idle_3s"
  | "lesson_comment"
  | "tap_avatar";

export interface CompanionMarketState {
  sentiment?: number;
  inflation?: number;
  greed?: number;
  volatility?: number;
  fundamentals?: number;
}

export interface CompanionDefinition {
  id: CompanionId;
  name: string;
  emoji: string;
  accentColor: string;
  personality: string;
  systemPrompt: string;
  previewQuote: string;
  phrases: Record<CompanionPhraseContext, string[]>;
}

type PhraseBlueprint = Record<CompanionPhraseContext, string[]>;

function makePhrases(segments: PhraseBlueprint): PhraseBlueprint {
  return segments;
}

const bullPhrases = makePhrases({
  welcome: [
    "We are so back. Let's swing big and make the tape sweat.",
    "New session, fresh conviction, zero fear.",
    "CardEcon just opened and I already smell upside.",
    "We're not tiptoeing in. We're charging.",
    "Wake up, champ. Opportunity is already moving.",
    "Let's build a stack and a story worth bragging about.",
    "I brought energy, optimism, and terrible restraint.",
    "Market on. Horns up.",
  ],
  correct: [
    "Boom. That's how winners read the room.",
    "Yes. Clean read, clean move, big energy.",
    "You saw the setup and hit it. Love that.",
    "That's the kind of conviction that prints.",
    "Tape respected. We move.",
    "Great swipe. Momentum likes us.",
    "Smart and spicy. My favorite combo.",
    "That's alpha with extra swagger.",
  ],
  incorrect: [
    "Okay, tiny stumble. Reload and rip the next one.",
    "That one clipped us, not crushed us.",
    "Missed read. Confidence stays, lesson gets sharper.",
    "Small bruise, still bullish.",
    "We got tagged. We answer with better timing.",
    "Not ideal, but champions recover mid-candle.",
    "One red print does not end the run.",
    "Shake it off. The next card owes us respect.",
  ],
  rank_up: [
    "Promotion energy. The room just noticed us.",
    "Rank up. That's what happens when conviction compounds.",
    "New badge, same appetite for upside.",
    "Level climbed. Street credibility unlocked.",
    "We just got a bigger seat at the table.",
    "Respect. The scoreboard agrees with us now.",
    "Another rung up the ladder. Keep pushing.",
    "The title got fancier because your calls got sharper.",
  ],
  low_capital: [
    "Capital's light, so every move needs purpose.",
    "Smaller stack now. That means cleaner spots only.",
    "No panic. Tight bankroll, tighter discipline.",
    "We've got less ammo, so aim with intent.",
    "This is where patience protects the comeback.",
    "Lean capital. Big focus.",
    "We don't need volume. We need edge.",
    "Play smart now and the stack can heal.",
  ],
  bull_market: [
    "Green tape. Let the winners breathe.",
    "This market wants risk. I want more.",
    "Bull vibes are on and the crowd is charging.",
    "Momentum loves confidence. So do I.",
    "Uptrend on deck. Press, don't freeze.",
    "Risk appetite is awake. Time to surf it.",
    "This is the kind of tape that rewards courage.",
    "The market's running. We can run with it.",
  ],
  bear_market: [
    "Ugly tape. We stay selective and strike clean.",
    "Bear mood out there. No lazy swings.",
    "Downtrend means sharper filters, not surrender.",
    "When the room gets cold, entries matter more.",
    "We don't force it in a sloppy market.",
    "Bad mood market. Pick battles, protect chips.",
    "This tape bites. Respect it, then exploit it.",
    "Bear season is for discipline and nerve.",
  ],
  volatile: [
    "Fast tape. Tight decisions, no drifting.",
    "Volatility is high and my pulse approves.",
    "Big swings mean big traps. Stay sharp.",
    "This market is caffeinated. Read twice, act once.",
    "Wild range today. Conviction needs receipts.",
    "Speed everywhere. Control your entries.",
    "Chaos can pay, but only if we're precise.",
    "Choppy market. Keep your feet under you.",
  ],
  idle_3s: [
    "We waiting, or we hunting? Same thing if you're ready.",
    "Every quiet second is a setup forming.",
    "I can feel opportunity stretching backstage.",
    "Keep your eyes up. The next edge won't announce itself.",
    "Discipline between decisions still counts.",
    "No boredom. Just pre-breakout silence.",
    "I like this pause. It smells like momentum loading.",
    "Stay sharp. The next call matters.",
  ],
  lesson_comment: [
    "Lesson banked. That's how instincts get expensive.",
    "Good. File that away and let it compound.",
    "Every lesson is future edge.",
    "Not just a result. That's pattern recognition training.",
    "See it, store it, weaponize it later.",
    "That takeaway will pay rent soon enough.",
    "We're building reps, not just reactions.",
    "Knowledge plus nerve is a dangerous combo.",
  ],
  tap_avatar: [
    "You tapped the bull. That means you want courage.",
    "Checking in? My answer is still buy conviction.",
    "Need a push? Fine: trust your read and move.",
    "I am always available for hype and directional bias.",
    "Quick note: hesitation rarely outperforms clarity.",
    "I was just about to tell you to stay aggressive.",
    "Ping received. Confidence restored.",
    "Horns online. What's the setup?",
  ],
});

const pennyPhrases = makePhrases({
  welcome: [
    "Hi there. Let's take it one careful decision at a time.",
    "I'm here. We can go slowly and still do well.",
    "A calm start is a strong start.",
    "Let's check the facts and protect your money.",
    "No rush today. Thoughtful choices are enough.",
    "Ready when you are. We can be patient.",
    "I'll keep an eye on the details with you.",
    "Let's make steady progress, not noisy progress.",
  ],
  correct: [
    "Nice work. That was measured and sensible.",
    "Good call. You didn't overreach.",
    "That choice balanced risk well.",
    "Well done. Careful thinking paid off.",
    "You read that one thoughtfully.",
    "That's the kind of decision that keeps accounts healthy.",
    "Smart move. Quietly strong.",
    "I like that. Clear head, clean result.",
  ],
  incorrect: [
    "That's okay. Let's slow down and review what changed.",
    "Not ideal, but we can learn from it safely.",
    "A miss is still useful information.",
    "No shame in that one. Want to check the signal again next time?",
    "That one got away from us. We'll steady the pace.",
    "We're okay. Let's tighten our checklist.",
    "Losses feel loud, but lessons last longer.",
    "Let's be gentle and get sharper from here.",
  ],
  rank_up: [
    "You earned that. Consistency really does add up.",
    "Rank up. Nice proof that careful work compounds.",
    "A bigger title from a lot of small smart choices.",
    "That's lovely progress.",
    "You climbed because you stayed disciplined.",
    "Your patience is showing on the scoreboard.",
    "It's nice to see steady work rewarded.",
    "One step higher. Nicely done.",
  ],
  low_capital: [
    "Cash is getting tight, so let's protect what remains.",
    "We have less room for mistakes now.",
    "This is a good time to favor clarity over excitement.",
    "Let's preserve the stack and wait for cleaner opportunities.",
    "Small bankroll, gentle hands.",
    "We can recover, but only if we stay selective.",
    "Let's keep the next few moves simple and safe.",
    "Money is precious here. No rushing.",
  ],
  bull_market: [
    "Markets look friendlier, but we still don't need to chase.",
    "A rising market helps, though prices can still get silly.",
    "There's more optimism around. Let's stay grounded.",
    "Uptrends are helpful when entries still make sense.",
    "Good environment, but we can keep our standards.",
    "More green out there. We can participate thoughtfully.",
    "This market feels healthier. Let's not confuse that with risk-free.",
    "Better conditions invite action, not carelessness.",
  ],
  bear_market: [
    "Falling markets are a reminder to protect capital first.",
    "This is a careful season, not a hurried one.",
    "When markets slide, cash and patience both matter.",
    "Let's keep risk small while conditions are rough.",
    "Down markets punish overconfidence.",
    "A weaker tape means stronger filters.",
    "This is the moment for selective choices.",
    "We don't have to force anything in a falling market.",
  ],
  volatile: [
    "Big swings today. Let's double-check before committing.",
    "Volatility can magnify mistakes, so let's stay calm.",
    "Choppy markets reward patience more than speed.",
    "Fast moves are tempting. Careful moves are safer.",
    "We can let the noise pass before acting.",
    "A wilder market means the margin for error gets smaller.",
    "Let's look for stable footing.",
    "If it feels rushed, it's probably not our best setup.",
  ],
  idle_3s: [
    "Quiet moments are perfect for thinking.",
    "No need to fill every pause with action.",
    "I'm checking the details while we wait.",
    "A pause can be productive too.",
    "Patience is still part of the strategy.",
    "We can let the next decision come to us.",
    "A calm tempo often leads to better outcomes.",
    "Let's stay observant, not anxious.",
  ],
  lesson_comment: [
    "That's a useful lesson. Let's keep it handy.",
    "Good. That adds a little more confidence for next time.",
    "Understanding why matters more than being perfect.",
    "That explanation will help future decisions.",
    "A nice bit of learning there.",
    "Let's tuck that lesson away and reuse it.",
    "Progress often looks like better questions.",
    "The more we understand, the less we need to guess.",
  ],
  tap_avatar: [
    "I'm here. Want to think this through together?",
    "Checking in is always a good idea.",
    "Let's make sure the logic still holds.",
    "Happy to take a second look with you.",
    "I don't mind being cautious. It usually helps.",
    "We can go one question at a time.",
    "A quick pause for clarity? I approve.",
    "Tell me what feels uncertain.",
  ],
});

const lunaPhrases = makePhrases({
  welcome: [
    "Welcome back. Let's move with patience and perspective.",
    "Another session begins. Breathe first, decide second.",
    "We don't need to rush to grow.",
    "The market is loud; our mind can stay calm.",
    "Let's take the long view, even in short moments.",
    "I'm with you. We can be steady here.",
    "Good choices often begin with quiet attention.",
    "Let's build something lasting today.",
  ],
  correct: [
    "A wise choice. You listened to the signal beneath the noise.",
    "Nicely done. That was balanced and clear.",
    "That decision had patience in it.",
    "You moved with confidence, not haste.",
    "Good call. The shape of that answer was sound.",
    "That felt aligned with the bigger picture.",
    "You chose well and calmly.",
    "A thoughtful move like that travels far.",
  ],
  incorrect: [
    "Not every path opens the way we expect. We learn and continue.",
    "That's alright. Missteps can still illuminate the road.",
    "The lesson is still valuable, even when the result stings.",
    "Pause here. See what this result is teaching you.",
    "We can adjust gently from this.",
    "No need for harshness. Reflection is enough.",
    "Even wrong turns can improve our map.",
    "Let's carry the insight forward and leave the shame behind.",
  ],
  rank_up: [
    "You've grown. The title simply caught up.",
    "Another rank, earned through steady learning.",
    "Progress has a quiet glow to it.",
    "You climbed because your judgment deepened.",
    "That rise reflects more than numbers.",
    "Beautiful. Growth revealed itself again.",
    "A new level, built from many calm decisions.",
    "You are becoming more deliberate. It shows.",
  ],
  low_capital: [
    "Resources are thinner now, so let intention become sharper.",
    "When the stack is small, patience becomes even more powerful.",
    "We can protect this season and grow again later.",
    "Less capital asks for more clarity.",
    "There is wisdom in waiting for the right opening.",
    "Small reserves call for gentle discipline.",
    "Let's move lightly until conditions improve.",
    "Scarcity can teach focus if we let it.",
  ],
  bull_market: [
    "The market is warming. We can welcome it without chasing it.",
    "Optimism is rising, but balance still matters.",
    "A favorable wind helps most when the sails are set well.",
    "This uptrend can be useful if we stay centered.",
    "Good conditions invite action, not recklessness.",
    "There is strength in the market today. Let's meet it with grace.",
    "Rising prices can still reward patient entries.",
    "Even in bright seasons, discipline is a lantern.",
  ],
  bear_market: [
    "The market is contracting. Protection is wisdom now.",
    "Falling conditions ask for humility and care.",
    "In colder cycles, survival is its own victory.",
    "This is a season for selectivity.",
    "Bearish weather rewards those who stay grounded.",
    "The wise move is often the one that preserves optionality.",
    "Let's not force growth in poor soil.",
    "Some periods are for defense and observation.",
  ],
  volatile: [
    "The waters are restless. Anchor before you act.",
    "Volatility magnifies impulse, so we should soften ours.",
    "Big swings can tempt a hurried hand.",
    "When motion increases, clarity must deepen.",
    "This is not a day for emotional trading.",
    "Let's stand still long enough to see clearly.",
    "A stormy tape asks for a quiet mind.",
    "Movement is fast; our judgment can still be slow and true.",
  ],
  idle_3s: [
    "A pause is not empty. It lets insight arrive.",
    "There is information in stillness too.",
    "We can wait without wasting the moment.",
    "I like this quiet. It sharpens the next choice.",
    "Let the market move. We do not have to mirror it.",
    "Calm attention is also a strategy.",
    "The next answer often ripens in silence.",
    "Steady breath, steady choices.",
  ],
  lesson_comment: [
    "That lesson added contour to your judgment.",
    "Good. Understanding is becoming more intuitive.",
    "A clear explanation can outlast a lucky result.",
    "Keep that insight close; it will return.",
    "Learning changes the pace of future decisions.",
    "That was more than feedback. It was perspective.",
    "You are collecting reasons, not just results.",
    "Wisdom grows in these small reflections.",
  ],
  tap_avatar: [
    "I'm here. What would you like to understand more deeply?",
    "Let's look beneath the surface together.",
    "A question asked calmly is already half-answered.",
    "Tell me what feels tangled.",
    "We can slow the noise and inspect the pattern.",
    "I'm listening. Let's make it clear.",
    "Curiosity is a strong compass.",
    "Ask, and we'll trace the signal together.",
  ],
});

const dashPhrases = makePhrases({
  welcome: [
    "Systems online. Data path clear. Let's optimize.",
    "Boot sequence complete. Time to process edge.",
    "Fresh session. New signal set. Let's move fast and smart.",
    "Telemetry is hot. I'm ready.",
    "Inputs loaded. Decision engine awaiting excellent choices.",
    "We're live. Probability hunting starts now.",
    "Another run. More data. Better calibration.",
    "Guide mode active. Let's compute.",
  ],
  correct: [
    "Correct. Expected value liked that move.",
    "Nice. Signal quality was high and you respected it.",
    "That choice scored well on both logic and timing.",
    "Positive outcome confirmed. Good pattern match.",
    "Strong read. Efficient execution.",
    "Yep. Decision latency low, quality high.",
    "That was a clean high-probability click.",
    "Result accepted. Nicely optimized.",
  ],
  incorrect: [
    "Output missed target. No panic. Recalibrate.",
    "Incorrect, but informative. Our model just improved.",
    "That one was noisy. Let's tighten inputs.",
    "Loss recorded. Insight extracted.",
    "Suboptimal choice. Valuable data point anyway.",
    "Variance bit us there. We respond with better filters.",
    "The forecast was off. The learning isn't.",
    "Okay, patch the heuristic and continue.",
  ],
  rank_up: [
    "Rank increased. Performance trend confirmed.",
    "Level up detected. Great efficiency curve.",
    "Promotion unlocked. Your model is improving.",
    "New tier achieved. That's repeatable quality.",
    "Scoreboard updated in your favor.",
    "You're compounding skill, not just capital.",
    "Advancement logged. Good work.",
    "Higher rank. Better signal processing.",
  ],
  low_capital: [
    "Capital buffer is low. Risk budget reduced.",
    "Stack compression detected. Need cleaner setups.",
    "Lower cash means tighter error tolerance.",
    "We need high-quality signals only from here.",
    "Bankroll drawdown noted. Precision mode recommended.",
    "Less capital, less room for noise.",
    "Protect remaining resources while edge rebuilds.",
    "Conserve chips. Deploy carefully.",
  ],
  bull_market: [
    "Sentiment positive. Trend-following has tailwind.",
    "Market regime favors risk-on behavior right now.",
    "Upward bias detected. Momentum setups improve.",
    "Bullish conditions increase opportunity frequency.",
    "Positive tape. Watch for clean continuation patterns.",
    "Green environment. Good for selective pressure.",
    "Buyers have control. Use that information.",
    "Regime looks supportive. Stay systematic.",
  ],
  bear_market: [
    "Negative regime detected. Defense matters more.",
    "Bearish tape reduces forgiveness for weak entries.",
    "Downtrend active. Prioritize preservation.",
    "Risk-off behavior increasing across the board.",
    "This market punishes sloppy execution.",
    "Lower-quality environment. Filter harder.",
    "Weak regime. Don't confuse motion with opportunity.",
    "Capital defense mode fits here.",
  ],
  volatile: [
    "Volatility spike detected. Signal noise is elevated.",
    "Range expansion underway. Reactivity must stay controlled.",
    "Fast market. Decision quality must outpace speed.",
    "High variance environment. Avoid impulsive clicks.",
    "Choppy tape. Tighten thresholds.",
    "Volatility up. Expect more fakeouts.",
    "Noise level increased. Confirm before acting.",
    "Big swings mean wider error bars.",
  ],
  idle_3s: [
    "Monitoring for fresh signal.",
    "No action yet. That's fine. Data is still arriving.",
    "Quiet intervals help reset bias.",
    "Processing. Waiting is allowed.",
    "Idle does not mean inactive. It means observant.",
    "Stand by. Better entry may be seconds away.",
    "Scanning for asymmetry.",
    "Hold. Evaluate. Then deploy.",
  ],
  lesson_comment: [
    "Lesson stored. Model update successful.",
    "Useful explanation. That improves future prediction quality.",
    "Knowledge packet received.",
    "Good. That context reduces future noise.",
    "More understanding means fewer random guesses.",
    "That explanation increased edge density.",
    "Archive this one. It's reusable.",
    "Teaching moment accepted and indexed.",
  ],
  tap_avatar: [
    "Ping received. What's the query?",
    "I'm online. Let's inspect the numbers.",
    "Need a fast breakdown? I can do that.",
    "Tap acknowledged. Feed me the problem.",
    "Ready for analysis mode.",
    "You summoned the robot. That was efficient.",
    "Let's debug the market idea together.",
    "Ask away. I brought metrics.",
  ],
});

const bearPhrases = makePhrases({
  welcome: [
    "Morning. I assume something is overpriced.",
    "We're back. Excellent. More chances to avoid nonsense.",
    "Let's see what the market is mispricing now.",
    "Fresh session, same healthy suspicion.",
    "Coffee's hot. Expectations are low. Perfect.",
    "Ready when you are. I brought caution.",
    "Let's begin by doubting the obvious story.",
    "Another day, another opportunity to notice risk.",
  ],
  correct: [
    "Huh. Nicely done. That was actually sensible.",
    "Correct. Miracles happen.",
    "You spotted the flaw in the setup. Good.",
    "Solid read. You avoided the trap.",
    "That choice had proper skepticism in it.",
    "Yes. Finally, someone respected downside.",
    "Good call. Risk was the real headline there.",
    "You read that with adult supervision. Impressive.",
  ],
  incorrect: [
    "There it is. Markets punish optimism eventually.",
    "Not great. Still, the downside lesson was free.",
    "That one hurt because risk won the argument.",
    "We missed the crack in the story.",
    "Unpleasant, yes. Educational, also yes.",
    "Classic. The cheerful version of events failed.",
    "That's why we check the downside first.",
    "Bad result. Useful scar tissue.",
  ],
  rank_up: [
    "Rank up. Apparently caution is marketable.",
    "Promotion achieved. Grim competence pays.",
    "A higher title for noticing what can go wrong.",
    "Well-earned. The scoreboard appreciates restraint.",
    "You advanced by respecting risk. Shocking concept.",
    "New rank, same suspicious outlook.",
    "Good. Progress with minimal delusion.",
    "The system rewarded realism for once.",
  ],
  low_capital: [
    "Capital's thin. Now every mistake gets louder.",
    "Small stack. Bad time for heroics.",
    "This is when preserving cash becomes a personality.",
    "We can recover, but only if we stop pretending every idea is special.",
    "Low capital means hard filters and fewer bets.",
    "Protect the scraps. They're still useful.",
    "The margin for error is now decorative.",
    "Let's not donate the rest to bad setups.",
  ],
  bull_market: [
    "Market's cheerful. That's usually when people overpay.",
    "Bullish tone, inflated confidence. Lovely combination for future regret.",
    "Yes, prices are rising. So are expectations.",
    "Good tape for gains, also for complacency.",
    "If everyone's excited, someone is underestimating risk.",
    "Rally conditions make discipline look boring. Keep it anyway.",
    "Uptrend noted. So is the temptation to get sloppy.",
    "Enjoy the green, but keep one eyebrow raised.",
  ],
  bear_market: [
    "Now this is a market with honest body language.",
    "Bearish conditions expose weak assumptions fast.",
    "Finally, a tape that punishes fantasy.",
    "Downtrend active. Caution is fashionable again.",
    "This is where preserving capital stops sounding timid.",
    "The market is sour, which means risk is visible.",
    "Ugly tape. Good time to stay demanding.",
    "This environment rewards skepticism.",
  ],
  volatile: [
    "Volatility's up. Wonderful. Everyone gets emotional.",
    "Fast swings mean sloppy traders reveal themselves quicker.",
    "Choppy market. Perfect conditions for bad decisions.",
    "The tape is unstable. Be less dramatic than it is.",
    "High volatility means wider downside if you're lazy.",
    "This market twitches. Don't copy it.",
    "Messy environment. Keep your guard up.",
    "If it feels frantic, step back and inspect risk.",
  ],
  idle_3s: [
    "Silence. Rare and suspicious.",
    "No signal yet. Good. Fewer ways to be wrong.",
    "Waiting is underrated by people who hate cash.",
    "Patience still beats dumb activity.",
    "A pause can save a lot of cleanup later.",
    "I'm content to wait until the risk is obvious.",
    "Quiet moments are excellent for doubting your assumptions.",
    "No action is often the least embarrassing action.",
  ],
  lesson_comment: [
    "Useful lesson. We can now be wrong less elegantly.",
    "Good. Another reason to distrust easy narratives.",
    "That explanation had teeth. Keep it.",
    "A lesson like that reduces future pain. Slightly.",
    "Not bad. Actual understanding is rarer than enthusiasm.",
    "That's worth remembering when the market gets theatrical again.",
    "See? The downside had something to teach.",
    "Useful scar tissue acquired.",
  ],
  tap_avatar: [
    "You rang. Let me guess, you want the risk version.",
    "I'm here. The answer is probably more caution.",
    "Quick check-in? Fine. What's the downside case?",
    "Let's inspect the thing everyone's ignoring.",
    "You tapped the skeptic. Good instinct.",
    "Tell me the idea and I'll tell you what can fail.",
    "Happy to help ruin a flimsy thesis.",
    "Proceed. I'll bring the deadpan.",
  ],
});

const sagePhrases = makePhrases({
  welcome: [
    "Welcome. Let's learn the pattern before we judge the result.",
    "Another session, another chance to understand how markets think.",
    "We'll aim for clear reasoning today.",
    "Good to see you. Let's keep curiosity active.",
    "I like beginnings. They leave room for explanation.",
    "Let's study first, then act.",
    "A thoughtful investor grows a little each round.",
    "Ready to learn why, not just what? Excellent.",
  ],
  correct: [
    "Well reasoned. The logic of that choice was sound.",
    "Correct. You matched the principle to the situation.",
    "Nicely done. That's understanding in action.",
    "That move shows good conceptual grounding.",
    "Excellent. You applied the right framework.",
    "That was a strong read because the reasoning held up.",
    "Good choice. You didn't just guess the answer.",
    "That's the kind of decision that teaches itself twice.",
  ],
  incorrect: [
    "Not correct, but very teachable.",
    "That's alright. Mistakes are often the clearest instructors.",
    "Let's examine why it missed; that's where the value is.",
    "A wrong answer can still reveal a right principle.",
    "No problem. We'll turn this into understanding.",
    "This is an opportunity to strengthen the model in your head.",
    "The result is off, but the lesson can still be precise.",
    "Let's refine the reasoning and continue.",
  ],
  rank_up: [
    "Congratulations. Your understanding has become more visible.",
    "Rank increased. Evidence that your judgment is maturing.",
    "Well earned. Skill compounds quietly, then shows up suddenly.",
    "A higher rank reflects better reasoning under uncertainty.",
    "Good progress. The frameworks are sticking.",
    "You've advanced because the decisions beneath the surface improved.",
    "Another step upward. Nicely deserved.",
    "That promotion has intellectual roots, not just numerical ones.",
  ],
  low_capital: [
    "Lower capital changes the cost of being wrong.",
    "When resources shrink, risk management grows in importance.",
    "This is a useful moment to emphasize selectivity.",
    "Smaller bankrolls benefit from fewer, better decisions.",
    "Capital preservation is a concept worth practicing here.",
    "Let's reduce errors before we try to increase gains.",
    "Less money means tighter tolerance for bad assumptions.",
    "We can recover, but only through discipline.",
  ],
  bull_market: [
    "Rising markets often reward risk, but valuation still matters.",
    "A bullish environment is helpful, though not universally safe.",
    "Uptrends are easier to navigate when you remember why they're working.",
    "This regime favors optimism, but good investors still ask for evidence.",
    "Positive momentum is real, yet not every asset deserves it.",
    "Bullish conditions improve odds for some strategies, not all of them.",
    "A strong market is a tailwind, not a substitute for judgment.",
    "This is a good time to separate durable strength from excitement.",
  ],
  bear_market: [
    "Falling markets reveal balance sheet quality and emotional discipline.",
    "Bearish environments teach the value of preservation.",
    "Downtrends often clarify which assumptions were fragile.",
    "This is a useful regime for thinking about downside first.",
    "Weak markets reward patience and punish wishful thinking.",
    "In difficult conditions, optionality becomes an asset.",
    "Bear markets are harsh, but they are also instructive.",
    "This is where risk management becomes visible.",
  ],
  volatile: [
    "Volatility increases uncertainty, which makes frameworks more valuable.",
    "A choppy market can obscure signal, so we must simplify the problem.",
    "Big swings don't remove logic; they make it more necessary.",
    "In volatility, process matters more than confidence.",
    "Fast price changes often test emotional control more than intelligence.",
    "This is a good time to separate narrative from evidence.",
    "Volatile conditions reward disciplined interpretation.",
    "Let's be methodical while the market is erratic.",
  ],
  idle_3s: [
    "Pauses are excellent times to organize the idea.",
    "Reflection between moves improves the next move.",
    "No need to rush. Understanding grows in quiet gaps too.",
    "Let's keep the framework active while we wait.",
    "A little patience often prevents a lot of confusion.",
    "Observe first. Action can wait a breath.",
    "Quiet moments are still part of the lesson.",
    "Consider the principle before the price.",
  ],
  lesson_comment: [
    "That's a useful principle to retain.",
    "Excellent. The explanation strengthens the intuition.",
    "A lesson like that improves future transfer, not just this card.",
    "Good. You're building concepts, not trivia.",
    "That insight will generalize well.",
    "Notice how the explanation links cause and effect.",
    "Very helpful. That's the kind of lesson that sticks.",
    "Keep that one. It's broadly applicable.",
  ],
  tap_avatar: [
    "Certainly. What concept should we unpack?",
    "Happy to help. Let's make the reasoning concrete.",
    "Ask away. I'll aim for clarity over jargon.",
    "Let's turn the confusion into a framework.",
    "A question is a good place to begin.",
    "I'm here. We can trace it from first principles.",
    "Tell me what's unclear, and we'll build from there.",
    "Glad to explain. Why matters.",
  ],
});

export const COMPANIONS: Record<CompanionId, CompanionDefinition> = {
  bull: {
    id: "bull",
    name: "BULL",
    emoji: "🐂",
    accentColor: "#E74C3C",
    personality: "Aggressive, YOLO, hype-machine",
    systemPrompt: "You are BULL, an over-the-top optimistic investor bro. Use hype slang, emojis, short punchy sentences. Always bullish. Never boring.",
    previewQuote: "Let's gooo! Markets are ripping and fear is for later.",
    phrases: bullPhrases,
  },
  penny: {
    id: "penny",
    name: "Penny",
    emoji: "🦊",
    accentColor: "#E67E22",
    personality: "Careful, frugal, always double-checks",
    systemPrompt: "You are Penny, a cautious fox who loves to save. Use gentle, thoughtful language. Ask clarifying questions. Never rush.",
    previewQuote: "Let's protect the downside first and let the upside earn our trust.",
    phrases: pennyPhrases,
  },
  luna: {
    id: "luna",
    name: "Luna",
    emoji: "🌙",
    accentColor: "#9B59B6",
    personality: "Balanced, wise, long-horizon thinker",
    systemPrompt: "You are Luna, a calm and wise guide. Use poetic but clear language. Focus on patience and long-term thinking.",
    previewQuote: "Slow choices can still lead to beautiful outcomes.",
    phrases: lunaPhrases,
  },
  dash: {
    id: "dash",
    name: "Dash",
    emoji: "⚡",
    accentColor: "#F1C40F",
    personality: "Tech-obsessed, fast, data-forward",
    systemPrompt: "You are Dash, a hyperactive robot obsessed with data. Use numbers, percentages, and tech jargon but explain them. Fast sentences.",
    previewQuote: "Signal first, speed second, confusion never.",
    phrases: dashPhrases,
  },
  bear: {
    id: "bear",
    name: "BEAR",
    emoji: "🐻",
    accentColor: "#795548",
    personality: "Skeptical, contrarian, doom-aware",
    systemPrompt: "You are BEAR, the eternal skeptic. Everything is overvalued. Use dry humor and deadpan delivery. Always find the risk.",
    previewQuote: "If everyone's excited, I start looking for the trap door.",
    phrases: bearPhrases,
  },
  sage: {
    id: "sage",
    name: "Sage",
    emoji: "🦉",
    accentColor: "#27AE60",
    personality: "Academic, educational, explains deeply",
    systemPrompt: "You are Sage, a wise owl professor. Use clear explanations with analogies. Always teach why, not just what.",
    previewQuote: "Understanding the mechanism usually beats memorizing the outcome.",
    phrases: sagePhrases,
  },
};

export const COMPANION_LIST = Object.values(COMPANIONS);

export interface PickPhraseOptions {
  recentPhrases?: string[];
  marketState?: CompanionMarketState;
  capital?: number;
}

export function pickPhrase(
  companionId: CompanionId,
  context: CompanionPhraseContext,
  options: PickPhraseOptions = {}
): string {
  const definition = COMPANIONS[companionId];
  const pool = definition.phrases[context] ?? definition.phrases.idle_3s;
  const recent = options.recentPhrases ?? [];
  const filtered = pool.filter((phrase) => !recent.includes(phrase));
  const source = filtered.length > 0 ? filtered : pool;
  return source[Math.floor(Math.random() * source.length)];
}

export function getIdleContextFromMarket(
  marketState?: CompanionMarketState
): CompanionPhraseContext {
  const sentiment = marketState?.sentiment ?? 0;
  const volatility = marketState?.volatility ?? 0;
  if (volatility >= 0.45) return "volatile";
  if (sentiment >= 0.3) return "bull_market";
  if (sentiment <= -0.3) return "bear_market";
  return "idle_3s";
}
