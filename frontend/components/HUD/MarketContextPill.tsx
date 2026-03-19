import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { useThemeStore } from "../../store/themeStore";

interface MarketState {
  sentiment?: number;
  inflation?: number;
  greed?: number;
  volatility?: number;
  fundamentals?: number;
}

interface Props {
  stage: number;
  capital: number;
  marketState?: MarketState;
}

function deriveContext(
  ms: MarketState,
  stage: number,
  isNormal: boolean,
  colors: ReturnType<typeof useColors>
): { text: string; dotColor: string } {
  const s = ms.sentiment ?? 0;
  const v = ms.volatility ?? 0;
  const inf = ms.inflation ?? 0;
  const g = ms.greed ?? 0;
  const f = ms.fundamentals ?? 0;

  const signals: { text: string; dotColor: string; strength: number }[] = [
    { text: isNormal ? "🐂 Markets Rising — Stocks look good" : "BULL MARKET — EQUITIES TRENDING UP", dotColor: colors.green, strength: s },
    { text: isNormal ? "🐻 Markets Falling — Play it safe" : "BEAR MARKET — CAPITAL PRESERVATION", dotColor: colors.red, strength: -s },
    { text: isNormal ? "🌊 Choppy Waters — Big swings ahead" : "VOLATILITY ELEVATED — VIX > 25", dotColor: colors.amber, strength: v },
    { text: isNormal ? "🔥 Prices Rising — Inflation eating gains" : "INFLATION PRESSURE — REAL RETURNS SQUEEZED", dotColor: colors.red, strength: inf },
    { text: isNormal ? "🚀 Everyone's Buying — Bubble risk" : "GREED INDEX HIGH — OVERVALUATION RISK", dotColor: colors.amber, strength: g },
    { text: isNormal ? "💪 Economy is Healthy — Good time to invest" : "STRONG FUNDAMENTALS — ECONOMY EXPANDING", dotColor: colors.green, strength: f },
    { text: isNormal ? "🛡️ Risk Off — Investors hiding in bonds" : "RISK-OFF — FLIGHT TO SAFETY", dotColor: colors.amber, strength: -f },
  ];

  const threshold = 0.25;
  let best = signals[0];
  for (const sig of signals) {
    if (sig.strength > best.strength) best = sig;
  }

  if (best.strength >= threshold) {
    return { text: best.text, dotColor: best.dotColor };
  }

  const STAGE_CONTEXTS = [
    { text: isNormal ? "🌤️ Market Open — Waiting for clues" : "MARKET OPEN — AWAITING SIGNALS", dotColor: colors.green },
    { text: isNormal ? "👀 Watch the Fed — Rates matter now" : "RATE SENSITIVE — FED WATCH ACTIVE", dotColor: colors.amber },
    { text: isNormal ? "🔄 Mid-Game — Money moving between sectors" : "MID-CYCLE — SECTOR ROTATION", dotColor: colors.blue },
    { text: isNormal ? "⏳ Late Stage — Economy slowing down" : "LATE CYCLE — TIGHTENING CONDITIONS", dotColor: colors.amber },
    { text: isNormal ? "🌪️ Mixed Signals — Stay focused" : "MACRO CROSSCURRENTS — STAY DISCIPLINED", dotColor: colors.blue },
  ];
  const idx = Math.min(stage - 1, STAGE_CONTEXTS.length - 1);
  return STAGE_CONTEXTS[idx];
}

export function MarketContextPill({ stage, capital, marketState }: Props) {
  const colors = useColors();
  const isNormal = useThemeStore((state) => state.mode === "normal");
  const ctx = deriveContext(marketState ?? {}, stage, isNormal, colors);
  const styles = createStyles(colors, isNormal);

  return (
    <View style={styles.pill}>
      <View style={[styles.dot, { backgroundColor: ctx.dotColor }]} />
      <Text style={styles.text}>{ctx.text}</Text>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>, isNormal: boolean) => StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: isNormal ? colors.bgPanel : colors.bgPanel,
    borderWidth: 1,
    borderColor: isNormal ? colors.borderPrimary : "#1e3a5f",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 6,
    alignSelf: "center",
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
  },
  text: {
    fontSize: 10,
    fontFamily: Fonts.sansBold,
    color: isNormal ? colors.textBright : colors.textPrimary,
    letterSpacing: 1.2,
  },
});
