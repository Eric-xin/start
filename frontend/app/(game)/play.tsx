import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useGameStore } from "../../store/gameStore";
import { swipe, getNextCard } from "../../services/game";
import { CardContainer } from "../../components/Card/CardContainer";
import { CardLesson } from "../../components/Card/CardLesson";
import { StatsPanel } from "../../components/HUD/StatsPanel";
import { MarketContextPill } from "../../components/HUD/MarketContextPill";
import { CandlestickBackground } from "../../components/HUD/CandlestickBackground";
import { SidebarPanel } from "../../components/HUD/SidebarPanel";
import { PortfolioDonut } from "../../components/HUD/PortfolioDonut";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { Layout } from "../../constants/layout";
import { useScreenSize } from "../../hooks/useScreenSize";

export default function PlayScreen() {
  const router = useRouter();
  const { width, height, isTablet } = useScreenSize();
  const {
    session,
    currentCard,
    nextCard,
    lessonText,
    lessonColor,
    isSwipeLocked,
    setSession,
    setCurrentCard,
    setNextCard,
    setLessonText,
    setSwipeLocked,
  } = useGameStore();

  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (!session) {
      router.replace("/(game)/index");
      return;
    }
    // Load first card
    loadNextCard();
  }, []);

  const loadNextCard = async () => {
    if (!session) return;
    try {
      const card = await getNextCard(session.id);
      if (card) {
        setCurrentCard(card);
      }
    } catch (e) {
      Alert.alert("Error", "Could not load card.");
    } finally {
      setInitializing(false);
    }
  };

  const handleSwipe = async (direction: "left" | "right") => {
    if (!session || !currentCard || isSwipeLocked) return;

    setSwipeLocked(true);

    try {
      const result = await swipe(session.id, currentCard.id, direction);
      setSession(result.session);

      const lessonColor = direction === "right" ? Colors.terminalGreen : "#d32f2f";
      setLessonText(result.lesson, lessonColor);

      if (result.next_card) {
        setNextCard(result.next_card);
      }

      // After lesson dismisses, advance to next card
      // (CardLesson calls onDismiss after ~1800ms total)
    } catch (e: any) {
      setSwipeLocked(false);
      Alert.alert("Error", "Swipe failed. Check connection.");
    }
  };

  const handleLessonDismiss = () => {
    setLessonText(null);
    setCurrentCard(nextCard);
    setNextCard(null);
    setSwipeLocked(false);
  };

  const showSidebar = (session?.investor_rank ?? 0) >= 3 && isTablet;
  const showDonut = (session?.investor_rank ?? 0) >= 4;
  const showMarketPill = (session?.investor_rank ?? 0) >= 2;
  const showCandlestick = (session?.investor_rank ?? 0) >= 2;

  if (initializing || !session) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.bloombergBlue} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CARDECON</Text>
        <Text style={styles.headerStage}>
          STAGE {session.stage} · RANK {session.investor_rank}
        </Text>
      </View>

      {/* Main game area */}
      <View style={styles.gameArea}>
        {/* Sidebar (Rank 3+) */}
        {showSidebar && (
          <View style={styles.sidebarLeft}>
            <SidebarPanel session={session} />
          </View>
        )}

        {/* Center card area */}
        <View style={styles.cardArea}>
          {/* Candlestick background (Rank 2+) */}
          {showCandlestick && (
            <CandlestickBackground width={width * 0.6} height={height * 0.6} />
          )}

          {/* Card stack */}
          <View style={styles.cardStack}>
            {/* Ghost card behind */}
            {nextCard && (
              <View
                style={[
                  styles.ghostCard,
                  {
                    width: Layout.cardWidth,
                    height: Layout.cardHeight,
                    backgroundColor: Colors.cardSurface,
                    opacity: 0.6,
                    transform: [{ scale: 0.97 }, { translateY: 12 }],
                  },
                ]}
              />
            )}

            {/* Current card */}
            {currentCard && (
              <CardContainer
                card={currentCard}
                isLocked={isSwipeLocked}
                onSwipe={handleSwipe}
              />
            )}
          </View>

          {/* Market context pill (Rank 2+) */}
          {showMarketPill && (
            <MarketContextPill stage={session.stage} capital={session.capital} />
          )}

          {/* Lesson text */}
          {lessonText && (
            <CardLesson
              text={lessonText}
              color={lessonColor}
              onDismiss={handleLessonDismiss}
            />
          )}
        </View>

        {/* Portfolio donut (Rank 4+) */}
        {showDonut && isTablet && (
          <View style={styles.sidebarRight}>
            <PortfolioDonut weights={session.portfolio_weights} />
          </View>
        )}
      </View>

      {/* Stats panel */}
      <StatsPanel session={session} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loading: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    height: Layout.headerHeight,
    backgroundColor: Colors.terminalDark,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1e3a5f",
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: Fonts.serif,
    color: Colors.bloombergBlue,
    letterSpacing: 3,
  },
  headerStage: {
    fontSize: 10,
    fontFamily: Fonts.sansBold,
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  gameArea: {
    flex: 1,
    flexDirection: "row",
  },
  sidebarLeft: {
    justifyContent: "flex-start",
    paddingTop: 20,
  },
  sidebarRight: {
    width: 140,
    alignItems: "center",
    paddingTop: 20,
    borderLeftWidth: 1,
    borderLeftColor: "#1e3a5f",
  },
  cardArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  cardStack: {
    width: Layout.cardWidth,
    height: Layout.cardHeight,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostCard: {
    position: "absolute",
    borderRadius: Layout.cardBorderRadius,
  },
});
