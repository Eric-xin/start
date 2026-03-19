import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  getIdleContextFromMarket,
  pickPhrase,
  type CompanionId,
  type CompanionMarketState,
} from "../../constants/companions";
import { useColors } from "../../constants/colors";
import { useThemeStore } from "../../store/themeStore";
import { useCompanionStore } from "../../store/companionStore";
import { CompanionAvatar } from "./CompanionAvatar";
import { CompanionBubble } from "./CompanionBubble";
import { CompanionVisual } from "./CompanionVisual";

interface Props {
  companionId: CompanionId;
  marketState?: CompanionMarketState;
  lessonVisible: boolean;
  onAsk: () => void;
}

export function CompanionPresence({
  companionId,
  marketState,
  lessonVisible,
  onAsk,
}: Props) {
  const colors = useColors();
  const isNormal = useThemeStore((state) => state.mode === "normal");
  const styles = createStyles(colors, isNormal);
  const recentPhrases = useCompanionStore((state) => state.recentPhrases);
  const bubbleText = useCompanionStore((state) => state.bubbleText);
  const bubbleVisible = useCompanionStore((state) => state.bubbleVisible);
  const showBubble = useCompanionStore((state) => state.showBubble);
  const hideBubble = useCompanionStore((state) => state.hideBubble);
  const floatY = useSharedValue(0);

  useEffect(() => {
    if (!isNormal) return;
    floatY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1800 }),
        withTiming(0, { duration: 1800 })
      ),
      -1,
      false
    );
  }, [floatY, isNormal]);

  useEffect(() => {
    if (lessonVisible) return;
    const delay = 3000 + Math.floor(Math.random() * 5000);
    const timeout = setTimeout(() => {
      const context = getIdleContextFromMarket(marketState);
      showBubble(pickPhrase(companionId, context, { recentPhrases }));
    }, delay);
    return () => clearTimeout(timeout);
  }, [companionId, lessonVisible, marketState, recentPhrases, showBubble, bubbleText]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <View style={isNormal ? styles.normalBubbleSlot : styles.proBubbleSlot}>
        <CompanionBubble
          companionId={companionId}
          text={bubbleText}
          visible={bubbleVisible}
          onHide={hideBubble}
          onAsk={onAsk}
        />
      </View>

      {isNormal ? (
        <Animated.View style={[styles.normalPresence, floatStyle]}>
          <CompanionVisual companionId={companionId} size={144} showName={false} muted />
        </Animated.View>
      ) : (
        <View style={styles.proPresence}>
          <CompanionAvatar
            companionId={companionId}
            onPress={() => showBubble(pickPhrase(companionId, "tap_avatar", { recentPhrases }))}
          />
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>, isNormal: boolean) => StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
  },
  normalPresence: {
    position: "absolute",
    left: 24,
    bottom: 28,
    opacity: 0.82,
  },
  proPresence: {
    position: "absolute",
    right: 18,
    bottom: 20,
  },
  normalBubbleSlot: {
    position: "absolute",
    left: 110,
    bottom: 168,
  },
  proBubbleSlot: {
    position: "absolute",
    right: 22,
    bottom: 68,
    alignItems: "flex-end",
  },
});
