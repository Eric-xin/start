import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import Svg, { Polyline } from "react-native-svg";
import { FloatingPanel } from "./FloatingPanel";
import { AssetDetailPanel } from "./AssetDetailPanel";
import { getMarketOverview, type MarketAssetData } from "../../services/gameHud";
import { useColors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { useThemeStore } from "../../store/themeStore";

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const W = 80;
  const H = 28;
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - ((v - min) / range) * H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <Svg width={W} height={H}>
      <Polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

function ReturnBadge({ value, label }: { value: number; label: string }) {
  const colors = useColors();
  const color = value > 0 ? colors.green : value < 0 ? colors.red : colors.textDim;
  const prefix = value > 0 ? "+" : "";
  return (
    <View style={badge.col}>
      <Text style={[badge.label, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[badge.value, { color }]}>{prefix}{value.toFixed(2)}%</Text>
    </View>
  );
}

const badge = StyleSheet.create({
  col: { alignItems: "flex-end" },
  label: { fontSize: 8, fontFamily: Fonts.sansBold, letterSpacing: 1 },
  value: { fontSize: 11, fontFamily: Fonts.mono, letterSpacing: 0.5 },
});

function AssetRow({ asset, onPress }: { asset: MarketAssetData; onPress: () => void }) {
  const colors = useColors();
  const isNormal = useThemeStore((state) => state.mode === "normal");
  const styles = createRowStyles(colors);
  const classLabels: Record<string, string> = {
    stocks: isNormal ? "📈 Stocks" : "EQUITIES",
    bonds: isNormal ? "🎁 Bonds" : "FIXED INCOME",
    gold: isNormal ? "🥇 Gold & Metals" : "COMMODITIES",
    bitcoin: isNormal ? "₿ Crypto" : "DIGITAL ASSETS",
    tech: isNormal ? "⚡ Tech" : "TECH / GROWTH",
  };
  const classColors: Record<string, string> = {
    stocks: colors.blue,
    bonds: colors.teal,
    gold: colors.amber,
    bitcoin: "#ff9800",
    tech: colors.blueLight,
  };
  const classColor = classColors[asset.asset_class] ?? colors.textDim;
  const trendColor = asset.return_7d > 0 ? colors.green : asset.return_7d < 0 ? colors.red : colors.textDim;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.container}>
      <View style={styles.left}>
        <View style={[styles.dot, { backgroundColor: classColor }]} />
        <View>
          <Text style={styles.ticker}>{asset.ticker}</Text>
          <Text style={styles.name}>{asset.name}</Text>
          <Text style={[styles.classLabel, { color: classColor }]}>
            {classLabels[asset.asset_class] ?? asset.asset_class.toUpperCase()}
          </Text>
        </View>
      </View>

      <Sparkline data={asset.sparkline} color={trendColor} />

      <View style={styles.right}>
        <Text style={styles.price}>${asset.latest_price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
        <View style={styles.returns}>
          <ReturnBadge value={asset.return_7d} label="7D" />
          <ReturnBadge value={asset.return_30d} label="30D" />
        </View>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const createRowStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderFaint,
    gap: 12,
  },
  left: { flexDirection: "row", alignItems: "flex-start", gap: 10, flex: 1 },
  dot: { width: 4, height: 38, borderRadius: 2, marginTop: 2 },
  ticker: { fontSize: 13, fontFamily: Fonts.mono, color: colors.textBright, letterSpacing: 1 },
  name: { fontSize: 9, fontFamily: Fonts.sans, color: colors.textDim, marginTop: 1 },
  classLabel: { fontSize: 8, fontFamily: Fonts.sansBold, letterSpacing: 1.5, marginTop: 2 },
  right: { alignItems: "flex-end", gap: 4 },
  price: { fontSize: 14, fontFamily: Fonts.mono, color: colors.textBright, letterSpacing: 0.5 },
  returns: { flexDirection: "row", gap: 14 },
  chevron: { fontSize: 16, color: colors.textMuted, marginLeft: 4 },
});

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function MarketPanel({ visible, onClose }: Props) {
  const colors = useColors();
  const isNormal = useThemeStore((state) => state.mode === "normal");
  const styles = createStyles(colors);
  const [data, setData] = useState<MarketAssetData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailTicker, setDetailTicker] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) { setDetailTicker(null); return; }
    setLoading(true);
    setError(null);
    getMarketOverview()
      .then((r) => setData(r.assets))
      .catch(() => setError("Unable to load market data."))
      .finally(() => setLoading(false));
  }, [visible]);

  return (
    <>
      <FloatingPanel
        visible={visible}
        title={isNormal ? "📈 Market Overview" : "MARKET OVERVIEW"}
        subtitle={isNormal ? "Tap a row to see more" : "TAP ROW FOR DETAILED CHART"}
        onClose={onClose}
        width={680}
        height={540}
      >
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color={colors.blue} />
            <Text style={styles.loadingText}>{isNormal ? "Getting market data..." : "SYNTHESIZING MARKET DATA..."}</Text>
          </View>
        )}
        {error && <Text style={styles.errorText}>{error}</Text>}
        {data && !loading && (
          <>
            <View style={styles.header}>
              <Text style={styles.headerText}>{isNormal ? "ASSET" : "TICKER"}</Text>
              <Text style={styles.headerText}>{isNormal ? "TREND" : "30-DAY TREND"}</Text>
              <Text style={styles.headerText}>{isNormal ? "PRICE / RETURNS" : "PRICE / RETURNS"}</Text>
            </View>
            {data.map((asset) => (
              <AssetRow key={asset.ticker} asset={asset} onPress={() => setDetailTicker(asset.ticker)} />
            ))}
            <Text style={styles.footnote}>
              {isNormal
                ? "Prices are generated from the game's market mood, inflation, fundamentals, and investor behavior."
                : "Prices synthesized from game market parameters · Driven by sentiment, fundamentals, inflation & greed"}
            </Text>
          </>
        )}
      </FloatingPanel>

      <AssetDetailPanel ticker={detailTicker} onClose={() => setDetailTicker(null)} />
    </>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 40 },
  loadingText: { fontSize: 10, fontFamily: Fonts.mono, color: colors.textDim, letterSpacing: 2 },
  errorText: { fontSize: 11, fontFamily: Fonts.sans, color: colors.red, textAlign: "center", paddingVertical: 24 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDim,
    marginBottom: 4,
  },
  headerText: { fontSize: 8, fontFamily: Fonts.sansBold, color: colors.textMuted, letterSpacing: 2 },
  footnote: { fontSize: 8, fontFamily: Fonts.sans, color: colors.textMuted, marginTop: 16, lineHeight: 13 },
});
