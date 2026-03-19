import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, Line, Text as SvgText, Path } from "react-native-svg";
import { Colors } from "../constants/colors";
import { Fonts } from "../constants/fonts";
import type { PersonaSnapshotData } from "../services/persona";

interface Props {
  snapshots: PersonaSnapshotData[];
  varianceExplained: number[];
  size?: number;
}

export function PCAMap({ snapshots, varianceExplained, size = 300 }: Props) {
  const pad = 32;
  const plotSize = size - pad * 2;

  // Filter snapshots with valid PCA coords
  const valid = snapshots.filter((s) => s.pca_x != null && s.pca_y != null);

  if (valid.length === 0) {
    return (
      <View style={[styles.empty, { width: size, height: size }]}>
        <Text style={styles.emptyText}>NO TRAJECTORY DATA YET</Text>
        <Text style={styles.emptySubText}>Play 10 cards to record first snapshot</Text>
      </View>
    );
  }

  // Compute bounds
  const xs = valid.map((s) => s.pca_x!);
  const ys = valid.map((s) => s.pca_y!);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const toSvg = (x: number, y: number) => ({
    svgX: pad + ((x - minX) / rangeX) * plotSize,
    svgY: pad + plotSize - ((y - minY) / rangeY) * plotSize,
  });

  // Build path for the trajectory line
  let pathD = "";
  valid.forEach((s, i) => {
    const { svgX, svgY } = toSvg(s.pca_x!, s.pca_y!);
    pathD += i === 0 ? `M ${svgX} ${svgY}` : ` L ${svgX} ${svgY}`;
  });

  const pc1Var = varianceExplained[0] ? (varianceExplained[0] * 100).toFixed(1) : "?";
  const pc2Var = varianceExplained[1] ? (varianceExplained[1] * 100).toFixed(1) : "?";

  return (
    <View>
      <Svg width={size} height={size}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((t) => (
          <React.Fragment key={t}>
            <Line
              x1={pad} y1={pad + t * plotSize}
              x2={pad + plotSize} y2={pad + t * plotSize}
              stroke={Colors.borderFaint} strokeWidth={1}
            />
            <Line
              x1={pad + t * plotSize} y1={pad}
              x2={pad + t * plotSize} y2={pad + plotSize}
              stroke={Colors.borderFaint} strokeWidth={1}
            />
          </React.Fragment>
        ))}

        {/* Axes */}
        <Line x1={pad} y1={pad + plotSize / 2} x2={pad + plotSize} y2={pad + plotSize / 2}
          stroke={Colors.borderDim} strokeWidth={1} />
        <Line x1={pad + plotSize / 2} y1={pad} x2={pad + plotSize / 2} y2={pad + plotSize}
          stroke={Colors.borderDim} strokeWidth={1} />

        {/* Trajectory path */}
        {valid.length > 1 && (
          <Path d={pathD} stroke={Colors.blue + "55"} strokeWidth={1.5} fill="none" />
        )}

        {/* Snapshot dots */}
        {valid.map((s, i) => {
          const { svgX, svgY } = toSvg(s.pca_x!, s.pca_y!);
          const isLast = i === valid.length - 1;
          const ratio = valid.length > 1 ? i / (valid.length - 1) : 0.5;
          // Color interpolation: blue → teal → green
          const dotColor = isLast ? Colors.green : Colors.blue;
          return (
            <React.Fragment key={s.id}>
              <Circle
                cx={svgX} cy={svgY}
                r={isLast ? 6 : 3.5}
                fill={dotColor}
                opacity={0.4 + ratio * 0.6}
              />
              {isLast && (
                <Circle cx={svgX} cy={svgY} r={9}
                  fill="none" stroke={Colors.green} strokeWidth={1} opacity={0.5} />
              )}
            </React.Fragment>
          );
        })}

        {/* Axis labels */}
        <SvgText
          x={pad + plotSize / 2} y={size - 4}
          fill={Colors.textMuted} fontSize={8} textAnchor="middle"
          fontFamily={Fonts.sansBold}
        >
          PC1 ({pc1Var}%)
        </SvgText>
        <SvgText
          x={8} y={pad + plotSize / 2}
          fill={Colors.textMuted} fontSize={8} textAnchor="middle"
          fontFamily={Fonts.sansBold}
          transform={`rotate(-90 8 ${pad + plotSize / 2})`}
        >
          PC2 ({pc2Var}%)
        </SvgText>
      </Svg>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.blue }]} />
          <Text style={styles.legendText}>PAST</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.green }]} />
          <Text style={styles.legendText}>CURRENT</Text>
        </View>
        <Text style={styles.legendNote}>{valid.length} snapshot{valid.length !== 1 ? "s" : ""}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: Colors.borderFaint, borderRadius: 2,
    borderStyle: "dashed",
  },
  emptyText: {
    fontSize: 10, fontFamily: Fonts.sansBold, color: Colors.textMuted, letterSpacing: 1.5,
  },
  emptySubText: {
    fontSize: 9, fontFamily: Fonts.mono, color: Colors.textMuted, marginTop: 6,
  },
  legend: {
    flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 1 },
  legendNote: { fontSize: 8, fontFamily: Fonts.mono, color: Colors.textMuted, marginLeft: "auto" as any },
});
