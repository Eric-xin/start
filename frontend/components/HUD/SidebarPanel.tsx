import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
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
  { sym: "VIX", base: 18 },
];

function getTickerData(session: SessionData) {
  const seed = session.capital / 10000;
  return TICKERS.map((t, i) => {
    const pct = parseFloat((Math.sin(seed * (i + 1) * 1.7) * 2.8).toFixed(2));
    const price = (t.base * (1 + pct / 100)).toFixed(t.base > 1000 ? 0 : 2);
    return { sym: t.sym, price, pct, up: pct >= 0 };
  });
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={rStyles.row}>
      <Text style={rStyles.label}>{label}</Text>
      <Text style={[rStyles.value, valueColor ? { color: valueColor } : {}]}>{value}</Text>
    </View>
  );
}

const rStyles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  label: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 1 },
  value: { fontSize: 10, fontFamily: Fonts.mono, color: Colors.textBright },
});

export function SidebarPanel({ session }: Props) {
  const { t } = useTranslation();
  const tickers = getTickerData(session);
  const sentiment = session.capital > 11000
    ? t("hud.sentimentBullish")
    : session.capital < 9500
      ? t("hud.sentimentBearish")
      : t("hud.sentimentNeutral");
  const sentimentColor = session.capital > 11000 ? Colors.green : session.capital < 9500 ? Colors.red : Colors.amber;

  return (
    <View style={styles.sidebar}>
      {/* Market data panel */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>{t("hud.marketData")}</Text>
        {tickers.map((t) => (
          <View key={t.sym} style={styles.tickerRow}>
            <Text style={styles.sym}>{t.sym}</Text>
            <Text style={styles.price}>{t.price}</Text>
            <Text style={[styles.pct, { color: t.up ? Colors.green : Colors.red }]}>
              {t.up ? "▲" : "▼"} {Math.abs(t.pct)}%
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      {/* Macro panel */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>{t("hud.macro")}</Text>
        <Row label={t("hud.sentiment")} value={sentiment} valueColor={sentimentColor} />
        <Row label={t("hud.tenYearYield")} value={`${(3.5 + session.stage * 0.3).toFixed(2)}%`} />
        <Row label={t("hud.fedRate")} value={`${(4.25 + session.stage * 0.15).toFixed(2)}%`} />
        <Row label={t("hud.cpiYoy")} value={`${(2.8 + session.stage * 0.4).toFixed(1)}%`} />
      </View>

      <View style={styles.divider} />

      {/* Session panel */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>{t("hud.session")}</Text>
        <Row label={t("hud.stage")} value={`${session.stage} / 5`} />
        <Row label={t("hud.progress")} value={`${(session.progress * 100).toFixed(0)}%`} />
        <Row label={t("hud.peak")} value={`$${Math.round(session.peak_capital).toLocaleString()}`} />
        <Row
          label={t("hud.pnl")}
          value={`${session.capital >= 10000 ? "+" : ""}$${Math.round(session.capital - 10000).toLocaleString()}`}
          valueColor={session.capital >= 10000 ? Colors.green : Colors.red}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    flex: 1,
    backgroundColor: Colors.bgPanel,
    padding: 12,
  },
  section: {
    marginBottom: 4,
  },
  sectionHeader: {
    fontSize: 8,
    fontFamily: Fonts.sansBold,
    color: Colors.blue,
    letterSpacing: 2,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDim,
    paddingBottom: 3,
  },
  tickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  sym: {
    width: 36,
    fontSize: 10,
    fontFamily: Fonts.sansBold,
    color: Colors.textPrimary,
  },
  price: {
    flex: 1,
    fontSize: 9,
    fontFamily: Fonts.mono,
    color: Colors.textBright,
    textAlign: "right",
  },
  pct: {
    width: 52,
    fontSize: 9,
    fontFamily: Fonts.mono,
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderDim,
    marginVertical: 10,
  },
});
