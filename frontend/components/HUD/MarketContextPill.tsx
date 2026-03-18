import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";

interface Props {
  stage: number;
  capital: number;
}

const MARKET_CONTEXTS = [
  "BULL MARKET — EQUITIES TRENDING UP",
  "RATE SENSITIVE — FED WATCH ACTIVE",
  "VOLATILITY ELEVATED — VIX > 25",
  "RISK-OFF — FLIGHT TO SAFETY",
  "BEAR MARKET — CAPITAL PRESERVATION",
];

export function MarketContextPill({ stage, capital }: Props) {
  const contextIdx = Math.min(stage - 1, MARKET_CONTEXTS.length - 1);
  const context = MARKET_CONTEXTS[contextIdx];

  return (
    <View style={styles.pill}>
      <View style={styles.dot} />
      <Text style={styles.text}>{context}</Text>
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
