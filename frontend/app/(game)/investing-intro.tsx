import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useColors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { AppTopBar } from "../../components/navigation/AppTopBar";
import { ThemeModeToggle } from "../../components/theme/ThemeModeToggle";
import { useAuthStore } from "../../store/authStore";

export default function InvestingIntroScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = createStyles(colors);
  const { t } = useTranslation();
  const skipInvestingIntro = useAuthStore((state) => state.skipInvestingIntro);
  const setSkipInvestingIntro = useAuthStore((state) => state.setSkipInvestingIntro);

  const handleContinue = async () => {
    await setSkipInvestingIntro(skipInvestingIntro);
    router.replace("/(game)");
  };

  return (
    <View style={styles.container}>
      <AppTopBar
        label={t("topbar.whyInvesting")}
        onBack={() => router.canGoBack() ? router.back() : router.push("/(game)")}
        rightContent={<ThemeModeToggle compact />}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.quoteCard}>
          <Text style={styles.quoteMark}>"</Text>
          <Text style={styles.quoteText}>{t("intro.quote")}</Text>
          <Text style={styles.quoteAuthor}>{t("intro.quoteAuthor")}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t("intro.whyTitle")}</Text>
          <Text style={styles.bodyText}>
            {t("intro.whyBody1")}
          </Text>
          <Text style={styles.bodyText}>
            {t("intro.whyBody2")}
          </Text>
          <Text style={styles.bodyText}>
            {t("intro.whyBody3")}
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t("intro.keepTitle")}</Text>
          <Text style={styles.bullet}>{t("intro.keep1")}</Text>
          <Text style={styles.bullet}>{t("intro.keep2")}</Text>
          <Text style={styles.bullet}>{t("intro.keep3")}</Text>
        </View>

        <TouchableOpacity
          style={styles.toggleRow}
          activeOpacity={0.9}
          onPress={() => setSkipInvestingIntro(!skipInvestingIntro)}
        >
          <View style={[styles.checkbox, skipInvestingIntro && styles.checkboxOn]}>
            {skipInvestingIntro ? <Text style={styles.check}>✓</Text> : null}
          </View>
          <Text style={styles.toggleLabel}>{t("intro.dontShow")}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cta} onPress={handleContinue}>
          <Text style={styles.ctaText}>{t("intro.continue")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scroll: {
      flex: 1,
    },
    content: {
      padding: 20,
      gap: 14,
      paddingBottom: 28,
    },
    quoteCard: {
      backgroundColor: colors.bgPanel,
      borderWidth: 1,
      borderColor: colors.borderPrimary,
      borderRadius: 16,
      padding: 18,
    },
    quoteMark: {
      fontFamily: Fonts.serif,
      fontSize: 34,
      color: colors.blue,
      marginBottom: 4,
      lineHeight: 34,
    },
    quoteText: {
      fontFamily: Fonts.serif,
      fontSize: 24,
      color: colors.textBright,
      lineHeight: 32,
    },
    quoteAuthor: {
      marginTop: 12,
      fontFamily: Fonts.sansBold,
      fontSize: 13,
      color: colors.textDim,
    },
    sectionCard: {
      backgroundColor: colors.bgPanel,
      borderWidth: 1,
      borderColor: colors.borderDim,
      borderRadius: 16,
      padding: 18,
      gap: 10,
    },
    sectionTitle: {
      fontFamily: Fonts.sansBold,
      fontSize: 18,
      color: colors.textBright,
    },
    bodyText: {
      fontFamily: Fonts.sans,
      fontSize: 15,
      lineHeight: 23,
      color: colors.textPrimary,
    },
    bullet: {
      fontFamily: Fonts.sans,
      fontSize: 15,
      lineHeight: 23,
      color: colors.textPrimary,
    },
    cta: {
      marginTop: 4,
      backgroundColor: colors.blue,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.borderPrimary,
    },
    ctaText: {
      color: colors.bg,
      fontFamily: Fonts.sansBold,
      fontSize: 15,
    },
    toggleRow: {
      marginTop: 2,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 2,
      paddingVertical: 4,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.borderPrimary,
      backgroundColor: colors.bgPanel,
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxOn: {
      backgroundColor: colors.blue,
      borderColor: colors.blue,
    },
    check: {
      color: colors.bg,
      fontFamily: Fonts.sansBold,
      fontSize: 13,
      lineHeight: 16,
    },
    toggleLabel: {
      color: colors.textPrimary,
      fontFamily: Fonts.sans,
      fontSize: 14,
    },
  });
