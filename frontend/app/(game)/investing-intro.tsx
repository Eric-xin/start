import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { AppTopBar } from "../../components/navigation/AppTopBar";
import { useAuthStore } from "../../store/authStore";

export default function InvestingIntroScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = createStyles(colors);
  const skipInvestingIntro = useAuthStore((state) => state.skipInvestingIntro);
  const setSkipInvestingIntro = useAuthStore((state) => state.setSkipInvestingIntro);

  const handleContinue = async () => {
    await setSkipInvestingIntro(skipInvestingIntro);
    router.replace("/(game)");
  };

  return (
    <View style={styles.container}>
      <AppTopBar label="Why Investing Matters" onBack={() => router.back()} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.quoteCard}>
          <Text style={styles.quoteMark}>"</Text>
          <Text style={styles.quoteText}>The biggest risk is not taking any risk.</Text>
          <Text style={styles.quoteAuthor}>- Mark Zuckerberg</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Why this is important</Text>
          <Text style={styles.bodyText}>
            Investing is one of the strongest ways to build long-term wealth. If money only sits in cash,
            inflation can slowly reduce what it can buy. Investing gives your money a chance to grow over time.
          </Text>
          <Text style={styles.bodyText}>
            Taking investing seriously means learning the basics, staying consistent, and making thoughtful
            decisions instead of emotional ones. Small, smart steps repeated over time can lead to meaningful
            financial progress.
          </Text>
          <Text style={styles.bodyText}>
            This game is built to help you practice those decisions in a safe environment so you can become more
            confident with real-world money choices.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>What to keep in mind</Text>
          <Text style={styles.bullet}>1. Growth takes time: focus on steady progress, not quick wins.</Text>
          <Text style={styles.bullet}>2. Risk and reward are connected: understand both before deciding.</Text>
          <Text style={styles.bullet}>3. Consistency matters more than perfect timing.</Text>
        </View>

        <TouchableOpacity
          style={styles.toggleRow}
          activeOpacity={0.9}
          onPress={() => setSkipInvestingIntro(!skipInvestingIntro)}
        >
          <View style={[styles.checkbox, skipInvestingIntro && styles.checkboxOn]}>
            {skipInvestingIntro ? <Text style={styles.check}>✓</Text> : null}
          </View>
          <Text style={styles.toggleLabel}>Don't show this again</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cta} onPress={handleContinue}>
          <Text style={styles.ctaText}>I understand, take me to Start Game</Text>
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
