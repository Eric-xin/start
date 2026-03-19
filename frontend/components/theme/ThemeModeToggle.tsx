import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { useThemeStore } from "../../store/themeStore";

export function ThemeModeToggle({
  compact = false,
}: {
  compact?: boolean;
}) {
  const colors = useColors();
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);

  return (
    <View
      style={[
        styles.wrap,
        {
          borderColor: colors.borderDim,
          backgroundColor: colors.bg,
        },
      ]}
    >
      {(["normal", "pro"] as const).map((value) => {
        const active = mode === value;
        return (
          <TouchableOpacity
            key={value}
            onPress={() => setMode(value)}
            style={[
              styles.chip,
              compact && styles.chipCompact,
              active && { backgroundColor: colors.blueDim },
            ]}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.text,
                compact && styles.textCompact,
                { color: active ? colors.blue : colors.textDim },
              ]}
            >
              {value === "normal" ? "NORMAL" : "PRO"}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 999,
    overflow: "hidden",
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipCompact: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: {
    fontSize: 9,
    fontFamily: Fonts.sansBold,
  },
  textCompact: {
    fontSize: 8,
  },
});
