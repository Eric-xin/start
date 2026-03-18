import React from "react";
import { StyleSheet } from "react-native";
import Svg, { Rect, Line } from "react-native-svg";

interface Props {
  width: number;
  height: number;
}

// Generate stable pseudo-random candles for visual
function generateCandles(count: number, w: number, h: number) {
  const candles = [];
  const spacing = w / count;
  let price = h * 0.5;

  for (let i = 0; i < count; i++) {
    const change = (Math.sin(i * 0.7) + Math.cos(i * 1.3)) * 20;
    const open = price;
    price += change;
    const close = price;
    const high = Math.max(open, close) + Math.abs(change) * 0.3;
    const low = Math.min(open, close) - Math.abs(change) * 0.3;
    const x = i * spacing + spacing / 2;
    candles.push({ x, open, close, high, low, bullish: close > open });
  }
  return candles;
}

export function CandlestickBackground({ width, height }: Props) {
  const candles = generateCandles(20, width, height);
  const barWidth = width / 20 * 0.6;

  return (
    <Svg
      width={width}
      height={height}
      style={styles.svg}
      pointerEvents="none"
    >
      {candles.map((c, i) => (
        <React.Fragment key={i}>
          <Line
            x1={c.x}
            y1={c.high}
            x2={c.x}
            y2={c.low}
            stroke={c.bullish ? "#2e7d32" : "#d32f2f"}
            strokeWidth={1}
          />
          <Rect
            x={c.x - barWidth / 2}
            y={Math.min(c.open, c.close)}
            width={barWidth}
            height={Math.max(2, Math.abs(c.close - c.open))}
            fill={c.bullish ? "#2e7d32" : "#d32f2f"}
          />
        </React.Fragment>
      ))}
    </Svg>
  );
}

const styles = StyleSheet.create({
  svg: {
    position: "absolute",
    opacity: 0.05,
  },
});
