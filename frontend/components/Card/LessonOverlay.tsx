import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableWithoutFeedback } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSequence, withDelay,
} from "react-native-reanimated";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { Layout } from "../../constants/layout";

interface Props {
  text: string;
  direction: "left" | "right";
  reward: number;
  onDismiss: () => void;
}

const AUTO_DISMISS_MS = 2600;

export function LessonOverlay({ text, direction, reward, onDismiss }: Props) {
  const { t } = useTranslation();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  const accepted = direction === "right";
  const accentColor = accepted ? Colors.green : Colors.red;
  const label = accepted ? t("lessonOverlay.accepted") : t("lessonOverlay.declined");
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
        {/* Colored top band */}
        <View style={[styles.topBand, { backgroundColor: accentColor }]} />

        <View style={styles.inner}>
          {/* Direction badge */}
          <View style={[styles.badge, { borderColor: accentColor }]}>
            <Text style={[styles.badgeArrow, { color: accentColor }]}>{arrow}</Text>
            <Text style={[styles.badgeText, { color: accentColor }]}>{label}</Text>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: accentColor + "33" }]} />

          {/* Lesson text */}
          <Text style={styles.lessonText}>{text}</Text>

          {/* Reward + dismiss hint */}
          <View style={styles.footer}>
            <View style={[styles.rewardPill, { borderColor: accentColor + "66" }]}>
              <Text style={[styles.rewardLabel, { color: Colors.textDim }]}>{t("lessonOverlay.return")}</Text>
              <Text style={[styles.rewardValue, { color: accentColor }]}>
                {rewardSign}{reward.toFixed(2)}
              </Text>
            </View>
            <Text style={styles.tapHint}>{t("lessonOverlay.tapToContinue")}</Text>
          </View>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  overlay: {
    width: Layout.cardWidth,
    height: Layout.cardHeight,
    backgroundColor: Colors.bgPanel,
    borderRadius: Layout.cardBorderRadius,
    borderWidth: 1,
    borderColor: Colors.borderDim,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
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
    letterSpacing: 3,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  lessonText: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.serifItalic,
    color: Colors.textBright,
    lineHeight: 24,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderFaint,
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
    color: Colors.textMuted,
    letterSpacing: 2,
  },
});
