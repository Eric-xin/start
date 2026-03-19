import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { getAchievements, AchievementData } from "../../services/achievements";
import { AppTopBar } from "../../components/navigation/AppTopBar";
import { Colors, useColors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { useThemeStore } from "../../store/themeStore";
import { ThemeModeToggle } from "../../components/theme/ThemeModeToggle";

const TIER_COLORS: Record<string, string> = {
  bronze: "#cd7f32",
  silver: "#c0c0c0",
  gold: "#ffd700",
  platinum: "#e5e4e2",
};

const CATEGORY_LABELS: Record<string, string> = {
  progress: "PROGRESS",
  stages: "STAGES",
  streaks: "STREAKS",
  money: "MONEY & PERFORMANCE",
  rank: "INVESTOR RANK",
  mastery: "LEARNING MASTERY",
  decisions: "DECISION QUALITY",
  strategy: "STRATEGY & DECKS",
};

function AchievementCard({ achievement }: { achievement: AchievementData }) {
  const colors = useColors();
  const accent = TIER_COLORS[achievement.tier] ?? colors.blue;
  const locked = !achievement.unlocked;

  return (
    <View style={[s.achCard, locked && s.achLocked, { backgroundColor: colors.bgPanel, borderColor: locked ? colors.borderDim : accent }]}>
      <View style={[s.achBand, { backgroundColor: locked ? colors.borderDim : accent }]} />
      <Text style={[s.achEmoji, locked && { opacity: 0.3 }]}>{achievement.emoji}</Text>
      <View style={s.achContent}>
        <Text style={[s.achTitle, { color: locked ? colors.textDim : colors.textBright }]}>{achievement.title}</Text>
        <Text style={[s.achDesc, { color: locked ? colors.textMuted : colors.textDim }]}>{achievement.description}</Text>
        {achievement.unlocked && achievement.unlocked_at && (
          <Text style={[s.achDate, { color: colors.textMuted }]}>
            {new Date(achievement.unlocked_at).toLocaleDateString()}
          </Text>
        )}
      </View>
      <View style={[s.tierBadge, { borderColor: locked ? colors.borderDim : accent }]}>
        <Text style={[s.tierText, { color: locked ? colors.textMuted : accent }]}>
          {achievement.tier.toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

export default function AchievementsScreen() {
  const router = useRouter();
  const colors = useColors();
  const isNormal = useThemeStore((state) => state.mode === "normal");
  const { width } = useWindowDimensions();
  const [achievements, setAchievements] = useState<AchievementData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAchievements()
      .then(setAchievements)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const unlocked = achievements.filter((a) => a.unlocked).length;
  const total = achievements.length;

  // Group by category
  const grouped = achievements.reduce<Record<string, AchievementData[]>>((acc, a) => {
    (acc[a.category] ??= []).push(a);
    return acc;
  }, {});

  const categoryOrder = ["progress", "stages", "streaks", "money", "rank", "mastery", "decisions", "strategy"];

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.blue} size="large" />
        <Text style={[styles.loadingText, { color: colors.textDim }]}>
          {isNormal ? "Loading your wins..." : "LOADING ACHIEVEMENTS"}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Top bar */}
      <View style={[styles.topBar, { backgroundColor: colors.bgPanel, borderBottomColor: colors.borderPrimary }]}>
        <View style={styles.topLeft}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backBtn, { color: colors.blue }]}>← BACK</Text>
          </TouchableOpacity>
          <View style={[styles.barSep, { backgroundColor: colors.borderDim }]} />
          <Text style={[styles.topBarLabel, { color: colors.textDim }]}>
            {isNormal ? "🏆 Achievements" : "ACHIEVEMENTS"}
          </Text>
        </View>
        <View style={styles.topRight}>
          <ThemeModeToggle compact />
          <Text style={[styles.counter, { color: colors.blue }]}>
            {isNormal ? `${unlocked}/${total} earned` : `${unlocked}/${total} UNLOCKED`}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressBar, { backgroundColor: colors.borderDim }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.blue, width: total > 0 ? `${(unlocked / total) * 100}%` : "0%" }]} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {isNormal ? (
          <View style={[styles.section, { backgroundColor: colors.bgPanel, borderWidth: 1, borderColor: colors.borderDim, borderRadius: 18, padding: 16 }]}>
            <Text style={{ fontSize: 15, fontFamily: Fonts.sansBold, color: colors.textBright, marginBottom: 6 }}>
              Collect milestones as you learn
            </Text>
            <Text style={{ fontSize: 12, fontFamily: Fonts.sans, color: colors.textPrimary, lineHeight: 18 }}>
              Each badge marks progress in money habits, market lessons, and decision-making. Locked badges show what you can grow into next.
            </Text>
          </View>
        ) : null}
        {categoryOrder.map((cat) => {
          const items = grouped[cat];
          if (!items?.length) return null;
          const catUnlocked = items.filter((a) => a.unlocked).length;

          return (
            <View key={cat} style={styles.section}>
              <View style={[styles.sectionHeader, { borderBottomColor: colors.borderFaint }]}>
                <View style={[styles.blueDot, { backgroundColor: colors.blue }]} />
                <Text style={[styles.sectionTitle, { color: colors.blue }]}>
                  {isNormal ? (CATEGORY_LABELS[cat] ?? cat).replace("MONEY & PERFORMANCE", "Money & progress").replace("INVESTOR RANK", "Investor growth").replace("LEARNING MASTERY", "Learning wins").replace("DECISION QUALITY", "Decision quality").replace("STRATEGY & DECKS", "Strategies & decks").replace("STAGES", "Journey steps").replace("STREAKS", "Streaks") : CATEGORY_LABELS[cat] ?? cat.toUpperCase()}
                </Text>
                <Text style={[styles.sectionCount, { color: colors.textDim }]}>{catUnlocked}/{items.length}</Text>
              </View>
              <View style={[styles.grid, { maxWidth: width > 800 ? 800 : "100%" }]}>
                {items.map((a) => (
                  <AchievementCard key={a.key} achievement={a} />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  achCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgPanel,
    borderWidth: 1,
    borderRadius: 2,
    padding: 12,
    gap: 10,
    marginBottom: 8,
    overflow: "hidden",
  },
  achLocked: { opacity: 0.6 },
  achBand: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  achEmoji: { fontSize: 24, marginLeft: 4 },
  achContent: { flex: 1 },
  achTitle: {
    fontSize: 13,
    fontFamily: Fonts.sansBold,
    color: Colors.textBright,
    letterSpacing: 0.5,
  },
  achDesc: {
    fontSize: 11,
    fontFamily: Fonts.sans,
    color: Colors.textDim,
    marginTop: 2,
  },
  achDate: {
    fontSize: 9,
    fontFamily: Fonts.mono,
    color: Colors.textMuted,
    marginTop: 4,
  },
  tierBadge: {
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tierText: {
    fontSize: 8,
    fontFamily: Fonts.sansBold,
    letterSpacing: 1.5,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loading: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 11,
    fontFamily: Fonts.mono,
    color: Colors.textDim,
    letterSpacing: 2,
  },
  topBar: {
    height: 40,
    backgroundColor: Colors.bgPanel,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderPrimary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  topLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  topRight: { flexDirection: "row", alignItems: "center" },
  backBtn: {
    fontSize: 10,
    fontFamily: Fonts.sansBold,
    color: Colors.blue,
    letterSpacing: 1,
  },
  barSep: { width: 1, height: 14, backgroundColor: Colors.borderDim },
  topBarLabel: {
    fontSize: 9,
    fontFamily: Fonts.sansBold,
    color: Colors.textDim,
    letterSpacing: 2,
  },
  counter: {
    fontSize: 11,
    fontFamily: Fonts.mono,
    color: Colors.blue,
    letterSpacing: 1,
  },
  progressBar: {
    height: 3,
    backgroundColor: Colors.borderDim,
  },
  progressFill: {
    height: 3,
    backgroundColor: Colors.blue,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 20,
    alignItems: "center",
  },
  section: {
    width: "100%",
    maxWidth: 600,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderFaint,
    paddingBottom: 6,
  },
  blueDot: {
    width: 6,
    height: 6,
    borderRadius: 1,
    backgroundColor: Colors.blue,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: Fonts.sansBold,
    color: Colors.blue,
    letterSpacing: 2,
    flex: 1,
  },
  sectionCount: {
    fontSize: 9,
    fontFamily: Fonts.mono,
    color: Colors.textDim,
  },
  grid: {
    width: "100%",
  },
});
