import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { getLeaderboard, LeaderboardData, getRankLabel } from "../../services/leaderboard";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";

export default function LeaderboardScreen() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadLeaderboard = useCallback(async () => {
    try {
      const data = await getLeaderboard(100);
      setLeaderboard(data);
    } catch {
      Alert.alert("Error", "Could not load leaderboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.blue} size="large" />
        <Text style={styles.loadingText}>LOADING LEADERBOARD</Text>
      </View>
    );
  }

  const currentUserEntry = leaderboard?.entries.find(e => leaderboard.current_user_rank === e.rank);

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.logo}>CARDECON</Text>
        <View style={styles.barSep} />
        <Text style={styles.topLabel}>LEADERBOARD</Text>
        <View style={{ flex: 1 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Current user widget */}
        {currentUserEntry && (
          <View style={styles.currentUserCard}>
            <Text style={styles.currentUserLabel}>YOUR POSITION</Text>
            <View style={styles.currentUserContent}>
              <View style={styles.currentUserRank}>
                <Text style={styles.currentUserRankNum}>#{currentUserEntry.rank}</Text>
                <Text style={styles.currentUserRankLabel}>of {leaderboard?.entries.length ?? 0}</Text>
              </View>
              <View style={styles.currentUserStats}>
                <Text style={styles.currentUserName}>{currentUserEntry.username}</Text>
                <View style={styles.currentUserMetrics}>
                  <Text style={styles.currentUserMetric}>
                    <Text style={{ color: Colors.blue }}>Net Worth:</Text> ${currentUserEntry.net_worth.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </Text>
                  <Text style={styles.currentUserMetric}>
                    <Text style={{ color: Colors.teal }}>Level:</Text> {currentUserEntry.investor_rank}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Leaderboard table */}
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 0.4 }]}>RANK</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>PLAYER</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>NET WORTH</Text>
            <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}>LVL</Text>
          </View>

          {leaderboard?.entries.map((entry, idx) => {
            const isCurrentUser = leaderboard?.current_user_rank === entry.rank;
            const rowBg = isCurrentUser ? Colors.bgPanel : Colors.bg;
            const borderColor = isCurrentUser ? Colors.blue : Colors.borderFaint;

            return (
              <View
                key={entry.portfolio_id}
                style={[
                  styles.tableRow,
                  {
                    backgroundColor: rowBg,
                    borderColor,
                    borderLeftWidth: isCurrentUser ? 3 : 0,
                  },
                ]}
              >
                <Text style={[styles.tableCell, { flex: 0.4 }]}>
                  <Text style={{ color: Colors.blue, fontWeight: "bold" }}>#{entry.rank}</Text>
                </Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]} numberOfLines={1}>
                  {entry.username}
                  {isCurrentUser && " ◆"}
                </Text>
                <Text style={[styles.tableCell, { flex: 1, color: Colors.green }]}>
                  ${(entry.net_worth / 1000).toFixed(0)}k
                </Text>
                <Text style={[styles.tableCell, { flex: 0.5, color: Colors.teal }]}>
                  {entry.investor_rank}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Info section */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>LEADERBOARD</Text>
          <Text style={styles.infoText}>
            Rankings are based on net worth accumulated through strategic investment decisions. Climb the ranks by making wise choices and growing your portfolio.
          </Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loading: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  loadingText: {
    fontSize: 10,
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
    paddingHorizontal: 16,
    gap: 10,
  },
  backText: {
    fontSize: 9,
    fontFamily: Fonts.sansBold,
    color: Colors.textDim,
    letterSpacing: 1.5,
  },
  logo: { fontSize: 13, fontFamily: Fonts.mono, color: Colors.blue, letterSpacing: 3 },
  barSep: { width: 1, height: 14, backgroundColor: Colors.borderDim },
  topLabel: {
    fontSize: 8,
    fontFamily: Fonts.sansBold,
    color: Colors.textDim,
    letterSpacing: 2,
  },

  scroll: { padding: 20, gap: 14, alignItems: "center" },

  currentUserCard: {
    width: "100%",
    maxWidth: 720,
    backgroundColor: Colors.bgPanel,
    borderWidth: 2,
    borderColor: Colors.blue,
    borderRadius: 2,
    padding: 16,
  },
  currentUserLabel: {
    fontSize: 7,
    fontFamily: Fonts.sansBold,
    color: Colors.blue,
    letterSpacing: 2,
    marginBottom: 12,
  },
  currentUserContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  currentUserRank: {
    alignItems: "center",
  },
  currentUserRankNum: {
    fontSize: 32,
    fontFamily: Fonts.mono,
    color: Colors.blue,
    fontWeight: "bold",
  },
  currentUserRankLabel: {
    fontSize: 9,
    fontFamily: Fonts.mono,
    color: Colors.textMuted,
  },
  currentUserStats: {
    flex: 1,
  },
  currentUserName: {
    fontSize: 14,
    fontFamily: Fonts.sansBold,
    color: Colors.textBright,
    marginBottom: 6,
  },
  currentUserMetrics: {
    gap: 4,
  },
  currentUserMetric: {
    fontSize: 10,
    fontFamily: Fonts.mono,
    color: Colors.textDim,
  },

  tableContainer: {
    width: "100%",
    maxWidth: 720,
    backgroundColor: Colors.bgPanel,
    borderWidth: 1,
    borderColor: Colors.borderDim,
    borderRadius: 2,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDim,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tableHeaderCell: {
    fontSize: 7,
    fontFamily: Fonts.sansBold,
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderFaint,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tableCell: {
    fontSize: 11,
    fontFamily: Fonts.mono,
    color: Colors.textBright,
  },

  infoCard: {
    width: "100%",
    maxWidth: 720,
    backgroundColor: Colors.bgPanel,
    borderWidth: 1,
    borderColor: Colors.borderDim,
    borderRadius: 2,
    padding: 14,
  },
  infoTitle: {
    fontSize: 8,
    fontFamily: Fonts.sansBold,
    color: Colors.blue,
    letterSpacing: 2,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 10,
    fontFamily: Fonts.sans,
    color: Colors.textDim,
    lineHeight: 16,
  },
});
