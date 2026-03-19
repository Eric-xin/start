import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useColors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { useThemeStore } from "../../store/themeStore";
import type { RoundResult } from "../../services/arena";

interface Props {
  roundNumber: number;
  totalRounds: number;
  results: RoundResult[];
  myPlayerId: string | null;
  isFinal: boolean;
  onContinue: () => void;
}

export function RoundResultsOverlay({
  roundNumber,
  totalRounds,
  results,
  myPlayerId,
  isFinal,
  onContinue,
}: Props) {
  const colors = useColors();
  const isNormal = useThemeStore((s) => s.mode === "normal");
  const styles = createStyles(colors, isNormal);

  const myResult = results.find((r) => r.player_id === myPlayerId);
  const best = results[0];

  return (
    <View style={styles.overlay}>
      <View style={styles.sheet}>
        {/* Top accent line */}
        <View style={[styles.accentLine, { backgroundColor: myResult?.rank === 1 ? colors.amber : colors.blue }]} />

        {/* Header */}
        <View style={styles.header}>
          {isNormal && (
            <Text style={styles.headerEmoji}>
              {isFinal ? "🏁" : "✅"}
            </Text>
          )}
          <Text style={styles.headerTitle}>
            {isFinal
              ? (isNormal ? "Final Results" : "FINAL RESULTS")
              : (isNormal ? `Round ${roundNumber} Complete` : `ROUND ${roundNumber} / ${totalRounds}`)}
          </Text>
          {!isFinal && (
            <Text style={styles.headerSub}>
              {isNormal
                ? `${totalRounds - roundNumber} round${totalRounds - roundNumber === 1 ? "" : "s"} remaining`
                : `${totalRounds - roundNumber} ROUNDS LEFT`}
            </Text>
          )}
        </View>

        {/* My result highlight */}
        {myResult && (
          <View style={[
            styles.myResult,
            { borderColor: myResult.capital_delta >= 0 ? colors.green : colors.red }
          ]}>
            <View style={styles.myResultLeft}>
              <Text style={styles.myResultRankLabel}>{isNormal ? "Your rank" : "RANK"}</Text>
              <Text style={[styles.myResultRank, {
                color: myResult.rank === 1 ? colors.amber : myResult.rank === 2 ? "#9e9e9e" : colors.textBright,
              }]}>
                #{myResult.rank}
              </Text>
            </View>
            <View style={styles.myResultDivider} />
            <View style={styles.myResultRight}>
              <Text style={styles.myResultDeltaLabel}>{isNormal ? "This round" : "DELTA"}</Text>
              <Text style={[styles.myResultDelta, {
                color: myResult.capital_delta >= 0 ? colors.green : colors.red,
              }]}>
                {myResult.capital_delta >= 0 ? "+" : ""}${Math.round(myResult.capital_delta).toLocaleString()}
              </Text>
            </View>
            <View style={styles.myResultDivider} />
            <View style={styles.myResultRight}>
              <Text style={styles.myResultDeltaLabel}>{isNormal ? "Portfolio" : "CAPITAL"}</Text>
              <Text style={styles.myResultTotal}>${Math.round(myResult.capital_after).toLocaleString()}</Text>
            </View>
          </View>
        )}

        {/* Leaderboard */}
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {results.map((r, i) => {
            const isMe = r.player_id === myPlayerId;
            const isFirst = i === 0;
            return (
              <View key={r.player_id} style={[
                styles.resultRow,
                isMe && styles.resultRowMe,
                isFirst && styles.resultRowFirst,
              ]}>
                {/* Rank indicator */}
                <View style={[
                  styles.rankBox,
                  r.rank === 1 && { backgroundColor: colors.amber },
                  r.rank === 2 && { backgroundColor: "#9e9e9e" },
                  r.rank === 3 && { backgroundColor: "#a0522d" },
                ]}>
                  <Text style={[styles.rankText, r.rank <= 3 && { color: "#fff" }]}>{r.rank}</Text>
                </View>

                {/* Name */}
                <Text style={[styles.resultName, isMe && styles.resultNameMe]} numberOfLines={1}>
                  {r.username}{isMe ? (isNormal ? " (You)" : " <YOU>") : ""}
                </Text>

                {/* Action indicator */}
                <View style={[
                  styles.actionBadge,
                  { backgroundColor: r.action === "right" ? colors.green + "22" : colors.red + "22", borderColor: r.action === "right" ? colors.green + "44" : colors.red + "44" }
                ]}>
                  <Text style={[styles.actionBadgeText, { color: r.action === "right" ? colors.green : colors.red }]}>
                    {r.action === "right" ? (isNormal ? "✓" : "R") : (isNormal ? "✗" : "L")}
                  </Text>
                </View>

                {/* Delta */}
                <View style={styles.resultCapitals}>
                  <Text style={[styles.resultDelta, {
                    color: r.capital_delta >= 0 ? colors.green : colors.red,
                  }]}>
                    {r.capital_delta >= 0 ? "+" : ""}{Math.round(r.capital_delta).toLocaleString()}
                  </Text>
                  <Text style={styles.resultTotal}>${Math.round(r.capital_after).toLocaleString()}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Continue */}
        <TouchableOpacity style={styles.continueBtn} onPress={onContinue}>
          <Text style={styles.continueBtnText}>
            {isFinal
              ? (isNormal ? "View Final Standings →" : "FINAL STANDINGS →")
              : (isNormal ? "Next Round →" : "NEXT ROUND →")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>, isNormal: boolean) =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.8)",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 100,
    },
    sheet: {
      width: "88%",
      maxWidth: 500,
      backgroundColor: isNormal ? colors.bgPanel : "#060f22",
      borderRadius: isNormal ? 20 : 4,
      borderWidth: 1,
      borderColor: colors.borderDim,
      maxHeight: "85%",
      overflow: "hidden",
    },
    accentLine: {
      height: 3,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 16,
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: colors.borderFaint,
      gap: 4,
    },
    headerEmoji: { fontSize: 28, marginBottom: 4 },
    headerTitle: {
      fontFamily: isNormal ? Fonts.sansBold : Fonts.mono,
      fontSize: isNormal ? 20 : 15,
      color: colors.textBright,
      letterSpacing: isNormal ? 0 : 2,
    },
    headerSub: {
      fontFamily: Fonts.sans,
      fontSize: 11,
      color: colors.textDim,
      letterSpacing: isNormal ? 0 : 1,
    },
    myResult: {
      flexDirection: "row",
      alignItems: "center",
      margin: 14,
      padding: 14,
      borderWidth: 1,
      borderRadius: isNormal ? 14 : 2,
    },
    myResultLeft: { flex: 1, alignItems: "center" },
    myResultRight: { flex: 1, alignItems: "center" },
    myResultDivider: {
      width: 1,
      height: 32,
      backgroundColor: colors.borderFaint,
    },
    myResultRankLabel: {
      fontFamily: Fonts.sansBold,
      fontSize: 8,
      color: colors.textMuted,
      letterSpacing: isNormal ? 0.3 : 1.5,
      marginBottom: 2,
    },
    myResultRank: {
      fontFamily: Fonts.mono,
      fontSize: 28,
    },
    myResultDeltaLabel: {
      fontFamily: Fonts.sansBold,
      fontSize: 8,
      color: colors.textMuted,
      letterSpacing: isNormal ? 0.3 : 1.5,
      marginBottom: 2,
    },
    myResultDelta: {
      fontFamily: Fonts.mono,
      fontSize: 18,
    },
    myResultTotal: {
      fontFamily: Fonts.mono,
      fontSize: 14,
      color: colors.textBright,
    },
    list: { maxHeight: 240 },
    resultRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderFaint,
      gap: 8,
    },
    resultRowMe: {
      backgroundColor: isNormal ? colors.blueDim : "rgba(10,108,245,0.08)",
    },
    resultRowFirst: {},
    rankBox: {
      width: 22,
      height: 22,
      borderRadius: isNormal ? 11 : 3,
      backgroundColor: colors.bgSurface,
      alignItems: "center",
      justifyContent: "center",
    },
    rankText: {
      fontFamily: Fonts.mono,
      fontSize: 11,
      color: colors.textDim,
    },
    resultName: {
      flex: 1,
      fontFamily: isNormal ? Fonts.sansMedium : Fonts.mono,
      fontSize: isNormal ? 13 : 11,
      color: colors.textPrimary,
      letterSpacing: isNormal ? 0 : 0.5,
    },
    resultNameMe: { color: colors.blue },
    actionBadge: {
      width: 22,
      height: 22,
      borderRadius: isNormal ? 11 : 2,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    actionBadgeText: {
      fontFamily: Fonts.mono,
      fontSize: 10,
    },
    resultCapitals: { alignItems: "flex-end" },
    resultDelta: {
      fontFamily: Fonts.mono,
      fontSize: 12,
    },
    resultTotal: {
      fontFamily: Fonts.mono,
      fontSize: 9,
      color: colors.textDim,
    },
    continueBtn: {
      margin: 14,
      paddingVertical: 14,
      borderRadius: isNormal ? 12 : 2,
      backgroundColor: colors.blue,
      alignItems: "center",
    },
    continueBtnText: {
      fontFamily: Fonts.sansBold,
      fontSize: 13,
      color: "#fff",
      letterSpacing: isNormal ? 0.5 : 2,
    },
  });
