import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { FloatingPanel } from "./FloatingPanel";
import { getRecentPlays, type PortfolioData, type CardPlayData } from "../../services/portfolio";
import { useColors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { useThemeStore } from "../../store/themeStore";

function BarRow({ label, ticker, color, pct, value }: {
  label: string; ticker: string; color: string; pct: number; value: number;
}) {
  const colors = useColors();
  const styles = createBarStyles(colors);
  return (
    <View style={styles.row}>
      <View style={styles.labelCol}>
        <Text style={styles.ticker}>{ticker}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(pct * 100, 0.5)}%`, backgroundColor: color }]} />
      </View>
      <View style={styles.valCol}>
        <Text style={[styles.pct, { color }]}>{(pct * 100).toFixed(1)}%</Text>
        <Text style={styles.dollar}>${Math.round(value).toLocaleString()}</Text>
      </View>
    </View>
  );
}

const createBarStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  labelCol: { width: 120 },
  ticker: { fontSize: 11, fontFamily: Fonts.mono, color: colors.textBright, letterSpacing: 0.5 },
  label: { fontSize: 8, fontFamily: Fonts.sans, color: colors.textDim, marginTop: 1 },
  track: { flex: 1, height: 6, backgroundColor: colors.bgCard, borderRadius: 3, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 3 },
  valCol: { width: 80, alignItems: "flex-end" },
  pct: { fontSize: 11, fontFamily: Fonts.mono },
  dollar: { fontSize: 9, fontFamily: Fonts.mono, color: colors.textDim, marginTop: 1 },
});

function TopicRow({ topic, mastery }: { topic: string; mastery: number }) {
  const colors = useColors();
  const styles = createTopicStyles(colors);
  const pct = Math.min(mastery, 1);
  const color = pct > 0.7 ? colors.green : pct > 0.4 ? colors.amber : colors.textDim;
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{topic.replace(/_/g, " ").toUpperCase()}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.pct, { color }]}>{Math.round(pct * 100)}%</Text>
    </View>
  );
}

const createTopicStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 7 },
  label: { width: 130, fontSize: 8, fontFamily: Fonts.sansBold, color: colors.textDim, letterSpacing: 1 },
  track: { flex: 1, height: 4, backgroundColor: colors.bgCard, borderRadius: 2, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 2 },
  pct: { width: 36, fontSize: 9, fontFamily: Fonts.mono, textAlign: "right" },
});

function PlayRow({ play }: { play: CardPlayData }) {
  const colors = useColors();
  const isNormal = useThemeStore((state) => state.mode === "normal");
  const styles = createPlayStyles(colors);
  const isRight = play.action === "right";
  const delta = play.capital_after - play.capital_before;
  const deltaColor = delta >= 0 ? colors.green : colors.red;
  const prefix = delta >= 0 ? "+" : "";
  return (
    <View style={styles.row}>
      <Text style={styles.action}>{isNormal ? (isRight ? "Take it" : "Pass") : (isRight ? "▶ ACCEPT" : "◀ DECLINE")}</Text>
      <Text style={styles.card} numberOfLines={1}>
        {play.card?.title ?? "—"}
      </Text>
      <Text style={[styles.delta, { color: deltaColor }]}>
        {prefix}${Math.round(delta).toLocaleString()}
      </Text>
    </View>
  );
}

const createPlayStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: colors.borderFaint },
  action: { fontSize: 8, fontFamily: Fonts.sansBold, color: colors.textDim, letterSpacing: 1, width: 72 },
  card: { flex: 1, fontSize: 10, fontFamily: Fonts.sans, color: colors.textPrimary },
  delta: { fontSize: 10, fontFamily: Fonts.mono },
});

function SectionHeader({ label }: { label: string }) {
  const colors = useColors();
  const styles = createSectionStyles(colors);
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
}

const createSectionStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 20, marginBottom: 12 },
  text: { fontSize: 8, fontFamily: Fonts.sansBold, color: colors.textMuted, letterSpacing: 2 },
  line: { flex: 1, height: 1, backgroundColor: colors.borderFaint },
});

interface Props {
  visible: boolean;
  onClose: () => void;
  portfolio: PortfolioData | null;
}

export function PortfolioPanel({ visible, onClose, portfolio }: Props) {
  const colors = useColors();
  const isNormal = useThemeStore((state) => state.mode === "normal");
  const styles = createStyles(colors);
  const [recentPlays, setRecentPlays] = useState<CardPlayData[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    getRecentPlays(10)
      .then(setRecentPlays)
      .catch(() => setRecentPlays([]))
      .finally(() => setLoading(false));
  }, [visible]);

  if (!portfolio) return null;

  const assetMeta: Record<string, { label: string; ticker: string; color: string }> = {
    stocks: { label: isNormal ? "📈 Stocks" : "US Equities", ticker: "SPY", color: colors.blue },
    bonds: { label: isNormal ? "🎁 Bonds" : "US Bonds", ticker: "AGG", color: colors.teal },
    gold: { label: isNormal ? "🥇 Gold & Metals" : "Gold", ticker: "GLD", color: colors.amber },
    bitcoin: { label: isNormal ? "₿ Crypto" : "Bitcoin", ticker: "BTC", color: "#ff9800" },
    tech: { label: isNormal ? "⚡ Tech" : "Tech Growth", ticker: "QQQ", color: colors.blueLight },
    cash: { label: isNormal ? "💵 Cash on Hand" : "Cash / Money Mkt", ticker: "CASH", color: colors.textDim },
  };

  const weights = portfolio.portfolio_weights ?? {};
  const netWorth = portfolio.net_worth;
  const capital = portfolio.capital;

  // Determine holdings from portfolio weights
  const holdings = Object.entries(weights)
    .filter(([, w]) => w > 0.005)
    .sort(([, a], [, b]) => b - a);

  // Cash = whatever isn't allocated
  const allocatedPct = holdings.reduce((sum, [, w]) => sum + w, 0);
  const cashPct = Math.max(1 - allocatedPct, 0);
  if (cashPct > 0.005) holdings.push(["cash", cashPct]);

  const topicEntries = Object.entries(portfolio.topic_mastery ?? {});

  const pnl = netWorth - 10000;
  const pnlColor = pnl >= 0 ? colors.green : colors.red;
  const pnlPrefix = pnl >= 0 ? "+" : "";

  return (
    <FloatingPanel
      visible={visible}
      title={isNormal ? "🏦 Portfolio" : "PORTFOLIO"}
      subtitle={isNormal ? `Rank ${portfolio.investor_rank} · Stage ${portfolio.stage}` : `RANK ${portfolio.investor_rank} · STAGE ${portfolio.stage}`}
      onClose={onClose}
      width={600}
      height={580}
    >
      <View style={styles.statStrip}>
        {[
          { label: isNormal ? "🏦 Total Value" : "NET WORTH", value: `$${Math.round(netWorth).toLocaleString()}`, color: colors.textBright },
          { label: isNormal ? "💵 Cash on Hand" : "CASH", value: `$${Math.round(capital).toLocaleString()}`, color: colors.amber },
          { label: isNormal ? "📈 Profit/Loss" : "P&L", value: `${pnlPrefix}$${Math.round(pnl).toLocaleString()}`, color: pnlColor },
          { label: isNormal ? "🏆 All-Time High" : "PEAK", value: `$${Math.round(portfolio.peak_net_worth).toLocaleString()}`, color: colors.teal },
          { label: isNormal ? "Cards Seen" : "CARDS", value: `${portfolio.total_cards_played}`, color: colors.textDim },
        ].map(({ label, value, color }) => (
          <View key={label} style={styles.stat}>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
          </View>
        ))}
      </View>

      <SectionHeader label={isNormal ? "YOUR MIX" : "ASSET ALLOCATION"} />
      {holdings.length === 0 ? (
        <Text style={styles.empty}>
          {isNormal ? "No investments yet. Play more cards to start building your portfolio." : "No allocations yet — play more cards to build your portfolio."}
        </Text>
      ) : (
        holdings.map(([key, pct]) => {
          const meta = assetMeta[key] ?? { label: key, ticker: key.toUpperCase(), color: colors.textDim };
          return (
            <BarRow
              key={key}
              label={meta.label}
              ticker={meta.ticker}
              color={meta.color}
              pct={pct as number}
              value={netWorth * (pct as number)}
            />
          );
        })
      )}

      {/* ── Topic mastery ── */}
      {topicEntries.length > 0 && (
        <>
          <SectionHeader label={isNormal ? "WHAT YOU'RE LEARNING" : "KNOWLEDGE MASTERY"} />
          {topicEntries.sort(([, a], [, b]) => (b as number) - (a as number)).map(([topic, mastery]) => (
            <TopicRow key={topic} topic={topic} mastery={mastery as number} />
          ))}
        </>
      )}

      <SectionHeader label={isNormal ? "RECENT CHOICES" : "RECENT DECISIONS"} />
      {loading && <ActivityIndicator color={colors.blue} style={{ marginVertical: 12 }} />}
      {recentPlays && recentPlays.length === 0 && (
        <Text style={styles.empty}>{isNormal ? "No choices recorded yet." : "No decisions recorded yet."}</Text>
      )}
      {recentPlays?.map((p) => <PlayRow key={p.id} play={p} />)}
    </FloatingPanel>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  statStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.borderFaint,
    borderRadius: 12,
    padding: 12,
  },
  stat: { alignItems: "center", gap: 3 },
  statLabel: { fontSize: 8, fontFamily: Fonts.sansBold, color: colors.textMuted, letterSpacing: 1.5 },
  statValue: { fontSize: 13, fontFamily: Fonts.mono, letterSpacing: 0.5 },
  empty: { fontSize: 10, fontFamily: Fonts.sans, color: colors.textDim, fontStyle: "italic", paddingVertical: 8 },
});
