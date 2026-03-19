import { Dimensions } from "react-native";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

// Card dimensions — scale down on narrow screens
const MAX_CARD_W = 380;
const MAX_CARD_H = 520;
const cardWidth = Math.min(MAX_CARD_W, SCREEN_W * 0.85);
const cardHeight = Math.round(cardWidth * (MAX_CARD_H / MAX_CARD_W));

export const Layout = {
  cardWidth,
  cardHeight,
  cardBorderRadius: 12,
  cardBandHeight: 8,
  headerHeight: 40,
  statusBarHeight: 28,       // bottom ticker-style status bar
  statsPanelHeight: 72,
  sidebarWidth: 200,
  swipeThreshold: 80,        // reduced from 120 — easier to swipe
  flyOffDuration: 280,
  lessonDuration: 1800,
  lessonFadeIn: 350,

  // Breakpoints
  tabletBreakpoint: 768,
  wideBreakpoint: 1100,
} as const;
