import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { FloatingPanel } from "./FloatingPanel";
import { getRecentPlays, getNetWorthHistory, type PortfolioData, type CardPlayData, type NetWorthPoint } from "../../services/portfolio";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";

// ─── Asset metadata ───────────────────────────────────────────────────────────
const ASSET_META: Record<string, { label: string; ticker: string; color: string }> = {
  stocks:  { label: "US Equities",     ticker: "SPY",  color: Colors.blue },
  bonds:   { label: "US Bonds",        ticker: "AGG",  color: Colors.teal },
  gold:    { label: "Gold",            ticker: "GLD",  color: Colors.amber },
  bitcoin: { label: "Bitcoin",         ticker: "BTC",  color: "#ff9800" },
  tech:    { label: "Tech Growth",     ticker: "QQQ",  color: Colors.blueLight },
  cash:    { label: "Cash / Money Mkt",ticker: "CASH", color: Colors.textDim },
};

function BarRow({ label, ticker, color, pct, value }: {
  label: string; ticker: string; color: string; pct: number; value: number;
}) {
  return (
    <View style={bar.row}>
      <View style={bar.labelCol}>
        <Text style={bar.ticker}>{ticker}</Text>
        <Text style={bar.label}>{label}</Text>
      </View>
      <View style={bar.track}>
        <View style={[bar.fill, { width: `${Math.max(pct * 100, 0.5)}%`, backgroundColor: color }]} />
      </View>
      <View style={bar.valCol}>
        <Text style={[bar.pct, { color }]}>{(pct * 100).toFixed(1)}%</Text>
        <Text style={bar.dollar}>${Math.round(value).toLocaleString()}</Text>
      </View>
    </View>
  );
}

const bar = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  labelCol: { width: 120 },
  ticker: { fontSize: 11, fontFamily: Fonts.mono, color: Colors.textBright, letterSpacing: 0.5 },
  label: { fontSize: 8, fontFamily: Fonts.sans, color: Colors.textDim, marginTop: 1 },
  track: { flex: 1, height: 6, backgroundColor: Colors.bgCard, borderRadius: 3, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 3 },
  valCol: { width: 80, alignItems: "flex-end" },
  pct: { fontSize: 11, fontFamily: Fonts.mono },
  dollar: { fontSize: 9, fontFamily: Fonts.mono, color: Colors.textDim, marginTop: 1 },
});

function TopicRow({ topic, mastery }: { topic: string; mastery: number }) {
  const pct = Math.min(mastery, 1);
  const color = pct > 0.7 ? Colors.green : pct > 0.4 ? Colors.amber : Colors.textDim;
  return (
    <View style={topic_.row}>
      <Text style={topic_.label}>{topic.replace(/_/g, " ").toUpperCase()}</Text>
      <View style={topic_.track}>
        <View style={[topic_.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={[topic_.pct, { color }]}>{Math.round(pct * 100)}%</Text>
    </View>
  );
}

const topic_ = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 7 },
  label: { width: 130, fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 1 },
  track: { flex: 1, height: 4, backgroundColor: Colors.bgCard, borderRadius: 2, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 2 },
  pct: { width: 36, fontSize: 9, fontFamily: Fonts.mono, textAlign: "right" },
});

function PlayRow({ play }: { play: CardPlayData }) {
  const isRight = play.action === "right";
  const delta = play.capital_after - play.capital_before;
  const deltaColor = delta >= 0 ? Colors.green : Colors.red;
  const prefix = delta >= 0 ? "+" : "";
  return (
    <View style={plays.row}>
      <Text style={plays.action}>{isRight ? "▶ ACCEPT" : "◀ DECLINE"}</Text>
      <Text style={plays.card} numberOfLines={1}>
        {play.card?.title ?? "—"}
      </Text>
      <Text style={[plays.delta, { color: deltaColor }]}>
        {prefix}${Math.round(delta).toLocaleString()}
      </Text>
    </View>
  );
}

const plays = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: Colors.borderFaint },
  action: { fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 1, width: 72 },
  card: { flex: 1, fontSize: 10, fontFamily: Fonts.sans, color: Colors.textPrimary },
  delta: { fontSize: 10, fontFamily: Fonts.mono },
});

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={sec.container}>
      <Text style={sec.text}>{label}</Text>
      <View style={sec.line} />
    </View>
  );
}

const sec = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 20, marginBottom: 12 },
  text: { fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.textMuted, letterSpacing: 2 },
  line: { flex: 1, height: 1, backgroundColor: Colors.borderFaint },
});

interface Props {
  visible: boolean;
  onClose: () => void;
  portfolio: PortfolioData | null;
}

export function PortfolioPanel({ visible, onClose, portfolio }: Props) {
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
  const pnlColor = pnl >= 0 ? Colors.green : Colors.red;
  const pnlPrefix = pnl >= 0 ? "+" : "";

  return (
    <FloatingPanel
      visible={visible}
      title="PORTFOLIO"
      subtitle={`RANK ${portfolio.investor_rank} · STAGE ${portfolio.stage}`}
      onClose={onClose}
      width={600}
      height={580}
    >
      {/* ── Summary stat strip ── */}
      <View style={styles.statStrip}>
        {[
          { label: "NET WORTH", value: `$${Math.round(netWorth).toLocaleString()}`, color: Colors.textBright },
          { label: "CASH", value: `$${Math.round(capital).toLocaleString()}`, color: Colors.amber },
          { label: "P&L", value: `${pnlPrefix}$${Math.round(pnl).toLocaleString()}`, color: pnlColor },
          { label: "PEAK", value: `$${Math.round(portfolio.peak_net_worth).toLocaleString()}`, color: Colors.teal },
          { label: "CARDS", value: `${portfolio.total_cards_played}`, color: Colors.textDim },
        ].map(({ label, value, color }) => (
          <View key={label} style={styles.stat}>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
          </View>
        ))}
      </View>

      {/* ── Asset allocation ── */}
      <SectionHeader label="ASSET ALLOCATION" />
      {holdings.length === 0 ? (
        <Text style={styles.empty}>No allocations yet — play more cards to build your portfolio.</Text>
      ) : (
        holdings.map(([key, pct]) => {
          const meta = ASSET_META[key] ?? { label: key, ticker: key.toUpperCase(), color: Colors.textDim };
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
          <SectionHeader label="KNOWLEDGE MASTERY" />
          {topicEntries.sort(([, a], [, b]) => (b as number) - (a as number)).map(([topic, mastery]) => (
            <TopicRow key={topic} topic={topic} mastery={mastery as number} />
          ))}
        </>
      )}

      {/* ── Recent decisions ── */}
      <SectionHeader label="RECENT DECISIONS" />
      {loading && <ActivityIndicator color={Colors.blue} style={{ marginVertical: 12 }} />}
      {recentPlays && recentPlays.length === 0 && (
        <Text style={styles.empty}>No decisions recorded yet.</Text>
      )}
      {recentPlays?.map((p) => <PlayRow key={p.id} play={p} />)}
    </FloatingPanel>
  );
}

const styles = StyleSheet.create({
  statStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.borderFaint,
    borderRadius: 2,
    padding: 12,
  },
  stat: { alignItems: "center", gap: 3 },
  statLabel: { fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.textMuted, letterSpacing: 1.5 },
  statValue: { fontSize: 13, fontFamily: Fonts.mono, letterSpacing: 0.5 },
  empty: { fontSize: 10, fontFamily: Fonts.sans, color: Colors.textDim, fontStyle: "italic", paddingVertical: 8 },
});
