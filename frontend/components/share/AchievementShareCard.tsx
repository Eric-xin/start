import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, {
  Defs, RadialGradient, LinearGradient,
  Stop, Circle, Rect, Line,
} from "react-native-svg";
import { Fonts } from "../../constants/fonts";
import { AchievementData } from "../../services/achievements";

export const CARD_W = 360;
export const CARD_H = 640;

const TIER_COLORS: Record<string, string> = {
  bronze: "#cd7f32",
  silver: "#c0c0c0",
  gold:   "#ffd700",
  platinum: "#e8e0ff",
};

const TIER_GLOWS: Record<string, string> = {
  bronze:   "#7a3c00",
  silver:   "#405060",
  gold:     "#9a7000",
  platinum: "#5030a0",
};

// Dot grid rendered as SVG circles
function DotGrid({ w, h }: { w: number; h: number }) {
  const spacing = 24;
  const dots: React.ReactElement[] = [];
  for (let x = spacing; x < w; x += spacing) {
    for (let y = spacing; y < h; y += spacing) {
      dots.push(
        <Circle key={`${x}:${y}`} cx={x} cy={y} r={0.8} fill="#1a3a6b" opacity="0.45" />
      );
    }
  }
  return <>{dots}</>;
}

interface Props {
  achievement: AchievementData;
}

