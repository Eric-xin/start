import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";

interface Props {
  weights: Record<string, number>;
  size?: number;
}

const SLICE_COLORS = [
  Colors.bloombergBlue,
  Colors.terminalGreen,
  Colors.amber,
  Colors.cardBand.purple,
  Colors.cardBand.red,
];

const ASSET_LABELS: Record<string, string> = {
  stocks: "EQ",
  bonds: "FI",
  crypto: "CR",
  real_estate: "RE",
  cash: "CA",
};

function polarToXY(angle: number, r: number, cx: number, cy: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function PortfolioDonut({ weights, size = 120 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const strokeWidth = size * 0.15;
  const circumference = 2 * Math.PI * r;

  const entries = Object.entries(weights).filter(([, v]) => v > 0.01);
  const total = entries.reduce((s, [, v]) => s + v, 0) || 1;

  // Build arc segments via strokeDashoffset trick
  let cumulativeAngle = 0;
  const segments = entries.map(([key, val], i) => {
    const fraction = val / total;
    const dashArray = fraction * circumference;
    const offset = -cumulativeAngle * circumference;
    cumulativeAngle += fraction;
    return { key, fraction, dashArray, offset, color: SLICE_COLORS[i % SLICE_COLORS.length] };
  });

  const fallback = entries.length === 0;

  return (
    <View style={[styles.container, { width: size, height: size + 40 }]}>
      <Svg width={size} height={size}>
        {fallback ? (
          <Circle cx={cx} cy={cy} r={r} stroke="#333" strokeWidth={strokeWidth} fill="none" />
        ) : (
          segments.map((seg) => (
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
          ))
        )}
        {/* Inner circle for donut hole */}
        <Circle cx={cx} cy={cy} r={r * 0.55} fill={Colors.terminalDark} />
      </Svg>
      <View style={styles.legend}>
        {entries.slice(0, 3).map(([key], i) => (
          <View key={key} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: SLICE_COLORS[i] }]} />
            <Text style={styles.legendText}>{ASSET_LABELS[key] ?? key.slice(0, 2).toUpperCase()}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  legend: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  legendText: {
    fontSize: 8,
    fontFamily: Fonts.sansBold,
    color: Colors.textMuted,
  },
});
