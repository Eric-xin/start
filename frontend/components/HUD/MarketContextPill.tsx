import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";

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

function deriveContext(ms: MarketState, stage: number): { text: string; dotColor: string } {
  const s = ms.sentiment ?? 0;
  const v = ms.volatility ?? 0;
  const inf = ms.inflation ?? 0;
  const g = ms.greed ?? 0;
  const f = ms.fundamentals ?? 0;

  // Pick the most dominant signal
  const signals: { text: string; dotColor: string; strength: number }[] = [
    { text: "BULL MARKET — EQUITIES TRENDING UP", dotColor: Colors.green, strength: s },
    { text: "BEAR MARKET — CAPITAL PRESERVATION", dotColor: Colors.red, strength: -s },
    { text: "VOLATILITY ELEVATED — VIX > 25", dotColor: Colors.amber, strength: v },
    { text: "INFLATION PRESSURE — REAL RETURNS SQUEEZED", dotColor: Colors.red, strength: inf },
    { text: "GREED INDEX HIGH — OVERVALUATION RISK", dotColor: Colors.amber, strength: g },
    { text: "STRONG FUNDAMENTALS — ECONOMY EXPANDING", dotColor: Colors.green, strength: f },
    { text: "RISK-OFF — FLIGHT TO SAFETY", dotColor: Colors.amber, strength: -f },
  ];

  // Find the strongest signal above a threshold
  const threshold = 0.25;
  let best = signals[0];
  for (const sig of signals) {
    if (sig.strength > best.strength) best = sig;
  }

  if (best.strength >= threshold) {
    return { text: best.text, dotColor: best.dotColor };
  }

  // Fallback: stage-based context when market state is neutral
  const STAGE_CONTEXTS = [
    { text: "MARKET OPEN — AWAITING SIGNALS", dotColor: Colors.terminalGreen },
    { text: "RATE SENSITIVE — FED WATCH ACTIVE", dotColor: Colors.amber },
    { text: "MID-CYCLE — SECTOR ROTATION", dotColor: Colors.blue },
    { text: "LATE CYCLE — TIGHTENING CONDITIONS", dotColor: Colors.amber },
    { text: "MACRO CROSSCURRENTS — STAY DISCIPLINED", dotColor: Colors.blue },
  ];
  const idx = Math.min(stage - 1, STAGE_CONTEXTS.length - 1);
  return STAGE_CONTEXTS[idx];
}

export function MarketContextPill({ stage, capital, marketState }: Props) {
  const ctx = deriveContext(marketState ?? {}, stage);

  return (
    <View style={styles.pill}>
      <View style={[styles.dot, { backgroundColor: ctx.dotColor }]} />
      <Text style={styles.text}>{ctx.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.terminalDark,
    borderWidth: 1,
    borderColor: "#1e3a5f",
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
    backgroundColor: Colors.terminalGreen,
  },
  text: {
    fontSize: 10,
    fontFamily: Fonts.sansBold,
    color: Colors.textSecondary,
    letterSpacing: 1.2,
  },
});
