import React, { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, useWindowDimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { getSession, getSessionHistory, SessionData, GameEventData } from "../../../services/game";
import { useGameStore } from "../../../store/gameStore";
import { Colors } from "../../../constants/colors";
import { Fonts } from "../../../constants/fonts";
import { MarkdownText } from "../../../components/MarkdownText";
import { AppTopBar } from "../../../components/navigation/AppTopBar";
import { ThemeModeToggle } from "../../../components/theme/ThemeModeToggle";

const TYPE_COLOR: Record<string, string> = {
  education: Colors.blue,
  event: Colors.amber,
  action: Colors.teal,
};

const TYPE_LABEL: Record<string, string> = {
  education: "EDU",
  event: "EVT",
  action: "ACT",
};

const BAND_COLORS: Record<string, string> = {
  red: "#d32f2f",
  green: "#2e7d32",
  amber: "#f57f17",
  purple: "#6a1b9a",
  steel_blue: "#1565c0",
};

function EventCard({ event, index, t }: { event: GameEventData; index: number; t: (k: string, o?: any) => string }) {
  const [expanded, setExpanded] = useState(false);
  const card = event.card;
  const accepted = event.action === "right";
  const accentColor = accepted ? Colors.green : Colors.red;
  const bandColor = card ? (BAND_COLORS[card.card_band_color] ?? Colors.blue) : Colors.borderDim;
  const lesson = card ? (accepted ? card.right_lesson : card.left_lesson) : null;
  const choice = card ? (accepted ? card.right_choice : card.left_choice) : null;
  const rewardSign = event.reward >= 0 ? "+" : "";

  return (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.85}
    >
      {/* Left band */}
      <View style={[styles.eventBand, { backgroundColor: bandColor }]} />

      <View style={styles.eventBody}>
        {/* Top row */}
        <View style={styles.eventTop}>
          {/* Index + type */}
          <View style={styles.eventMeta}>
            <Text style={styles.eventIndex}>#{index + 1}</Text>
            {card && (
              <View style={[styles.typePill, { borderColor: TYPE_COLOR[card.type] + "66" }]}>
                <Text style={[styles.typePillText, { color: TYPE_COLOR[card.type] }]}>
                  {TYPE_LABEL[card.type]}
                </Text>
              </View>
            )}
          </View>

          {/* Card title */}
          <View style={styles.eventTitleBlock}>
            <Text style={styles.eventEmoji}>{card?.emoji ?? "•"}</Text>
            <Text style={styles.eventTitle} numberOfLines={expanded ? undefined : 1}>
              {card?.title ?? t("sessionDetail.unknownCard")}
            </Text>
          </View>

          {/* Decision + reward */}
          <View style={styles.eventRight}>
            <View style={[styles.decisionBadge, { borderColor: accentColor + "55" }]}>
              <Text style={[styles.decisionText, { color: accentColor }]}>
                {accepted ? t("sessionDetail.accepted") : t("sessionDetail.declined")}
              </Text>
            </View>
            <Text style={[styles.rewardText, { color: accentColor }]}>
              {rewardSign}{event.reward.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Expanded detail */}
        {expanded && card && (
          <View style={styles.eventDetail}>
            <View style={styles.choiceRow}>
              <View style={[styles.choiceChip, { borderColor: Colors.red + "55" }]}>
                <Text style={[styles.choiceLabel, { color: Colors.red }]}>{t("sessionDetail.choiceDecline")}</Text>
                <Text style={styles.choiceText}>{card.left_choice}</Text>
              </View>
              <View style={[styles.choiceChip, styles.choiceChipActive, { borderColor: accentColor }]}>
                <Text style={[styles.choiceLabel, { color: accentColor }]}>
                  {t("sessionDetail.yourChoice")}
                </Text>
                <Text style={styles.choiceText}>
                  {accepted ? card.right_choice : card.left_choice}
                </Text>
              </View>
              {accepted && (
                <View style={[styles.choiceChip, { borderColor: Colors.green + "55" }]}>
                  <Text style={[styles.choiceLabel, { color: Colors.green }]}>{t("sessionDetail.choiceAccept")}</Text>
                  <Text style={styles.choiceText}>{card.right_choice}</Text>
                </View>
              )}
            </View>

            {lesson && (
              <View style={styles.lessonBlock}>
                <Text style={styles.lessonLabel}>{t("sessionDetail.lesson")}</Text>
                <MarkdownText
                  text={lesson}
                  style={styles.lessonText}
                  boldStyle={styles.lessonTextBold}
                />
              </View>
            )}

            <View style={styles.detailMeta}>
              <Text style={styles.detailMetaText}>
                {t("sessionDetail.difficulty", { value: Math.round(card.difficulty * 100), topics: card.topics.join(", ") || t("sessionDetail.general") })}
              </Text>
              <Text style={styles.detailMetaText}>
                {new Date(event.created_at).toLocaleTimeString()}
              </Text>
            </View>
          </View>
        )}

        {!expanded && (
          <Text style={styles.tapHint}>{t("sessionDetail.tapExpand")}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function SessionDetailScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { setSession } = useGameStore();
  const [session, setSessionState] = useState<SessionData | null>(null);
  const [history, setHistory] = useState<GameEventData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([getSession(id), getSessionHistory(id)])
      .then(([sess, hist]) => {
        setSessionState(sess);
        setHistory(hist);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleContinue = () => {
    if (!session) return;
    setSession(session);
    router.push("/(game)/play");
  };

  const totalReward = history.reduce((s, e) => s + e.reward, 0);
  const acceptedCount = history.filter((e) => e.action === "right").length;
  const declinedCount = history.filter((e) => e.action === "left").length;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push("/(game)/sessions");
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.blue} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppTopBar
        label={t("sessionDetail.topBar")}
        onBack={handleBack}
        rightContent={
          <>
            <ThemeModeToggle compact />
            {session ? (
              <TouchableOpacity style={styles.continueTopBtn} onPress={handleContinue}>
                <Text style={styles.continueTopBtnText}>{t("sessionDetail.continue")}</Text>
              </TouchableOpacity>
            ) : null}
          </>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Session summary */}
        {session && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{t("sessionDetail.summary.finalCapital")}</Text>
                <Text style={[styles.summaryValue, { color: session.capital >= 10000 ? Colors.green : Colors.red }]}>
                  ${Math.round(session.capital).toLocaleString()}
                </Text>
              </View>
              <View style={styles.summarySep} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{t("sessionDetail.summary.decisions")}</Text>
                <Text style={styles.summaryValue}>{history.length}</Text>
              </View>
              <View style={styles.summarySep} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{t("sessionDetail.summary.accepted")}</Text>
                <Text style={[styles.summaryValue, { color: Colors.green }]}>{acceptedCount}</Text>
              </View>
              <View style={styles.summarySep} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{t("sessionDetail.summary.declined")}</Text>
                <Text style={[styles.summaryValue, { color: Colors.red }]}>{declinedCount}</Text>
              </View>
              <View style={styles.summarySep} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{t("sessionDetail.summary.stage")}</Text>
                <Text style={styles.summaryValue}>{session.stage}/5</Text>
              </View>
            </View>
          </View>
        )}

        {/* Cards header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionTitle}>{t("sessionDetail.decisionLog")}</Text>
          <Text style={styles.sectionSub}>{t("sessionDetail.decisionSub", { count: history.length })}</Text>
        </View>

        {/* Event cards */}
        {history.length === 0 ? (
          <Text style={styles.emptyText}>{t("sessionDetail.empty")}</Text>
        ) : (
          history.map((event, i) => (
            <EventCard key={event.id} event={event} index={i} t={t} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loading: { flex: 1, backgroundColor: Colors.bg, alignItems: "center", justifyContent: "center" },
  continueTopBtn: {
    borderWidth: 1, borderColor: Colors.blue + "66",
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 2,
  },
  continueTopBtnText: { fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.blue, letterSpacing: 1.5 },

  scroll: { padding: 16, gap: 10, alignItems: "center" },

  summaryCard: {
    width: "100%", maxWidth: 680,
    backgroundColor: Colors.bgPanel,
    borderWidth: 1, borderColor: Colors.borderDim, borderRadius: 2,
    overflow: "hidden",
  },
  summaryRow: { flexDirection: "row", flexWrap: "wrap" },
  summaryItem: { flex: 1, minWidth: 80, padding: 14, alignItems: "center" },
  summarySep: { width: 1, backgroundColor: Colors.borderFaint },
  summaryLabel: { fontSize: 7, fontFamily: Fonts.sansBold, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 4 },
  summaryValue: { fontSize: 16, fontFamily: Fonts.mono, color: Colors.textBright, letterSpacing: 0.5 },

  sectionHeader: {
    width: "100%", maxWidth: 680,
    flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6,
  },
  sectionDot: { width: 5, height: 5, borderRadius: 1, backgroundColor: Colors.blue },
  sectionTitle: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.blue, letterSpacing: 2 },
  sectionSub: { fontSize: 8, fontFamily: Fonts.mono, color: Colors.textMuted, marginLeft: "auto" as any },
  emptyText: { fontSize: 11, fontFamily: Fonts.mono, color: Colors.textMuted },

  // Event card
  eventCard: {
    width: "100%", maxWidth: 680,
    backgroundColor: Colors.bgPanel,
    borderWidth: 1, borderColor: Colors.borderDim,
    borderRadius: 2, flexDirection: "row", overflow: "hidden",
  },
  eventBand: { width: 3 },
  eventBody: { flex: 1, padding: 12 },

  eventTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  eventMeta: { flexDirection: "row", alignItems: "center", gap: 6, width: 56 },
  eventIndex: { fontSize: 9, fontFamily: Fonts.mono, color: Colors.textMuted, width: 24 },
  typePill: {
    borderWidth: 1, borderRadius: 2, paddingHorizontal: 4, paddingVertical: 1,
  },
  typePillText: { fontSize: 7, fontFamily: Fonts.sansBold, letterSpacing: 1 },

  eventTitleBlock: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  eventEmoji: { fontSize: 16 },
  eventTitle: { flex: 1, fontSize: 13, fontFamily: Fonts.mono, color: Colors.textBright, letterSpacing: 0.5 },

  eventRight: { alignItems: "flex-end", gap: 3 },
  decisionBadge: {
    borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2,
  },
  decisionText: { fontSize: 7, fontFamily: Fonts.sansBold, letterSpacing: 1.5 },
  rewardText: { fontSize: 10, fontFamily: Fonts.mono, letterSpacing: 0.5 },

  tapHint: {
    fontSize: 7, fontFamily: Fonts.sansBold, color: Colors.textMuted,
    letterSpacing: 1.5, marginTop: 6, textAlign: "right",
  },

  // Expanded detail
  eventDetail: {
    marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.borderFaint,
    gap: 10,
  },
  choiceRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  choiceChip: {
    flex: 1, minWidth: 100,
    borderWidth: 1, borderColor: Colors.borderDim,
    borderRadius: 2, padding: 8, gap: 4,
  },
  choiceChipActive: { backgroundColor: Colors.bgSurface },
  choiceLabel: { fontSize: 7, fontFamily: Fonts.sansBold, letterSpacing: 1.5 },
  choiceText: { fontSize: 10, fontFamily: Fonts.sans, color: Colors.textDim, lineHeight: 14 },

  lessonBlock: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.borderFaint,
    borderRadius: 2, padding: 10, gap: 4,
  },
  lessonLabel: { fontSize: 7, fontFamily: Fonts.sansBold, color: Colors.textMuted, letterSpacing: 2 },
  lessonText: { fontSize: 12, fontFamily: Fonts.serifItalic, color: Colors.textPrimary, lineHeight: 18 },
  lessonTextBold: { fontFamily: Fonts.serif },

  detailMeta: {
    flexDirection: "row", justifyContent: "space-between",
  },
  detailMetaText: { fontSize: 8, fontFamily: Fonts.mono, color: Colors.textMuted },
});
