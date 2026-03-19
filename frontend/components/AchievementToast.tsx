import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Colors } from "../constants/colors";
import { Fonts } from "../constants/fonts";

const TIER_COLORS: Record<string, string> = {
  bronze: "#cd7f32",
  silver: "#c0c0c0",
  gold: "#ffd700",
  platinum: "#e5e4e2",
};

interface Props {
  emoji: string;
  title: string;
  tier: string;
  onDone: () => void;
}

export function AchievementToast({ emoji, title, tier, onDone }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-40)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, friction: 8, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(onDone);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const accent = TIER_COLORS[tier] ?? Colors.blue;

  return (
    <Animated.View
      style={[
        styles.container,
        { borderColor: accent, opacity, transform: [{ translateY }, { scale }] },
      ]}
    >
      <View style={[styles.glow, { backgroundColor: accent }]} />
      <Text style={styles.emoji}>{emoji}</Text>
      <View style={styles.textCol}>
        <Text style={styles.label}>ACHIEVEMENT UNLOCKED</Text>
        <Text style={[styles.title, { color: accent }]}>{title}</Text>
      </View>
      <View style={[styles.tierBadge, { borderColor: accent }]}>
        <Text style={[styles.tierText, { color: accent }]}>{tier.toUpperCase()}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgPanel,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    zIndex: 9999,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    maxWidth: 400,
  },
  glow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    opacity: 0.8,
  },
  emoji: { fontSize: 28 },
  textCol: { flex: 1 },
  label: {
    fontSize: 8,
    fontFamily: Fonts.sansBold,
    color: Colors.textDim,
    letterSpacing: 2,
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontFamily: Fonts.sansBold,
    letterSpacing: 1,
  },
  tierBadge: {
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tierText: {
    fontSize: 8,
    fontFamily: Fonts.sansBold,
    letterSpacing: 1.5,
  },
});
