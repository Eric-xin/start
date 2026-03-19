import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { Layout } from "../../constants/layout";

interface MarketState {
  sentiment?: number;
  inflation?: number;
  greed?: number;
  volatility?: number;
  fundamentals?: number;
}

interface Props {
  session: {
    capital: number;
    stage: number;
    progress: number;
    investor_rank: number;
    peak_capital?: number;
    peak_net_worth?: number;
    portfolio_weights?: Record<string, number>;
    market_state?: MarketState;
  };
}

const TICKERS = [
  { sym: "SPY", base: 450, drivers: { sentiment: 0.6, fundamentals: 0.4, volatility: -0.3 } },
  { sym: "QQQ", base: 380, drivers: { sentiment: 0.5, greed: 0.3, fundamentals: 0.3, volatility: -0.4 } },
  { sym: "BTC", base: 42000, drivers: { sentiment: 0.3, greed: 0.6, volatility: 0.2, fundamentals: 0.1 } },
  { sym: "GLD", base: 185, drivers: { sentiment: -0.3, inflation: 0.5, volatility: 0.3, fundamentals: -0.1 } },
  { sym: "TLT", base: 92, drivers: { sentiment: -0.2, inflation: -0.6, volatility: -0.2, fundamentals: 0.2 } },
  { sym: "VIX", base: 18, drivers: { sentiment: -0.5, volatility: 0.8, greed: -0.3, fundamentals: -0.3 } },
];

function getTickerData(session: Props["session"]) {
  const ms = session.market_state ?? {};
  const seed = session.capital / 10000;

  return TICKERS.map((t, i) => {
    // Base noise from capital (keeps some variation between tickers)
    const noise = Math.sin(seed * (i + 1) * 1.7) * 1.0;

    // Market-state-driven component
    let stateEffect = 0;
    for (const [dim, weight] of Object.entries(t.drivers)) {
      stateEffect += (ms[dim as keyof MarketState] ?? 0) * weight;
    }
    // Scale state effect to a reasonable percentage range (-5% to +5%)
    const pct = parseFloat((noise + stateEffect * 4.0).toFixed(2));
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

function deriveSentimentLabel(ms: MarketState): { label: string; color: string } {
  const s = ms.sentiment ?? 0;
  const g = ms.greed ?? 0;
  const combined = s * 0.6 + g * 0.4;
  if (combined > 0.3) return { label: "BULLISH", color: Colors.green };
  if (combined < -0.3) return { label: "BEARISH", color: Colors.red };
  return { label: "NEUTRAL", color: Colors.amber };
}

export function SidebarPanel({ session }: Props) {
  const tickers = getTickerData(session);
  const ms: MarketState = session.market_state ?? {};

  const sentimentInfo = deriveSentimentLabel(ms);

  // Macro indicators driven by market_state dimensions
  const inflationVal = ms.inflation ?? 0;     // -1 to 1
  const volatilityVal = ms.volatility ?? 0;
  const fundamentalsVal = ms.fundamentals ?? 0;

  // 10Y Yield: base 3.8%, shifts with inflation (+) and fundamentals (+)
  const yieldPct = 3.8 + inflationVal * 1.5 + fundamentalsVal * 0.5;
  // Fed Rate: base 4.5%, rises with inflation, slightly with volatility
  const fedRate = 4.5 + inflationVal * 1.0 + volatilityVal * 0.3;
  // CPI YoY: base 3.0%, directly driven by inflation dimension
  const cpi = 3.0 + inflationVal * 2.5;

  const peak = (session as any).peak_net_worth ?? (session as any).peak_capital ?? session.capital;

  return (
    <View style={styles.sidebar}>
      {/* Market data panel */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>MARKET DATA</Text>
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
        <Text style={styles.sectionHeader}>MACRO</Text>
        <Row label="SENTIMENT" value={sentimentInfo.label} valueColor={sentimentInfo.color} />
        <Row label="10Y YIELD" value={`${Math.max(0.5, yieldPct).toFixed(2)}%`} />
        <Row label="FED RATE" value={`${Math.max(0.25, fedRate).toFixed(2)}%`} />
        <Row label="CPI YoY" value={`${Math.max(0.0, cpi).toFixed(1)}%`} />
      </View>

      <View style={styles.divider} />

      {/* Session panel */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>SESSION</Text>
        <Row label="STAGE" value={`${session.stage} / 5`} />
        <Row label="PROGRESS" value={`${(session.progress * 100).toFixed(0)}%`} />
        <Row label="PEAK" value={`$${Math.round(peak).toLocaleString()}`} />
        <Row
          label="P&L"
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
