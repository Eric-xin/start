import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Fonts } from "../../constants/fonts";
import { Layout } from "../../constants/layout";

interface Props {
  text: string;
  color?: string;
  onDismiss: () => void;
}

export function CardLesson({ text, color = "#00ff88", onDismiss }: Props) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: Layout.lessonFadeIn });

    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 300 }, (finished) => {
        if (finished) runOnJS(onDismiss)();
      });
    }, Layout.lessonDuration);

    return () => clearTimeout(timer);
  }, [text]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.Text style={[styles.lesson, { color }, style]}>
      {text}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  lesson: {
    fontSize: 15,
    fontFamily: Fonts.monoItalic,
    textAlign: "center",
    maxWidth: Layout.cardWidth,
    lineHeight: 22,
    paddingHorizontal: 16,
    marginTop: 16,
  },
});
