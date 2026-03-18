import React from "react";
import { StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  clamp,
  SharedValue,
  interpolate,
} from "react-native-reanimated";
import { Layout } from "../../constants/layout";

interface Props {
  dragX: SharedValue<number>;
}

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

export function CardGlow({ dragX }: Props) {
  const leftStyle = useAnimatedStyle(() => ({
    opacity: clamp(-dragX.value / 150, 0, 0.7),
  }));

  const rightStyle = useAnimatedStyle(() => ({
    opacity: clamp(dragX.value / 150, 0, 0.7),
  }));

  return (
    <>
      {/* Left glow — red (reject) */}
      <AnimatedGradient
        colors={["rgba(211, 47, 47, 0.8)", "transparent"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.overlay, leftStyle]}
        pointerEvents="none"
      />
      {/* Right glow — green (accept) */}
      <AnimatedGradient
        colors={["transparent", "rgba(46, 125, 50, 0.8)"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.overlay, rightStyle]}
        pointerEvents="none"
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Layout.cardBorderRadius,
  },
});
