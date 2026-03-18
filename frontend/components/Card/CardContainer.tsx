import React from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import { CardFace } from "./CardFace";
import { CardGlow } from "./CardGlow";
import { Layout } from "../../constants/layout";
import type { CardData } from "../../services/game";

interface Props {
  card: CardData;
  isLocked: boolean;
  onSwipe: (direction: "left" | "right") => void;
  initialRotation?: number;
}

export function CardContainer({ card, isLocked, onSwipe, initialRotation = 0 }: Props) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const dragX = useSharedValue(0);

  const flyOff = (direction: "left" | "right") => {
    const targetX = direction === "right" ? 600 : -600;
    translateX.value = withTiming(targetX, { duration: Layout.flyOffDuration }, (finished) => {
      if (finished) {
        runOnJS(onSwipe)(direction);
      }
    });
    translateY.value = withTiming(translateY.value - 30, { duration: Layout.flyOffDuration });
  };

  const pan = Gesture.Pan()
    .enabled(!isLocked)
    .onChange((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
      dragX.value = e.translationX;
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) >= Layout.swipeThreshold) {
        const direction = e.translationX > 0 ? "right" : "left";
        runOnJS(flyOff)(direction);
      } else {
        // Snap back
        translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
        translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
        dragX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotation = initialRotation + translateX.value * 0.06;
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation}deg` },
      ],
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <CardFace card={card} />
        <CardGlow dragX={dragX} />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    width: Layout.cardWidth,
    height: Layout.cardHeight,
    position: "absolute",
  },
});
