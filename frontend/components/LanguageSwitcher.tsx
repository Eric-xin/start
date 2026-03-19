import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Colors } from "../constants/colors";
import { Fonts } from "../constants/fonts";
import { AppLanguage } from "../i18n/resources";
import { setAppLanguage, SUPPORTED_LANGUAGES } from "../i18n";

const ICON_LABELS: Record<AppLanguage, string> = {
  en: "EN",
  gsw: "CH-DE",
  fr: "FR",
  it: "IT",
};

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { t, i18n } = useTranslation();
  const selectedLanguage = (i18n.resolvedLanguage || i18n.language || "en") as AppLanguage;

  return (
    <View style={styles.wrap}>
      {!compact && <Text style={styles.title}>{t("common.language")}</Text>}
      <View style={styles.row}>
        {SUPPORTED_LANGUAGES.map((lang) => {
          const active = selectedLanguage === lang;
          return (
            <TouchableOpacity
              key={lang}
              style={[styles.button, compact && styles.buttonCompact, active && styles.buttonActive]}
              onPress={() => void setAppLanguage(lang)}
            >
              <Text style={[styles.buttonText, compact && styles.buttonTextCompact, active && styles.buttonTextActive]}>
                {compact ? ICON_LABELS[lang] : t(`common.languages.${lang}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  title: {
    fontSize: 8,
    fontFamily: Fonts.sansBold,
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  button: {
    borderWidth: 1,
    borderColor: Colors.borderDim,
    borderRadius: 2,
    backgroundColor: Colors.bgCard,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  buttonCompact: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  buttonActive: {
    borderColor: Colors.blue,
    backgroundColor: Colors.bgPanel,
  },
  buttonText: {
    fontSize: 8,
    fontFamily: Fonts.sansBold,
    color: Colors.textDim,
    letterSpacing: 1,
  },
  buttonTextCompact: {
    fontSize: 7,
    letterSpacing: 0.8,
  },
  buttonTextActive: {
    color: Colors.blue,
  },
});
