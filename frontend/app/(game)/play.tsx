import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { usePortfolioStore } from "../../store/portfolioStore";
import { getNextCard, playCard } from "../../services/portfolio";
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
import { useColors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { Layout } from "../../constants/layout";
import { useThemeStore } from "../../store/themeStore";
import { useCompanionStore } from "../../store/companionStore";
import { pickPhrase, type CompanionId } from "../../constants/companions";
import { CompanionPresence } from "../../components/companion/CompanionPresence";
import { CompanionChatDrawer } from "../../components/companion/CompanionChatDrawer";
import { ThemeModeToggle } from "../../components/theme/ThemeModeToggle";

type PanelType = "market" | "news" | "portfolio" | null;

function TerminalGrid() {
  const colors = useColors();

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}>
      {Array.from({ length: 30 }).map((_, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            top: i * 32,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: colors.borderFaint,
            opacity: 0.6,
          }}
        />
      ))}
      {Array.from({ length: 20 }).map((_, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: i * 72,
            top: 0,
            bottom: 0,
            width: 1,
            backgroundColor: colors.borderFaint,
            opacity: 0.4,
          }}
        />
      ))}
    </View>
  );
}

function TopStatusBar({
  session,
  onExit,
  activePanel,
  onOpenPanel,
  t,
}: {
  session: any;
  onExit: () => void;
  activePanel: PanelType;
  onOpenPanel: (p: PanelType) => void;
  t: (k: string) => string;
}) {
  const colors = useColors();
  const isNormal = useThemeStore((state) => state.mode === "normal");
  const styles = createTopBarStyles(colors, isNormal);
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const panelBtn = (id: Exclude<PanelType, null>, label: string) => {
    const active = activePanel === id;
    return (
      <TouchableOpacity
        key={id}
        style={[styles.panelBtn, active && styles.panelBtnActive]}
        onPress={() => onOpenPanel(active ? null : id)}
      >
        <Text style={[styles.panelBtnText, active && styles.panelBtnTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.bar}>
      <View style={styles.left}>
        <Text style={styles.logo}>CARDECON</Text>
        <View style={styles.sep} />
        <Text style={styles.label}>{isNormal ? t("play.top.cash") : t("play.top.stage")}</Text>
        <Text style={[styles.value, { color: isNormal ? (session.capital >= 10000 ? colors.green : session.capital >= 8500 ? colors.amber : colors.red) : colors.textBright }]}>
          {isNormal ? `$${Math.round(session.capital).toLocaleString()}` : `${session.stage}/5`}
        </Text>
        {!isNormal && (
          <>
            <View style={styles.sep} />
            <Text style={styles.label}>{t("play.top.rank")}</Text>
            <Text style={styles.value}>{session.investor_rank}</Text>
            <View style={styles.sep} />
            <Text style={styles.label}>{t("play.top.capital")}</Text>
          </>
        )}
        {!isNormal && (
        <Text style={[styles.value, { color: session.capital >= 10000 ? colors.green : colors.red }]}>
          ${Math.round(session.capital).toLocaleString()}
        </Text>
        )}
      </View>

      <View style={styles.panelBtns}>
        {panelBtn("market", isNormal ? t("play.top.market") : t("play.top.marketPro"))}
        {panelBtn("news", isNormal ? t("play.top.news") : t("play.top.newsPro"))}
        {panelBtn("portfolio", isNormal ? t("play.top.portfolio") : t("play.top.portfolioPro"))}
      </View>

      <View style={styles.right}>
        <View style={styles.liveIndicator} />
        <Text style={styles.time}>{timeStr}</Text>

        <ThemeModeToggle />

        <TouchableOpacity style={styles.exitBtn} onPress={onExit}>
          <Text style={styles.exitBtnText}>{t("play.top.exit")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function GhostCard() {
  const colors = useColors();
  return (
    <View
      style={{
        position: "absolute",
        width: Layout.cardWidth,
        height: Layout.cardHeight,
        backgroundColor: colors.cardSurface,
        borderRadius: Layout.cardBorderRadius,
        opacity: 0.45,
        transform: [{ scale: 0.96 }, { translateY: 14 }],
        borderWidth: 1,
        pointerEvents: "none",
        borderColor: colors.cardBorder,
      }}
    />
  );
}

export default function PlayScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const isNormal = useThemeStore((state) => state.mode === "normal");
  const styles = createStyles(colors, isNormal);
  const { width, height } = useWindowDimensions();

  const isWide = width >= Layout.wideBreakpoint;
  const isMedium = width >= Layout.tabletBreakpoint;

  const {
    portfolio,
    currentCard,
    nextCard,
    lesson,
    isSwipeLocked,
    updatePortfolio,
    setCurrentCard,
    setNextCard,
    setLesson,
    setSwipeLocked,
  } = usePortfolioStore();

  const companionId = useCompanionStore((state) => state.companionId);
  const setCompanion = useCompanionStore((state) => state.setCompanion);
  const showBubble = useCompanionStore((state) => state.showBubble);
  const openLLM = useCompanionStore((state) => state.openLLM);
  const recentPhrases = useCompanionStore((state) => state.recentPhrases);

  const [initializing, setInitializing] = useState(true);
  const [achievementQueue, setAchievementQueue] = useState<AchievementData[]>([]);
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const [isChoiceFlipped, setIsChoiceFlipped] = useState<boolean>(Math.random() < 0.5);
  const mounted = useRef(false);
  const welcomed = useRef(false);

  useEffect(() => {
    mounted.current = true;
    if (currentCard) {
      setInitializing(false);
      return;
    }
    if (!portfolio) {
      const t = setTimeout(() => router.replace("/(game)"), 0);
      return () => clearTimeout(t);
    }
    getNextCard()
      .then((c) => {
        if (mounted.current && c) setCurrentCard(c);
      })
      .catch(() => Alert.alert(t("common.error"), t("play.errors.loadCard")))
      .finally(() => {
        if (mounted.current) setInitializing(false);
      });
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!portfolio?.companion_id) return;
    setCompanion(portfolio.companion_id as CompanionId);
  }, [portfolio?.companion_id, setCompanion]);

  useEffect(() => {
    if (!companionId || welcomed.current) return;
    welcomed.current = true;
    showBubble(pickPhrase(companionId, "welcome", { recentPhrases }));
  }, [companionId, recentPhrases, showBubble]);

  const handleSwipe = useCallback(
    async (direction: "left" | "right") => {
      if (!currentCard || isSwipeLocked) return;
      setSwipeLocked(true);
      setCurrentCard(null);
      try {
        const action = isChoiceFlipped ? (direction === "left" ? "right" : "left") : direction;
        const previousRank = portfolio?.investor_rank ?? 1;
        const result = await playCard(currentCard.id, action);
        updatePortfolio(result.portfolio);
        setNextCard(result.next_card ?? null);
        setLesson({
          text: result.lesson,
          direction,
          reward: result.reward,
          isCorrect: result.is_correct,
        });
        if (result.newly_unlocked_achievements?.length) {
          setAchievementQueue((q) => [...q, ...result.newly_unlocked_achievements]);
        }
        if (companionId) {
          const context =
            result.portfolio.investor_rank > previousRank
              ? "rank_up"
              : result.is_correct
                ? "correct"
                : "incorrect";
          showBubble(pickPhrase(companionId, context, { recentPhrases }));
        }
      } catch {
        setSwipeLocked(false);
        setCurrentCard(currentCard);
        Alert.alert(t("common.error"), t("play.errors.swipe"));
      }
    },
    [companionId, currentCard, isChoiceFlipped, isSwipeLocked, portfolio?.investor_rank, recentPhrases, setCurrentCard, setLesson, setNextCard, updatePortfolio, setSwipeLocked, showBubble, t]
  );

  const handleLessonDismiss = useCallback(() => {
    if (companionId) {
      showBubble(pickPhrase(companionId, "lesson_comment", { recentPhrases }));
    }
    setLesson(null);
    setCurrentCard(nextCard);
    setNextCard(null);
    setIsChoiceFlipped(Math.random() < 0.5);
    setSwipeLocked(false);
  }, [companionId, nextCard, recentPhrases, setCurrentCard, setLesson, setNextCard, setSwipeLocked, showBubble]);

  if (initializing || (!currentCard && !lesson)) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.blue} size="large" />
        <Text style={styles.loadingText}>{isNormal ? t("play.loading") : t("play.loadingPro")}</Text>
      </View>
    );
  }

  const rank = portfolio?.investor_rank ?? 1;
  const sessionProxy = portfolio
    ? {
        ...portfolio,
        progress: (portfolio.total_cards_played % 20) / 20,
        market_state: portfolio.market_state ?? {},
      }
    : { capital: 0, stage: 1, investor_rank: 1, progress: 0, portfolio_weights: {}, market_state: {} };
  const showSidebar = isWide || (isMedium && (isNormal || rank >= 3));
  const showMarketPill = rank >= 2;
  const sidebarW = showSidebar ? (isNormal ? Math.min(Math.max(width * 0.34, 320), 420) : Layout.sidebarWidth) : 0;
  const cardAreaW = width - sidebarW;
  const cardAreaH = height - Layout.headerHeight - Layout.statsPanelHeight;

  return (
    <View style={styles.container}>
      <TerminalGrid />

      {achievementQueue.length > 0 && (
        <AchievementToast
          key={achievementQueue[0].key}
          emoji={achievementQueue[0].emoji}
          title={achievementQueue[0].title}
          tier={achievementQueue[0].tier}
          onDone={() => setAchievementQueue((q) => q.slice(1))}
        />
      )}

      <TopStatusBar
        session={sessionProxy}
        onExit={() => router.replace("/(game)")}
        activePanel={activePanel}
        onOpenPanel={setActivePanel}
        t={t}
      />

      <View style={styles.body}>
        {showSidebar && (
          <View style={[styles.sidePanel, { width: sidebarW }]}>
            <SidebarPanel session={sessionProxy} />
          </View>
        )}

        <View style={[styles.arena, { width: cardAreaW, height: cardAreaH }]}>
          <View style={styles.panelLabel}>
            <Text style={styles.panelLabelText}>{isNormal ? t("play.decisionTitle") : t("play.decisionTitlePro")}</Text>
          </View>

          {(nextCard || (lesson && nextCard)) && <GhostCard />}

          {lesson ? (
            <LessonOverlay
              text={lesson.text}
              direction={lesson.direction}
              reward={lesson.reward}
              isCorrect={lesson.isCorrect}
              onDismiss={handleLessonDismiss}
            />
          ) : currentCard ? (
            <CardContainer
              key={currentCard.id}
              card={currentCard}
              isLocked={isSwipeLocked}
              onSwipe={handleSwipe}
              isChoiceFlipped={isChoiceFlipped}
              areaWidth={cardAreaW}
              areaHeight={cardAreaH - 48}
            />
          ) : !initializing ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{isNormal ? t("play.nextLoading") : t("play.nextLoadingPro")}</Text>
              <ActivityIndicator color={colors.blue} size="small" style={{ marginTop: 10 }} />
            </View>
          ) : null}

          {companionId ? (
            <CompanionPresence
              companionId={companionId}
              marketState={sessionProxy.market_state}
              lessonVisible={Boolean(lesson)}
              onAsk={openLLM}
            />
          ) : null}

          {showMarketPill && !lesson && (
            <View style={styles.pillRow}>
              <MarketContextPill
                stage={sessionProxy.stage}
                capital={sessionProxy.capital}
                marketState={sessionProxy.market_state}
              />
            </View>
          )}

          {currentCard && !isSwipeLocked && !lesson && (
            <View style={styles.swipeHints} pointerEvents="none">
              <Text style={styles.swipeHintText}>{isNormal ? t("play.hints.left") : t("play.hints.leftPro")}</Text>
              <Text style={styles.swipeHintText}>{isNormal ? t("play.hints.right") : t("play.hints.rightPro")}</Text>
            </View>
          )}
        </View>
      </View>

      <StatsPanel session={sessionProxy} />

      <MarketPanel visible={activePanel === "market"} onClose={() => setActivePanel(null)} />
      <NewsPanel visible={activePanel === "news"} onClose={() => setActivePanel(null)} />
      <PortfolioPanel
        visible={activePanel === "portfolio"}
        onClose={() => setActivePanel(null)}
        portfolio={portfolio}
      />

      {companionId ? (
        <CompanionChatDrawer
          companionId={companionId}
          context={{
            current_card: currentCard
              ? {
                  title: currentCard.title,
                  body: currentCard.body,
                  topics: currentCard.topics,
                }
              : null,
            market_state: sessionProxy.market_state,
            news_items: [],
            portfolio: portfolio
              ? {
                  capital: portfolio.capital,
                  stage: portfolio.stage,
                  investor_rank: portfolio.investor_rank,
                }
              : null,
          }}
        />
      ) : null}
    </View>
  );
}

