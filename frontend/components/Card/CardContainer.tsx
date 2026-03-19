import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { CardFace } from "./CardFace";
import { CardGlow } from "./CardGlow";
import { Layout } from "../../constants/layout";
import type { CardData } from "../../services/portfolio";

interface Props {
  card: CardData;
  isLocked: boolean;
  onSwipe: (direction: "left" | "right") => void;
  isChoiceFlipped?: boolean;
  // Gesture area fills this container — defaults to card dimensions
  areaWidth?: number;
  areaHeight?: number;
}

export function CardContainer({
  card,
  isLocked,
  onSwipe,
  isChoiceFlipped = false,
  areaWidth = Layout.cardWidth,
  areaHeight = Layout.cardHeight,
}: Props) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const dragX = useSharedValue(0);

  const triggerFlyOff = (direction: "left" | "right") => {
    const targetX = direction === "right" ? areaWidth + 200 : -(areaWidth + 200);
    translateX.value = withTiming(targetX, { duration: Layout.flyOffDuration }, (done) => {
      if (done) runOnJS(onSwipe)(direction);
    });
    translateY.value = withTiming(translateY.value - 40, { duration: Layout.flyOffDuration });
  };

  const pan = Gesture.Pan()
    .enabled(!isLocked)
    .minDistance(5)          // start detecting quickly
    .onChange((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
      dragX.value = e.translationX;
    })
    .onEnd((e) => {
      const absX = Math.abs(e.translationX);
      const velocityBoost = Math.abs(e.velocityX) > 600; // fast fling counts too
      if (absX >= Layout.swipeThreshold || velocityBoost) {
        const dir = e.translationX > 0 || e.velocityX > 0 ? "right" : "left";
        runOnJS(triggerFlyOff)(dir);
      } else {
        translateX.value = withSpring(0, { damping: 18, stiffness: 160 });
        translateY.value = withSpring(0, { damping: 18, stiffness: 160 });
        dragX.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotation = translateX.value * 0.05;
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation}deg` },
      ],
    };
  });

  return (
    // GestureDetector fills the full area so swipes register anywhere in the zone
    <GestureDetector gesture={pan}>
      <View style={{ width: areaWidth, height: areaHeight, alignItems: "center", justifyContent: "center" }}>
        <Animated.View style={[styles.card, cardStyle]}>
          <CardFace card={card} isChoiceFlipped={isChoiceFlipped} />
          <CardGlow dragX={dragX} />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    width: Layout.cardWidth,
    height: Layout.cardHeight,
  },
});
