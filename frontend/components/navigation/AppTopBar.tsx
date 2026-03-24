import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { useColors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { useThemeStore } from "../../store/themeStore";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function AppTopBar({
  label,
  labelKey,
  onBack,
  rightContent,
}: {
  label: string;
  labelKey?: string;
  onBack?: () => void;
  rightContent?: React.ReactNode;
}) {
  const colors = useColors();
  const isNormal = useThemeStore((state) => state.mode === "normal");
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isNarrow = width < 520;
  const resolvedLabel = labelKey ? t(labelKey) : label;

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
        {!isNarrow && (
          <>
            <Text style={[styles.logo, { color: colors.blue }]}>{t("common.appName")}</Text>
            <View style={[styles.sep, { backgroundColor: colors.borderDim }]} />
          </>
        )}
        <Text
          style={[
            styles.label,
            {
              color: isNarrow ? colors.blue : colors.textDim,
              letterSpacing: isNormal ? 0.4 : 2,
              fontSize: isNarrow ? 11 : 10,
              fontFamily: isNarrow ? Fonts.mono : Fonts.sansBold,
            },
          ]}
        >
          {resolvedLabel}
        </Text>
      </View>

      <View style={[styles.right, isNarrow && styles.rightNarrow]}>
        <LanguageSwitcher compact={isNarrow} />
        {rightContent}
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={[
              styles.backBtn,
              {
                borderColor: colors.borderDim,
                backgroundColor: isNormal ? colors.bg : "transparent",
                borderRadius: 8,
                paddingHorizontal: isNarrow ? 10 : 12,
                paddingVertical: isNarrow ? 6 : 8,
              },
            ]}
          >
            <Text style={[styles.backText, { color: colors.textDim }]}>{t("common.back")}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 48,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    gap: 8,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 1,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rightNarrow: {
    gap: 5,
  },
  logo: {
    fontSize: 13,
    fontFamily: Fonts.mono,
    letterSpacing: 2.5,
  },
  sep: {
    width: 1,
    height: 14,
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
