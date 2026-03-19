import React, { useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { Layout } from "../../constants/layout";
import type { CardData } from "../../services/game";
import { PixelArtBackground } from "./PixelArtBackground";

const TYPE_LABELS: Record<string, string> = {
  education: "EDU",
  event: "EVT",
  action: "ACT",
};

interface Props {
  card: CardData;
}

type CardMaterial = "standard" | "metal" | "glass" | "old";

function hashSeed(value: string | number): number {
  const text = String(value);
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

function pickMaterial(card: CardData): CardMaterial {
  const keywords = `${card.title} ${card.body} ${(card.topics || []).join(" ")}`.toLowerCase();
  if (/(great depression|depression|1929|bank run|dust bowl|deflation|crash)/.test(keywords)) {
    return "old";
  }

  const h = hashSeed(`${card.id}:${card.type}:${(card.topics || []).join("|")}`) % 100;
  if (card.type === "action") return h < 70 ? "metal" : "standard";
  if (card.type === "event") return h < 65 ? "glass" : "standard";
  if (h < 18) return "metal";
  if (h < 36) return "glass";
  return "standard";
}

function materialTheme(material: CardMaterial) {
  if (material === "metal") {
    return {
      cardSurface: "#d8dde8",
      cardText: "#162033",
      cardBody: "#2e3b50",
      cardBorder: "#a9b6cc",
      choiceBorder: "#9fb1c9",
      typeBg: "rgba(255,255,255,0.35)",
      diffText: "#536785",
    };
  }
  if (material === "glass") {
    return {
      cardSurface: "rgba(202,227,246,0.52)",
      cardText: "#09253f",
      cardBody: "#173a56",
      cardBorder: "rgba(197, 230, 255, 0.9)",
      choiceBorder: "rgba(164, 206, 232, 0.85)",
      typeBg: "rgba(255,255,255,0.4)",
      diffText: "#2f5775",
    };
  }
  if (material === "old") {
    return {
      cardSurface: "#e3d4b7",
      cardText: "#3e2f1f",
      cardBody: "#5d4630",
      cardBorder: "#a4845b",
      choiceBorder: "#b89b73",
      typeBg: "rgba(134, 101, 62, 0.15)",
      diffText: "#7c6243",
    };
  }
  return {
    cardSurface: Colors.cardSurface,
    cardText: Colors.cardText,
    cardBody: Colors.cardTextBody,
    cardBorder: Colors.cardBorder,
    choiceBorder: "#d0c8b8",
    typeBg: "transparent",
    diffText: "#888",
  };
}

function MaterialOverlay({ material }: { material: CardMaterial }) {
  if (material === "metal") {
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={["rgba(255,255,255,0.35)", "rgba(255,255,255,0.0)"]}
          start={{ x: 0.05, y: 0.05 }}
          end={{ x: 0.75, y: 0.55 }}
          style={styles.materialFill}
        />
        <LinearGradient
          colors={["rgba(40, 60, 95, 0.0)", "rgba(40, 60, 95, 0.18)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.materialFill}
        />
      </View>
    );
  }

  if (material === "glass") {
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={["rgba(255,255,255,0.32)", "rgba(255,255,255,0.08)", "rgba(255,255,255,0.02)"]}
          start={{ x: 0.1, y: 0.02 }}
          end={{ x: 0.9, y: 0.9 }}
          style={styles.materialFill}
        />
        <View style={styles.glassEdge} />
      </View>
    );
  }

  if (material === "old") {
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={["rgba(99,69,36,0.12)", "rgba(99,69,36,0.03)", "rgba(99,69,36,0.14)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.materialFill}
        />
        <View style={styles.oldVignette} />
      </View>
    );
  }

  return null;
}

export function CardFace({ card }: Props) {
  const rotation = useRef((-1.5 + Math.random() * 3).toFixed(2)).current;
  const bandColor = Colors.cardBand[card.card_band_color] ?? Colors.cardBand.steel_blue;
  const typeLabel = TYPE_LABELS[card.type] ?? card.type.toUpperCase();
  const subject = card.topics?.[0] || card.type;
  const material = pickMaterial(card);
  const theme = materialTheme(material);

  return (
    <View style={[styles.card, {
      transform: [{ rotate: `${rotation}deg` }],
      backgroundColor: theme.cardSurface,
      borderColor: theme.cardBorder,
    }]}>
      {/* Top band */}
      <View style={[styles.band, { backgroundColor: bandColor }]} />

      {/* Pixel-art background by card subject with 100 deterministic variants */}
      <PixelArtBackground subject={subject} bandColor={bandColor} seed={card.id} material={material} />
      <MaterialOverlay material={material} />

      {/* Card inner */}
      <View style={styles.inner}>
        {/* Header row: type + difficulty */}
        <View style={styles.metaRow}>
          <View style={[styles.typePill, { borderColor: bandColor, backgroundColor: theme.typeBg }]}>
            <Text style={[styles.typeText, { color: bandColor }]}>{typeLabel}</Text>
          </View>
          <Text style={[styles.diffLabel, { color: theme.diffText }]}>
            DIFF {(card.difficulty * 10).toFixed(0)}/10
          </Text>
        </View>

        {/* Emoji */}
        <Text style={styles.emoji}>{card.emoji}</Text>

        {/* Title */}
        <Text style={[styles.title, { color: theme.cardText }]} numberOfLines={2}>{card.title}</Text>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: bandColor + "44" }]} />

        {/* Body */}
        <Text style={[styles.body, { color: theme.cardBody }]}>{card.body}</Text>

        {/* Choices */}
        <View style={styles.choicesRow}>
          <View style={styles.choice}>
            <Text style={[styles.arrow, { color: Colors.red }]}>←</Text>
            <Text style={[styles.choiceText, { color: theme.cardBody }]} numberOfLines={2}>{card.left_choice}</Text>
          </View>
          <View style={[styles.choiceDivider, { backgroundColor: bandColor + "55" }]} />
          <View style={[styles.choice, styles.choiceRight]}>
            <Text style={[styles.choiceText, { color: theme.cardBody }]} numberOfLines={2}>{card.right_choice}</Text>
            <Text style={[styles.arrow, { color: Colors.green }]}>→</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: Layout.cardWidth,
    height: Layout.cardHeight,
    backgroundColor: Colors.cardSurface,
    borderRadius: Layout.cardBorderRadius,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  band: {
    height: Layout.cardBandHeight,
  },
  inner: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
    zIndex: 2,
  },
  materialFill: {
    ...StyleSheet.absoluteFillObject,
  },
  glassEdge: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: "rgba(235, 248, 255, 0.8)",
    borderRadius: Layout.cardBorderRadius,
  },
  oldVignette: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: "rgba(101, 68, 32, 0.35)",
    borderRadius: Layout.cardBorderRadius,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  typePill: {
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  typeText: {
    fontSize: 9,
    fontFamily: Fonts.sansBold,
    letterSpacing: 2,
  },
  diffLabel: {
    fontSize: 9,
    fontFamily: Fonts.mono,
    color: "#888",
    letterSpacing: 1,
  },
  emoji: {
    fontSize: 44,
    textAlign: "center",
    marginVertical: 6,
  },
  title: {
    fontSize: 20,
    fontFamily: Fonts.mono,
    color: Colors.cardText,
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    marginBottom: 10,
  },
  body: {
    fontSize: 13.5,
    fontFamily: Fonts.sans,
    color: Colors.cardTextBody,
    lineHeight: 20,
    flex: 1,
  },
  choicesRow: {
    flexDirection: "row",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#c6b89f",
    gap: 4,
  },
  choice: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
  },
  choiceRight: {
    justifyContent: "flex-end",
  },
  choiceDivider: {
    width: 1,
    alignSelf: "stretch",
    marginHorizontal: 6,
  },
  arrow: {
    fontSize: 15,
    fontFamily: Fonts.sansBold,
    lineHeight: 18,
  },
  choiceText: {
    flex: 1,
    fontSize: 11,
    fontFamily: Fonts.sansMedium,
    color: "#555",
    lineHeight: 15,
  },
});