import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { Layout } from "../../constants/layout";
import { useThemeStore } from "../../store/themeStore";

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
  const colors = useColors();
  return (
    <View style={rStyles.row}>
      <Text style={[rStyles.label, { color: colors.textDim }]}>{label}</Text>
      <Text style={[rStyles.value, { color: valueColor ?? colors.textBright }]}>{value}</Text>
    </View>
  );
}

const rStyles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  label: { fontSize: 9, fontFamily: Fonts.sansBold, letterSpacing: 1 },
  value: { fontSize: 10, fontFamily: Fonts.mono },
});

function deriveSentimentLabel(ms: MarketState, isNormal: boolean, colors: ReturnType<typeof useColors>): { label: string; color: string } {
  const s = ms.sentiment ?? 0;
  const g = ms.greed ?? 0;
  const combined = s * 0.6 + g * 0.4;
  if (combined > 0.3) return { label: isNormal ? "Markets Rising" : "BULLISH", color: colors.green };
  if (combined < -0.3) return { label: isNormal ? "Markets Falling" : "BEARISH", color: colors.red };
  return { label: isNormal ? "Mixed" : "NEUTRAL", color: colors.amber };
}

function marketExplainer(ms: MarketState) {
  const sentiment = ms.sentiment ?? 0;
  const inflation = ms.inflation ?? 0;
  const volatility = ms.volatility ?? 0;
  if (volatility >= 0.45) return "Big price swings today. Smaller, safer choices help.";
  if (sentiment >= 0.3) return "Markets feel upbeat. Good ideas have more room to work.";
  if (sentiment <= -0.3) return "Markets feel nervous. Protect cash and avoid forcing decisions.";
  if (inflation >= 0.3) return "Prices are rising, so gains need to beat inflation to matter.";
  return "Signals are mixed. Read the card carefully and keep your plan simple.";
}

function spendingSignal(capital: number, colors: ReturnType<typeof useColors>) {
  if (capital >= 12000) return { label: "Comfortable", color: colors.green };
  if (capital >= 10000) return { label: "Steady", color: colors.blue };
  if (capital >= 8500) return { label: "Tightening", color: colors.amber };
  return { label: "Low cash", color: colors.red };
}

