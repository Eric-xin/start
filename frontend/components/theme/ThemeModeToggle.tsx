import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { useThemeStore } from "../../store/themeStore";

export function ThemeModeToggle({
  compact = false,
  navSized = false,
}: {
  compact?: boolean;
  navSized?: boolean;
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
              navSized && styles.chipNav,
              active && { backgroundColor: colors.blueDim },
            ]}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.text,
                compact && styles.textCompact,
                navSized && styles.textNav,
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
  chipNav: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  text: {
    fontSize: 9,
    fontFamily: Fonts.sansBold,
  },
  textCompact: {
    fontSize: 8,
  },
  textNav: {
    fontSize: 10,
    letterSpacing: 1.2,
  },
});
