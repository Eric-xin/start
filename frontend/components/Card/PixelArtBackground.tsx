import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Rect } from "react-native-svg";

const GRID = 16;
const RENDER_GRID = 28;
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
type CardMaterial = "standard" | "metal" | "glass" | "old";

interface Props {
  subject?: string;
  bandColor: string;
  seed: string | number;
  material?: CardMaterial;
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

function addCircle(map: Map<string, Pixel>, cx: number, cy: number, r: number, shade: 0 | 1 | 2) {
  for (let y = cy - r; y <= cy + r; y += 1) {
    for (let x = cx - r; x <= cx + r; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r * r) {
        addPixel(map, x, y, shade);
      }
    }
  }
}

function addRing(map: Map<string, Pixel>, cx: number, cy: number, r: number, shade: 0 | 1 | 2) {
  addCircle(map, cx, cy, r, shade);
  addCircle(map, cx, cy, Math.max(0, r - 1), 0);
}

function addCandles(map: Map<string, Pixel>, x: number, y: number, heights: number[]) {
  heights.forEach((h, i) => {
    const px = x + i * 3;
    addRect(map, px, y - h, 2, h, (i % 2 === 0 ? 1 : 2));
    addLine(map, px + 1, y - h - 1, px + 1, y + 1, 2);
  });
}

function addArrow(map: Map<string, Pixel>, x0: number, y0: number, x1: number, y1: number, shade: 0 | 1 | 2) {
  addLine(map, x0, y0, x1, y1, shade);
  const dx = x1 - x0;
  const dy = y1 - y0;
  const ax = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
  const ay = dy === 0 ? 0 : (dy > 0 ? 1 : -1);
  addLine(map, x1, y1, x1 - ax - ay, y1 - ay + ax, shade);
  addLine(map, x1, y1, x1 - ax + ay, y1 - ay - ax, shade);
}

function addClock(map: Map<string, Pixel>, cx: number, cy: number, phase: number) {
  addRing(map, cx, cy, 4, 1);
  addPixel(map, cx, cy, 2);
  const minute = phase % 4;
  const hour = (phase + 1) % 4;
  const minuteHands: Array<[number, number]> = [[0, -3], [3, 0], [0, 3], [-3, 0]];
  const hourHands: Array<[number, number]> = [[1, -2], [2, 1], [-1, 2], [-2, -1]];
  addLine(map, cx, cy, cx + minuteHands[minute][0], cy + minuteHands[minute][1], 2);
  addLine(map, cx, cy, cx + hourHands[hour][0], cy + hourHands[hour][1], 2);
}

function addShield(map: Map<string, Pixel>, x: number, y: number) {
  addRect(map, x, y, 6, 5, 1);
  addLine(map, x, y + 5, x + 2, y + 7, 2);
  addLine(map, x + 5, y + 5, x + 3, y + 7, 2);
  addLine(map, x + 2, y + 7, x + 3, y + 7, 2);
  addLine(map, x + 2, y + 1, x + 2, y + 5, 2);
  addLine(map, x + 3, y + 1, x + 3, y + 5, 2);
}

function addPie(map: Map<string, Pixel>, cx: number, cy: number, r: number, phase: number) {
  addCircle(map, cx, cy, r, 1);
  addLine(map, cx, cy, cx + r, cy, 2);
  if (phase % 2 === 0) {
    addLine(map, cx, cy, cx, cy - r, 2);
    addRect(map, cx, cy - r, r, r, 2);
  } else {
    addLine(map, cx, cy, cx - r, cy, 2);
    addRect(map, cx - r, cy, r, r, 2);
  }
}

function addDollar(map: Map<string, Pixel>, x: number, y: number) {
  addLine(map, x + 1, y, x + 1, y + 8, 2);
  addRect(map, x, y + 1, 3, 2, 1);
  addRect(map, x, y + 5, 3, 2, 1);
  addPixel(map, x + 2, y + 3, 2);
  addPixel(map, x, y + 4, 2);
}

function addScales(map: Map<string, Pixel>, x: number, y: number) {
  addLine(map, x + 4, y, x + 4, y + 8, 2);
  addLine(map, x + 1, y + 2, x + 7, y + 2, 2);
  addLine(map, x + 1, y + 2, x, y + 5, 1);
  addLine(map, x + 7, y + 2, x + 8, y + 5, 1);
  addRect(map, x - 1, y + 5, 3, 2, 1);
  addRect(map, x + 6, y + 5, 3, 2, 2);
}

function addBurst(map: Map<string, Pixel>, cx: number, cy: number) {
  addLine(map, cx - 3, cy, cx + 3, cy, 2);
  addLine(map, cx, cy - 3, cx, cy + 3, 2);
  addLine(map, cx - 2, cy - 2, cx + 2, cy + 2, 1);
  addLine(map, cx - 2, cy + 2, cx + 2, cy - 2, 1);
}

