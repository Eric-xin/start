import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { useThemeStore } from "../../store/themeStore";

export function AppTopBar({
  label,
  onBack,
  rightContent,
}: {
  label: string;
  onBack?: () => void;
  rightContent?: React.ReactNode;
}) {
  const colors = useColors();
  const isNormal = useThemeStore((state) => state.mode === "normal");

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.bgPanel,
          borderBottomColor: colors.borderPrimary,
        },
      ]}
    >
      <View style={styles.left}>
        <Text style={[styles.logo, { color: colors.blue }]}>CARDECON</Text>
        <View style={[styles.sep, { backgroundColor: colors.borderDim }]} />
        <Text
          style={[
            styles.label,
            {
              color: colors.textDim,
              letterSpacing: isNormal ? 0.4 : 2,
            },
          ]}
        >
          {label}
        </Text>
      </View>

      <View style={styles.right}>
        {rightContent}
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={[
              styles.backBtn,
              {
                borderColor: colors.borderDim,
                backgroundColor: isNormal ? colors.bg : "transparent",
                borderRadius: isNormal ? 999 : 2,
              },
            ]}
          >
            <Text style={[styles.backText, { color: colors.textDim }]}>BACK</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 52,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    gap: 12,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 1,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logo: {
    fontSize: 14,
    fontFamily: Fonts.mono,
    letterSpacing: 3,
  },
  sep: {
    width: 1,
    height: 16,
  },
  label: {
    fontSize: 10,
    fontFamily: Fonts.sansBold,
  },
  backBtn: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backText: {
    fontSize: 10,
    fontFamily: Fonts.sansBold,
    letterSpacing: 1.2,
  },
});
