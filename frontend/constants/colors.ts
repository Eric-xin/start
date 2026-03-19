export const Colors = {
  // Terminal backgrounds
  bg: "#070d1a",              // deep navy-black
  bgPanel: "#0a1628",         // panel background
  bgCard: "#0d1f3c",          // card-within-panel
  bgSurface: "#111d35",       // elevated surface

  // Borders — blueprint grid feel
  borderPrimary: "#0a6cf5",   // bright blue border
  borderDim: "#1a3a6b",       // dimmer blue border
  borderFaint: "#0d2040",     // very faint border

  // Primary accent — Bloomberg blue (replaces terminal green)
  blue: "#0a6cf5",
  blueLight: "#4d9fff",
  blueDim: "#1a4a8a",
  blueBright: "#2979ff",

  // Status colors
  green: "#00e676",           // positive / right swipe
  red: "#ff1744",             // negative / left swipe
  amber: "#ffab00",           // capital / warning
  teal: "#00bcd4",            // rank

  // Text
  textBright: "#e8f4ff",      // primary text
  textPrimary: "#a8c8f0",     // standard terminal text
  textDim: "#4a7aaa",         // dim/muted
  textMuted: "#253a55",       // very muted

  // Physical card (cream) — contrast against terminal
  cardSurface: "#f5f0e8",
  cardText: "#1a1a1a",
  cardTextBody: "#3a3a3a",
  cardBorder: "#d8d0c0",

  // Card band colors
  cardBand: {
    red: "#d32f2f",
    green: "#2e7d32",
    amber: "#f57f17",
    purple: "#6a1b9a",
    steel_blue: "#1565c0",
  } as Record<string, string>,
} as const;
