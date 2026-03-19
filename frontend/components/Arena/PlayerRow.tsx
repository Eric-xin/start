import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { useThemeStore } from "../../store/themeStore";

interface Props {
  rank: number;
  username: string;
  capital: number;
  capitalDelta?: number;
  startingCapital: number;
  isMe: boolean;
  isHost?: boolean;
  status?: string;
  showDelta?: boolean;
}

export function PlayerRow({
  rank,
  username,
  capital,
  capitalDelta,
  startingCapital,
  isMe,
  isHost,
  status,
  showDelta = false,
}: Props) {
  const colors = useColors();
  const isNormal = useThemeStore((s) => s.mode === "normal");
  const styles = createStyles(colors, isNormal);

  const pct = ((capital - startingCapital) / startingCapital) * 100;
  const isUp = capital >= startingCapital;
  const capitalColor = isUp ? colors.green : colors.red;
  const isDisconnected = status === "disconnected";

  const rankEmoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;

  return (
    <View style={[styles.row, isMe && styles.rowMe, isDisconnected && styles.rowDisconnected]}>
      {/* Rank */}
      <View style={styles.rankBox}>
        {rankEmoji && isNormal ? (
          <Text style={styles.rankEmoji}>{rankEmoji}</Text>
        ) : (
          <Text style={[styles.rank, rank <= 3 && styles.rankTop]}>{rank}</Text>
        )}
      </View>

      {/* Name */}
      <View style={styles.nameBox}>
        <Text style={[styles.username, isMe && styles.usernameMe]} numberOfLines={1}>
          {username}
          {isHost ? (isNormal ? " 👑" : " [HOST]") : ""}
          {isMe ? (isNormal ? " (You)" : " <YOU>") : ""}
        </Text>
        {isDisconnected && (
          <Text style={styles.disconnectedLabel}>{isNormal ? "disconnected" : "OFFLINE"}</Text>
        )}
      </View>

      {/* Capital */}
      <View style={styles.capitalBox}>
        <Text style={[styles.capital, { color: capitalColor }]}>
          ${Math.round(capital).toLocaleString()}
        </Text>
        {showDelta && capitalDelta !== undefined && (
          <Text style={[styles.delta, { color: capitalDelta >= 0 ? colors.green : colors.red }]}>
            {capitalDelta >= 0 ? "+" : ""}
            {Math.round(capitalDelta).toLocaleString()}
          </Text>
        )}
        {!showDelta && (
          <Text style={[styles.pct, { color: capitalColor }]}>
            {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
          </Text>
        )}
      </View>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>, isNormal: boolean) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: isNormal ? 10 : 7,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderFaint,
      gap: 8,
    },
    rowMe: {
      backgroundColor: isNormal ? colors.blueDim : "rgba(10,108,245,0.08)",
    },
    rowDisconnected: {
      opacity: 0.4,
    },
    rankBox: {
      width: 28,
      alignItems: "center",
    },
    rank: {
      fontFamily: Fonts.mono,
      fontSize: 13,
      color: colors.textDim,
    },
    rankTop: {
      color: colors.amber,
    },
    rankEmoji: {
      fontSize: 16,
    },
    nameBox: {
      flex: 1,
      gap: 1,
    },
    username: {
      fontFamily: isNormal ? Fonts.sansMedium : Fonts.mono,
      fontSize: isNormal ? 13 : 11,
      color: colors.textPrimary,
      letterSpacing: isNormal ? 0 : 0.5,
    },
    usernameMe: {
      color: colors.blue,
    },
    disconnectedLabel: {
      fontFamily: Fonts.sans,
      fontSize: 9,
      color: colors.textMuted,
      letterSpacing: isNormal ? 0 : 1,
    },
    capitalBox: {
      alignItems: "flex-end",
      gap: 1,
    },
    capital: {
      fontFamily: Fonts.mono,
      fontSize: 12,
      letterSpacing: 0.5,
    },
    pct: {
      fontFamily: Fonts.mono,
      fontSize: 9,
      letterSpacing: 0.3,
    },
    delta: {
      fontFamily: Fonts.mono,
      fontSize: 10,
      letterSpacing: 0.3,
    },
  });
