import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { StatBar } from "./StatBar";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { Layout } from "../../constants/layout";
import type { SessionData } from "../../services/game";

interface Props {
  session: SessionData;
}

export function StatsPanel({ session }: Props) {
  const { t } = useTranslation();
  const capitalNorm = Math.min(1, Math.max(0, (session.capital - 8000) / 12000));
  const capitalDelta = session.capital - 10000;
  const deltaStr = `${capitalDelta >= 0 ? "+" : ""}${Math.round(capitalDelta).toLocaleString()}`;
  const rankLabel = [
    t("hud.rankNames.none"),
    t("hud.rankNames.analyst"),
    t("hud.rankNames.associate"),
    t("hud.rankNames.director"),
    t("hud.rankNames.md"),
  ][session.investor_rank] ?? "?";

  return (
    <View style={styles.panel}>
      {/* Left: metric labels */}
      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>{t("hud.capital")}</Text>
          <Text style={[styles.metricValue, { color: session.capital >= 10000 ? Colors.green : Colors.red }]}>
            ${Math.round(session.capital).toLocaleString()}
          </Text>
          <Text style={[styles.metricDelta, { color: capitalDelta >= 0 ? Colors.green : Colors.red }]}>
            {deltaStr}
          </Text>
        </View>

        <View style={styles.sep} />

        <View style={styles.metric}>
          <Text style={styles.metricLabel}>{t("hud.stage")}</Text>
          <Text style={[styles.metricValue, { color: Colors.blue }]}>{session.stage}/5</Text>
          <Text style={styles.metricDelta}>{(session.progress * 100).toFixed(0)}%</Text>
        </View>

        <View style={styles.sep} />

        <View style={styles.metric}>
          <Text style={styles.metricLabel}>{t("hud.rank")}</Text>
          <Text style={[styles.metricValue, { color: Colors.teal }]}>{rankLabel}</Text>
          <Text style={styles.metricDelta}>{t("hud.level")} {session.investor_rank}</Text>
        </View>
      </View>

      {/* Right: stat bars */}
      <View style={styles.bars}>
        <StatBar label={t("hud.capital")} value={capitalNorm} color={Colors.amber} />
        <StatBar label={t("hud.progressLabel")} value={session.progress} color={Colors.blue} />
        <StatBar label={t("hud.rank")} value={(session.investor_rank - 1) / 3} color={Colors.teal} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    height: Layout.statsPanelHeight,
    backgroundColor: Colors.bgPanel,
    borderTopWidth: 1,
    borderTopColor: Colors.borderPrimary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 12,
  },
  metrics: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  metric: {
    alignItems: "flex-start",
    minWidth: 70,
  },
  metricLabel: {
    fontSize: 8,
    fontFamily: Fonts.sansBold,
    color: Colors.textDim,
    letterSpacing: 1.5,
  },
  metricValue: {
    fontSize: 14,
    fontFamily: Fonts.mono,
    color: Colors.textBright,
    letterSpacing: 0.5,
  },
  metricDelta: {
    fontSize: 9,
    fontFamily: Fonts.mono,
    color: Colors.textDim,
  },
  sep: {
    width: 1,
    height: 32,
    backgroundColor: Colors.borderDim,
    marginHorizontal: 4,
  },
  bars: {
    flex: 1,
    gap: 6,
    justifyContent: "center",
  },
});
