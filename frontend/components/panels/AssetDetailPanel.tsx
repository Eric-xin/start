import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import Svg, { Polyline, Line, Text as SvgText, Rect } from "react-native-svg";
import { FloatingPanel } from "./FloatingPanel";
import { getAssetDetail, type AssetDetail } from "../../services/gameHud";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";

const ASSET_CLASS_COLOR: Record<string, string> = {
  stocks:  Colors.blue,
  bonds:   Colors.teal,
  gold:    Colors.amber,
  bitcoin: "#ff9800",
  tech:    Colors.blueLight,
};

// ─── Large SVG chart (90 days) ───────────────────────────────────────────────
function LargeChart({ prices, color }: { prices: number[]; color: string }) {
  const W = 560;
  const H = 160;
  const PAD = { top: 12, bottom: 28, left: 12, right: 8 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  if (prices.length < 2) return null;

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const xOf = (i: number) => PAD.left + (i / (prices.length - 1)) * plotW;
  const yOf = (v: number) => PAD.top + plotH - ((v - min) / range) * plotH;

  const pts = prices.map((v, i) => `${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join(" ");

  // Build filled area path
  const first = `${xOf(0).toFixed(1)},${(PAD.top + plotH).toFixed(1)}`;
  const last  = `${xOf(prices.length - 1).toFixed(1)},${(PAD.top + plotH).toFixed(1)}`;

  // Day labels at 0, 30, 60, 90
  const labels = [0, 29, 59, 89].filter((i) => i < prices.length);

  const isUp = prices[prices.length - 1] >= prices[0];
  const lineColor = isUp ? Colors.green : Colors.red;
  const fillColor = isUp ? "rgba(0,230,118,0.08)" : "rgba(255,23,68,0.08)";

  return (
    <Svg width={W} height={H} style={{ marginTop: 8 }}>
      {/* Y gridlines */}
      {[0.25, 0.5, 0.75].map((frac) => {
        const y = PAD.top + plotH * (1 - frac);
        const val = min + range * frac;
        return (
          <React.Fragment key={frac}>
            <Line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
              stroke={Colors.borderFaint} strokeWidth={0.5} strokeDasharray="4,4" />
            <SvgText x={PAD.left - 2} y={y + 3} fontSize={7} fill={Colors.textMuted}
              textAnchor="end" fontFamily="monospace">
              {val.toFixed(0)}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* Filled area */}
      <Polyline
        points={`${first} ${pts} ${last}`}
        fill={fillColor}
        stroke="none"
      />

      {/* Price line */}
      <Polyline points={pts} fill="none" stroke={lineColor} strokeWidth={1.8} />

      {/* Day labels */}
      {labels.map((i) => (
        <SvgText key={i} x={xOf(i)} y={H - 6} fontSize={8}
          fill={Colors.textMuted} textAnchor="middle" fontFamily="monospace">
          {i === 0 ? "90d ago" : i === 29 ? "60d" : i === 59 ? "30d" : "Today"}
        </SvgText>
      ))}

      {/* Current price dot */}
      <Rect
        x={xOf(prices.length - 1) - 3}
        y={yOf(prices[prices.length - 1]) - 3}
        width={6} height={6}
        rx={3} fill={lineColor}
      />
    </Svg>
  );
}

// ─── Factor contribution bars ────────────────────────────────────────────────
function FactorBars({ factors }: { factors: Record<string, number> }) {
  const entries = Object.entries(factors);
  const maxAbs = Math.max(...entries.map(([, v]) => Math.abs(v)), 1);

  return (
    <View style={fc.container}>
      {entries.map(([label, val]) => {
        const isPos = val >= 0;
        const barW = Math.abs(val) / maxAbs * 100;
        const color = isPos ? Colors.green : Colors.red;
        return (
          <View key={label} style={fc.row}>
            <Text style={fc.label}>{label.toUpperCase()}</Text>
            <View style={fc.track}>
              <View style={[fc.fill, { width: `${barW}%`, backgroundColor: color }]} />
            </View>
            <Text style={[fc.val, { color }]}>
              {isPos ? "+" : ""}{val.toFixed(1)}%
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const fc = StyleSheet.create({
  container: { gap: 6, marginTop: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { width: 100, fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 1 },
  track: { flex: 1, height: 5, backgroundColor: Colors.bgCard, borderRadius: 2, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 2 },
  val: { width: 44, fontSize: 9, fontFamily: Fonts.mono, textAlign: "right" },
});

// ─── Main component ───────────────────────────────────────────────────────────
interface Props {
  ticker: string | null;
  onClose: () => void;
}

export function AssetDetailPanel({ ticker, onClose }: Props) {
  const [detail, setDetail] = useState<AssetDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setDetail(null);
    getAssetDetail(ticker)
      .then(setDetail)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ticker]);

  const color = detail ? (ASSET_CLASS_COLOR[detail.asset_class] ?? Colors.blue) : Colors.blue;
  const isUp = detail && detail.return_90d >= 0;

  return (
    <FloatingPanel
      visible={!!ticker}
      title={detail ? `${detail.ticker} — ${detail.name.toUpperCase()}` : "LOADING..."}
      subtitle={detail ? detail.asset_class.toUpperCase() : undefined}
      onClose={onClose}
      width={620}
      height={580}
    >
      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.blue} />
          <Text style={styles.loadingText}>GENERATING MARKET DATA...</Text>
        </View>
      )}

      {detail && !loading && (
        <>
          {/* ── Price strip ── */}
          <View style={styles.priceStrip}>
            <View>
              <Text style={[styles.price, { color }]}>
                ${detail.latest_price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </Text>
              <Text style={styles.priceLabel}>{detail.name}</Text>
            </View>
            <View style={styles.returnBadges}>
              {[
                { label: "7D",  val: detail.return_7d },
                { label: "30D", val: detail.return_30d },
                { label: "90D", val: detail.return_90d },
              ].map(({ label, val }) => {
                const c = val >= 0 ? Colors.green : Colors.red;
                const prefix = val >= 0 ? "+" : "";
                return (
                  <View key={label} style={styles.badge}>
                    <Text style={styles.badgeLabel}>{label}</Text>
                    <Text style={[styles.badgeVal, { color: c }]}>{prefix}{val.toFixed(2)}%</Text>
                  </View>
                );
              })}
            </View>
            <View style={[styles.regimePill, { borderColor: color }]}>
              <Text style={[styles.regimeText, { color }]}>
                VOL: {detail.volatility_regime}
              </Text>
            </View>
          </View>

          {/* ── Large chart ── */}
          <View style={styles.chartContainer}>
            <LargeChart prices={detail.prices_90d} color={color} />
          </View>

          {/* ── Stats row ── */}
          <View style={styles.statsRow}>
            {[
              { label: "DRIFT (ANN.)", val: `${detail.annual_drift_pct > 0 ? "+" : ""}${detail.annual_drift_pct}%` },
              { label: "VOL (ANN.)", val: `${detail.annual_vol_pct}%` },
            ].map(({ label, val }) => (
              <View key={label} style={styles.stat}>
                <Text style={styles.statLabel}>{label}</Text>
                <Text style={styles.statVal}>{val}</Text>
              </View>
            ))}
          </View>

          {/* ── Factor breakdown ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DRIVER BREAKDOWN</Text>
            <FactorBars factors={detail.factors} />
          </View>

          {/* ── Interpretation ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ANALYSIS</Text>
            <Text style={styles.interpretation}>{detail.interpretation}</Text>
          </View>

          <Text style={styles.footnote}>
            Prices synthesized from game market parameters · Not real market data
          </Text>
        </>
      )}
    </FloatingPanel>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 40 },
  loadingText: { fontSize: 10, fontFamily: Fonts.mono, color: Colors.textDim, letterSpacing: 2 },
  priceStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderFaint,
  },
  price: { fontSize: 26, fontFamily: Fonts.mono, letterSpacing: -0.5 },
  priceLabel: { fontSize: 9, fontFamily: Fonts.sans, color: Colors.textDim, marginTop: 2 },
  returnBadges: { flexDirection: "row", gap: 14 },
  badge: { alignItems: "flex-end" },
  badgeLabel: { fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.textMuted, letterSpacing: 1 },
  badgeVal: { fontSize: 13, fontFamily: Fonts.mono },
  regimePill: {
    borderWidth: 1, borderRadius: 2,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  regimeText: { fontSize: 8, fontFamily: Fonts.sansBold, letterSpacing: 1.5 },
  chartContainer: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.borderFaint,
    borderRadius: 2,
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginTop: 12,
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: 24,
    marginTop: 10,
  },
  stat: {},
  statLabel: { fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.textMuted, letterSpacing: 1.5 },
  statVal: { fontSize: 13, fontFamily: Fonts.mono, color: Colors.textBright, marginTop: 2 },
  section: { marginTop: 16 },
  sectionTitle: {
    fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.textMuted,
    letterSpacing: 2, marginBottom: 8,
  },
  interpretation: {
    fontSize: 11, fontFamily: Fonts.sans, color: Colors.textPrimary,
    lineHeight: 17,
  },
  footnote: {
    fontSize: 8, fontFamily: Fonts.sans, color: Colors.textMuted,
    marginTop: 16, lineHeight: 13,
  },
});
