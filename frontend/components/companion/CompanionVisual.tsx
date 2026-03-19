import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COMPANIONS, type CompanionId } from "../../constants/companions";
import { useColors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { useThemeStore } from "../../store/themeStore";

interface Props {
  companionId: CompanionId;
  size?: number;
  showName?: boolean;
  muted?: boolean;
}

export function CompanionVisual({
  companionId,
  size = 92,
  showName = true,
  muted = false,
}: Props) {
  const colors = useColors();
  const isNormal = useThemeStore((state) => state.mode === "normal");
  const styles = createStyles(colors, size, isNormal);
  const companion = COMPANIONS[companionId];

  return (
    <View style={[styles.wrap, muted && { opacity: 0.8 }]}>
      <View
        style={[
          styles.frame,
          {
            borderColor: companion.accentColor,
            backgroundColor: companion.accentColor + (isNormal ? "16" : "10"),
          },
        ]}
      >
        <View
          style={[
            styles.innerFrame,
            {
              borderColor: companion.accentColor + "66",
              backgroundColor: isNormal ? colors.bgSurface : colors.bgPanel,
            },
          ]}
        >
          <Text style={styles.emoji}>{companion.emoji}</Text>
        </View>
      </View>
      {/* {showName ? <Text style={styles.name}>{companion.name}</Text> : null} */}
    </View>
  );
}

const createStyles = (
  colors: ReturnType<typeof useColors>,
  size: number,
  isNormal: boolean
) =>
  StyleSheet.create({
    wrap: {
      alignItems: "center",
      gap: 8,
    },
    frame: {
      width: size,
      height: size,
      borderRadius: isNormal ? 20 : 4,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      padding: Math.max(6, Math.round(size * 0.08)),
      shadowColor: "#000",
      shadowOpacity: isNormal ? 0.08 : 0.18,
      shadowRadius: isNormal ? 10 : 0,
      shadowOffset: { width: 0, height: isNormal ? 6 : 0 },
    },
    innerFrame: {
      width: "100%",
      height: "100%",
      borderRadius: isNormal ? 14 : 2,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    emoji: {
      fontSize: size * 0.42,
      includeFontPadding: false,
    },
    name: {
      fontSize: 12,
      fontFamily: Fonts.sansBold,
      color: colors.textBright,
      letterSpacing: 1.2,
    },
  });
