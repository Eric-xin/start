import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { Layout } from "../../constants/layout";

interface Props {
  label: string;
  value: number; // 0.0 – 1.0
  color: string;
  displayValue?: string;
}

export function StatBar({ label, value, color, displayValue }: Props) {
  const fillWidth = useSharedValue(0);

  useEffect(() => {
    fillWidth.value = withSpring(Math.max(0, Math.min(1, value)), {
      damping: 20,
      stiffness: 120,
    });
  }, [value]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fillWidth.value * 100}%`,
    backgroundColor: color,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {displayValue && <Text style={[styles.value, { color }]}>{displayValue}</Text>}
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: {
    fontSize: 9,
    fontFamily: Fonts.sansBold,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 9,
    fontFamily: Fonts.sansBold,
    letterSpacing: 0.5,
  },
  track: {
    height: Layout.statBarHeight,
    backgroundColor: "#1a1a1a",
    borderRadius: 4,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 4,
  },
});
