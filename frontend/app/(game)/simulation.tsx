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
  Modal,
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
import { useTranslation } from "react-i18next";
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
import { useRouter } from "expo-router";
import { useThemeStore } from "../../store/themeStore";
import { ThemeModeToggle } from "../../components/theme/ThemeModeToggle";

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
  const colors = useColors();
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
          ? colors.green
          : ev.impact === "negative"
          ? colors.red
          : colors.amber,
    }));

  // Last point tip
  const lastPt = portfolioPoints[portfolioPoints.length - 1];
  const lastVal = data[data.length - 1]?.value;

  const chartBottom = PAD_TOP + chartH;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.blue} stopOpacity="0.25" />
          <Stop offset="1" stopColor={colors.blue} stopOpacity="0.02" />
        </LinearGradient>
      </Defs>

      {/* Chart background */}
      <Rect
        x={PAD_LEFT}
        y={PAD_TOP}
        width={chartW}
        height={chartH}
        fill={colors.bgPanel}
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
            stroke={colors.borderFaint}
            strokeWidth={1}
            strokeDasharray={i === 0 ? undefined : "3,4"}
          />
          <SvgText
            x={PAD_LEFT - 4}
            y={gl.y + 4}
            fontSize={8}
            fontFamily={Fonts.mono}
            fill={colors.textDim}
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
          fill={colors.textDim}
          textAnchor="middle"
        >
          {yr.year}
        </SvgText>
      ))}

      {/* Benchmark area (subtle) */}
      {benchmarkPoints.length > 1 && (
        <Path
          d={buildAreaPath(benchmarkPoints, chartBottom)}
          fill={colors.textMuted}
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
          stroke={colors.textDim}
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
          stroke={colors.blue}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Rightmost value tip */}
      {lastPt && lastVal !== undefined && (
        <G>
          <Circle cx={lastPt.x} cy={lastPt.y} r={3.5} fill={colors.blue} />
          <Rect
            x={lastPt.x - 2}
            y={lastPt.y - 18}
            width={60}
            height={14}
            fill={colors.bgCard ?? colors.bgPanel}
            rx={2}
            opacity={0.9}
          />
          <SvgText
            x={lastPt.x + 28}
            y={lastPt.y - 7}
            fontSize={9}
            fontFamily={Fonts.mono}
            fill={colors.textBright}
            textAnchor="middle"
          >
            {fmtCurrency(lastVal)}
          </SvgText>
        </G>
      )}

      {/* Legend */}
      <G>
        <Rect x={PAD_LEFT + 8} y={PAD_TOP + 6} width={20} height={2} fill={colors.blue} rx={1} />
        <SvgText
          x={PAD_LEFT + 32}
          y={PAD_TOP + 9}
          fontSize={8}
          fontFamily={Fonts.mono}
          fill={colors.textBright}
        >
          PORTFOLIO
        </SvgText>
        <Rect
          x={PAD_LEFT + 90}
          y={PAD_TOP + 6}
          width={20}
          height={1.5}
          fill={colors.textDim}
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
  barColor?: string;
}

