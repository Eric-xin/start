import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { COMPANIONS, type CompanionId } from "../../constants/companions";
import { useColors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { useThemeStore } from "../../store/themeStore";

interface Props {
  companionId: CompanionId;
  text: string | null;
  visible: boolean;
  onHide: () => void;
  onAsk: () => void;
}

export function CompanionBubble({
  companionId,
  text,
  visible,
  onHide,
  onAsk,
}: Props) {
  const colors = useColors();
  const isNormal = useThemeStore((state) => state.mode === "normal");
  const styles = createStyles(colors, isNormal);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(14);
  const companion = COMPANIONS[companionId];

  useEffect(() => {
    if (!visible || !text) {
      opacity.value = withTiming(0, { duration: 160 });
      translateY.value = withTiming(14, { duration: 160 });
      return;
    }

    opacity.value = withTiming(1, { duration: 200 });
    translateY.value = withTiming(0, { duration: 200 });
    const timeout = setTimeout(onHide, 4000);
    return () => clearTimeout(timeout);
  }, [onHide, opacity, text, translateY, visible]);

  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!text) return null;

  return (
    <Animated.View style={[styles.bubble, bubbleStyle, { borderColor: companion.accentColor }]}>
      <Text style={styles.name}>{companion.emoji} {companion.name}</Text>
      <Text style={styles.text}>{text}</Text>
      <Pressable onPress={onAsk} style={styles.askButton}>
        <Text style={[styles.askText, { color: companion.accentColor }]}>Ask me →</Text>
      </Pressable>
    </Animated.View>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>, isNormal: boolean) => StyleSheet.create({
  bubble: {
    minWidth: 220,
    maxWidth: 320,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 2,
    backgroundColor: isNormal ? colors.bgPanel : colors.bgSurface,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  name: {
    fontSize: 12,
    fontFamily: isNormal ? Fonts.sansBold : Fonts.mono,
    color: colors.textBright,
    marginBottom: 6,
  },
  text: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: isNormal ? Fonts.sans : Fonts.mono,
    color: colors.textPrimary,
  },
  askButton: {
    alignSelf: "flex-end",
    marginTop: 10,
  },
  askText: {
    fontSize: 11,
    fontFamily: Fonts.sansBold,
  },
});
