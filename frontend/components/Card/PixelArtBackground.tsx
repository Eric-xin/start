import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Rect } from "react-native-svg";

const GRID = 16;
const VARIANTS_PER_SUBJECT = 100;

type Subject =
  | "asset_allocation"
  | "bonds"
  | "compounding"
  | "consistency"
  | "dca"
  | "diversification"
  | "etfs"
  | "fomo"
  | "inflation"
  | "market_growth"
  | "market_timing"
  | "opportunity_cost"
  | "overtrading"
  | "panic_selling"
  | "rebalancing"
  | "risk_return"
  | "saving_vs_investing"
  | "stocks"
  | "time_horizon"
  | "volatility";

type Pixel = { x: number; y: number; shade: 0 | 1 | 2 };

interface Props {
  subject?: string;
  bandColor: string;
  seed: string | number;
}

function hashSeed(value: string | number): number {
  const text = String(value);
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

function lcg(seed: number) {
  let state = seed || 1;
  return () => {
    state = Math.imul(1664525, state) + 1013904223;
    return ((state >>> 0) % 1_000_000) / 1_000_000;
  };
}

function clamp(v: number, min = 0, max = 255) {
  return Math.max(min, Math.min(max, v));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "");
  const full = normalized.length === 3
    ? `${normalized[0]}${normalized[0]}${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}`
    : normalized;
  const int = parseInt(full, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function tint(hex: string, factor: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${clamp(r * factor)}, ${clamp(g * factor)}, ${clamp(b * factor)})`;
}

function normalizeSubject(subject?: string): Subject {
  const value = (subject || "").toLowerCase().trim() as Subject;
  const supported: Record<string, Subject> = {
    asset_allocation: "asset_allocation",
    bonds: "bonds",
    compounding: "compounding",
    consistency: "consistency",
    dca: "dca",
    diversification: "diversification",
    etfs: "etfs",
    fomo: "fomo",
    inflation: "inflation",
    market_growth: "market_growth",
    market_timing: "market_timing",
    opportunity_cost: "opportunity_cost",
    overtrading: "overtrading",
    panic_selling: "panic_selling",
    rebalancing: "rebalancing",
    risk_return: "risk_return",
    saving_vs_investing: "saving_vs_investing",
    stocks: "stocks",
    time_horizon: "time_horizon",
    volatility: "volatility",
  };
  return supported[value] ?? "stocks";
}

function addPixel(map: Map<string, Pixel>, x: number, y: number, shade: 0 | 1 | 2) {
  if (x < 0 || x >= GRID || y < 0 || y >= GRID) return;
  map.set(`${x},${y}`, { x, y, shade });
}

function addRect(map: Map<string, Pixel>, x: number, y: number, w: number, h: number, shade: 0 | 1 | 2) {
  for (let iy = 0; iy < h; iy += 1) {
    for (let ix = 0; ix < w; ix += 1) {
      addPixel(map, x + ix, y + iy, shade);
    }
  }
}

function addLine(map: Map<string, Pixel>, x0: number, y0: number, x1: number, y1: number, shade: 0 | 1 | 2) {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;

  while (true) {
    addPixel(map, x, y, shade);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

function buildSubjectPixels(subject: Subject, variant: number): Pixel[] {
  const map = new Map<string, Pixel>();
  const rand = lcg(variant + 1);
  const bias = variant % 3;

  switch (subject) {
    case "stocks":
      addRect(map, 2, 10, 2, 4, 1);
      addRect(map, 5, 8, 2, 6, 2);
      addRect(map, 8, 9, 2, 5, 1);
      addRect(map, 11, 6, 2, 8, 2);
      addLine(map, 2, 12, 13, 4 + bias, 2);
      break;
    case "bonds":
      addRect(map, 3, 4, 10, 8, 1);
      addLine(map, 3, 4, 8, 2, 2);
      addLine(map, 12, 4, 8, 2, 2);
      addLine(map, 5, 7, 10, 7, 2);
      addLine(map, 5, 9, 10, 9, 2);
      break;
    case "inflation":
      addRect(map, 4, 10, 8, 2, 1);
      addLine(map, 8, 11, 8, 4, 2);
      addLine(map, 8, 4, 6, 6, 2);
      addLine(map, 8, 4, 10, 6, 2);
      addRect(map, 6, 6, 4, 4, 1);
      break;
    case "etfs":
      addRect(map, 3, 8, 4, 4, 1);
      addRect(map, 7, 8, 4, 4, 2);
      addRect(map, 5, 4, 4, 4, 1);
      break;
    case "market_growth":
      addLine(map, 2, 12, 5, 10, 1);
      addLine(map, 5, 10, 7, 11, 1);
      addLine(map, 7, 11, 10, 7, 2);
      addLine(map, 10, 7, 13, 5, 2);
      addRect(map, 12, 4, 2, 2, 2);
      break;
    case "market_timing":
      addRect(map, 3, 3, 10, 10, 1);
      addLine(map, 8, 3, 8, 8, 2);
      addLine(map, 8, 8, 11, 8, 2);
      addRect(map, 7, 2, 2, 2, 2);
      break;
    case "volatility":
      addLine(map, 2, 10, 4, 5, 2);
      addLine(map, 4, 5, 7, 12, 2);
      addLine(map, 7, 12, 10, 6, 1);
      addLine(map, 10, 6, 13, 11, 1);
      break;
    case "risk_return":
      addRect(map, 2, 10, 5, 2, 1);
      addRect(map, 9, 6, 5, 2, 2);
      addLine(map, 5, 10, 9, 6, 2);
      break;
    case "saving_vs_investing":
      addRect(map, 2, 8, 5, 5, 1);
      addRect(map, 9, 5, 5, 8, 2);
      break;
    case "opportunity_cost":
      addRect(map, 3, 5, 4, 7, 1);
      addRect(map, 9, 5, 4, 7, 2);
      addLine(map, 7, 8, 9, 8, 2);
      break;
    case "asset_allocation":
      addRect(map, 3, 4, 10, 10, 1);
      addLine(map, 8, 4, 8, 14, 2);
      addLine(map, 3, 9, 13, 9, 2);
      break;
    case "diversification":
      addRect(map, 3, 4, 4, 4, 1);
      addRect(map, 9, 4, 4, 4, 2);
      addRect(map, 3, 10, 4, 4, 2);
      addRect(map, 9, 10, 4, 4, 1);
      break;
    case "compounding":
      addRect(map, 3, 10, 2, 3, 1);
      addRect(map, 6, 8, 2, 5, 1);
      addRect(map, 9, 6, 2, 7, 2);
      addRect(map, 12, 4, 2, 9, 2);
      break;
    case "time_horizon":
      addRect(map, 4, 4, 8, 8, 1);
      addLine(map, 8, 8, 8, 5, 2);
      addLine(map, 8, 8, 10, 9, 2);
      break;
    case "consistency":
      addRect(map, 3, 5, 2, 8, 1);
      addRect(map, 6, 5, 2, 8, 1);
      addRect(map, 9, 5, 2, 8, 1);
      addRect(map, 12, 5, 2, 8, 1);
      break;
    case "dca":
      addRect(map, 3, 5, 3, 3, 1);
      addRect(map, 7, 7, 3, 3, 1);
      addRect(map, 11, 9, 3, 3, 2);
      break;
    case "rebalancing":
      addRect(map, 3, 6, 4, 6, 1);
      addRect(map, 9, 6, 4, 6, 2);
      addLine(map, 7, 9, 9, 9, 2);
      addLine(map, 7, 9, 6, 8, 2);
      addLine(map, 9, 9, 10, 8, 2);
      break;
    case "fomo":
      addRect(map, 4, 5, 8, 8, 1);
      addRect(map, 6, 7, 4, 4, 2);
      addRect(map, 11, 4, 2, 2, 2);
      break;
    case "overtrading":
      addLine(map, 2, 6, 7, 6, 2);
      addLine(map, 7, 6, 6, 5, 2);
      addLine(map, 7, 6, 6, 7, 2);
      addLine(map, 13, 10, 8, 10, 1);
      addLine(map, 8, 10, 9, 9, 1);
      addLine(map, 8, 10, 9, 11, 1);
      addRect(map, 6, 7, 4, 3, 1);
      break;
    case "panic_selling":
      addLine(map, 2, 4, 13, 12, 2);
      addLine(map, 13, 12, 11, 12, 2);
      addLine(map, 13, 12, 13, 10, 2);
      addRect(map, 3, 3, 4, 3, 1);
      break;
    default:
      addRect(map, 4, 4, 8, 8, 1);
      break;
  }

  const mirrored = variant % 2 === 1;
  const sparkleCount = 5 + (variant % 6);
  const jitter = variant % 4 === 0 ? 1 : 0;

  const transformed = new Map<string, Pixel>();
  map.forEach((p) => {
    const x = mirrored ? GRID - 1 - p.x : p.x;
    const jx = x + (jitter ? (rand() > 0.5 ? 1 : 0) : 0);
    addPixel(transformed, jx, p.y, p.shade);
  });

  for (let i = 0; i < sparkleCount; i += 1) {
    addPixel(
      transformed,
      Math.floor(rand() * GRID),
      Math.floor(rand() * GRID),
      (1 + (i % 2)) as 1 | 2,
    );
  }

  return Array.from(transformed.values());
}

export function PixelArtBackground({ subject, bandColor, seed }: Props) {
  const normalized = normalizeSubject(subject);
  const subjectSeed = hashSeed(normalized);
  const variant = hashSeed(`${seed}:${normalized}`) % VARIANTS_PER_SUBJECT;

  const pixels = useMemo(
    () => buildSubjectPixels(normalized, variant + subjectSeed),
    [normalized, variant, subjectSeed],
  );

  const palette = useMemo(
    () => [
      tint(bandColor, 0.75),
      tint(bandColor, 0.95),
      tint(bandColor, 1.2),
    ],
    [bandColor],
  );

  return (
    <View pointerEvents="none" style={styles.wrap}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${GRID} ${GRID}`}>
        {Array.from({ length: GRID * GRID }).map((_, i) => {
          const x = i % GRID;
          const y = Math.floor(i / GRID);
          const alpha = (x + y) % 2 === 0 ? 0.07 : 0.03;
          return (
            <Rect
              key={`bg-${i}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill={rgba(bandColor, alpha)}
            />
          );
        })}

        {pixels.map((p, i) => (
          <Rect
            key={`px-${i}`}
            x={p.x}
            y={p.y}
            width={1}
            height={1}
            fill={palette[p.shade]}
            opacity={0.24 + p.shade * 0.08}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
  },
});