function TraitBar({ label, value, barColor: customBarColor }: TraitBarProps) {
  const colors = useColors();
  const isNormal = useThemeStore((state) => state.mode === "normal");
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

  // Use custom color if provided, otherwise interpolate from dim blue to bright blue based on value
  const barColor =
    customBarColor ||
    (value >= 0.7 ? colors.blue : value >= 0.4 ? colors.blueLight : colors.blueDim);

  return (
    <View style={[traitStyles.row, isNormal && traitStyles.rowNormal]}>
      <Text style={[traitStyles.label, { color: colors.textDim }, isNormal && traitStyles.labelNormal]}>
        {isNormal ? label : label.toUpperCase()}
      </Text>
      <View style={[traitStyles.track, { backgroundColor: colors.bgCard ?? colors.bgPanel, borderColor: colors.borderFaint }, isNormal && traitStyles.trackNormal]}>
        <Animated.View
          style={[traitStyles.fill, fillStyle, { backgroundColor: barColor }]}
        />
      </View>
      <Text style={[traitStyles.value, { color: colors.textBright }]}>{Math.round(value * 100)}</Text>
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
  rowNormal: {
    gap: 10,
    marginBottom: 0,
    alignItems: "center",
  },
  label: {
    width: 88,
    fontSize: 8,
    fontFamily: Fonts.mono,
    color: Colors.textDim,
    letterSpacing: 0.8,
  },
  labelNormal: {
    width: "auto",
    fontSize: 12,
    fontFamily: Fonts.sans,
    letterSpacing: 0,
    fontWeight: "500",
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
  trackNormal: {
    height: 8,
    borderRadius: 4,
    borderWidth: 0,
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

// ─── Simple Allocation Bar ────────────────────────────────────────────────────

interface SimpleAllocationBarProps {
  allocation: Record<string, number>;
}

function SimpleAllocationBar({ allocation }: SimpleAllocationBarProps) {
  const { t } = useTranslation();
  const colors = useColors();

  const entries = Object.entries(allocation)
    .filter(([, v]) => v > 0.01)
    .sort(([, a], [, b]) => b - a);

  const total = entries.reduce((s, [, v]) => s + v, 0) || 1;

  // Calculate diversification score (how many asset classes)
  const diversificationScore = entries.length;

  return (
    <View style={simpleAllocStyles.container}>
      {/* Title */}
      <Text style={[simpleAllocStyles.title, { color: colors.textBright }]}>
        {t("simulation.allocation.title")}
      </Text>

      {/* Bar visualization */}
      <View style={[simpleAllocStyles.bar, { backgroundColor: colors.bgCard, borderColor: colors.borderDim }]}>
        {entries.map(([key, val]) => {
          const percentage = (val / total) * 100;
          const color = ASSET_COLORS[key as AssetClass] ?? colors.blue;
          return (
            <View
              key={key}
              style={[
                simpleAllocStyles.segment,
                {
                  width: `${percentage}%`,
                  backgroundColor: color,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Legend */}
      <View style={simpleAllocStyles.legend}>
        {entries.map(([key, val]) => {
          const percentage = (val / total) * 100;
          const color = ASSET_COLORS[key as AssetClass] ?? colors.blue;
          return (
            <View key={key} style={simpleAllocStyles.legendItem}>
              <View style={[simpleAllocStyles.legendDot, { backgroundColor: color }]} />
              <Text style={[simpleAllocStyles.legendLabel, { color: colors.textBright }]}>
                {ASSET_LABELS[key as AssetClass] ?? key.toUpperCase()}
              </Text>
              <Text style={[simpleAllocStyles.legendPct, { color: colors.textDim }]}>
                {percentage.toFixed(0)}%
              </Text>
            </View>
          );
        })}
      </View>

      {/* Explanation */}
      <View style={[simpleAllocStyles.explanation, { backgroundColor: colors.bgCard, borderColor: colors.borderDim }]}>
        <View style={simpleAllocStyles.explanationHeader}>
          <Text style={[simpleAllocStyles.explanationIcon]}>✓</Text>
          <Text style={[simpleAllocStyles.explanationTitle, { color: colors.textBright }]}>
            {t("simulation.allocation.goodDiversification")}
          </Text>
        </View>
        <Text style={[simpleAllocStyles.explanationText, { color: colors.textPrimary }]}>
          {t("simulation.allocation.explanation", { count: diversificationScore })}
        </Text>
      </View>
    </View>
  );
}

const simpleAllocStyles = StyleSheet.create({
  container: {
    gap: 10,
    marginBottom: 6,
  },
  title: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    color: Colors.textBright,
    fontWeight: "500",
  },
  bar: {
    height: 28,
    borderRadius: 8,
    overflow: "hidden",
    flexDirection: "row",
    borderWidth: 1,
    borderColor: Colors.borderDim,
  },
  segment: {
    height: "100%",
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    color: Colors.textBright,
  },
  legendPct: {
    fontSize: 11,
    fontFamily: Fonts.mono,
    color: Colors.textDim,
  },
  explanation: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderDim,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  explanationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  explanationIcon: {
    fontSize: 14,
    color: Colors.green,
    fontWeight: "600",
  },
  explanationTitle: {
    fontSize: 13,
    fontFamily: Fonts.sansBold,
    color: Colors.textBright,
    fontWeight: "600",
  },
  explanationText: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    color: Colors.textPrimary,
    lineHeight: 17,
  },
});

// ─── Allocation Donut ─────────────────────────────────────────────────────────

interface AllocationDonutProps {
  allocation: Record<string, number>;
  size?: number;
}

function AllocationDonut({ allocation, size = 120 }: AllocationDonutProps) {
  const { t } = useTranslation();
  const colors = useColors();
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
      ASSET_COLORS[key as AssetClass] ?? colors.blue;
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
          stroke={colors.borderFaint}
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
        <Circle cx={cx} cy={cy} r={r * 0.52} fill={colors.bgPanel} />
        <SvgText
          x={cx}
          y={cy - 4}
          fontSize={9}
          fontFamily={Fonts.mono}
          fill={colors.textDim}
          textAnchor="middle"
        >
          {t("simulation.allocation.allocShort")}
        </SvgText>
        <SvgText
          x={cx}
          y={cy + 10}
          fontSize={8}
          fontFamily={Fonts.mono}
          fill={colors.textDim}
          textAnchor="middle"
        >
          {t("simulation.allocation.assetsCount", { count: entries.length })}
        </SvgText>
      </Svg>
      <View style={donutStyles.legend}>
        {segments.map((seg) => (
          <View key={seg.key} style={donutStyles.legendItem}>
            <View style={[donutStyles.dot, { backgroundColor: seg.color }]} />
            <Text style={[donutStyles.legendText, { color: colors.textDim }]}>
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
  const { t } = useTranslation();
  const colors = useColors();
  const isBuy = trade.action.toLowerCase().includes("buy");
  const actionColor = isBuy ? colors.green : colors.red;
  const actionLabel = isBuy ? t("simulation.trade.buy") : t("simulation.trade.sell");
  const weightDelta = trade.new_weight - trade.old_weight;

  return (
    <View style={[tradeStyles.container, { backgroundColor: colors.bgPanel, borderColor: colors.borderFaint }]}>
      <View style={tradeStyles.header}>
        <Text style={[tradeStyles.date, { color: colors.textDim }]}>{trade.date}</Text>
        <View style={[tradeStyles.actionBadge, { borderColor: actionColor }]}>
          <Text style={[tradeStyles.actionText, { color: actionColor }]}>
            {actionLabel}
          </Text>
        </View>
        <Text style={[tradeStyles.asset, { color: colors.textBright }]}>
          {ASSET_LABELS[trade.asset as AssetClass] ?? trade.asset.toUpperCase()}
        </Text>
      </View>
      <Text style={[tradeStyles.reason, { color: colors.textBright }]}>{trade.reason}</Text>
      <View style={tradeStyles.footer}>
        <View style={[tradeStyles.traitPill, { backgroundColor: colors.bgCard ?? colors.bgPanel, borderColor: colors.borderDim ?? colors.borderFaint }]}>
          <Text style={[tradeStyles.traitText, { color: colors.blue }]}>
            {trade.trigger_trait} · {(trade.trait_value * 100).toFixed(0)}
          </Text>
        </View>
        {capital !== undefined && (
          <Text style={[tradeStyles.capital, { color: colors.textDim }]}>
            {fmtCurrency(capital)}{" "}
            <Text
              style={{
                color: weightDelta >= 0 ? colors.green : colors.red,
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
  const colors = useColors();
  return (
    <View style={[metricStyles.card, { backgroundColor: colors.bgPanel, borderColor: colors.borderFaint }]}>
      <Text style={[metricStyles.label, { color: colors.textDim }]}>{label}</Text>
      <Text style={[metricStyles.value, { color: color ?? colors.textBright }]}>
        {value}
      </Text>
    </View>
  );
}

interface SimpleMetricCardProps extends MetricCardProps {
  hint?: string;
}

function SimpleMetricCard({ label, value, color, hint }: SimpleMetricCardProps) {
  const colors = useColors();
  return (
    <View style={[metricStyles.card, { backgroundColor: colors.bgPanel, borderColor: colors.borderDim, borderRadius: 12 }]}>
      <Text style={[metricStyles.label, { color: colors.textDim, fontSize: 12 }]}>{label}</Text>
      <Text style={[metricStyles.value, { color: color ?? colors.textBright }]}>
        {value}
      </Text>
      {hint && (
        <Text style={{ fontSize: 11, fontFamily: Fonts.sans, color: colors.textMuted, lineHeight: 15, marginTop: 4 }}>
          {hint}
        </Text>
      )}
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

// ─── Year Picker Component ────────────────────────────────────────────────────

interface YearPickerProps {
  value: string;
  onSelect: (year: string) => void;
  minYear?: number;
  maxYear?: number;
  label: string;
}

function YearPicker({ value, onSelect, minYear = 2000, maxYear = 2030, label }: YearPickerProps) {
  const colors = useColors();
  const isNormal = useThemeStore((state) => state.mode === "normal");
  const [showPicker, setShowPicker] = useState(false);

  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => (minYear + i).toString());

  return (
    <>
      <TouchableOpacity
        style={[
          yearPickerStyles.trigger,
          {
            backgroundColor: isNormal ? colors.bgCard : Colors.bg,
            borderColor: isNormal ? colors.borderDim : Colors.borderDim,
          },
        ]}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.7}
      >
        <Text style={[yearPickerStyles.triggerText, { color: colors.textBright }]}>
          {value}
        </Text>
        <Text style={[yearPickerStyles.triggerArrow, { color: colors.textDim }]}>▼</Text>
      </TouchableOpacity>

      <Modal visible={showPicker} transparent animationType="fade">
        <TouchableOpacity
          style={yearPickerStyles.modalOverlay}
          onPress={() => setShowPicker(false)}
          activeOpacity={1}
        >
          <View
            style={[
              yearPickerStyles.modalContent,
              {
                backgroundColor: colors.bgPanel,
                borderColor: colors.borderFaint,
              },
            ]}
          >
            <Text style={[yearPickerStyles.modalTitle, { color: colors.textBright }]}>
              Select {label}
            </Text>
            <ScrollView style={yearPickerStyles.yearList}>
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    yearPickerStyles.yearItem,
                    value === year && { backgroundColor: colors.blue },
                  ]}
                  onPress={() => {
                    onSelect(year);
                    setShowPicker(false);
                  }}
                  activeOpacity={0.6}
                >
                  <Text
                    style={[
                      yearPickerStyles.yearItemText,
                      { color: value === year ? colors.bgPanel : colors.textBright },
                    ]}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const yearPickerStyles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  triggerText: {
    fontSize: 14,
    fontFamily: Fonts.sans,
    fontWeight: "500",
  },
  triggerArrow: {
    fontSize: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    borderRadius: 12,
    maxHeight: 400,
    width: "80%",
    borderWidth: 1,
    overflow: "hidden",
  },
  modalTitle: {
    fontSize: 14,
    fontFamily: Fonts.sansBold,
    fontWeight: "600",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderFaint,
  },
  yearList: {
    maxHeight: 320,
  },
  yearItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderFaint,
  },
  yearItemText: {
    fontSize: 14,
    fontFamily: Fonts.sans,
    textAlign: "center",
  },
});

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
  const { t } = useTranslation();
  const colors = useColors();
  const isNormal = useThemeStore((state) => state.mode === "normal");
  const { width } = useWindowDimensions();
  const isWide = width >= 1024;

  const { portfolio } = usePortfolioStore();
  const personaVector: number[] =
    (portfolio as any)?.persona_vector ?? DEFAULT_TRAITS;

  const [traitMap, setTraitMap] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    api.get("/api/hud/traits").then((r) => {
      setTraitMap(r.data.traits);
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
      setError(e?.response?.data?.detail ?? e?.message ?? t("simulation.errors.failed"));
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
        isNormal && { backgroundColor: colors.bgPanel },
      ]}
    >
      {/* Persona type */}
      <SectionLabel text={t("simulation.persona.title")} />
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

      <View style={{ marginTop: 14, gap: 10 }}>
        {TRAIT_NAMES.map((name, i) => (
          <TraitBar
            key={name}
            label={name}
            value={traitValues[i]}
            barColor={personaColor(inferredPersona)}
          />
        ))}
      </View>

      <Divider />

      <View style={styles.configRow}>
        <View style={styles.configField}>
          <Text style={styles.configLabel}>{t("simulation.form.start")}</Text>
          <YearPicker
            value={startYear}
            onSelect={setStartYear}
            minYear={2000}
            maxYear={2030}
            label={t("simulation.form.startYear")}
          />
        </View>
        <View style={styles.configField}>
          <Text style={styles.configLabel}>{t("simulation.form.end")}</Text>
          <YearPicker
            value={endYear}
            onSelect={setEndYear}
            minYear={2000}
            maxYear={2030}
            label={t("simulation.form.endYear")}
          />
        </View>
      </View>

      <View style={[styles.configField, { marginTop: 8 }]}>
        <Text style={styles.configLabel}>{t("simulation.form.initialCapital")}</Text>
        <TextInput
          style={[styles.configInput, isNormal && { backgroundColor: colors.bgCard, color: colors.textBright, borderColor: colors.borderDim }]}
          value={capital}
          onChangeText={setCapital}
          keyboardType="numeric"
          selectTextOnFocus
        />
      </View>

      <View style={{ marginTop: 12 }}>
        <Text style={styles.configLabel}>{t("simulation.form.assetClasses")}</Text>
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
          <Text style={styles.runButtonText}>{isNormal ? t("simulation.cta.run") : t("simulation.cta.runPro")}</Text>
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
          <Text style={styles.emptyTitle}>{isNormal ? t("simulation.ready.title") : t("simulation.ready.titlePro")}</Text>
          <Text style={styles.emptySubtitle}>
            {isNormal
              ? t("simulation.ready.body")
              : t("simulation.ready.bodyPro")}
          </Text>
        </View>
      )}

      {running && (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={Colors.blue} />
          <Text style={[styles.emptyTitle, { marginTop: 16 }]}>
            {isNormal ? t("simulation.running.title") : t("simulation.running.titlePro")}
          </Text>
          <Text style={styles.emptySubtitle}>
            {isNormal
              ? t("simulation.running.body")
              : t("simulation.running.bodyPro")}
          </Text>
        </View>
      )}

      {!!error && !running && (
        <View style={styles.errorState}>
          <Text style={styles.errorIcon}>⚠</Text>
          <Text style={styles.errorTitle}>{isNormal ? t("simulation.errorState.title") : t("simulation.errorState.titlePro")}</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRun}>
            <Text style={styles.retryText}>{t("simulation.errorState.retry")}</Text>
          </TouchableOpacity>
        </View>
      )}

      {result && !running && (
        <>
          {isNormal ? (
            <View style={[styles.normalHelperCard, { backgroundColor: colors.bgPanel, borderColor: colors.borderDim }]}>
              <Text style={[styles.normalHelperTitle, { color: colors.textBright }]}>{t("simulation.helper.title")}</Text>
              <Text style={[styles.normalHelperBody, { color: colors.textPrimary }]}>
                {t("simulation.helper.body")}
              </Text>
            </View>
          ) : null}
          {isNormal ? (
            <View style={[styles.metricsStrip, { marginBottom: 6 }]}>
              <MetricCard
                label={t("simulation.quick.whatHappened")}
                value={result.metrics.total_return >= 0 ? t("simulation.quick.moneyGrew") : t("simulation.quick.moneyFell")}
                color={result.metrics.total_return >= 0 ? colors.green : colors.red}
              />
              <MetricCard
                label={t("simulation.quick.riskFeel")}
                value={result.metrics.max_drawdown > -0.2 ? t("simulation.quick.riskManageable") : result.metrics.max_drawdown > -0.35 ? t("simulation.quick.riskBumpy") : t("simulation.quick.riskWild")}
                color={result.metrics.max_drawdown > -0.2 ? colors.green : result.metrics.max_drawdown > -0.35 ? colors.amber : colors.red}
              />
              <MetricCard
                label={t("simulation.quick.quickRead")}
                value={result.metrics.sharpe_ratio >= 1 ? t("simulation.quick.balanced") : t("simulation.quick.needsWork")}
                color={result.metrics.sharpe_ratio >= 1 ? colors.blue : colors.textBright}
              />
            </View>
          ) : null}
          {/* Metrics strip */}
          <SectionLabel text={isNormal ? t("simulation.metrics.title") : t("simulation.metrics.titlePro")} />
          {isNormal ? (
            <View style={styles.metricsStrip}>
              <SimpleMetricCard
                label={t("simulation.metrics.totalGain")}
                value={fmtPct(result.metrics.total_return)}
                color={result.metrics.total_return >= 0 ? colors.green : colors.red}
                hint={t("simulation.metrics.totalGainHint")}
              />
              <SimpleMetricCard
                label={t("simulation.metrics.yearlyAverage")}
                value={fmtPctPerYear(result.metrics.annualized_return)}
                color={result.metrics.annualized_return >= 0 ? colors.green : colors.red}
                hint={t("simulation.metrics.yearlyAverageHint")}
              />
              <SimpleMetricCard
                label={t("simulation.metrics.biggestDip")}
                value={fmtPct(result.metrics.max_drawdown, false)}
                color={colors.red}
                hint={t("simulation.metrics.biggestDipHint")}
              />
              <SimpleMetricCard
                label={t("simulation.metrics.qualityScore")}
                value={result.metrics.sharpe_ratio.toFixed(2)}
                color={
                  result.metrics.sharpe_ratio >= 1
                    ? colors.green
                    : result.metrics.sharpe_ratio >= 0
                    ? colors.amber
                    : colors.red
                }
                hint={t("simulation.metrics.qualityScoreHint")}
              />
            </View>
          ) : (
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
          )}

          {!isNormal && (
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
          )}

          {isNormal && (
            <>
              <Divider />
              <SectionLabel text={t("simulation.metrics.whatsInside")} />
              <SimpleAllocationBar allocation={result.final_allocation} />
            </>
          )}

          <Divider />

          {/* Line Chart */}
          <SectionLabel text={isNormal ? t("simulation.chart.title") : t("simulation.chart.titlePro")} />
          <View
            style={[
              styles.chartContainer,
              { width: chartWidth, height: 280 },
              isNormal && { borderColor: colors.borderDim, backgroundColor: colors.bgPanel },
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

          {/* Final Allocation Donut - Pro mode only */}
          {!isNormal && (
            <>
              <SectionLabel text={t("simulation.finalAllocation")} />
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
            </>
          )}

          {/* Trade Log */}
          <SectionLabel text={isNormal ? t("simulation.trade.title", { count: result.trades.length }) : t("simulation.trade.titlePro", { count: result.trades.length })} />
          {result.trades.length === 0 ? (
            <Text style={styles.noTradesText}>
              {t("simulation.trade.none")}
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
    <View style={[styles.screen, isNormal && { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, isNormal && { backgroundColor: colors.bgPanel, borderBottomColor: colors.borderDim }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerBrand}>CARDECON</Text>
          <View style={styles.headerSeparator} />
          <Text style={styles.headerTitle}>{isNormal ? t("simulation.header.title") : t("simulation.header.titlePro")}</Text>
        </View>
        <View style={styles.headerRight}>
          <ThemeModeToggle compact />
          <View style={[styles.statusDot, { backgroundColor: Colors.green }]} />
          <LiveClock />
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[styles.backBtnText, { color: colors.textDim }]}>BACK</Text>
          </TouchableOpacity>
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
  backBtn: {
    borderWidth: 1,
    borderColor: Colors.borderDim,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 2,
  },
  backBtnText: {
    fontSize: 10,
    fontFamily: Fonts.sansBold,
    letterSpacing: 1.2,
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
  normalHelperCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  normalHelperTitle: {
    fontSize: 14,
    fontFamily: Fonts.sansBold,
    marginBottom: 6,
  },
  normalHelperBody: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    lineHeight: 18,
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
