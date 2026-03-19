import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from "react-native";
import Svg, {
  Path,
  Line,
  Text as SvgText,
  Circle,
  Rect,
  G,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Colors, useColors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { Layout } from "../../constants/layout";
import { usePortfolioStore } from "../../store/portfolioStore";
import {
  runSimulation,
  type SimulationRequest,
  type SimulationResponse,
  type EventAnnotation,
  type TradeRecord,
} from "../../services/simulation";
import { api } from "../../services/api";
import { useThemeStore } from "../../store/themeStore";

// ─── Asset config ────────────────────────────────────────────────────────────

const ASSET_CLASSES = ["stocks", "bonds", "gold", "bitcoin", "tech"] as const;
type AssetClass = (typeof ASSET_CLASSES)[number];

const ASSET_COLORS: Record<AssetClass, string> = {
  stocks: "#0a6cf5",
  bonds: "#00c853",
  gold: "#ffa000",
  bitcoin: "#f7931a",
  tech: "#8b5cf6",
};

const ASSET_LABELS: Record<AssetClass, string> = {
  stocks: "STOCKS",
  bonds: "BONDS",
  gold: "GOLD",
  bitcoin: "BITCOIN",
  tech: "TECH",
};

// ─── Trait names ──────────────────────────────────────────────────────────────

const TRAIT_NAMES = [
  "Risk Tolerance",
  "Loss Aversion",
  "Recency Bias",
  "Overconfidence",
  "Diversification",
  "Patience",
];

// ─── Persona colors ───────────────────────────────────────────────────────────

function personaColor(type: string): string {
  if (type.includes("Aggressive") || type.includes("Momentum")) return Colors.red;
  if (type.includes("Conservative")) return Colors.green;
  if (type.includes("FOMO") || type.includes("Overconfident") || type.includes("Bull")) return Colors.amber;
  if (type.includes("Balanced") || type.includes("Diversif")) return Colors.blue;
  return Colors.textDim;
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function fmtCurrency(v: number): string {
  return "$" + Math.round(v).toLocaleString("en-US");
}

function fmtPct(v: number, alwaysSign = true): string {
  const pct = (v * 100).toFixed(1);
  if (alwaysSign && v > 0) return "+" + pct + "%";
  return pct + "%";
}

function fmtPctPerYear(v: number): string {
  const pct = (v * 100).toFixed(1);
  if (v > 0) return "+" + pct + "%/yr";
  return pct + "%/yr";
}

// ─── SVG Line Chart ───────────────────────────────────────────────────────────

interface LineChartProps {
  data: { date: string; value: number }[];
  benchmarkData: { date: string; value: number }[];
  events: EventAnnotation[];
  width: number;
  height: number;
}

function buildPath(
  points: { x: number; y: number }[]
): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)}`;
  }
  return d;
}

function buildAreaPath(
  points: { x: number; y: number }[],
  chartBottom: number
): string {
  if (points.length === 0) return "";
  let d = `M ${points[0].x.toFixed(1)} ${chartBottom}`;
  d += ` L ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)}`;
  }
  d += ` L ${points[points.length - 1].x.toFixed(1)} ${chartBottom} Z`;
  return d;
}

function LineChart({ data, benchmarkData, events, width, height }: LineChartProps) {
  const PAD_LEFT = 56;
  const PAD_RIGHT = 16;
  const PAD_TOP = 12;
  const PAD_BOTTOM = 28;

  const chartW = width - PAD_LEFT - PAD_RIGHT;
  const chartH = height - PAD_TOP - PAD_BOTTOM;

  // Combine both datasets to determine global min/max
  const allValues = [...data.map((d) => d.value), ...benchmarkData.map((d) => d.value)];
  const allDates = [...data.map((d) => d.date), ...benchmarkData.map((d) => d.date)];

  if (allValues.length === 0) {
    return (
      <View style={{ width, height, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: Colors.textDim, fontFamily: Fonts.mono, fontSize: 11 }}>
          NO DATA
        </Text>
      </View>
    );
  }

  const minVal = Math.min(...allValues) * 0.97;
  const maxVal = Math.max(...allValues) * 1.03;
  const valRange = maxVal - minVal || 1;

  // Date range
  const sortedDates = [...new Set(allDates)].sort();
  const minDate = sortedDates[0];
  const maxDate = sortedDates[sortedDates.length - 1];
  const minTime = new Date(minDate).getTime();
  const maxTime = new Date(maxDate).getTime();
  const timeRange = maxTime - minTime || 1;

  function scaleX(dateStr: string): number {
    const t = new Date(dateStr).getTime();
    return PAD_LEFT + ((t - minTime) / timeRange) * chartW;
  }

  function scaleY(val: number): number {
    return PAD_TOP + chartH - ((val - minVal) / valRange) * chartH;
  }

  // Build point arrays
  const portfolioPoints = data.map((d) => ({ x: scaleX(d.date), y: scaleY(d.value) }));
  const benchmarkPoints = benchmarkData.map((d) => ({ x: scaleX(d.date), y: scaleY(d.value) }));

  // Grid lines (4 horizontal)
  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const val = minVal + (i / 4) * valRange;
    const y = scaleY(val);
    return { y, val };
  });

  // X axis year labels
  const startYear = new Date(minDate).getFullYear();
  const endYear = new Date(maxDate).getFullYear();
  const years: { year: number; x: number }[] = [];
  for (let yr = startYear; yr <= endYear; yr++) {
    const dateStr = `${yr}-01-01`;
    const t = new Date(dateStr).getTime();
    if (t >= minTime && t <= maxTime) {
      years.push({ year: yr, x: scaleX(dateStr) });
    }
  }

  // Event vertical markers
  const eventMarkers = events
    .filter((ev) => {
      const t = new Date(ev.date).getTime();
      return t >= minTime && t <= maxTime;
    })
    .map((ev) => ({
      ...ev,
      x: scaleX(ev.date),
      color:
        ev.impact === "positive"
          ? Colors.green
          : ev.impact === "negative"
          ? Colors.red
          : Colors.amber,
    }));

  // Last point tip
  const lastPt = portfolioPoints[portfolioPoints.length - 1];
  const lastVal = data[data.length - 1]?.value;

  const chartBottom = PAD_TOP + chartH;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#0a6cf5" stopOpacity="0.25" />
          <Stop offset="1" stopColor="#0a6cf5" stopOpacity="0.02" />
        </LinearGradient>
      </Defs>

      {/* Chart background */}
      <Rect
        x={PAD_LEFT}
        y={PAD_TOP}
        width={chartW}
        height={chartH}
        fill={Colors.bgPanel}
        rx={2}
      />

      {/* Horizontal grid lines */}
      {gridLines.map((gl, i) => (
        <G key={i}>
          <Line
            x1={PAD_LEFT}
            y1={gl.y}
            x2={PAD_LEFT + chartW}
            y2={gl.y}
            stroke={Colors.borderFaint}
            strokeWidth={1}
            strokeDasharray={i === 0 ? undefined : "3,4"}
          />
          <SvgText
            x={PAD_LEFT - 4}
            y={gl.y + 4}
            fontSize={8}
            fontFamily={Fonts.mono}
            fill={Colors.textDim}
            textAnchor="end"
          >
            {fmtCurrency(gl.val)}
          </SvgText>
        </G>
      ))}

      {/* Event vertical markers */}
      {eventMarkers.map((ev, i) => (
        <G key={`ev-${i}`}>
          <Line
            x1={ev.x}
            y1={PAD_TOP}
            x2={ev.x}
            y2={chartBottom}
            stroke={ev.color}
            strokeWidth={1}
            strokeDasharray="2,3"
            strokeOpacity={0.7}
          />
          <Circle cx={ev.x} cy={PAD_TOP + 4} r={2.5} fill={ev.color} fillOpacity={0.8} />
        </G>
      ))}

      {/* X axis year labels */}
      {years.map((yr) => (
        <SvgText
          key={yr.year}
          x={yr.x}
          y={PAD_TOP + chartH + 16}
          fontSize={9}
          fontFamily={Fonts.mono}
          fill={Colors.textDim}
          textAnchor="middle"
        >
          {yr.year}
        </SvgText>
      ))}

      {/* Benchmark area (subtle) */}
      {benchmarkPoints.length > 1 && (
        <Path
          d={buildAreaPath(benchmarkPoints, chartBottom)}
          fill={Colors.textMuted}
          fillOpacity={0.05}
        />
      )}

      {/* Portfolio area fill */}
      {portfolioPoints.length > 1 && (
        <Path
          d={buildAreaPath(portfolioPoints, chartBottom)}
          fill="url(#portfolioGrad)"
        />
      )}

      {/* Benchmark line */}
      {benchmarkPoints.length > 1 && (
        <Path
          d={buildPath(benchmarkPoints)}
          stroke={Colors.textDim}
          strokeWidth={1.5}
          fill="none"
          strokeDasharray="4,3"
          strokeOpacity={0.6}
        />
      )}

      {/* Portfolio line */}
      {portfolioPoints.length > 0 && (
        <Path
          d={buildPath(portfolioPoints)}
          stroke="#0a6cf5"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Rightmost value tip */}
      {lastPt && lastVal !== undefined && (
        <G>
          <Circle cx={lastPt.x} cy={lastPt.y} r={3.5} fill="#0a6cf5" />
          <Rect
            x={lastPt.x - 2}
            y={lastPt.y - 18}
            width={60}
            height={14}
            fill={Colors.bgCard ?? Colors.bgPanel}
            rx={2}
            opacity={0.9}
          />
          <SvgText
            x={lastPt.x + 28}
            y={lastPt.y - 7}
            fontSize={9}
            fontFamily={Fonts.mono}
            fill={Colors.textBright}
            textAnchor="middle"
          >
            {fmtCurrency(lastVal)}
          </SvgText>
        </G>
      )}

      {/* Legend */}
      <G>
        <Rect x={PAD_LEFT + 8} y={PAD_TOP + 6} width={20} height={2} fill="#0a6cf5" rx={1} />
        <SvgText
          x={PAD_LEFT + 32}
          y={PAD_TOP + 9}
          fontSize={8}
          fontFamily={Fonts.mono}
          fill={Colors.textBright}
        >
          PORTFOLIO
        </SvgText>
        <Rect
          x={PAD_LEFT + 90}
          y={PAD_TOP + 6}
          width={20}
          height={1.5}
          fill={Colors.textDim}
          rx={1}
          opacity={0.6}
        />
        <SvgText
          x={PAD_LEFT + 114}
          y={PAD_TOP + 9}
          fontSize={8}
          fontFamily={Fonts.mono}
          fill={Colors.textDim}
        >
          BENCHMARK
        </SvgText>
      </G>
    </Svg>
  );
}

// ─── Trait Bar ────────────────────────────────────────────────────────────────

interface TraitBarProps {
  label: string;
  value: number; // 0–1
}

function TraitBar({ label, value }: TraitBarProps) {
  const fill = useSharedValue(0);

  useEffect(() => {
    fill.value = withSpring(Math.max(0, Math.min(1, value)), {
      damping: 22,
      stiffness: 130,
    });
  }, [value]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fill.value * 100}%` as any,
  }));

  // Color: interpolate from dim blue to bright blue based on value
  const barColor =
    value >= 0.7 ? Colors.blue : value >= 0.4 ? Colors.blueLight : Colors.blueDim;

  return (
    <View style={traitStyles.row}>
      <Text style={traitStyles.label}>{label.toUpperCase()}</Text>
      <View style={traitStyles.track}>
        <Animated.View
          style={[traitStyles.fill, fillStyle, { backgroundColor: barColor }]}
        />
      </View>
      <Text style={traitStyles.value}>{Math.round(value * 100)}</Text>
    </View>
  );
}

const traitStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  label: {
    width: 88,
    fontSize: 8,
    fontFamily: Fonts.mono,
    color: Colors.textDim,
    letterSpacing: 0.8,
  },
  track: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.bgCard ?? Colors.bgPanel,
    borderRadius: 2,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.borderFaint,
  },
  fill: {
    height: "100%",
    borderRadius: 2,
  },
  value: {
    width: 24,
    fontSize: 9,
    fontFamily: Fonts.mono,
    color: Colors.textBright,
    textAlign: "right",
  },
});

// ─── Allocation Donut ─────────────────────────────────────────────────────────

interface AllocationDonutProps {
  allocation: Record<string, number>;
  size?: number;
}

function AllocationDonut({ allocation, size = 120 }: AllocationDonutProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.36;
  const strokeWidth = size * 0.14;
  const circumference = 2 * Math.PI * r;

  const entries = Object.entries(allocation).filter(([, v]) => v > 0.01);
  const total = entries.reduce((s, [, v]) => s + v, 0) || 1;

  let cumulativeAngle = 0;
  const segments = entries.map(([key, val]) => {
    const fraction = val / total;
    const dashArray = fraction * circumference;
    const offset = -cumulativeAngle * circumference;
    cumulativeAngle += fraction;
    const color =
      ASSET_COLORS[key as AssetClass] ?? Colors.blue;
    return { key, fraction, dashArray, offset, color, pct: Math.round(fraction * 100) };
  });

  return (
    <View style={donutStyles.container}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={Colors.borderFaint}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {segments.map((seg) => (
          <Circle
            key={seg.key}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${seg.dashArray} ${circumference}`}
            strokeDashoffset={seg.offset}
            rotation={-90}
            origin={`${cx}, ${cy}`}
          />
        ))}
        {/* Donut hole */}
        <Circle cx={cx} cy={cy} r={r * 0.52} fill={Colors.bgPanel} />
        <SvgText
          x={cx}
          y={cy - 4}
          fontSize={9}
          fontFamily={Fonts.mono}
          fill={Colors.textDim}
          textAnchor="middle"
        >
          ALLOC
        </SvgText>
        <SvgText
          x={cx}
          y={cy + 10}
          fontSize={8}
          fontFamily={Fonts.mono}
          fill={Colors.textDim}
          textAnchor="middle"
        >
          {entries.length} assets
        </SvgText>
      </Svg>
      <View style={donutStyles.legend}>
        {segments.map((seg) => (
          <View key={seg.key} style={donutStyles.legendItem}>
            <View style={[donutStyles.dot, { backgroundColor: seg.color }]} />
            <Text style={donutStyles.legendText}>
              {ASSET_LABELS[seg.key as AssetClass] ?? seg.key.toUpperCase()} {seg.pct}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const donutStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 8,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
    maxWidth: 200,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 8,
    fontFamily: Fonts.mono,
    color: Colors.textDim,
    letterSpacing: 0.5,
  },
});

// ─── Trade Log Item ───────────────────────────────────────────────────────────

interface TradeLogItemProps {
  trade: TradeRecord;
  capital?: number;
}

function TradeLogItem({ trade, capital }: TradeLogItemProps) {
  const isBuy = trade.action.toLowerCase().includes("buy");
  const actionColor = isBuy ? Colors.green : Colors.red;
  const actionLabel = isBuy ? "▲ BUY" : "▼ SELL";
  const weightDelta = trade.new_weight - trade.old_weight;

  return (
    <View style={tradeStyles.container}>
      <View style={tradeStyles.header}>
        <Text style={tradeStyles.date}>{trade.date}</Text>
        <View style={[tradeStyles.actionBadge, { borderColor: actionColor }]}>
          <Text style={[tradeStyles.actionText, { color: actionColor }]}>
            {actionLabel}
          </Text>
        </View>
        <Text style={tradeStyles.asset}>
          {ASSET_LABELS[trade.asset as AssetClass] ?? trade.asset.toUpperCase()}
        </Text>
      </View>
      <Text style={tradeStyles.reason}>{trade.reason}</Text>
      <View style={tradeStyles.footer}>
        <View style={tradeStyles.traitPill}>
          <Text style={tradeStyles.traitText}>
            {trade.trigger_trait} · {(trade.trait_value * 100).toFixed(0)}
          </Text>
        </View>
        {capital !== undefined && (
          <Text style={tradeStyles.capital}>
            {fmtCurrency(capital)}{" "}
            <Text
              style={{
                color: weightDelta >= 0 ? Colors.green : Colors.red,
              }}
            >
              ({weightDelta >= 0 ? "+" : ""}
              {(weightDelta * 100).toFixed(1)}%)
            </Text>
          </Text>
        )}
      </View>
    </View>
  );
}

const tradeStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bgPanel,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.borderFaint,
    padding: 10,
    marginBottom: 6,
    gap: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  date: {
    fontSize: 9,
    fontFamily: Fonts.mono,
    color: Colors.textDim,
    width: 80,
  },
  actionBadge: {
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  actionText: {
    fontSize: 8,
    fontFamily: Fonts.mono,
    letterSpacing: 0.5,
  },
  asset: {
    fontSize: 10,
    fontFamily: Fonts.mono,
    color: Colors.textBright,
    letterSpacing: 1,
  },
  reason: {
    fontSize: 10,
    fontFamily: Fonts.sans,
    color: Colors.textBright,
    lineHeight: 14,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  traitPill: {
    backgroundColor: Colors.bgCard ?? Colors.bgPanel,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.borderDim ?? Colors.borderFaint,
  },
  traitText: {
    fontSize: 8,
    fontFamily: Fonts.mono,
    color: Colors.blue,
    letterSpacing: 0.3,
  },
  capital: {
    fontSize: 9,
    fontFamily: Fonts.mono,
    color: Colors.textDim,
  },
});

// ─── Metric Card ──────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string;
  color?: string;
}

function MetricCard({ label, value, color }: MetricCardProps) {
  return (
    <View style={metricStyles.card}>
      <Text style={metricStyles.label}>{label}</Text>
      <Text style={[metricStyles.value, { color: color ?? Colors.textBright }]}>
        {value}
      </Text>
    </View>
  );
}

const metricStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.bgPanel,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.borderFaint,
    padding: 10,
    gap: 4,
    minWidth: 80,
  },
  label: {
    fontSize: 7,
    fontFamily: Fonts.mono,
    color: Colors.textDim,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 15,
    fontFamily: Fonts.mono,
    letterSpacing: 0.5,
  },
});

// ─── Live Clock ────────────────────────────────────────────────────────────────

function LiveClock() {
  const colors = useColors();
  const [time, setTime] = useState(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 8);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTime(now.toTimeString().slice(0, 8));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Text style={[clockStyles.text, { color: colors.textDim }]}>{time} UTC</Text>
  );
}

const clockStyles = StyleSheet.create({
  text: {
    fontSize: 11,
    fontFamily: Fonts.mono,
    color: Colors.textDim,
    letterSpacing: 1,
  },
});

// ─── Asset Toggle ─────────────────────────────────────────────────────────────

interface AssetToggleProps {
  asset: AssetClass;
  selected: boolean;
  onToggle: () => void;
}

function AssetToggle({ asset, selected, onToggle }: AssetToggleProps) {
  const colors = useColors();
  const isNormal = useThemeStore((state) => state.mode === "normal");
  const color = ASSET_COLORS[asset];
  return (
    <TouchableOpacity
      onPress={onToggle}
      style={[
        assetToggleStyles.chip,
        {
          borderColor: selected ? color : colors.borderFaint,
          backgroundColor: selected ? color + "22" : isNormal ? colors.bg : "transparent",
          borderRadius: isNormal ? 999 : 3,
        },
      ]}
      activeOpacity={0.7}
    >
      <View
        style={[
          assetToggleStyles.dot,
          { backgroundColor: selected ? color : colors.textMuted },
        ]}
      />
      <Text
        style={[
          assetToggleStyles.label,
          { color: selected ? color : colors.textDim, fontFamily: isNormal ? Fonts.sansBold : Fonts.mono },
        ]}
      >
        {ASSET_LABELS[asset]}
      </Text>
    </TouchableOpacity>
  );
}

const assetToggleStyles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  label: {
    fontSize: 8,
    fontFamily: Fonts.mono,
    letterSpacing: 0.8,
  },
});

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider() {
  const colors = useColors();
  return (
    <View
      style={{
        height: 1,
        backgroundColor: colors.borderFaint,
        marginVertical: 12,
      }}
    />
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  const colors = useColors();
  const isNormal = useThemeStore((state) => state.mode === "normal");
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <View style={{ width: isNormal ? 8 : 3, height: 12, backgroundColor: colors.blue, borderRadius: 999 }} />
      <Text
        style={{
          fontSize: isNormal ? 14 : 9,
          fontFamily: isNormal ? Fonts.sansBold : Fonts.mono,
          color: colors.blue,
          letterSpacing: isNormal ? 0.4 : 2,
          textTransform: isNormal ? "none" : "uppercase",
        }}
      >
        {text}
      </Text>
    </View>
  );
}

// ─── Default trait vector (neutral investor) ──────────────────────────────────

const DEFAULT_TRAITS: number[] = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5];

// Map backend trait keys (in order) to TRAIT_NAMES indices
const TRAIT_KEYS = [
  "risk_appetite",
  "loss_aversion",
  "fomo_sensitivity",
  "overconfidence",
  "diversification_bias",
  "patience",
];

// ─── Main Simulation Screen ───────────────────────────────────────────────────

export default function SimulationScreen() {
  const colors = useColors();
  const isNormal = useThemeStore((state) => state.mode === "normal");
  const { width } = useWindowDimensions();
  const isWide = width >= 1024;

  const { portfolio } = usePortfolioStore();
  const personaVector: number[] =
    (portfolio as any)?.persona_vector ?? DEFAULT_TRAITS;

  const [traitMap, setTraitMap] = useState<Record<string, number> | null>(null);
  const [traitInterpretation, setTraitInterpretation] = useState<string>("");

  useEffect(() => {
    api.get("/api/hud/traits").then((r) => {
      setTraitMap(r.data.traits);
      setTraitInterpretation(r.data.interpretation ?? "");
    }).catch(() => {});
  }, []);

  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SimulationResponse | null>(null);
  const [error, setError] = useState("");
  const [selectedAssets, setSelectedAssets] = useState<AssetClass[]>([
    "stocks",
    "bonds",
    "gold",
    "bitcoin",
    "tech",
  ]);
  const [startYear, setStartYear] = useState("2021");
  const [endYear, setEndYear] = useState("2026");
  const [capital, setCapital] = useState("10000");

  const resultsRef = useRef<ScrollView>(null);

  const toggleAsset = useCallback((asset: AssetClass) => {
    setSelectedAssets((prev) =>
      prev.includes(asset) ? prev.filter((a) => a !== asset) : [...prev, asset]
    );
  }, []);

  const handleRun = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setError("");
    setResult(null);

    try {
      const req: SimulationRequest = {
        persona_vector: personaVector,
        start_date: `${startYear}-01-01`,
        end_date: `${endYear}-01-01`,
        initial_capital: parseFloat(capital) || 10000,
        asset_classes: selectedAssets,
      };
      const res = await runSimulation(req);
      setResult(res);
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e?.message ?? "Simulation failed");
    } finally {
      setRunning(false);
    }
  }, [running, personaVector, startYear, endYear, capital, selectedAssets]);

  // Chart width
  const PERSONA_PANEL_WIDTH = 280;
  const chartWidth = isWide
    ? width - PERSONA_PANEL_WIDTH - 16 - 32 - 24
    : width - 32;

  // ── Persona traits display ──────────────────────────────────────────────────

  // Use backend-computed trait scores [0-1]; fall back to neutral until loaded
  const traitValues = TRAIT_KEYS.map((key) => traitMap?.[key] ?? 0.5);
  const inferredPersona = result?.persona_type ?? inferPersonaType(personaVector);

  // ── Render ──────────────────────────────────────────────────────────────────

  const personaPanel = (
    <View
      style={[
        styles.personaPanel,
        isWide ? { width: PERSONA_PANEL_WIDTH } : { width: "100%" },
      ]}
    >
      {/* Persona type */}
      <SectionLabel text="YOUR PERSONA" />
      <View style={styles.personaTypeRow}>
        <View
          style={[
            styles.personaTypeBadge,
            { borderColor: personaColor(inferredPersona) },
          ]}
        >
          <Text
            style={[
              styles.personaTypeText,
              { color: personaColor(inferredPersona) },
            ]}
          >
            {inferredPersona}
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 12 }}>
        {TRAIT_NAMES.map((name, i) => (
          <TraitBar key={name} label={name} value={traitValues[i]} />
        ))}
      </View>

      {traitInterpretation ? (
        <Text style={styles.traitInterpretation}>{traitInterpretation}</Text>
      ) : null}

      <Divider />

      {/* Simulation config */}
      <SectionLabel text={isNormal ? "🧪 Try a What-If Plan" : "SIMULATION CONFIG"} />
      {isNormal ? (
        <Text style={styles.traitInterpretation}>
          Choose a time range, starting cash, and a few investment types. We will turn the results into a simpler story below.
        </Text>
      ) : null}

      <View style={styles.configRow}>
        <View style={styles.configField}>
          <Text style={styles.configLabel}>START</Text>
          <TextInput
            style={styles.configInput}
            value={startYear}
            onChangeText={setStartYear}
            keyboardType="numeric"
            maxLength={4}
            selectTextOnFocus
          />
        </View>
        <View style={styles.configField}>
          <Text style={styles.configLabel}>END</Text>
          <TextInput
            style={styles.configInput}
            value={endYear}
            onChangeText={setEndYear}
            keyboardType="numeric"
            maxLength={4}
            selectTextOnFocus
          />
        </View>
      </View>

      <View style={[styles.configField, { marginTop: 8 }]}>
        <Text style={styles.configLabel}>INITIAL CAPITAL ($)</Text>
        <TextInput
          style={styles.configInput}
          value={capital}
          onChangeText={setCapital}
          keyboardType="numeric"
          selectTextOnFocus
        />
      </View>

      <View style={{ marginTop: 12 }}>
        <Text style={styles.configLabel}>ASSET CLASSES</Text>
        <View style={styles.assetGrid}>
          {ASSET_CLASSES.map((asset) => (
            <AssetToggle
              key={asset}
              asset={asset}
              selected={selectedAssets.includes(asset)}
              onToggle={() => toggleAsset(asset)}
            />
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.runButton,
          running && { opacity: 0.6 },
          selectedAssets.length === 0 && { opacity: 0.4 },
        ]}
        onPress={handleRun}
        disabled={running || selectedAssets.length === 0}
        activeOpacity={0.8}
      >
        {running ? (
          <ActivityIndicator size="small" color={Colors.textBright} />
        ) : (
          <Text style={styles.runButtonText}>{isNormal ? "▶ Run My Scenario" : "▶ RUN SIMULATION"}</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const resultsPanel = (
    <ScrollView
      ref={resultsRef}
      style={styles.resultsScroll}
      contentContainerStyle={styles.resultsContent}
      showsVerticalScrollIndicator={false}
    >
      {!result && !running && !error && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>◉</Text>
          <Text style={styles.emptyTitle}>{isNormal ? "Simulation ready" : "SIMULATION ENGINE READY"}</Text>
          <Text style={styles.emptySubtitle}>
            {isNormal
              ? "Pick a simple scenario and run it to see how this investor style might have behaved."
              : "Configure parameters and press RUN SIMULATION to generate your persona-driven backtest."}
          </Text>
        </View>
      )}

      {running && (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={Colors.blue} />
          <Text style={[styles.emptyTitle, { marginTop: 16 }]}>
            {isNormal ? "Running your scenario..." : "RUNNING SIMULATION..."}
          </Text>
          <Text style={styles.emptySubtitle}>
            {isNormal
              ? "We're comparing your investor style against past market moves."
              : "Backtesting your investor persona across historical market data."}
          </Text>
        </View>
      )}

      {!!error && !running && (
        <View style={styles.errorState}>
          <Text style={styles.errorIcon}>⚠</Text>
          <Text style={styles.errorTitle}>{isNormal ? "Simulation could not run" : "SIMULATION FAILED"}</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRun}>
            <Text style={styles.retryText}>RETRY</Text>
          </TouchableOpacity>
        </View>
      )}

      {result && !running && (
        <>
          {isNormal ? (
            <View style={[styles.metricsStrip, { marginBottom: 6 }]}>
              <MetricCard
                label="What happened"
                value={result.metrics.total_return >= 0 ? "📈 Money grew" : "📉 Money fell"}
                color={result.metrics.total_return >= 0 ? colors.green : colors.red}
              />
              <MetricCard
                label="Risk feel"
                value={result.metrics.max_drawdown > -0.2 ? "🙂 Manageable" : result.metrics.max_drawdown > -0.35 ? "😬 Bumpy" : "😵 Wild"}
                color={result.metrics.max_drawdown > -0.2 ? colors.green : result.metrics.max_drawdown > -0.35 ? colors.amber : colors.red}
              />
              <MetricCard
                label="Quick read"
                value={result.metrics.sharpe_ratio >= 1 ? "Balanced" : "Needs work"}
                color={result.metrics.sharpe_ratio >= 1 ? colors.blue : colors.textBright}
              />
            </View>
          ) : null}
          {/* Metrics strip */}
          <SectionLabel text={isNormal ? "📊 Easy Summary" : "PERFORMANCE METRICS"} />
          <View style={styles.metricsStrip}>
            <MetricCard
              label="TOTAL RETURN"
              value={fmtPct(result.metrics.total_return)}
              color={result.metrics.total_return >= 0 ? Colors.green : Colors.red}
            />
            <MetricCard
              label="ANN. RETURN"
              value={fmtPctPerYear(result.metrics.annualized_return)}
              color={
                result.metrics.annualized_return >= 0 ? Colors.green : Colors.red
              }
            />
            <MetricCard
              label="MAX DRAWDOWN"
              value={fmtPct(result.metrics.max_drawdown, false)}
              color={Colors.red}
            />
            <MetricCard
              label="SHARPE"
              value={result.metrics.sharpe_ratio.toFixed(2)}
              color={
                result.metrics.sharpe_ratio >= 1
                  ? Colors.green
                  : result.metrics.sharpe_ratio >= 0
                  ? Colors.amber
                  : Colors.red
              }
            />
            <MetricCard
              label="VOLATILITY"
              value={fmtPctPerYear(result.metrics.volatility)}
              color={Colors.amber}
            />
          </View>

          {/* Secondary metrics */}
          <View style={[styles.metricsStrip, { marginTop: 6 }]}>
            <MetricCard
              label="BEST MONTH"
              value={fmtPct(result.metrics.best_month)}
              color={Colors.green}
            />
            <MetricCard
              label="WORST MONTH"
              value={fmtPct(result.metrics.worst_month)}
              color={Colors.red}
            />
            <MetricCard
              label="TOTAL TRADES"
              value={String(result.metrics.total_trades)}
              color={Colors.textBright}
            />
          </View>

          <Divider />

          {/* Line Chart */}
          <SectionLabel text={isNormal ? "📈 Money Over Time" : "PORTFOLIO PERFORMANCE"} />
          <View
            style={[
              styles.chartContainer,
              { width: chartWidth, height: 280 },
            ]}
          >
            <LineChart
              data={result.portfolio_history.map((p) => ({
                date: p.date,
                value: p.value,
              }))}
              benchmarkData={result.benchmark_history.map((p) => ({
                date: p.date,
                value: p.value,
              }))}
              events={result.events}
              width={chartWidth}
              height={280}
            />
          </View>

          <Divider />

          {/* Final Allocation Donut */}
          <SectionLabel text={isNormal ? "🧺 Where the Money Ended Up" : "FINAL ALLOCATION"} />
          <View style={styles.donutRow}>
            <AllocationDonut allocation={result.final_allocation} size={130} />
            <View style={styles.allocationList}>
              {Object.entries(result.final_allocation)
                .filter(([, v]) => v > 0.005)
                .sort(([, a], [, b]) => b - a)
                .map(([key, val]) => (
                  <View key={key} style={styles.allocationItem}>
                    <View
                      style={[
                        styles.allocationDot,
                        {
                          backgroundColor:
                            ASSET_COLORS[key as AssetClass] ?? Colors.blue,
                        },
                      ]}
                    />
                    <Text style={styles.allocationAsset}>
                      {ASSET_LABELS[key as AssetClass] ?? key.toUpperCase()}
                    </Text>
                    <Text style={styles.allocationPct}>
                      {(val * 100).toFixed(1)}%
                    </Text>
                  </View>
                ))}
            </View>
          </View>

          <Divider />

          {/* Trade Log */}
          <SectionLabel text={isNormal ? `📝 Decisions Made (${result.trades.length})` : `TRADE LOG · ${result.trades.length} DECISIONS`} />
          {result.trades.length === 0 ? (
            <Text style={styles.noTradesText}>
              No trades executed in this simulation period.
            </Text>
          ) : (
            result.trades.map((trade, i) => (
              <TradeLogItem
                key={`${trade.date}-${trade.asset}-${i}`}
                trade={trade}
              />
            ))
          )}
        </>
      )}
    </ScrollView>
  );

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, isNormal && { backgroundColor: colors.bgPanel, borderBottomColor: colors.borderDim }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerBrand}>CARDECON</Text>
          <View style={styles.headerSeparator} />
          <Text style={styles.headerTitle}>{isNormal ? "🧪 Try a Simulation" : "SIMULATION ENGINE"}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.statusDot, { backgroundColor: Colors.green }]} />
          <LiveClock />
        </View>
      </View>

      {/* Body */}
      {isWide ? (
        <View style={styles.wideBody}>
          {personaPanel}
          <View style={styles.panelDivider} />
          {resultsPanel}
        </View>
      ) : (
        <ScrollView style={styles.narrowBody} showsVerticalScrollIndicator={false}>
          {personaPanel}
          <View style={{ height: 1, backgroundColor: colors.borderFaint, marginVertical: 12 }} />
          {resultsPanel}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Infer persona label from vector ─────────────────────────────────────────

function inferPersonaType(vec: number[]): string {
  const risk = vec[0] ?? 0.5;
  const patience = vec[5] ?? 0.5;
  const overconf = vec[3] ?? 0.5;
  const recency = vec[2] ?? 0.5;
  const divers = vec[4] ?? 0.5;

  if (risk > 0.75 && overconf > 0.65) return "Overconfident Bull";
  if (risk > 0.7 && patience < 0.4) return "Aggressive Momentum Trader";
  if (risk < 0.35 && patience > 0.6) return "Conservative Strategist";
  if (recency > 0.7 && patience < 0.35) return "FOMO Chaser";
  if (divers > 0.6 && Math.abs(risk - 0.5) < 0.2) return "Balanced Diversifier";
  return "Adaptive Investor";
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },

  // Header
  header: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDim ?? Colors.borderFaint,
    backgroundColor: Colors.bgPanel,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerBrand: {
    fontSize: 13,
    fontFamily: Fonts.mono,
    color: Colors.blue,
    letterSpacing: 2,
    fontWeight: "700",
  },
  headerSeparator: {
    width: 1,
    height: 16,
    backgroundColor: Colors.borderDim ?? Colors.borderFaint,
  },
  headerTitle: {
    fontSize: 11,
    fontFamily: Fonts.mono,
    color: Colors.textDim,
    letterSpacing: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Layout
  wideBody: {
    flex: 1,
    flexDirection: "row",
  },
  narrowBody: {
    flex: 1,
  },
  panelDivider: {
    width: 1,
    backgroundColor: Colors.borderFaint,
  },

  // Persona panel
  personaPanel: {
    backgroundColor: Colors.bgPanel,
    padding: 16,
    borderRightWidth: 1,
    borderRightColor: Colors.borderFaint,
  },
  personaTypeRow: {
    marginBottom: 4,
  },
  personaTypeBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  traitInterpretation: {
    fontSize: 9,
    fontFamily: Fonts.sans,
    color: Colors.textDim,
    lineHeight: 14,
    marginTop: 8,
    fontStyle: "italic",
  },
  personaTypeText: {
    fontSize: 10,
    fontFamily: Fonts.mono,
    letterSpacing: 0.5,
  },

  // Config
  configRow: {
    flexDirection: "row",
    gap: 8,
  },
  configField: {
    flex: 1,
    gap: 3,
  },
  configLabel: {
    fontSize: 8,
    fontFamily: Fonts.mono,
    color: Colors.textDim,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  configInput: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.borderDim ?? Colors.borderFaint,
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    fontFamily: Fonts.mono,
    color: Colors.textBright,
  },
  assetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 6,
  },

  // Run button
  runButton: {
    marginTop: 16,
    backgroundColor: Colors.blue,
    borderRadius: 4,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  runButtonText: {
    fontSize: 11,
    fontFamily: Fonts.mono,
    color: Colors.textBright,
    letterSpacing: 2,
    fontWeight: "700",
  },

  // Results panel
  resultsScroll: {
    flex: 1,
  },
  resultsContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // Empty / loading states
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 32,
    color: Colors.borderDim ?? Colors.borderFaint,
  },
  emptyTitle: {
    fontSize: 12,
    fontFamily: Fonts.mono,
    color: Colors.textDim,
    letterSpacing: 2,
  },
  emptySubtitle: {
    fontSize: 11,
    fontFamily: Fonts.sans,
    color: Colors.textMuted,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 16,
  },

  // Error state
  errorState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 10,
  },
  errorIcon: {
    fontSize: 28,
    color: Colors.amber,
  },
  errorTitle: {
    fontSize: 12,
    fontFamily: Fonts.mono,
    color: Colors.amber,
    letterSpacing: 2,
  },
  errorText: {
    fontSize: 11,
    fontFamily: Fonts.mono,
    color: Colors.red,
    textAlign: "center",
    maxWidth: 320,
  },
  retryButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.blue,
    borderRadius: 3,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  retryText: {
    fontSize: 10,
    fontFamily: Fonts.mono,
    color: Colors.blue,
    letterSpacing: 2,
  },

  // Metrics
  metricsStrip: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },

  // Chart
  chartContainer: {
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.borderFaint,
  },

  // Allocation
  donutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    flexWrap: "wrap",
  },
  allocationList: {
    flex: 1,
    gap: 6,
    minWidth: 140,
  },
  allocationItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  allocationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  allocationAsset: {
    flex: 1,
    fontSize: 10,
    fontFamily: Fonts.mono,
    color: Colors.textBright,
    letterSpacing: 0.5,
  },
  allocationPct: {
    fontSize: 10,
    fontFamily: Fonts.mono,
    color: Colors.textDim,
  },

  // Trade log
  noTradesText: {
    fontSize: 11,
    fontFamily: Fonts.mono,
    color: Colors.textDim,
    paddingVertical: 16,
    textAlign: "center",
  },
});