function buildSubjectPixels(subject: Subject, variant: number): Pixel[] {
  const map = new Map<string, Pixel>();
  const rand = lcg(variant + 1);
  const phase = variant % 4;
  const bias = variant % 3;

  switch (subject) {
    case "stocks":
      addCandles(map, 2, 12, [3, 5, 4, 7]);
      addArrow(map, 2, 12, 13, 5 + bias, 2);
      break;
    case "bonds":
      addRect(map, 2, 4, 12, 8, 1);
      addShield(map, 4, 5);
      addLine(map, 9, 6, 12, 6, 2);
      addLine(map, 9, 8, 12, 8, 2);
      addLine(map, 9, 10, 12, 10, 2);
      break;
    case "inflation":
      addDollar(map, 6, 4);
      addArrow(map, 5, 12, 11, 5, 2);
      addLine(map, 2, 12, 13, 12, 1);
      break;
    case "etfs":
      addRect(map, 2, 8, 3, 3, 1);
      addRect(map, 6, 8, 3, 3, 2);
      addRect(map, 10, 8, 3, 3, 1);
      addRect(map, 6, 4, 3, 3, 2);
      addLine(map, 4, 9, 6, 9, 2);
      addLine(map, 9, 9, 10, 9, 2);
      addLine(map, 7, 7, 7, 8, 2);
      break;
    case "market_growth":
      addLine(map, 2, 12, 4, 11, 1);
      addLine(map, 4, 11, 7, 12, 1);
      addLine(map, 7, 12, 10, 8, 2);
      addLine(map, 10, 8, 13, 5, 2);
      addArrow(map, 10, 8, 13, 5, 2);
      break;
    case "market_timing":
      addClock(map, 6, 6, phase);
      addCandles(map, 9, 13, [3, 5, 4]);
      break;
    case "volatility":
      addLine(map, 2, 10, 4, 5, 2);
      addLine(map, 4, 5, 7, 12, 2);
      addLine(map, 7, 12, 10, 6, 1);
      addLine(map, 10, 6, 13, 11, 1);
      addBurst(map, 8, 8);
      break;
    case "risk_return":
      addScales(map, 4, 4);
      addArrow(map, 4, 12, 12, 6, 2);
      break;
    case "saving_vs_investing":
      addRect(map, 2, 8, 5, 5, 1);
      addDollar(map, 3, 8);
      addCandles(map, 9, 13, [5, 7]);
      break;
    case "opportunity_cost":
      addRect(map, 2, 6, 4, 6, 1);
      addRect(map, 10, 6, 4, 6, 2);
      addArrow(map, 6, 9, 10, 9, 2);
      break;
    case "asset_allocation":
      addPie(map, 6, 8, 4, phase);
      addRect(map, 11, 6, 2, 6, 2);
      addRect(map, 13, 8, 1, 4, 1);
      break;
    case "diversification":
      addRect(map, 3, 4, 4, 4, 1);
      addRect(map, 9, 4, 4, 4, 2);
      addRect(map, 3, 10, 4, 4, 2);
      addRect(map, 9, 10, 4, 4, 1);
      addLine(map, 7, 6, 9, 6, 2);
      addLine(map, 7, 12, 9, 12, 2);
      break;
    case "compounding":
      addRect(map, 3, 10, 2, 3, 1);
      addRect(map, 6, 8, 2, 5, 1);
      addRect(map, 9, 6, 2, 7, 2);
      addRect(map, 12, 4, 2, 9, 2);
      addArrow(map, 3, 12, 13, 4, 2);
      break;
    case "time_horizon":
      addClock(map, 8, 8, phase);
      addArrow(map, 2, 13, 13, 13, 1);
      break;
    case "consistency":
      addRect(map, 3, 5, 2, 8, 1);
      addRect(map, 6, 5, 2, 8, 1);
      addRect(map, 9, 5, 2, 8, 1);
      addRect(map, 12, 5, 2, 8, 1);
      addLine(map, 2, 13, 14, 13, 2);
      break;
    case "dca":
      addDollar(map, 2, 6);
      addDollar(map, 6, 7);
      addDollar(map, 10, 8);
      addArrow(map, 2, 12, 13, 9, 1);
      break;
    case "rebalancing":
      addPie(map, 5, 8, 3, phase);
      addPie(map, 11, 8, 3, phase + 1);
      addArrow(map, 7, 8, 9, 8, 2);
      break;
    case "fomo":
      addCandles(map, 3, 12, [3, 5, 8, 10]);
      addBurst(map, 12, 4);
      addArrow(map, 4, 11, 13, 3, 2);
      break;
    case "overtrading":
      addArrow(map, 2, 5, 8, 5, 2);
      addArrow(map, 13, 11, 7, 11, 1);
      addRect(map, 6, 7, 4, 3, 1);
      addLine(map, 8, 6, 8, 10, 2);
      break;
    case "panic_selling":
      addCandles(map, 2, 12, [8, 6, 4, 3]);
      addArrow(map, 3, 4, 13, 12, 2);
      addBurst(map, 3, 3);
      break;
    default:
      addRect(map, 4, 4, 8, 8, 1);
      break;
  }

  const mirrored = variant % 2 === 1;
  const sparkleCount = 2 + (variant % 4);
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

export function PixelArtBackground({ subject, bandColor, seed, material = "standard" }: Props) {
  const normalized = normalizeSubject(subject);
  const subjectSeed = hashSeed(normalized);
  const renderSeed = hashSeed(`${seed}:${normalized}:${material}`);
  const variant = renderSeed % VARIANTS_PER_SUBJECT;

  const pixels = useMemo(
    () => buildSubjectPixels(normalized, variant + subjectSeed),
    [normalized, variant, subjectSeed],
  );

  const palette = useMemo(
    () => {
      if (material === "metal") {
        return ["rgb(92, 100, 118)", "rgb(150, 162, 184)", "rgb(220, 230, 245)"];
      }
      if (material === "glass") {
        return ["rgba(164, 220, 255, 0.55)", "rgba(210, 240, 255, 0.72)", "rgba(244, 252, 255, 0.9)"];
      }
      if (material === "old") {
        return ["rgb(116, 93, 61)", "rgb(151, 122, 78)", "rgb(193, 163, 110)"];
      }
      return [
        tint(bandColor, 0.75),
        tint(bandColor, 0.95),
        tint(bandColor, 1.2),
      ];
    },
    [bandColor, material],
  );

  const tileAlpha = material === "glass" ? 0.02 : material === "metal" ? 0.05 : material === "old" ? 0.06 : 0.07;
  const tileAltAlpha = material === "glass" ? 0.01 : material === "metal" ? 0.03 : material === "old" ? 0.04 : 0.03;

  const effectPixels = useMemo(() => {
    const rand = lcg(renderSeed + 11);
    const list: Array<{ x: number; y: number; w: number; h: number; fill: string; opacity: number }> = [];

    if (material === "metal") {
      for (let y = 2; y < RENDER_GRID; y += 4) {
        list.push({
          x: 0,
          y,
          w: RENDER_GRID,
          h: 1,
          fill: "#dce8ff",
          opacity: 0.08 + ((y % 8) === 0 ? 0.05 : 0),
        });
      }
      list.push({ x: 0, y: 4, w: RENDER_GRID, h: 3, fill: "#ffffff", opacity: 0.06 });
    } else if (material === "glass") {
      list.push({ x: 1, y: 1, w: RENDER_GRID - 2, h: 5, fill: "#ffffff", opacity: 0.09 });
      for (let i = 0; i < 10; i += 1) {
        list.push({
          x: Math.floor(rand() * RENDER_GRID),
          y: Math.floor(rand() * RENDER_GRID),
          w: 1,
          h: 1,
          fill: "#e8f8ff",
          opacity: 0.18,
        });
      }
    } else if (material === "old") {
      for (let i = 0; i < 16; i += 1) {
        list.push({
          x: Math.floor(rand() * RENDER_GRID),
          y: Math.floor(rand() * RENDER_GRID),
          w: 1 + Math.floor(rand() * 2),
          h: 1 + Math.floor(rand() * 2),
          fill: "#7e5f39",
          opacity: 0.08,
        });
      }
      for (let i = 0; i < 4; i += 1) {
        const x = Math.floor(rand() * (RENDER_GRID - 4));
        const y = Math.floor(rand() * (RENDER_GRID - 4));
        list.push({ x, y, w: 4, h: 1, fill: "#5f4220", opacity: 0.1 });
      }
    }

    return list;
  }, [material, renderSeed]);

  return (
    <View pointerEvents="none" style={styles.wrap}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${RENDER_GRID} ${RENDER_GRID}`}>
        {Array.from({ length: RENDER_GRID * RENDER_GRID }).map((_, i) => {
          const x = i % RENDER_GRID;
          const y = Math.floor(i / RENDER_GRID);
          const alpha = (x + y) % 2 === 0 ? tileAlpha : tileAltAlpha;
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

        {effectPixels.map((e, i) => (
          <Rect
            key={`fx-${i}`}
            x={e.x}
            y={e.y}
            width={e.w}
            height={e.h}
            fill={e.fill}
            opacity={e.opacity}
          />
        ))}

        {pixels.map((p, i) => (
          <Rect
            key={`px-${i}`}
            x={(p.x / (GRID - 1)) * (RENDER_GRID - 2) + 0.5}
            y={(p.y / (GRID - 1)) * (RENDER_GRID - 2) + 0.5}
            width={1}
            height={1}
            fill={palette[p.shade]}
            opacity={material === "glass" ? 0.22 + p.shade * 0.06 : 0.3 + p.shade * 0.09}
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
