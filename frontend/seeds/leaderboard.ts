// ─── Leaderboard Seed Data ───────────────────────────────────────────────────
// Hardcoded player entries used to populate the leaderboard screen.
// The real user is inserted at runtime and ranked among these.

export interface SeedPlayer {
  id: string;
  name: string;
  net_worth: number;
  /** Optional avatar initials shown in the row */
  initials: string;
}

export const LEADERBOARD_SEED: SeedPlayer[] = [
  { id: "seed_01", name: "Alex Chen",       initials: "AC", net_worth: 45_800 },
  { id: "seed_02", name: "Jordan Smith",    initials: "JS", net_worth: 98_400 },
  { id: "seed_03", name: "Casey Murphy",    initials: "CM", net_worth: 87_200 },
  { id: "seed_04", name: "Morgan Lee",      initials: "ML", net_worth: 76_900 },
  { id: "seed_05", name: "Riley Johnson",   initials: "RJ", net_worth: 65_300 },
  { id: "seed_06", name: "Taylor Brown",    initials: "TB", net_worth: 54_700 },
  { id: "seed_07", name: "Cameron White",   initials: "CW", net_worth: 43_500 },
  { id: "seed_08", name: "Blake Davis",     initials: "BD", net_worth: 32_400 },
  { id: "seed_09", name: "Drew Wilson",     initials: "DW", net_worth: 21_200 },
  { id: "seed_10", name: "Avery Taylor",    initials: "AT", net_worth: 10_100 },
  { id: "seed_11", name: "Quinn Anderson",  initials: "QA", net_worth:  8_600 },
  { id: "seed_12", name: "Skyler Garcia",   initials: "SG", net_worth:  7_300 },
  { id: "seed_13", name: "Reese Martinez",  initials: "RM", net_worth:  6_100 },
  { id: "seed_14", name: "Finley Thompson", initials: "FT", net_worth:  5_000 },
  { id: "seed_15", name: "Harlow Jackson",  initials: "HJ", net_worth:  4_700 },
];