export function AchievementShareCard({ achievement }: Props) {
  const accent = TIER_COLORS[achievement.tier] ?? "#0a6cf5";
  const glow   = TIER_GLOWS[achievement.tier]  ?? "#0a3a7a";
  const cx     = CARD_W / 2;
  const emojiY = 248;

  return (
    <View style={[styles.card, { width: CARD_W, height: CARD_H }]}>
      {/* ── SVG background ── */}
      <Svg width={CARD_W} height={CARD_H} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="bgGrad" cx="50%" cy="25%" r="85%">
            <Stop offset="0%"   stopColor="#0a1628" />
            <Stop offset="100%" stopColor="#050b14" />
          </RadialGradient>
          <RadialGradient id="centerGlow" cx="50%" cy="39%" r="42%">
            <Stop offset="0%"   stopColor={glow} stopOpacity="0.95" />
            <Stop offset="55%"  stopColor={glow} stopOpacity="0.30" />
            <Stop offset="100%" stopColor="#050b14" stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id="topAccent" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"   stopColor={accent} stopOpacity="0.10" />
            <Stop offset="100%" stopColor={accent} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Base */}
        <Rect x={0} y={0} width={CARD_W} height={CARD_H} fill="url(#bgGrad)" />
        <DotGrid w={CARD_W} h={CARD_H} />
        <Rect x={0} y={0} width={CARD_W} height={CARD_H} fill="url(#centerGlow)" />
        <Rect x={0} y={0} width={CARD_W} height={220} fill="url(#topAccent)" />

        {/* Corner brackets */}
        <Rect x={22}           y={22}           width={30} height={2}  fill={accent} opacity={0.85} />
        <Rect x={22}           y={22}           width={2}  height={30} fill={accent} opacity={0.85} />
        <Rect x={CARD_W - 52}  y={22}           width={30} height={2}  fill={accent} opacity={0.85} />
        <Rect x={CARD_W - 24}  y={22}           width={2}  height={30} fill={accent} opacity={0.85} />
        <Rect x={22}           y={CARD_H - 24}  width={30} height={2}  fill={accent} opacity={0.85} />
        <Rect x={22}           y={CARD_H - 52}  width={2}  height={30} fill={accent} opacity={0.85} />
        <Rect x={CARD_W - 52}  y={CARD_H - 24}  width={30} height={2}  fill={accent} opacity={0.85} />
        <Rect x={CARD_W - 24}  y={CARD_H - 52}  width={2}  height={30} fill={accent} opacity={0.85} />

        {/* Concentric rings around emoji */}
        <Circle cx={cx} cy={emojiY} r={98} stroke={accent} strokeWidth={0.4} fill="none" opacity={0.20} />
        <Circle cx={cx} cy={emojiY} r={82} stroke={accent} strokeWidth={0.8} fill="none" opacity={0.30} />
        <Circle cx={cx} cy={emojiY} r={65} stroke={accent} strokeWidth={1.5} fill="none" opacity={0.55} />
        <Circle cx={cx} cy={emojiY} r={60} fill={glow} fillOpacity={0.22} />

        {/* Horizontal separator lines */}
        <Line x1={42} y1={152} x2={CARD_W - 42} y2={152}
              stroke={accent} strokeWidth={0.5} opacity={0.28} />
        <Line x1={42} y1={CARD_H - 86} x2={CARD_W - 42} y2={CARD_H - 86}
              stroke={accent} strokeWidth={0.5} opacity={0.28} />

        {/* Small tick marks on separator lines */}
        <Rect x={42}            y={150} width={1} height={4} fill={accent} opacity={0.5} />
        <Rect x={CARD_W - 43}   y={150} width={1} height={4} fill={accent} opacity={0.5} />
        <Rect x={42}            y={CARD_H - 88} width={1} height={4} fill={accent} opacity={0.5} />
        <Rect x={CARD_W - 43}   y={CARD_H - 88} width={1} height={4} fill={accent} opacity={0.5} />
      </Svg>

      {/* ── Content ── */}
      <View style={styles.content}>
        {/* Brand header */}
        <View style={styles.brandRow}>
          <Text style={[styles.brandA, { color: accent }]}>MARKET</Text>
          <Text style={[styles.brandB, { color: "#e8f4ff" }]}>HAND</Text>
        </View>
        <Text style={styles.subBrand}>INVESTOR ACHIEVEMENTS</Text>

        {/* Emoji ring */}
        <View style={styles.emojiWrapper}>
          <Text style={styles.emoji}>{achievement.emoji}</Text>
        </View>

        {/* Labels */}
        <Text style={[styles.unlockedLabel, { color: accent }]}>
          ACHIEVEMENT UNLOCKED
        </Text>

        <Text style={styles.title}>{achievement.title}</Text>
        <Text style={styles.desc}>{achievement.description}</Text>

        {/* Tier pill */}
        <View style={[styles.tierPill, { borderColor: accent }]}>
          <View style={[styles.tierDot, { backgroundColor: accent }]} />
          <Text style={[styles.tierText, { color: accent }]}>
            {achievement.tier.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerUrl}>markethand.ericxin.dev</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#050b14",
    overflow: "hidden",
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 52,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 0,
    marginBottom: 4,
  },
  brandA: {
    fontSize: 15,
    fontFamily: Fonts.sansBold,
    letterSpacing: 4,
  },
  brandB: {
    fontSize: 15,
    fontFamily: Fonts.sansBold,
    letterSpacing: 4,
  },
  subBrand: {
    fontSize: 7,
    fontFamily: Fonts.sansBold,
    letterSpacing: 3,
    color: "#253a55",
    marginBottom: 56,
  },

  emojiWrapper: {
    width: 112,
    height: 112,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  emoji: {
    fontSize: 54,
    lineHeight: 64,
  },

  unlockedLabel: {
    fontSize: 8,
    fontFamily: Fonts.sansBold,
    letterSpacing: 3,
    marginBottom: 12,
    textAlign: "center",
  },
  title: {
    fontSize: 26,
    fontFamily: Fonts.serif,
    color: "#e8f4ff",
    textAlign: "center",
    marginBottom: 10,
    lineHeight: 32,
  },
  desc: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    color: "#4a7aaa",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  tierPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  tierDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  tierText: {
    fontSize: 9,
    fontFamily: Fonts.sansBold,
    letterSpacing: 3,
  },
  footer: {
    paddingBottom: 28,
    alignItems: "center",
  },
  footerUrl: {
    fontSize: 8,
    fontFamily: Fonts.mono,
    color: "#1a3a6b",
    letterSpacing: 1.5,
  },
});
