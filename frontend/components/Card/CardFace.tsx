import React, { useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { Layout } from "../../constants/layout";
import type { CardData } from "../../services/game";

const TYPE_LABELS: Record<string, string> = {
  education: "EDU",
  event: "EVT",
  action: "ACT",
};

interface Props {
  card: CardData;
}

export function CardFace({ card }: Props) {
  const rotation = useRef((-1.5 + Math.random() * 3).toFixed(2)).current;
  const bandColor = Colors.cardBand[card.card_band_color] ?? Colors.cardBand.steel_blue;
  const typeLabel = TYPE_LABELS[card.type] ?? card.type.toUpperCase();

  return (
    <View style={[styles.card, { transform: [{ rotate: `${rotation}deg` }] }]}>
      {/* Top band */}
      <View style={[styles.band, { backgroundColor: bandColor }]} />

      {/* Card inner */}
      <View style={styles.inner}>
        {/* Header row: type + difficulty */}
        <View style={styles.metaRow}>
          <View style={[styles.typePill, { borderColor: bandColor }]}>
            <Text style={[styles.typeText, { color: bandColor }]}>{typeLabel}</Text>
          </View>
          <Text style={styles.diffLabel}>
            DIFF {(card.difficulty * 10).toFixed(0)}/10
          </Text>
        </View>

        {/* Emoji */}
        <Text style={styles.emoji}>{card.emoji}</Text>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>{card.title}</Text>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: bandColor + "44" }]} />

        {/* Body */}
        <Text style={styles.body}>{card.body}</Text>

        {/* Choices */}
        <View style={styles.choicesRow}>
          <View style={styles.choice}>
            <Text style={[styles.arrow, { color: Colors.red }]}>←</Text>
            <Text style={styles.choiceText} numberOfLines={2}>{card.left_choice}</Text>
          </View>
          <View style={[styles.choiceDivider, { backgroundColor: bandColor + "55" }]} />
          <View style={[styles.choice, styles.choiceRight]}>
            <Text style={styles.choiceText} numberOfLines={2}>{card.right_choice}</Text>
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
    boxShadow: "0 12px 24px rgba(0, 0, 0, 0.6)",
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
    borderTopColor: "#d0c8b8",
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