const createTopBarStyles = (colors: ReturnType<typeof useColors>, isNormal: boolean) =>
  StyleSheet.create({
    bar: {
      height: Layout.headerHeight,
      backgroundColor: colors.bgPanel,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderPrimary,
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
      color: colors.blue,
      letterSpacing: 3,
    },
    sep: { width: 1, height: 14, backgroundColor: colors.borderDim },
    label: {
      fontSize: 9,
      fontFamily: Fonts.sansBold,
      color: colors.textDim,
      letterSpacing: isNormal ? 0.5 : 1.5,
    },
    value: {
      fontSize: 11,
      fontFamily: Fonts.mono,
      color: colors.textBright,
      letterSpacing: 0.5,
    },
    liveIndicator: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.green,
    },
    time: {
      fontSize: 11,
      fontFamily: Fonts.mono,
      color: colors.textDim,
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
      borderColor: colors.borderDim,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: isNormal ? 999 : 2,
      backgroundColor: isNormal ? colors.bg : "transparent",
    },
    panelBtnActive: {
      borderColor: colors.blue,
      backgroundColor: colors.blueDim,
    },
    panelBtnText: {
      fontSize: 9,
      fontFamily: Fonts.sansBold,
      color: colors.textDim,
      letterSpacing: isNormal ? 0.4 : 1.5,
    },
    panelBtnTextActive: {
      color: colors.blue,
    },
    exitBtn: {
      borderWidth: 1,
      borderColor: colors.borderDim,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: isNormal ? 999 : 2,
      marginLeft: 4,
      backgroundColor: isNormal ? colors.bg : "transparent",
    },
    exitBtnText: {
      fontSize: 9,
      fontFamily: Fonts.sansBold,
      color: colors.textDim,
      letterSpacing: isNormal ? 0.3 : 1.5,
    },
  });

