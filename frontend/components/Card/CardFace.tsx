import React, { useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { Layout } from "../../constants/layout";
import type { CardData } from "../../services/game";

interface Props {
  card: CardData;
}

export function CardFace({ card }: Props) {
  const rotationRef = useRef(-2 + Math.random() * 4);
  const bandColor = Colors.cardBand[card.card_band_color] ?? Colors.cardBand.steel_blue;

  return (
    <View
      style={[
        styles.card,
        { transform: [{ rotate: `${rotationRef.current}deg` }] },
      ]}
    >
      {/* Colored band at top */}
      <View style={[styles.band, { backgroundColor: bandColor }]} />

      <View style={styles.content}>
        {/* Emoji */}
        <Text style={styles.emoji}>{card.emoji}</Text>

        {/* Title */}
        <Text style={styles.title}>{card.title}</Text>

        {/* Type badge */}
        <View style={[styles.typeBadge, { borderColor: bandColor }]}>
          <Text style={[styles.typeText, { color: bandColor }]}>
            {card.type.toUpperCase()}
          </Text>
        </View>

        {/* Body */}
        <Text style={styles.body}>{card.body}</Text>

        {/* Choice hints at bottom */}
        <View style={styles.choices}>
          <View style={styles.choiceLeft}>
            <Text style={styles.choiceArrow}>←</Text>
            <Text style={styles.choiceText} numberOfLines={2}>
              {card.left_choice}
            </Text>
          </View>
          <View style={styles.choiceDivider} />
          <View style={styles.choiceRight}>
            <Text style={styles.choiceText} numberOfLines={2}>
              {card.right_choice}
            </Text>
            <Text style={styles.choiceArrow}>→</Text>
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
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  band: {
    height: Layout.cardBandHeight,
    width: "100%",
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  emoji: {
    fontSize: 48,
    textAlign: "center",
    marginBottom: 8,
  },
  typeBadge: {
    alignSelf: "center",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 12,
  },
  typeText: {
    fontSize: 9,
    fontFamily: Fonts.sansBold,
    letterSpacing: 2,
  },
  title: {
    fontSize: 22,
    fontFamily: Fonts.serif,
    color: Colors.cardText,
    textAlign: "center",
    marginBottom: 4,
    lineHeight: 28,
  },
  body: {
    fontSize: 15,
    fontFamily: Fonts.sans,
    color: Colors.cardTextBody,
    lineHeight: 22,
    flex: 1,
    marginTop: 12,
  },
  choices: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#d0c8b8",
    paddingTop: 12,
  },
  choiceLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  choiceRight: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  choiceDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#d0c8b8",
    marginHorizontal: 8,
  },
  choiceArrow: {
    fontSize: 16,
    color: "#888",
  },
  choiceText: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
    color: "#555",
    flex: 1,
  },
});
