import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useColors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { getCurrentLanguage, setAppLanguage } from "../../i18n";
import type { AppLanguage } from "../../i18n/translations";

const LANGS: Array<{ code: AppLanguage; icon: string; label: string }> = [
  { code: "en", icon: "EN", label: "English" },
  { code: "de-CH", icon: "CH", label: "Swiss German" },
  { code: "fr", icon: "FR", label: "French" },
  { code: "it", icon: "IT", label: "Italian" },
];

export function LanguageSwitcher() {
  const colors = useColors();
  const { i18n } = useTranslation();
  const current = useMemo(() => getCurrentLanguage(), [i18n.language]);

  return (
    <View style={styles.row}>
      {LANGS.map((lang) => {
        const active = lang.code === current;
        return (
          <TouchableOpacity
            key={lang.code}
            onPress={() => setAppLanguage(lang.code)}
            accessibilityRole="button"
            accessibilityLabel={lang.label}
            style={[
              styles.btn,
              {
                borderColor: active ? colors.blue : colors.borderDim,
                backgroundColor: active ? colors.blueDim : colors.bg,
              },
            ]}
          >
            <Text
              style={[
                styles.btnText,
                { color: active ? colors.blueBright : colors.textDim },
              ]}
            >
              {lang.icon}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  btn: {
    minWidth: 30,
    height: 26,
    borderWidth: 1,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  btnText: {
    fontSize: 10,
    fontFamily: Fonts.sansBold,
    letterSpacing: 0.6,
  },
});
