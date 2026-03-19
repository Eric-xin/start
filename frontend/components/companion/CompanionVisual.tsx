import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COMPANIONS, type CompanionId } from "../../constants/companions";
import { useColors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";

interface Props {
  companionId: CompanionId;
  size?: number;
  showName?: boolean;
  muted?: boolean;
}

export function CompanionVisual({
  companionId,
  size = 92,
  showName = true,
  muted = false,
}: Props) {
  const colors = useColors();
  const styles = createStyles(colors, size);
  const companion = COMPANIONS[companionId];

  return (
    <View style={[styles.wrap, muted && { opacity: 0.8 }]}>
      <View style={[styles.circle, { borderColor: companion.accentColor, backgroundColor: companion.accentColor + "18" }]}>
        <Text style={styles.emoji}>{companion.emoji}</Text>
      </View>
      {showName ? <Text style={styles.name}>{companion.name}</Text> : null}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>, size: number) => StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: 8,
  },
  circle: {
    width: size,
    height: size,
    borderRadius: size / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  emoji: {
    fontSize: size * 0.48,
  },
  name: {
    fontSize: 12,
    fontFamily: Fonts.sansBold,
    color: colors.textBright,
    letterSpacing: 1.2,
  },
});
