import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { useColors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";

interface Props {
  label: string;
  value: number; // 0–1
  color: string;
}

export function StatBar({ label, value, color }: Props) {
  const colors = useColors();
  const styles = createStyles(colors);
  const fill = useSharedValue(0);

  useEffect(() => {
    fill.value = withSpring(Math.max(0, Math.min(1, value)), { damping: 22, stiffness: 130 });
  }, [value]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fill.value * 100}%`,
    backgroundColor: color,
  }));

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    width: 64,
    fontSize: 8,
    fontFamily: Fonts.sansBold,
    color: colors.textDim,
    letterSpacing: 1.2,
  },
  track: {
    flex: 1,
    height: 4,
    backgroundColor: colors.bgCard,
    borderRadius: 2,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderFaint,
  },
  fill: {
    height: "100%",
    borderRadius: 2,
  },
});
