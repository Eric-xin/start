import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { Layout } from "../../constants/layout";
import type { SessionData } from "../../services/game";

interface Props {
  session: SessionData;
}

const TICKERS = [
  { sym: "SPY", base: 450 },
  { sym: "QQQ", base: 380 },
  { sym: "BTC", base: 42000 },
  { sym: "GLD", base: 185 },
  { sym: "TLT", base: 92 },
];

function getTickerData(session: SessionData) {
  const seed = session.capital / 10000;
  return TICKERS.map((t, i) => {
    const change = (Math.sin(seed * (i + 1) * 1.3) * 3).toFixed(2);
    const price = (t.base * (1 + parseFloat(change) / 100)).toFixed(2);
    return { sym: t.sym, price, change, positive: parseFloat(change) >= 0 };
  });
}

export function SidebarPanel({ session }: Props) {
  const tickers = getTickerData(session);

  return (
    <View style={styles.sidebar}>
      <Text style={styles.header}>MARKET</Text>

      <View style={styles.section}>
        {tickers.map((t) => (
          <View key={t.sym} style={styles.tickerRow}>
            <Text style={styles.sym}>{t.sym}</Text>
            <View style={styles.tickerRight}>
              <Text style={styles.price}>{t.price}</Text>
              <Text style={[styles.change, { color: t.positive ? Colors.terminalGreen : "#d32f2f" }]}>
                {t.positive ? "+" : ""}{t.change}%
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      <Text style={styles.subheader}>SENTIMENT</Text>
      <Text style={styles.sentimentValue}>
        {session.capital > 11000 ? "BULLISH" : session.capital < 9500 ? "BEARISH" : "NEUTRAL"}
      </Text>

      <Text style={styles.subheader}>10Y YIELD</Text>
      <Text style={styles.yieldValue}>4.{(session.stage * 12) % 99}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: Layout.sidebarWidth,
    backgroundColor: Colors.terminalDark,
    borderLeftWidth: 1,
    borderLeftColor: "#1e3a5f",
    padding: 12,
  },
  header: {
    fontSize: 9,
    fontFamily: Fonts.sansBold,
    color: Colors.bloombergBlue,
    letterSpacing: 2,
    marginBottom: 8,
  },
  section: {
    gap: 6,
  },
  tickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sym: {
    fontSize: 11,
    fontFamily: Fonts.sansBold,
    color: Colors.textSecondary,
  },
  tickerRight: {
    alignItems: "flex-end",
  },
  price: {
    fontSize: 10,
    fontFamily: Fonts.mono,
    color: Colors.textPrimary,
  },
  change: {
    fontSize: 9,
    fontFamily: Fonts.mono,
  },
  divider: {
    height: 1,
    backgroundColor: "#1e3a5f",
    marginVertical: 8,
  },
  subheader: {
    fontSize: 8,
    fontFamily: Fonts.sansBold,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginTop: 4,
  },
  sentimentValue: {
    fontSize: 12,
    fontFamily: Fonts.sansBold,
    color: Colors.terminalGreen,
    marginBottom: 4,
  },
  yieldValue: {
    fontSize: 14,
    fontFamily: Fonts.mono,
    color: Colors.textSecondary,
  },
});
