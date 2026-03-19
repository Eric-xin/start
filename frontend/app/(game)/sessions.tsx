import React, { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { getSessions, SessionData } from "../../services/game";
import { useGameStore } from "../../store/gameStore";
import { Colors, useColors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { AppTopBar } from "../../components/navigation/AppTopBar";

const RANK_LABELS = ["—", "ANALYST I", "ASSOCIATE II", "DIRECTOR III", "MD IV"];

export default function SessionsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { t } = useTranslation();
  const colors = useColors();
  const { setSession } = useGameStore();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSessions()
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleContinue = (session: SessionData) => {
    setSession(session);
    router.push("/(game)/play");
  };

  return (
    <View style={styles.container}>
      <AppTopBar
        label={t("sessions.topBar")}
        onBack={() => router.back()}
        rightContent={<Text style={styles.sessionCount}>{t("sessions.count", { count: sessions.length })}</Text>}
      />

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.blue} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {sessions.length === 0 ? (
            <Text style={styles.emptyText}>{t("sessions.empty")}</Text>
          ) : (
            sessions.map((session, idx) => {
              const delta = session.capital - 10000;
              const deltaPct = ((delta / 10000) * 100).toFixed(1);
              const isUp = delta >= 0;
              return (
                <View key={session.id} style={styles.sessionCard}>
                  {/* Header row */}
                  <View style={styles.sessionHeader}>
                    <View style={styles.sessionIndex}>
                      <Text style={styles.sessionIndexText}>#{sessions.length - idx}</Text>
                    </View>
                    <View style={styles.sessionHeaderMain}>
                      <Text style={styles.sessionDate}>
                        {new Date(session.created_at).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </Text>
                      <Text style={styles.sessionUpdated}>
                        {t("sessions.lastPlayed", { date: new Date(session.updated_at).toLocaleDateString() })}
                      </Text>
                    </View>
                    <View style={styles.sessionActions}>
                      <TouchableOpacity
                        style={styles.reviewBtn}
                        onPress={() => router.push(`/(game)/session/${session.id}`)}
                      >
                        <Text style={styles.reviewBtnText}>{t("sessions.review")}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.continueBtn}
                        onPress={() => handleContinue(session)}
                      >
                        <Text style={styles.continueBtnText}>{t("sessions.continue")}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Stats row */}
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>{t("sessions.stats.capital")}</Text>
                      <Text style={styles.statValue}>${Math.round(session.capital).toLocaleString()}</Text>
                    </View>
                    <View style={styles.statSep} />
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>{t("sessions.stats.return")}</Text>
                      <Text style={[styles.statValue, { color: isUp ? Colors.green : Colors.red }]}>
                        {isUp ? "+" : ""}{deltaPct}%
                      </Text>
                    </View>
                    <View style={styles.statSep} />
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>{t("sessions.stats.stage")}</Text>
                      <Text style={styles.statValue}>{session.stage}/5</Text>
                    </View>
                    <View style={styles.statSep} />
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>{t("sessions.stats.rank")}</Text>
                      <Text style={[styles.statValue, { color: Colors.teal, fontSize: 11 }]}>
                        {RANK_LABELS[session.investor_rank] ?? "—"}
                      </Text>
                    </View>
                    <View style={styles.statSep} />
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>{t("sessions.stats.peak")}</Text>
                      <Text style={[styles.statValue, { color: Colors.amber }]}>
                        ${Math.round(session.peak_capital).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },

  sessionCount: { fontSize: 9, fontFamily: Fonts.mono, color: Colors.textMuted },

  scroll: { padding: 20, gap: 12, alignItems: "center" },
  emptyText: { fontSize: 12, fontFamily: Fonts.mono, color: Colors.textMuted, marginTop: 40 },

  sessionCard: {
    width: "100%", maxWidth: 640,
    backgroundColor: Colors.bgPanel,
    borderWidth: 1, borderColor: Colors.borderDim,
    borderRadius: 2, overflow: "hidden",
  },

  sessionHeader: {
    flexDirection: "row", alignItems: "center",
    padding: 14, gap: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.borderFaint,
  },
  sessionIndex: {
    width: 36, height: 36, borderRadius: 2,
    backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.borderDim,
    alignItems: "center", justifyContent: "center",
  },
  sessionIndexText: { fontSize: 11, fontFamily: Fonts.mono, color: Colors.textDim },
  sessionHeaderMain: { flex: 1 },
  sessionDate: { fontSize: 12, fontFamily: Fonts.mono, color: Colors.textBright, letterSpacing: 0.5 },
  sessionUpdated: { fontSize: 9, fontFamily: Fonts.mono, color: Colors.textMuted, marginTop: 2 },

  sessionActions: { flexDirection: "row", gap: 6 },
  reviewBtn: {
    borderWidth: 1, borderColor: Colors.borderDim,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 2,
  },
  reviewBtnText: { fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 1.5 },
  continueBtn: {
    borderWidth: 1, borderColor: Colors.blue + "66",
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 2,
  },
  continueBtnText: { fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.blue, letterSpacing: 1.5 },

  statsRow: {
    flexDirection: "row", flexWrap: "wrap",
  },
  statItem: {
    flex: 1, minWidth: 80, padding: 12, alignItems: "center",
  },
  statSep: { width: 1, backgroundColor: Colors.borderFaint },
  statLabel: { fontSize: 7, fontFamily: Fonts.sansBold, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 4 },
  statValue: { fontSize: 13, fontFamily: Fonts.mono, color: Colors.textBright, letterSpacing: 0.5 },
});