export function SidebarPanel({ session }: Props) {
  const colors = useColors();
  const isNormal = useThemeStore((state) => state.mode === "normal");
  const styles = createStyles(colors);
  const tickers = getTickerData(session);
  const ms: MarketState = session.market_state ?? {};

  const sentimentInfo = deriveSentimentLabel(ms, isNormal, colors);

  // Macro indicators driven by market_state dimensions
  const inflationVal = ms.inflation ?? 0;     // -1 to 1
  const volatilityVal = ms.volatility ?? 0;
  const fundamentalsVal = ms.fundamentals ?? 0;

  // 10Y Yield: base 3.8%, shifts with inflation (+) and fundamentals (+)
  const yieldPct = 3.8 + inflationVal * 1.5 + fundamentalsVal * 0.5;
  // Fed Rate: base 4.5%, rises with inflation, slightly with volatility
  const fedRate = 4.5 + inflationVal * 1.0 + volatilityVal * 0.3;
  const cpi = 3.0 + inflationVal * 2.5;

  const peak = (session as any).peak_net_worth ?? (session as any).peak_capital ?? session.capital;
  const spendTone = spendingSignal(session.capital, colors);

  if (isNormal) {
    const topMovers = tickers.slice(0, 3);
    return (
      <View style={styles.sidebar}>
        <View style={styles.normalCard}>
          <Text style={styles.normalHeader}>💰 Your Money</Text>
          <Text style={[styles.normalCashValue, { color: spendTone.color }]}>
            ${Math.round(session.capital).toLocaleString()}
          </Text>
          <Text style={styles.normalBody}>You are {session.capital >= 10000 ? "up" : "down"} {Math.abs(Math.round(session.capital - 10000)).toLocaleString()} from your starting cash.</Text>
          <View style={[styles.normalTag, { borderColor: spendTone.color, backgroundColor: spendTone.color + "10" }]}>
            <Text style={[styles.normalTagText, { color: spendTone.color }]}>{spendTone.label}</Text>
          </View>
        </View>

        <View style={styles.normalCard}>
          <Text style={styles.normalHeader}>🌤️ Market Weather</Text>
          <Text style={[styles.normalMood, { color: sentimentInfo.color }]}>{sentimentInfo.label}</Text>
          <Text style={styles.normalBody}>{marketExplainer(ms)}</Text>
          <View style={styles.normalFacts}>
            <Text style={styles.normalFact}>🔥 Inflation: {Math.max(0.0, cpi).toFixed(1)}%</Text>
            <Text style={styles.normalFact}>🌊 Volatility: {volatilityVal >= 0.45 ? "High" : "Normal"}</Text>
            <Text style={styles.normalFact}>🏆 Best so far: ${Math.round(peak).toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.normalCard}>
          <Text style={styles.normalHeader}>👀 Quick Watchlist</Text>
          {topMovers.map((t) => (
            <View key={t.sym} style={styles.normalWatchRow}>
              <Text style={styles.normalWatchTicker}>{t.sym}</Text>
              <Text style={styles.normalWatchPrice}>${t.price}</Text>
              <Text style={[styles.normalWatchMove, { color: t.up ? colors.green : colors.red }]}>
                {t.up ? "Up" : "Down"} {Math.abs(t.pct)}%
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.sidebar}>
      {/* Market data panel */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>{isNormal ? "MARKET SNAPSHOT" : "MARKET DATA"}</Text>
        {tickers.map((t) => (
          <View key={t.sym} style={styles.tickerRow}>
            <Text style={styles.sym}>{t.sym}</Text>
            <Text style={styles.price}>{t.price}</Text>
            <Text style={[styles.pct, { color: t.up ? colors.green : colors.red }]}>
              {t.up ? "▲" : "▼"} {Math.abs(t.pct)}%
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      {/* Macro panel */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>{isNormal ? "BIG PICTURE" : "MACRO"}</Text>
        <Row label={isNormal ? "Mood" : "SENTIMENT"} value={sentimentInfo.label} valueColor={sentimentInfo.color} />
        <Row label={isNormal ? "10Y Yield" : "10Y YIELD"} value={`${Math.max(0.5, yieldPct).toFixed(2)}%`} />
        <Row label={isNormal ? "Fed Rate" : "FED RATE"} value={`${Math.max(0.25, fedRate).toFixed(2)}%`} />
        <Row label="CPI YoY" value={`${Math.max(0.0, cpi).toFixed(1)}%`} />
      </View>

      <View style={styles.divider} />

      {/* Session panel */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>{isNormal ? "YOUR RUN" : "SESSION"}</Text>
        <Row label={isNormal ? "📚 Stage" : "STAGE"} value={`${session.stage} / 5`} />
        <Row label={isNormal ? "Progress" : "PROGRESS"} value={`${(session.progress * 100).toFixed(0)}%`} />
        <Row label={isNormal ? "🏆 All-Time High" : "PEAK"} value={`$${Math.round(peak).toLocaleString()}`} />
        <Row
          label={isNormal ? "📈 Profit/Loss" : "P&L"}
          value={`${session.capital >= 10000 ? "+" : ""}$${Math.round(session.capital - 10000).toLocaleString()}`}
          valueColor={session.capital >= 10000 ? colors.green : colors.red}
        />
      </View>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  sidebar: {
    flex: 1,
    backgroundColor: colors.bgPanel,
    padding: 12,
  },
  section: {
    marginBottom: 4,
  },
  sectionHeader: {
    fontSize: 8,
    fontFamily: Fonts.sansBold,
    color: colors.blue,
    letterSpacing: 2,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDim,
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
    color: colors.textPrimary,
  },
  price: {
    flex: 1,
    fontSize: 9,
    fontFamily: Fonts.mono,
    color: colors.textBright,
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
    backgroundColor: colors.borderDim,
    marginVertical: 10,
  },
  normalCard: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.borderDim,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  normalHeader: {
    fontSize: 14,
    fontFamily: Fonts.sansBold,
    color: colors.textBright,
    marginBottom: 8,
  },
  normalCashValue: {
    fontSize: 26,
    fontFamily: Fonts.mono,
    marginBottom: 6,
  },
  normalMood: {
    fontSize: 18,
    fontFamily: Fonts.sansBold,
    marginBottom: 6,
  },
  normalBody: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: Fonts.sans,
    color: colors.textPrimary,
  },
  normalTag: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 10,
  },
  normalTagText: {
    fontSize: 11,
    fontFamily: Fonts.sansBold,
  },
  normalFacts: {
    gap: 6,
    marginTop: 10,
  },
  normalFact: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
    color: colors.textBright,
  },
  normalWatchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderFaint,
  },
  normalWatchTicker: {
    width: 44,
    fontSize: 13,
    fontFamily: Fonts.sansBold,
    color: colors.textBright,
  },
  normalWatchPrice: {
    flex: 1,
    fontSize: 12,
    fontFamily: Fonts.mono,
    color: colors.textPrimary,
  },
  normalWatchMove: {
    fontSize: 12,
    fontFamily: Fonts.sansBold,
  },
});
