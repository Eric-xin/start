import React, { useEffect, useCallback, useRef, useState } from "react";
import {
  View, Text, StyleSheet, ActivityIndicator,
  Alert, useWindowDimensions, Platform, TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { usePortfolioStore } from "../../store/portfolioStore";
import { playCard, getNextCard } from "../../services/portfolio";
import type { AchievementData } from "../../services/achievements";
import { CardContainer } from "../../components/Card/CardContainer";
import { LessonOverlay } from "../../components/Card/LessonOverlay";
import { AchievementToast } from "../../components/AchievementToast";
import { StatsPanel } from "../../components/HUD/StatsPanel";
import { MarketContextPill } from "../../components/HUD/MarketContextPill";
import { SidebarPanel } from "../../components/HUD/SidebarPanel";
import { MarketPanel } from "../../components/panels/MarketPanel";
import { NewsPanel } from "../../components/panels/NewsPanel";
import { PortfolioPanel } from "../../components/panels/PortfolioPanel";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { Layout } from "../../constants/layout";

type PanelType = "market" | "news" | "portfolio" | null;

// ─── Bloomberg Terminal Grid Background ────────────────────────────────────
function TerminalGrid() {
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}>
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
function TopStatusBar({
  session,
  onExit,
  activePanel,
  onOpenPanel,
}: {
  session: any;
  onExit: () => void;
  activePanel: PanelType;
  onOpenPanel: (p: PanelType) => void;
}) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const panelBtn = (id: Exclude<PanelType, null>, label: string) => {
    const active = activePanel === id;
    return (
      <TouchableOpacity
        key={id}
        style={[tbStyles.panelBtn, active && tbStyles.panelBtnActive]}
        onPress={() => onOpenPanel(active ? null : id)}
      >
        <Text style={[tbStyles.panelBtnText, active && tbStyles.panelBtnTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={tbStyles.bar}>
      <View style={tbStyles.left}>
        <Text style={tbStyles.logo}>CARDECON</Text>
        <View style={tbStyles.sep} />
        <Text style={tbStyles.label}>STAGE</Text>
        <Text style={tbStyles.value}>{session.stage}/5</Text>
        <View style={tbStyles.sep} />
        <Text style={tbStyles.label}>RANK</Text>
        <Text style={tbStyles.value}>{session.investor_rank}</Text>
        <View style={tbStyles.sep} />
        <Text style={tbStyles.label}>CAPITAL</Text>
        <Text style={[tbStyles.value, { color: session.capital >= 10000 ? Colors.green : Colors.red }]}>
          ${Math.round(session.capital).toLocaleString()}
        </Text>
      </View>

      {/* ── Panel trigger buttons ── */}
      <View style={tbStyles.panelBtns}>
        {panelBtn("market", "MARKET")}
        {panelBtn("news", "NEWS")}
        {panelBtn("portfolio", "PORTFOLIO")}
      </View>

      <View style={tbStyles.right}>
        <View style={tbStyles.liveIndicator} />
        <Text style={tbStyles.time}>{timeStr}</Text>
        <TouchableOpacity style={tbStyles.exitBtn} onPress={onExit}>
          <Text style={tbStyles.exitBtnText}>EXIT</Text>
        </TouchableOpacity>
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
  panelBtns: {
    flexDirection: "row",
    gap: 4,
    position: "absolute",
    left: "50%",
    transform: [{ translateX: -126 }],
  },
  panelBtn: {
    borderWidth: 1,
    borderColor: Colors.borderDim,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 2,
  },
  panelBtnActive: {
    borderColor: Colors.blue,
    backgroundColor: Colors.blueDim,
  },
  panelBtnText: {
    fontSize: 9,
    fontFamily: Fonts.sansBold,
    color: Colors.textDim,
    letterSpacing: 1.5,
  },
  panelBtnTextActive: {
    color: Colors.blue,
  },
  exitBtn: {
    borderWidth: 1,
    borderColor: Colors.borderDim,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 2,
    marginLeft: 4,
  },
  exitBtnText: {
    fontSize: 9,
    fontFamily: Fonts.sansBold,
    color: Colors.textDim,
    letterSpacing: 1.5,
  },
});

// ─── Ghost card ──────────────────────────────────────────────────────────────
function GhostCard() {
  return (
    <View
      style={{
        position: "absolute",
        width: Layout.cardWidth,
        height: Layout.cardHeight,
        backgroundColor: Colors.cardSurface,
        borderRadius: Layout.cardBorderRadius,
        opacity: 0.45,
        transform: [{ scale: 0.96 }, { translateY: 14 }],
        borderWidth: 1,
        pointerEvents: "none",
        borderColor: Colors.cardBorder,
      }}
    />
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function PlayScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const isWide = width >= Layout.wideBreakpoint;
  const isMedium = width >= Layout.tabletBreakpoint;

  const {
    portfolio, currentCard, nextCard, lesson, isSwipeLocked,
    setPortfolio, setCurrentCard, setNextCard, setLesson, setSwipeLocked,
  } = usePortfolioStore();

  const [initializing, setInitializing] = React.useState(true);
  const [achievementQueue, setAchievementQueue] = useState<AchievementData[]>([]);
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    if (currentCard) {
      // Card was pre-loaded from the index screen
      setInitializing(false);
      return;
    }
    if (!portfolio) {
      const t = setTimeout(() => router.replace("/(game)"), 0);
      return () => clearTimeout(t);
    }
    getNextCard()
      .then((c) => { if (mounted.current && c) setCurrentCard(c); })
      .catch(() => Alert.alert("Error", "Could not load card."))
      .finally(() => { if (mounted.current) setInitializing(false); });
    return () => { mounted.current = false; };
  }, []);

  const handleSwipe = useCallback(async (direction: "left" | "right") => {
    if (!currentCard || isSwipeLocked) return;
    setSwipeLocked(true);
    setCurrentCard(null);
    try {
      const result = await playCard(currentCard.id, direction);
      setPortfolio(result.portfolio);
      setNextCard(result.next_card ?? null);
      setLesson({ text: result.lesson, direction, reward: result.reward });
      if (result.newly_unlocked_achievements?.length) {
        setAchievementQueue((q) => [...q, ...result.newly_unlocked_achievements]);
      }
    } catch {
      setSwipeLocked(false);
      setCurrentCard(currentCard);
      Alert.alert("Error", "Swipe failed. Check connection.");
    }
  }, [currentCard, isSwipeLocked]);

  const handleLessonDismiss = useCallback(() => {
    setLesson(null);
    setCurrentCard(nextCard);
    setNextCard(null);
    setSwipeLocked(false);
  }, [nextCard]);

  if (initializing || (!currentCard && !lesson)) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.blue} size="large" />
        <Text style={styles.loadingText}>LOADING CARDS</Text>
      </View>
    );
  }

  const rank = portfolio?.investor_rank ?? 1;
  // Build a session-shaped proxy so HUD components keep working unchanged
  const sessionProxy = portfolio
    ? { ...portfolio, progress: (portfolio.total_cards_played % 20) / 20, market_state: portfolio.market_state ?? {} }
    : { capital: 0, stage: 1, investor_rank: 1, progress: 0, portfolio_weights: {}, market_state: {} };
  const showSidebar = isWide || (isMedium && rank >= 3);
  const showMarketPill = rank >= 2;

  // Card area: subtract sidebar if visible
  const sidebarW = showSidebar ? Layout.sidebarWidth : 0;
  const cardAreaW = width - sidebarW;
  const cardAreaH = height - Layout.headerHeight - Layout.statsPanelHeight;

  return (
    <View style={styles.container}>
      <TerminalGrid />

      {/* Achievement toast */}
      {achievementQueue.length > 0 && (
        <AchievementToast
          key={achievementQueue[0].key}
          emoji={achievementQueue[0].emoji}
          title={achievementQueue[0].title}
          tier={achievementQueue[0].tier}
          onDone={() => setAchievementQueue((q) => q.slice(1))}
        />
      )}

      {/* Top status bar */}
      <TopStatusBar
        session={sessionProxy}
        onExit={() => router.replace("/(game)")}
        activePanel={activePanel}
        onOpenPanel={setActivePanel}
      />

      {/* Body */}
      <View style={styles.body}>
        {/* Left sidebar — Rank 3+ or wide screen */}
        {showSidebar && (
          <View style={[styles.sidePanel, { width: Layout.sidebarWidth }]}>
            <SidebarPanel session={sessionProxy} />
          </View>
        )}

        {/* Center — card arena */}
        <View style={[styles.arena, { width: cardAreaW, height: cardAreaH }]}>
          {/* Panel border label */}
          <View style={styles.panelLabel}>
            <Text style={styles.panelLabelText}>DECISION ENGINE</Text>
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
              <Text style={styles.emptyText}>LOADING NEXT DECISION...</Text>
              <ActivityIndicator color={Colors.blue} size="small" style={{ marginTop: 10 }} />
            </View>
          ) : null}

          {/* Market context pill — Rank 2+ */}
          {showMarketPill && !lesson && (
            <View style={styles.pillRow}>
              <MarketContextPill stage={sessionProxy.stage} capital={sessionProxy.capital} marketState={sessionProxy.market_state} />
            </View>
          )}

          {/* Swipe hints */}
          {currentCard && !isSwipeLocked && !lesson && (
            <View style={styles.swipeHints}>
              <Text style={[styles.swipeHintText, { color: Colors.red }]}>← DECLINE</Text>
              <Text style={[styles.swipeHintText, { color: Colors.green }]}>ACCEPT →</Text>
            </View>
          )}
        </View>

      </View>

      {/* Bottom stats panel */}
      <StatsPanel session={sessionProxy} />

      {/* ── Floating panels ── */}
      <MarketPanel visible={activePanel === "market"} onClose={() => setActivePanel(null)} />
      <NewsPanel visible={activePanel === "news"} onClose={() => setActivePanel(null)} />
      <PortfolioPanel
        visible={activePanel === "portfolio"}
        onClose={() => setActivePanel(null)}
        portfolio={portfolio}
      />
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
    pointerEvents: "none",
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
