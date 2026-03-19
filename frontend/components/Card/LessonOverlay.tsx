import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableWithoutFeedback } from "react-native";
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useColors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { Layout } from "../../constants/layout";
import { MarkdownText } from "../MarkdownText";
import { useThemeStore } from "../../store/themeStore";

interface Props {
  text: string;
  direction: "left" | "right";
  reward: number;
  isCorrect: boolean;
  onDismiss: () => void;
}

const AUTO_DISMISS_MS = 2600;

export function LessonOverlay({ text, direction, reward, isCorrect, onDismiss }: Props) {
  const colors = useColors();
  const isNormal = useThemeStore((state) => state.mode === "normal");
  const styles = createStyles(colors, isNormal);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  const accepted = direction === "right";
  const accentColor = isCorrect ? colors.green : colors.red;
  const label = isCorrect
    ? (isNormal ? "✅ Good call!" : "CORRECT")
    : (isNormal ? "❌ Not quite" : "INCORRECT");
  const arrow = accepted ? "→" : "←";
  const rewardSign = reward >= 0 ? "+" : "";

  useEffect(() => {
    // Slide up + fade in
    opacity.value = withTiming(1, { duration: 280 });
    translateY.value = withTiming(0, { duration: 280 });

    const t = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, []);

  const wrapStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <TouchableWithoutFeedback onPress={onDismiss}>
      <Animated.View style={[styles.overlay, wrapStyle]}>
        <View style={[styles.topBand, { backgroundColor: accentColor }]} />

        <View style={styles.inner}>
          <View style={[styles.badge, { borderColor: accentColor }]}>
            <Text style={[styles.badgeArrow, { color: accentColor }]}>{arrow}</Text>
            <Text style={[styles.badgeText, { color: accentColor }]}>{label}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: accentColor + "33" }]} />

          <MarkdownText
            text={text}
            style={styles.lessonText}
            boldStyle={styles.lessonTextBold}
          />

          <View style={styles.footer}>
            <View style={[styles.rewardPill, { borderColor: accentColor + "66" }]}>
              <Text style={[styles.rewardLabel, { color: colors.textDim }]}>{isNormal ? "📊 Impact" : "RETURN"}</Text>
              <Text style={[styles.rewardValue, { color: accentColor }]}>
                {rewardSign}{reward.toFixed(2)}
              </Text>
            </View>
            <Text style={styles.tapHint}>{isNormal ? "Tap to continue →" : "TAP TO CONTINUE"}</Text>
          </View>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>, isNormal: boolean) => StyleSheet.create({
  overlay: {
    width: Layout.cardWidth,
    height: Layout.cardHeight,
    backgroundColor: colors.bgPanel,
    borderRadius: Layout.cardBorderRadius,
    borderWidth: 1,
    borderColor: colors.borderDim,
    overflow: "hidden",
    boxShadow: "0 12px 20px rgba(0, 0, 0, 0.5)",
    elevation: 14,
  },
  topBand: {
    height: Layout.cardBandHeight,
  },
  inner: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeArrow: {
    fontSize: 18,
    fontFamily: Fonts.sansBold,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: Fonts.sansBold,
    letterSpacing: isNormal ? 0.5 : 3,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  lessonText: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.serifItalic,
    color: colors.textBright,
    lineHeight: 24,
  },
  lessonTextBold: {
    fontFamily: Fonts.serif,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.borderFaint,
  },
  rewardPill: {
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: "center",
  },
  rewardLabel: {
    fontSize: 7,
    fontFamily: Fonts.sansBold,
    letterSpacing: 2,
    marginBottom: 2,
  },
  rewardValue: {
    fontSize: 16,
    fontFamily: Fonts.mono,
    letterSpacing: 1,
  },
  tapHint: {
    fontSize: 8,
    fontFamily: Fonts.sansBold,
    color: colors.textMuted,
    letterSpacing: isNormal ? 0.4 : 2,
  },
});
