import React, { useEffect, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, ActivityIndicator,
  Alert, useWindowDimensions, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useGameStore } from "../../store/gameStore";
import { swipe, getNextCard } from "../../services/game";
import { CardContainer } from "../../components/Card/CardContainer";
import { LessonOverlay } from "../../components/Card/LessonOverlay";
import { StatsPanel } from "../../components/HUD/StatsPanel";
import { MarketContextPill } from "../../components/HUD/MarketContextPill";
import { SidebarPanel } from "../../components/HUD/SidebarPanel";
import { PortfolioDonut } from "../../components/HUD/PortfolioDonut";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { Layout } from "../../constants/layout";

// ─── Bloomberg Terminal Grid Background ────────────────────────────────────
function TerminalGrid() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Horizontal scan lines */}
      {Array.from({ length: 30 }).map((_, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            top: i * 32,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: Colors.borderFaint,
            opacity: 0.6,
          }}
        />
      ))}
      {/* Vertical grid lines */}
      {Array.from({ length: 20 }).map((_, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: i * 72,
            top: 0,
            bottom: 0,
            width: 1,
            backgroundColor: Colors.borderFaint,
            opacity: 0.4,
          }}
        />
      ))}
    </View>
  );
}

// ─── Top Status Bar ─────────────────────────────────────────────────────────
function TopStatusBar({ session }: { session: any }) {
  const { t, i18n } = useTranslation();
  const now = new Date();
  const locale = i18n?.language || undefined;
  const timeStr = now.toLocaleTimeString(locale, { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <View style={tbStyles.bar}>
      <View style={tbStyles.left}>
        <Text style={tbStyles.logo}>CARDECON</Text>
        <View style={tbStyles.sep} />
        <Text style={tbStyles.label}>{t("hud.stage")}</Text>
        <Text style={tbStyles.value}>{session.stage}/5</Text>
        <View style={tbStyles.sep} />
        <Text style={tbStyles.label}>{t("hud.rank")}</Text>
        <Text style={tbStyles.value}>{session.investor_rank}</Text>
        <View style={tbStyles.sep} />
        <Text style={tbStyles.label}>{t("hud.capital")}</Text>
        <Text style={[tbStyles.value, { color: session.capital >= 10000 ? Colors.green : Colors.red }]}>
          ${Math.round(session.capital).toLocaleString()}
        </Text>
      </View>
      <View style={tbStyles.right}>
        <View style={tbStyles.liveIndicator} />
        <Text style={tbStyles.time}>{timeStr}</Text>
      </View>
    </View>
  );
}

const tbStyles = StyleSheet.create({
  bar: {
    height: Layout.headerHeight,
    backgroundColor: Colors.bgPanel,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderPrimary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 8 },
  right: { flexDirection: "row", alignItems: "center", gap: 8 },
  logo: {
    fontSize: 13,
    fontFamily: Fonts.mono,
    color: Colors.blue,
    letterSpacing: 3,
  },
  sep: { width: 1, height: 14, backgroundColor: Colors.borderDim },
  label: {
    fontSize: 9,
    fontFamily: Fonts.sansBold,
    color: Colors.textDim,
    letterSpacing: 1.5,
  },
  value: {
    fontSize: 11,
    fontFamily: Fonts.mono,
    color: Colors.textBright,
    letterSpacing: 0.5,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.green,
  },
  time: {
    fontSize: 11,
    fontFamily: Fonts.mono,
    color: Colors.textDim,
    letterSpacing: 1,
  },
});

// ─── Ghost card ──────────────────────────────────────────────────────────────
function GhostCard() {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: Layout.cardWidth,
        height: Layout.cardHeight,
        backgroundColor: Colors.cardSurface,
        borderRadius: Layout.cardBorderRadius,
        opacity: 0.45,
        transform: [{ scale: 0.96 }, { translateY: 14 }],
        borderWidth: 1,
        borderColor: Colors.cardBorder,
      }}
    />
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function PlayScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();

  const isWide = width >= Layout.wideBreakpoint;
  const isMedium = width >= Layout.tabletBreakpoint;

  const {
    session, currentCard, nextCard, lesson, isSwipeLocked,
    setSession, setCurrentCard, setNextCard, setLesson, setSwipeLocked,
  } = useGameStore();

  const [initializing, setInitializing] = React.useState(true);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    if (!session) {
      const t = setTimeout(() => router.replace("/(game)/index"), 0);
      return () => clearTimeout(t);
    }
    getNextCard(session.id)
      .then((c) => { if (mounted.current && c) setCurrentCard(c); })
      .catch(() => Alert.alert(t("profile.error"), t("auth.errors.unableConnect")))
      .finally(() => { if (mounted.current) setInitializing(false); });
    return () => { mounted.current = false; };
  }, []);

  const handleSwipe = useCallback(async (direction: "left" | "right") => {
    if (!session || !currentCard || isSwipeLocked) return;
    setSwipeLocked(true);
    // Immediately hide the card (it flew off) — show loading state
    setCurrentCard(null);
    try {
      const result = await swipe(session.id, currentCard.id, direction);
      setSession(result.session);
      // Show lesson overlay; store next card ready for after dismiss
      setNextCard(result.next_card ?? null);
      setLesson({ text: result.lesson, direction, reward: result.reward });
    } catch {
      setSwipeLocked(false);
      setCurrentCard(currentCard); // restore on error
      Alert.alert(t("profile.error"), t("auth.errors.unableConnect"));
    }
  }, [session, currentCard, isSwipeLocked]);

  const handleLessonDismiss = useCallback(() => {
    setLesson(null);
    if (!nextCard) {
      setCurrentCard(null);
      setNextCard(null);
      setSwipeLocked(false);
      if (session?.is_daily && session.daily_completed) {
        Alert.alert(
          t("play.dailyComplete"),
          t("play.dailyCompleteMsg", { amount: Math.round(session.streak_bonus_awarded).toLocaleString() }),
          [{ text: t("play.backToIndex"), onPress: () => router.replace("/(game)/index") }]
        );
      }
      return;
    }
    setCurrentCard(nextCard);
    setNextCard(null);
    setSwipeLocked(false);
  }, [nextCard, session, router]);

  if (initializing || !session) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.blue} size="large" />
        <Text style={styles.loadingText}>{t("play.initializingSession")}</Text>
      </View>
    );
  }

  const showSidebar = isWide || (isMedium && session.investor_rank >= 3);
  const showDonut = session.investor_rank >= 4 && isWide;
  const showMarketPill = session.investor_rank >= 2;

  // Card area: subtract sidebar if visible
  const sidebarW = showSidebar ? Layout.sidebarWidth : 0;
  const donutW = showDonut ? 140 : 0;
  const cardAreaW = width - sidebarW - donutW;
  const cardAreaH = height - Layout.headerHeight - Layout.statsPanelHeight;

  return (
    <View style={styles.container}>
      <TerminalGrid />

      {/* Top status bar */}
      <TopStatusBar session={session} />

      {/* Body */}
      <View style={styles.body}>
        {/* Left sidebar — Rank 3+ or wide screen */}
        {showSidebar && (
          <View style={[styles.sidePanel, { width: Layout.sidebarWidth }]}>
            <SidebarPanel session={session} />
          </View>
        )}

        {/* Center — card arena */}
        <View style={[styles.arena, { width: cardAreaW, height: cardAreaH }]}>
          {/* Panel border label */}
          <View style={styles.panelLabel}>
            <Text style={styles.panelLabelText}>{t("play.decisionEngine")}</Text>
          </View>

          {/* Ghost card — visible when a card is active OR lesson is showing */}
          {(nextCard || (lesson && nextCard)) && <GhostCard />}

          {/* Lesson overlay — replaces card after swipe */}
          {lesson ? (
            <LessonOverlay
              text={lesson.text}
              direction={lesson.direction}
              reward={lesson.reward}
              onDismiss={handleLessonDismiss}
            />
          ) : currentCard ? (
            /* key forces full remount so animation values reset for each new card */
            <CardContainer
              key={currentCard.id}
              card={currentCard}
              isLocked={isSwipeLocked}
              onSwipe={handleSwipe}
              areaWidth={cardAreaW}
              areaHeight={cardAreaH - 48}
            />
          ) : !initializing ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {session.is_daily && session.daily_completed
                  ? t("play.dailySessionComplete")
                  : t("play.loadingNextDecision")}
              </Text>
              <ActivityIndicator color={Colors.blue} size="small" style={{ marginTop: 10 }} />
            </View>
          ) : null}

          {/* Market context pill — Rank 2+ */}
          {showMarketPill && !lesson && (
            <View style={styles.pillRow}>
              <MarketContextPill stage={session.stage} capital={session.capital} />
            </View>
          )}

          {/* Swipe hints */}
          {currentCard && !isSwipeLocked && !lesson && (
            <View style={styles.swipeHints} pointerEvents="none">
              <Text style={[styles.swipeHintText, { color: Colors.red }]}>← {t("play.decline")}</Text>
              <Text style={[styles.swipeHintText, { color: Colors.green }]}>{t("play.accept")} →</Text>
            </View>
          )}
        </View>

        {/* Right panel — portfolio donut (Rank 4+, wide) */}
        {showDonut && (
          <View style={[styles.sidePanel, { width: donutW, alignItems: "center", paddingTop: 24 }]}>
            <Text style={styles.panelLabelText}>{t("play.portfolio")}</Text>
            <PortfolioDonut weights={session.portfolio_weights} size={100} />
          </View>
        )}
      </View>

      {/* Bottom stats panel */}
      <StatsPanel session={session} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
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
  body: {
    flex: 1,
    flexDirection: "row",
  },
  sidePanel: {
    borderRightWidth: 1,
    borderRightColor: Colors.borderDim,
  },
  arena: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    borderRightWidth: 1,
    borderRightColor: Colors.borderFaint,
  },
  panelLabel: {
    position: "absolute",
    top: 8,
    left: 12,
  },
  panelLabelText: {
    fontSize: 8,
    fontFamily: Fonts.sansBold,
    color: Colors.textMuted,
    letterSpacing: 2,
  },
  pillRow: {
    position: "absolute",
    bottom: 52,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  swipeHints: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  swipeHintText: {
    fontSize: 9,
    fontFamily: Fonts.sansBold,
    letterSpacing: 2,
    opacity: 0.5,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    width: Layout.cardWidth,
    height: Layout.cardHeight,
  },
  emptyText: {
    fontSize: 9,
    fontFamily: Fonts.sansBold,
    color: Colors.textDim,
    letterSpacing: 2,
  },
});