const createStyles = (colors: ReturnType<typeof useColors>, isNormal: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    loading: {
      flex: 1,
      backgroundColor: colors.bg,
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
    },
    loadingText: {
      fontSize: 11,
      fontFamily: Fonts.mono,
      color: colors.textDim,
      letterSpacing: isNormal ? 0.4 : 2,
    },
    body: {
      flex: 1,
      flexDirection: "row",
    },
    sidePanel: {
      borderRightWidth: 1,
      borderRightColor: colors.borderDim,
    },
    arena: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      borderRightWidth: 1,
      borderRightColor: colors.borderFaint,
    },
    panelLabel: {
      position: "absolute",
      top: 8,
      left: 12,
      zIndex: 3,
    },
    panelLabelText: {
      fontSize: 8,
      fontFamily: Fonts.sansBold,
      color: colors.textMuted,
      letterSpacing: isNormal ? 0.4 : 2,
    },
    pillRow: {
      position: "absolute",
      bottom: isNormal ? 92 : 52,
      left: 0,
      right: 0,
      alignItems: "center",
      zIndex: 2,
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
      letterSpacing: isNormal ? 0.4 : 2,
      opacity: 0.55,
      color: colors.textDim,
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
      color: colors.textDim,
      letterSpacing: isNormal ? 0.4 : 2,
    },
  });
