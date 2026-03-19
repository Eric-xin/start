import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { StatBar } from "./StatBar";
import { useColors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { Layout } from "../../constants/layout";
import { useThemeStore } from "../../store/themeStore";

interface Props {
  session: {
    capital: number;
    stage: number;
    progress: number;
    investor_rank: number;
    market_state?: {
      sentiment?: number;
      volatility?: number;
    };
  };
}

function getMoneyTone(capital: number) {
  if (capital >= 12000) return { label: "Growing nicely", color: "green" as const };
  if (capital >= 10000) return { label: "Stable", color: "blue" as const };
  if (capital >= 8500) return { label: "Watch your spending", color: "amber" as const };
  return { label: "Cash is running low", color: "red" as const };
}

export function StatsPanel({ session }: Props) {
  const colors = useColors();
  const isNormal = useThemeStore((state) => state.mode === "normal");
  const capitalNorm = Math.min(1, Math.max(0, (session.capital - 8000) / 12000));
  const capitalDelta = session.capital - 10000;
  const deltaStr = `${capitalDelta >= 0 ? "+" : ""}${Math.round(capitalDelta).toLocaleString()}`;
  const styles = createStyles(colors, isNormal);
  const moneyTone = getMoneyTone(session.capital);
  const moneyToneColor =
    moneyTone.color === "green"
      ? colors.green
      : moneyTone.color === "blue"
        ? colors.blue
        : moneyTone.color === "amber"
          ? colors.amber
          : colors.red;
  const sentiment = session.market_state?.sentiment ?? 0;
  const volatility = session.market_state?.volatility ?? 0;
  const moodLabel =
    volatility >= 0.45 ? "🌊 Busy market"
      : sentiment >= 0.25 ? "🐂 Friendly market"
        : sentiment <= -0.25 ? "🐻 Cautious market"
          : "🌤️ Mixed market";
  const rankLabel = isNormal
    ? "🏅 Investor Rank"
    : "RANK";
  const capitalLabel = isNormal
    ? "💰 Your Money"
    : "CAPITAL";
  const stageLabel = isNormal
    ? "📚 Progress"
    : "STAGE";
  const rankValue = isNormal
    ? `${["—", "Beginner", "Builder", "Strategist", "Market Master"][session.investor_rank] ?? "?"}`
    : `${["—", "ANALYST", "ASSOCIATE", "DIRECTOR", "MD"][session.investor_rank] ?? "?"}`;

  return (
    <View style={styles.panel}>
      {isNormal ? (
        <>
          <View style={styles.moneyHero}>
            <View>
              <Text style={styles.moneyHeroLabel}>💰 Cash on Hand</Text>
              <Text style={[styles.moneyHeroValue, { color: session.capital >= 10000 ? colors.green : moneyToneColor }]}>
                ${Math.round(session.capital).toLocaleString()}
              </Text>
              <Text style={[styles.moneyHeroSub, { color: capitalDelta >= 0 ? colors.green : colors.red }]}>
                {deltaStr} from where you started
              </Text>
            </View>
            <View style={[styles.moneyBadge, { borderColor: moneyToneColor, backgroundColor: moneyToneColor + "12" }]}>
              <Text style={[styles.moneyBadgeText, { color: moneyToneColor }]}>{moneyTone.label}</Text>
            </View>
          </View>
          <View style={styles.normalPills}>
            <View style={styles.normalPill}>
              <Text style={styles.normalPillLabel}>Market mood</Text>
              <Text style={styles.normalPillValue}>{moodLabel}</Text>
            </View>
            <View style={styles.normalPill}>
              <Text style={styles.normalPillLabel}>Risk level</Text>
              <Text style={styles.normalPillValue}>{volatility >= 0.45 ? "High swings" : "Manageable"}</Text>
            </View>
            <View style={styles.normalPill}>
              <Text style={styles.normalPillLabel}>Tip</Text>
              <Text style={styles.normalPillValue}>
                {session.capital < 8500 ? "Protect your cash" : "Take clean opportunities"}
              </Text>
            </View>
          </View>
        </>
      ) : (
        <>
          <View style={styles.metrics}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>{capitalLabel}</Text>
              <Text style={[styles.metricValue, { color: session.capital >= 10000 ? colors.green : colors.red }]}>
                ${Math.round(session.capital).toLocaleString()}
              </Text>
              <Text style={[styles.metricDelta, { color: capitalDelta >= 0 ? colors.green : colors.red }]}>
                {deltaStr}
              </Text>
            </View>

            <View style={styles.sep} />

            <View style={styles.metric}>
              <Text style={styles.metricLabel}>{stageLabel}</Text>
              <Text style={[styles.metricValue, { color: colors.blue }]}>{session.stage}/5</Text>
              <Text style={styles.metricDelta}>{(session.progress * 100).toFixed(0)}%</Text>
            </View>

            <View style={styles.sep} />

            <View style={styles.metric}>
              <Text style={styles.metricLabel}>{rankLabel}</Text>
              <Text style={[styles.metricValue, { color: colors.teal }]}>
                {rankValue}
              </Text>
              <Text style={styles.metricDelta}>{isNormal ? `Level ${session.investor_rank}` : `LVL ${session.investor_rank}`}</Text>
            </View>
          </View>

          <View style={styles.bars}>
            <StatBar label={isNormal ? "MONEY" : "CAPITAL"} value={capitalNorm} color={colors.amber} />
            <StatBar label={isNormal ? "PROGRESS" : "PROGRESS"} value={session.progress} color={colors.blue} />
            <StatBar label={isNormal ? "RANK" : "RANK"} value={(session.investor_rank - 1) / 3} color={colors.teal} />
          </View>
        </>
      )}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>, isNormal: boolean) => StyleSheet.create({
  panel: {
    height: Layout.statsPanelHeight,
    backgroundColor: colors.bgPanel,
    borderTopWidth: 1,
    borderTopColor: colors.borderPrimary,
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
    minWidth: isNormal ? 96 : 70,
  },
  metricLabel: {
    fontSize: 8,
    fontFamily: Fonts.sansBold,
    color: colors.textDim,
    letterSpacing: 1.5,
  },
  metricValue: {
    fontSize: 14,
    fontFamily: Fonts.mono,
    color: colors.textBright,
    letterSpacing: 0.5,
  },
  metricDelta: {
    fontSize: 9,
    fontFamily: Fonts.mono,
    color: colors.textDim,
  },
  sep: {
    width: 1,
    height: 32,
    backgroundColor: colors.borderDim,
    marginHorizontal: 4,
  },
  bars: {
    flex: 1,
    gap: 6,
    justifyContent: "center",
  },
  moneyHero: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flex: 1,
  },
  moneyHeroLabel: {
    fontSize: 10,
    fontFamily: Fonts.sansBold,
    color: colors.textDim,
    letterSpacing: 0.4,
  },
  moneyHeroValue: {
    fontSize: 22,
    fontFamily: Fonts.mono,
    letterSpacing: 0.6,
    marginTop: 2,
  },
  moneyHeroSub: {
    fontSize: 10,
    fontFamily: Fonts.sansMedium,
    marginTop: 2,
  },
  moneyBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  moneyBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.sansBold,
  },
  normalPills: {
    flexDirection: "row",
    gap: 8,
    flex: 1,
  },
  normalPill: {
    flex: 1,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.borderDim,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: "center",
  },
  normalPillLabel: {
    fontSize: 9,
    fontFamily: Fonts.sansBold,
    color: colors.textDim,
  },
  normalPillValue: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
    color: colors.textBright,
    marginTop: 2,
  },
});
