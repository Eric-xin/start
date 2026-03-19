import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColors } from "../../../../constants/colors";
import { Fonts } from "../../../../constants/fonts";
import { Layout } from "../../../../constants/layout";
import { useThemeStore } from "../../../../store/themeStore";
import { useArenaStore } from "../../../../store/arenaStore";
import { useAuthStore } from "../../../../store/authStore";
import { playArenaCard, getRoom } from "../../../../services/arena";
import { CardContainer } from "../../../../components/Card/CardContainer";
import { RoundResultsOverlay } from "../../../../components/Arena/RoundResultsOverlay";
import type { FinalStanding } from "../../../../services/arena";

// ─── Terminal grid background ──────────────────────────────────────────────────
function TerminalGrid() {
  const colors = useColors();
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}>
      {Array.from({ length: 32 }).map((_, i) => (
        <View key={i} style={{ position: "absolute", top: i * 28, left: 0, right: 0, height: 1, backgroundColor: colors.borderFaint, opacity: 0.5 }} />
      ))}
    </View>
  );
}

// ─── Final standings screen ────────────────────────────────────────────────────
function FinalStandingsScreen({
  standings, startingCapital, myPlayerId, onExit, colors, isNormal,
}: {
  standings: FinalStanding[];
  startingCapital: number;
  myPlayerId: string | null;
  onExit: () => void;
  colors: any;
  isNormal: boolean;
}) {
  const myStanding = standings.find((s) => s.player_id === myPlayerId);
  const won = myStanding?.rank === 1;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={{
        paddingTop: 28,
        paddingBottom: 20,
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: colors.borderDim,
        backgroundColor: colors.bgPanel,
        gap: 6,
      }}>
        {isNormal ? (
          <Text style={{ fontSize: 40 }}>{won ? "🏆" : myStanding?.rank === 2 ? "🥈" : myStanding?.rank === 3 ? "🥉" : "🎯"}</Text>
        ) : null}
        <Text style={{
          fontFamily: isNormal ? Fonts.sansBold : Fonts.mono,
          fontSize: isNormal ? 26 : 18,
          color: colors.textBright,
          letterSpacing: isNormal ? 0 : 3,
        }}>
          {isNormal ? "Game Over" : "FINAL STANDINGS"}
        </Text>
        {myStanding && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 }}>
            <Text style={{
              fontFamily: Fonts.mono,
              fontSize: 13,
              color: myStanding.rank === 1 ? colors.amber : colors.textDim,
            }}>
              {isNormal ? `You finished #${myStanding.rank}` : `RANK #${myStanding.rank}`}
            </Text>
            <Text style={{
              fontFamily: Fonts.mono,
              fontSize: 13,
              color: myStanding.capital_delta >= 0 ? colors.green : colors.red,
            }}>
              {myStanding.capital_delta >= 0 ? "+" : ""}${Math.round(myStanding.capital_delta).toLocaleString()}
            </Text>
          </View>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {standings.map((s, i) => {
          const isMe = s.player_id === myPlayerId;
          const pct = ((s.capital - startingCapital) / startingCapital) * 100;
          const bar = Math.max(0, Math.min(1, (s.capital - startingCapital * 0.8) / (startingCapital * 0.8)));

          return (
            <View key={s.player_id} style={[
              {
                paddingHorizontal: 20,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderFaint,
                backgroundColor: isMe
                  ? (isNormal ? colors.blueDim : "rgba(10,108,245,0.08)")
                  : (i === 0 ? (isNormal ? "rgba(255,171,0,0.06)" : "rgba(255,171,0,0.04)") : "transparent"),
              }
            ]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 }}>
                {/* Rank */}
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: isNormal ? 16 : 4,
                  backgroundColor: s.rank === 1 ? colors.amber : s.rank === 2 ? "#9e9e9e" : s.rank === 3 ? "#a0522d" : colors.bgSurface,
                  borderWidth: 1,
                  borderColor: s.rank <= 3 ? "transparent" : colors.borderFaint,
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Text style={{ fontFamily: Fonts.mono, fontSize: 13, color: s.rank <= 3 ? "#fff" : colors.textDim }}>
                    {s.rank}
                  </Text>
                </View>

                {/* Name */}
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontFamily: isNormal ? Fonts.sansMedium : Fonts.mono,
                    fontSize: isNormal ? 15 : 12,
                    color: isMe ? colors.blue : colors.textPrimary,
                    letterSpacing: isNormal ? 0 : 0.5,
                  }}>
                    {s.username}{isMe ? (isNormal ? " (You)" : " <YOU>") : ""}
                  </Text>
                </View>

                {/* Delta + Capital */}
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{
                    fontFamily: Fonts.mono,
                    fontSize: 14,
                    color: s.capital_delta >= 0 ? colors.green : colors.red,
                  }}>
                    {s.capital_delta >= 0 ? "+" : ""}${Math.round(s.capital_delta).toLocaleString()}
                  </Text>
                  <Text style={{ fontFamily: Fonts.mono, fontSize: 11, color: colors.textDim }}>
                    ${Math.round(s.capital).toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Capital bar */}
              <View style={{ height: 3, backgroundColor: colors.borderFaint, borderRadius: 2, overflow: "hidden" }}>
                <View style={{
                  width: `${bar * 100}%`,
                  height: 3,
                  backgroundColor: s.rank === 1 ? colors.amber : (s.capital_delta >= 0 ? colors.green : colors.red),
                }} />
              </View>
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={{
          margin: 16,
          paddingVertical: 15,
          borderRadius: isNormal ? 14 : 2,
          backgroundColor: colors.blue,
          alignItems: "center",
        }}
        onPress={onExit}
      >
        <Text style={{ fontFamily: Fonts.sansBold, fontSize: 14, color: "#fff", letterSpacing: isNormal ? 0.5 : 2 }}>
          {isNormal ? "Back to Arena" : "BACK TO ARENA"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Compact player chip for top strip ────────────────────────────────────────
function PlayerChip({
  rank, username, capital, startingCapital, isMe, colors, isNormal,
}: {
  rank: number; username: string; capital: number; startingCapital: number; isMe: boolean; colors: any; isNormal: boolean;
}) {
  const delta = capital - startingCapital;
  const up = delta >= 0;
  return (
    <View style={[
      {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: isNormal ? 999 : 2,
        borderWidth: 1,
        borderColor: isMe ? colors.blue : colors.borderDim,
        backgroundColor: isMe ? (isNormal ? colors.blueDim : "rgba(10,108,245,0.1)") : colors.bgSurface,
      }
    ]}>
      <Text style={{ fontFamily: Fonts.mono, fontSize: 9, color: rank === 1 ? colors.amber : colors.textMuted }}>{rank}</Text>
      <Text style={{ fontFamily: isNormal ? Fonts.sansMedium : Fonts.mono, fontSize: 10, color: isMe ? colors.blue : colors.textPrimary, maxWidth: 68 }} numberOfLines={1}>
        {username}
      </Text>
      <Text style={{ fontFamily: Fonts.mono, fontSize: 10, color: up ? colors.green : colors.red }}>
        {up ? "+" : ""}{(delta / 1000).toFixed(1)}K
      </Text>
    </View>
  );
}

// ─── Main play screen ──────────────────────────────────────────────────────────
export default function ArenaPlayScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const colors = useColors();
  const isNormal = useThemeStore((s) => s.mode === "normal");
  const user = useAuthStore((s) => s.user);
  const { width, height } = useWindowDimensions();

  const {
    room, players, myPlayerId,
    currentCard, currentRound, totalRounds,
    waitingFor, roundResults, finalStandings,
    setRoom, setMyPlayerId, connectWs, wsConnected,
    clearRoundResults, reset,
  } = useArenaStore();

  const [swiped, setSwiped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isChoiceFlipped] = useState(Math.random() < 0.5);

  const isWide = width >= Layout.wideBreakpoint;
  const sidebarW = isWide ? 240 : 0;
  const cardAreaW = width - sidebarW;
  const cardAreaH = height - Layout.headerHeight - 44 - (isWide ? 0 : 52);

  useEffect(() => {
    if (!code) return;
    connectWs(code).catch(() => {});
    getRoom(code)
      .then((r) => {
        const me = r.players.find((p) => p.user_id === user?.id);
        setRoom(r, r.players);
        if (me && !myPlayerId) setMyPlayerId(me.id);
      })
      .catch(() => Alert.alert("Error", "Could not load room"))
      .finally(() => setLoading(false));
  }, [code]);

  useEffect(() => {
    if (currentCard) setSwiped(false);
  }, [currentCard?.id]);

  const handleSwipe = useCallback(
    async (direction: "left" | "right") => {
      if (!currentCard || swiped || !code) return;
      setSwiped(true);
      try {
        const action = isChoiceFlipped
          ? (direction === "left" ? "right" : "left")
          : direction;
        await playArenaCard(code, action);
      } catch (e: any) {
        setSwiped(false);
        Alert.alert("Error", e?.response?.data?.detail ?? "Swipe failed");
      }
    },
    [code, currentCard, isChoiceFlipped, swiped]
  );

  const sortedPlayers = [...players].sort((a, b) => b.capital - a.capital);
  const myPlayer = players.find((p) => p.id === myPlayerId);
  const startCap = room?.starting_capital ?? 10_000;

  if (loading && !currentCard && !finalStandings) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", gap: 14 }}>
        <ActivityIndicator color={colors.blue} size="large" />
        <Text style={{ fontFamily: Fonts.mono, fontSize: 11, color: colors.textDim, letterSpacing: 2 }}>
          {isNormal ? "Loading arena..." : "LOADING ARENA"}
        </Text>
      </View>
    );
  }

  if (finalStandings) {
    return (
      <FinalStandingsScreen
        standings={finalStandings}
        startingCapital={startCap}
        myPlayerId={myPlayerId}
        onExit={() => { reset(); router.replace("/(game)/arena"); }}
        colors={colors}
        isNormal={isNormal}
      />
    );
  }

  const styles = createStyles(colors, isNormal);

  return (
    <View style={styles.root}>
      <TerminalGrid />

      {/* Round results overlay */}
      {roundResults && (
        <RoundResultsOverlay
          roundNumber={currentRound}
          totalRounds={totalRounds}
          results={roundResults}
          myPlayerId={myPlayerId}
          isFinal={false}
          onContinue={clearRoundResults}
        />
      )}

      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <Text style={styles.arenaTag}>{isNormal ? "⚔️ Arena" : "ARENA"}</Text>
          <View style={styles.sep} />
          <Text style={styles.roundTag}>
            {isNormal ? `Round ${currentRound} / ${totalRounds}` : `R${currentRound}/${totalRounds}`}
          </Text>
        </View>

        <View style={styles.topCenter}>
          {/* Round progress pips */}
          <View style={styles.pips}>
            {Array.from({ length: Math.min(totalRounds, 20) }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.pip,
                  i < currentRound - 1 && styles.pipDone,
                  i === currentRound - 1 && styles.pipCurrent,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.topRight}>
          <View style={[styles.wsChip, { borderColor: wsConnected ? colors.green + "60" : colors.borderDim }]}>
            <View style={[styles.wsDot, { backgroundColor: wsConnected ? colors.green : colors.amber }]} />
            <Text style={styles.wsLabel}>{wsConnected ? "LIVE" : "..."}</Text>
          </View>
          <TouchableOpacity
            style={styles.exitBtn}
            onPress={() => { reset(); router.replace("/(game)/arena"); }}
          >
            <Text style={styles.exitBtnText}>{isNormal ? "Exit" : "EXIT"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.body}>
        {/* Wide sidebar leaderboard */}
        {isWide && (
          <View style={[styles.sidebar, { width: sidebarW }]}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>{isNormal ? "Standings" : "STANDINGS"}</Text>
              <Text style={styles.sidebarCount}>{players.length} players</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {sortedPlayers.map((p, i) => {
                const isMe = p.id === myPlayerId;
                const delta = p.capital - startCap;
                const hasPlayed = swiped && isMe;
                return (
                  <View key={p.id} style={[
                    styles.sidebarRow,
                    isMe && styles.sidebarRowMe,
                    p.status === "disconnected" && { opacity: 0.4 },
                  ]}>
                    {/* Rank bubble */}
                    <View style={[
                      styles.rankBubble,
                      i === 0 && { backgroundColor: colors.amber },
                      i === 1 && { backgroundColor: "#9e9e9e" },
                      i === 2 && { backgroundColor: "#a0522d" },
                    ]}>
                      <Text style={[styles.rankBubbleText, i < 3 && { color: "#fff" }]}>{i + 1}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sidebarName, isMe && { color: colors.blue }]} numberOfLines={1}>
                        {p.username}{isMe ? (isNormal ? " (You)" : " <YOU>") : ""}
                      </Text>
                      <Text style={[styles.sidebarCapital, { color: delta >= 0 ? colors.green : colors.red }]}>
                        {delta >= 0 ? "+" : ""}${Math.round(delta).toLocaleString()}
                      </Text>
                    </View>

                    <Text style={styles.sidebarTotal}>${(p.capital / 1000).toFixed(1)}K</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Main card area */}
        <View style={[styles.cardArea, { width: cardAreaW }]}>
          {/* Narrow screen: scrollable player chips */}
          {!isWide && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsScroll}
              contentContainerStyle={styles.chipsContent}
            >
              {sortedPlayers.map((p, i) => (
                <PlayerChip
                  key={p.id}
                  rank={i + 1}
                  username={p.username}
                  capital={p.capital}
                  startingCapital={startCap}
                  isMe={p.id === myPlayerId}
                  colors={colors}
                  isNormal={isNormal}
                />
              ))}
            </ScrollView>
          )}

          {/* My capital strip */}
          {myPlayer && (
            <View style={styles.myCapitalStrip}>
              <Text style={styles.myCapitalLabel}>{isNormal ? "Your Capital" : "YOUR CAPITAL"}</Text>
              <Text style={[styles.myCapitalValue, {
                color: myPlayer.capital >= startCap ? colors.green : colors.red,
              }]}>
                ${Math.round(myPlayer.capital).toLocaleString()}
              </Text>
              <Text style={[styles.myCapitalDelta, {
                color: myPlayer.capital >= startCap ? colors.green : colors.red,
              }]}>
                {myPlayer.capital >= startCap ? "+" : ""}{(((myPlayer.capital - startCap) / startCap) * 100).toFixed(1)}%
              </Text>
            </View>
          )}

          {/* Card or waiting state */}
          {currentCard && !swiped ? (
            <CardContainer
              key={currentCard.id}
              card={currentCard}
              isLocked={swiped}
              onSwipe={handleSwipe}
              isChoiceFlipped={isChoiceFlipped}
              areaWidth={cardAreaW}
              areaHeight={cardAreaH}
            />
          ) : swiped && !roundResults ? (
            <View style={styles.waitingBox}>
              <ActivityIndicator color={colors.blue} size="large" style={{ marginBottom: 12 }} />
              <Text style={styles.waitingTitle}>
                {isNormal ? "Waiting for others..." : "WAITING FOR PLAYERS"}
              </Text>
              {waitingFor && (
                <>
                  <View style={styles.waitingProgress}>
                    <View style={[styles.waitingProgressFill, {
                      width: `${(waitingFor.played_count / Math.max(waitingFor.total_count, 1)) * 100}%`,
                    }]} />
                  </View>
                  <Text style={styles.waitingCount}>
                    {isNormal
                      ? `${waitingFor.played_count} of ${waitingFor.total_count} played`
                      : `${waitingFor.played_count}/${waitingFor.total_count} PLAYED`}
                  </Text>
                </>
              )}
            </View>
          ) : !currentCard && !roundResults ? (
            <View style={styles.waitingBox}>
              <ActivityIndicator color={colors.blue} size="large" />
              <Text style={styles.waitingTitle}>
                {isNormal ? "Loading next card..." : "LOADING NEXT CARD"}
              </Text>
            </View>
          ) : null}

          {/* Swipe hints */}
          {currentCard && !swiped && !roundResults && (
            <View style={styles.hints} pointerEvents="none">
              <Text style={styles.hintText}>{isNormal ? "← Pass" : "← PASS"}</Text>
              <Text style={styles.hintText}>{isNormal ? "Accept →" : "ACCEPT →"}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>, isNormal: boolean) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },

    topBar: {
      height: Layout.headerHeight,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.bgPanel,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderPrimary,
      paddingHorizontal: 12,
      gap: 8,
    },
    topLeft: { flexDirection: "row", alignItems: "center", gap: 8, minWidth: 100 },
    arenaTag: {
      fontFamily: Fonts.mono,
      fontSize: 11,
      color: colors.blue,
      letterSpacing: isNormal ? 0.5 : 3,
    },
    sep: { width: 1, height: 12, backgroundColor: colors.borderDim },
    roundTag: {
      fontFamily: Fonts.mono,
      fontSize: 10,
      color: colors.textBright,
    },
    topCenter: { flex: 1, alignItems: "center" },
    pips: { flexDirection: "row", gap: 3, alignItems: "center" },
    pip: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.borderDim,
    },
    pipDone: { backgroundColor: colors.blue + "99" },
    pipCurrent: { backgroundColor: colors.blue, width: 10, borderRadius: 5 },
    topRight: { flexDirection: "row", alignItems: "center", gap: 8, minWidth: 100, justifyContent: "flex-end" },
    wsChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 999,
      borderWidth: 1,
    },
    wsDot: { width: 5, height: 5, borderRadius: 3 },
    wsLabel: { fontFamily: Fonts.mono, fontSize: 8, color: colors.textDim, letterSpacing: 1 },
    exitBtn: {
      borderWidth: 1,
      borderColor: colors.borderDim,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: isNormal ? 999 : 2,
    },
    exitBtnText: {
      fontFamily: Fonts.sansBold,
      fontSize: 9,
      color: colors.textDim,
      letterSpacing: isNormal ? 0.3 : 1.5,
    },

    body: { flex: 1, flexDirection: "row" },

    sidebar: {
      borderRightWidth: 1,
      borderRightColor: colors.borderDim,
      backgroundColor: colors.bgPanel,
    },
    sidebarHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderFaint,
    },
    sidebarTitle: {
      fontFamily: Fonts.sansBold,
      fontSize: 9,
      color: colors.textMuted,
      letterSpacing: isNormal ? 0.3 : 2,
    },
    sidebarCount: {
      fontFamily: Fonts.mono,
      fontSize: 9,
      color: colors.textMuted,
    },
    sidebarRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderFaint,
      gap: 10,
    },
    sidebarRowMe: {
      backgroundColor: isNormal ? colors.blueDim : "rgba(10,108,245,0.07)",
    },
    rankBubble: {
      width: 24,
      height: 24,
      borderRadius: isNormal ? 12 : 3,
      backgroundColor: colors.bgSurface,
      borderWidth: 1,
      borderColor: colors.borderFaint,
      alignItems: "center",
      justifyContent: "center",
    },
    rankBubbleText: {
      fontFamily: Fonts.mono,
      fontSize: 11,
      color: colors.textDim,
    },
    sidebarName: {
      fontFamily: isNormal ? Fonts.sansMedium : Fonts.mono,
      fontSize: isNormal ? 12 : 10,
      color: colors.textPrimary,
      letterSpacing: isNormal ? 0 : 0.5,
    },
    sidebarCapital: {
      fontFamily: Fonts.mono,
      fontSize: 9,
    },
    sidebarTotal: {
      fontFamily: Fonts.mono,
      fontSize: 10,
      color: colors.textDim,
    },

    cardArea: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    chipsScroll: {
      position: "absolute",
      top: 8,
      left: 0,
      right: 0,
      maxHeight: 44,
    },
    chipsContent: {
      paddingHorizontal: 12,
      gap: 7,
      alignItems: "center",
    },

    myCapitalStrip: {
      position: "absolute",
      bottom: 72,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: isNormal ? 999 : 2,
      borderWidth: 1,
      borderColor: colors.borderDim,
      backgroundColor: colors.bgPanel,
    },
    myCapitalLabel: {
      fontFamily: Fonts.sansBold,
      fontSize: 9,
      color: colors.textMuted,
      letterSpacing: isNormal ? 0.3 : 1.5,
    },
    myCapitalValue: {
      fontFamily: Fonts.mono,
      fontSize: 14,
    },
    myCapitalDelta: {
      fontFamily: Fonts.mono,
      fontSize: 10,
    },

    waitingBox: {
      width: Layout.cardWidth,
      height: Layout.cardHeight * 0.55,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      borderWidth: 1,
      borderColor: colors.borderDim,
      borderRadius: isNormal ? 20 : 4,
      backgroundColor: colors.bgSurface,
      paddingHorizontal: 24,
    },
    waitingTitle: {
      fontFamily: Fonts.mono,
      fontSize: 12,
      color: colors.textDim,
      letterSpacing: isNormal ? 0 : 1,
      textAlign: "center",
    },
    waitingProgress: {
      width: 160,
      height: 3,
      backgroundColor: colors.borderFaint,
      borderRadius: 2,
      overflow: "hidden",
    },
    waitingProgressFill: {
      height: 3,
      backgroundColor: colors.blue,
    },
    waitingCount: {
      fontFamily: Fonts.mono,
      fontSize: 10,
      color: colors.blue,
    },

    hints: {
      position: "absolute",
      bottom: 16,
      left: 0,
      right: 0,
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 28,
    },
    hintText: {
      fontFamily: Fonts.sansBold,
      fontSize: 9,
      color: colors.textDim,
      opacity: 0.55,
      letterSpacing: isNormal ? 0.4 : 2,
    },
  });
