import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import Svg, { Polyline } from "react-native-svg";
import { FloatingPanel } from "./FloatingPanel";
import { AssetDetailPanel } from "./AssetDetailPanel";
import { getMarketOverview, type MarketAssetData } from "../../services/gameHud";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";

const ASSET_CLASS_LABEL: Record<string, string> = {
  stocks: "EQUITIES",
  bonds: "FIXED INCOME",
  gold: "COMMODITIES",
  bitcoin: "DIGITAL ASSETS",
  tech: "TECH / GROWTH",
};

const ASSET_CLASS_COLOR: Record<string, string> = {
  stocks: Colors.blue,
  bonds: Colors.teal,
  gold: Colors.amber,
  bitcoin: "#ff9800",
  tech: Colors.blueLight,
};

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
  const color = value > 0 ? Colors.green : value < 0 ? Colors.red : Colors.textDim;
  const prefix = value > 0 ? "+" : "";
  return (
    <View style={badge.col}>
      <Text style={badge.label}>{label}</Text>
      <Text style={[badge.value, { color }]}>{prefix}{value.toFixed(2)}%</Text>
    </View>
  );
}

const badge = StyleSheet.create({
  col: { alignItems: "flex-end" },
  label: { fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.textMuted, letterSpacing: 1 },
  value: { fontSize: 11, fontFamily: Fonts.mono, letterSpacing: 0.5 },
});

function AssetRow({ asset, onPress }: { asset: MarketAssetData; onPress: () => void }) {
  const classColor = ASSET_CLASS_COLOR[asset.asset_class] ?? Colors.textDim;
  const trendColor = asset.return_7d > 0 ? Colors.green : asset.return_7d < 0 ? Colors.red : Colors.textDim;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={row.container}>
      {/* Left: ticker + name */}
      <View style={row.left}>
        <View style={[row.dot, { backgroundColor: classColor }]} />
        <View>
          <Text style={row.ticker}>{asset.ticker}</Text>
          <Text style={row.name}>{asset.name}</Text>
          <Text style={[row.classLabel, { color: classColor }]}>
            {ASSET_CLASS_LABEL[asset.asset_class] ?? asset.asset_class.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Sparkline */}
      <Sparkline data={asset.sparkline} color={trendColor} />

      {/* Price + returns */}
      <View style={row.right}>
        <Text style={row.price}>${asset.latest_price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
        <View style={row.returns}>
          <ReturnBadge value={asset.return_7d} label="7D" />
          <ReturnBadge value={asset.return_30d} label="30D" />
        </View>
      </View>
      <Text style={row.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const row = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderFaint,
    gap: 12,
  },
  left: { flexDirection: "row", alignItems: "flex-start", gap: 10, flex: 1 },
  dot: { width: 4, height: 38, borderRadius: 2, marginTop: 2 },
  ticker: { fontSize: 13, fontFamily: Fonts.mono, color: Colors.textBright, letterSpacing: 1 },
  name: { fontSize: 9, fontFamily: Fonts.sans, color: Colors.textDim, marginTop: 1 },
  classLabel: { fontSize: 8, fontFamily: Fonts.sansBold, letterSpacing: 1.5, marginTop: 2 },
  right: { alignItems: "flex-end", gap: 4 },
  price: { fontSize: 14, fontFamily: Fonts.mono, color: Colors.textBright, letterSpacing: 0.5 },
  returns: { flexDirection: "row", gap: 14 },
  chevron: { fontSize: 16, color: Colors.textMuted, marginLeft: 4 },
});

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function MarketPanel({ visible, onClose }: Props) {
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
        title="MARKET OVERVIEW"
        subtitle="TAP ROW FOR DETAILED CHART"
        onClose={onClose}
        width={680}
        height={540}
      >
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.blue} />
            <Text style={styles.loadingText}>SYNTHESIZING MARKET DATA...</Text>
          </View>
        )}
        {error && <Text style={styles.errorText}>{error}</Text>}
        {data && !loading && (
          <>
            <View style={styles.header}>
              <Text style={styles.headerText}>TICKER</Text>
              <Text style={styles.headerText}>30-DAY TREND</Text>
              <Text style={styles.headerText}>PRICE / RETURNS</Text>
            </View>
            {data.map((asset) => (
              <AssetRow key={asset.ticker} asset={asset} onPress={() => setDetailTicker(asset.ticker)} />
            ))}
            <Text style={styles.footnote}>
              Prices synthesized from game market parameters · Driven by sentiment, fundamentals, inflation & greed
            </Text>
          </>
        )}
      </FloatingPanel>

      {/* Detail panel — stacks on top */}
      <AssetDetailPanel ticker={detailTicker} onClose={() => setDetailTicker(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 40 },
  loadingText: { fontSize: 10, fontFamily: Fonts.mono, color: Colors.textDim, letterSpacing: 2 },
  errorText: { fontSize: 11, fontFamily: Fonts.sans, color: Colors.red, textAlign: "center", paddingVertical: 24 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDim,
    marginBottom: 4,
  },
  headerText: { fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.textMuted, letterSpacing: 2 },
  footnote: { fontSize: 8, fontFamily: Fonts.sans, color: Colors.textMuted, marginTop: 16, lineHeight: 13 },
});
