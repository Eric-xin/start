import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { createSession } from "../../services/game";
import { useAuthStore } from "../../store/authStore";
import { useGameStore } from "../../store/gameStore";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";

const RANK_LABELS = ["—", "ANALYST I", "ASSOCIATE II", "DIRECTOR III", "MD IV"];

function GridBg() {
  const { width, height } = useWindowDimensions();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: Math.ceil(height / 32) }).map((_, i) => (
        <View key={`h${i}`} style={{ position: "absolute", top: i * 32, left: 0, right: 0, height: 1, backgroundColor: Colors.borderFaint }} />
      ))}
      {Array.from({ length: Math.ceil(width / 64) }).map((_, i) => (
        <View key={`v${i}`} style={{ position: "absolute", left: i * 64, top: 0, bottom: 0, width: 1, backgroundColor: Colors.borderFaint, opacity: 0.5 }} />
      ))}
    </View>
  );
}

function DataBlock({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <View style={db.block}>
      <Text style={db.label}>{label}</Text>
      <Text style={[db.value, accent ? { color: accent } : {}]}>{value}</Text>
      {sub && <Text style={db.sub}>{sub}</Text>}
    </View>
  );
}

const db = StyleSheet.create({
  block: { alignItems: "flex-start" },
  label: { fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 1.5, marginBottom: 2 },
  value: { fontSize: 18, fontFamily: Fonts.mono, color: Colors.textBright, letterSpacing: 1 },
  sub: { fontSize: 9, fontFamily: Fonts.mono, color: Colors.textDim, marginTop: 1 },
});

export default function GameIndexScreen() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const { setSession, reset } = useGameStore();
  const [loading, setLoading] = useState(false);

  const handleNewGame = async () => {
    setLoading(true);
    try {
      reset();
      const session = await createSession();
      setSession(session);
      router.push("/(game)/play");
    } catch {
      Alert.alert("Error", "Could not create session. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await clearAuth();
    router.replace("/(auth)/login");
  };

  return (
    <View style={styles.container}>
      <GridBg />

      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <Text style={styles.logo}>CARDECON</Text>
          <View style={styles.barSep} />
          <Text style={styles.topBarLabel}>FINANCIAL INTELLIGENCE PLATFORM</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>LOGOUT</Text>
        </TouchableOpacity>
      </View>

      {/* Main content */}
      <View style={styles.content}>

        {/* Welcome panel */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.blueDot} />
            <Text style={styles.cardHeaderText}>INVESTOR PROFILE</Text>
          </View>
          <Text style={styles.username}>{user?.username?.toUpperCase() ?? "INVESTOR"}</Text>
          <Text style={styles.email}>{user?.email ?? "—"}</Text>

          <View style={styles.dataRow}>
            <DataBlock label="TIER" value={user?.subscription_tier?.toUpperCase() ?? "NORMAL"} accent={Colors.blue} />
            <View style={styles.dataSep} />
            <DataBlock label="RANK" value={RANK_LABELS[1]} accent={Colors.teal} />
            <View style={styles.dataSep} />
            <DataBlock label="STATUS" value="ACTIVE" sub="VERIFIED" accent={Colors.green} />
          </View>
        </View>

        {/* Action panel */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.blueDot} />
            <Text style={styles.cardHeaderText}>SESSION CONTROL</Text>
          </View>

          <Text style={styles.sessionDesc}>
            Each session is an independent run through the decision engine. Your persona vector adapts with every swipe.
          </Text>

          <TouchableOpacity
            style={[styles.ctaBtn, loading && { opacity: 0.5 }]}
            onPress={handleNewGame}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={Colors.bg} size="small" />
              : <Text style={styles.ctaBtnText}>▶  LAUNCH NEW SESSION</Text>
            }
          </TouchableOpacity>
        </View>

        {/* System status panel */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.blueDot, { backgroundColor: Colors.green }]} />
            <Text style={styles.cardHeaderText}>SYSTEM STATUS</Text>
          </View>
          <View style={styles.dataRow}>
            <DataBlock label="PERSONA ENGINE" value="ONLINE" accent={Colors.green} />
            <View style={styles.dataSep} />
            <DataBlock label="CARD PIPELINE" value="READY" accent={Colors.green} />
            <View style={styles.dataSep} />
            <DataBlock label="VERSION" value="1.0.0" />
          </View>
        </View>
      </View>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <Text style={styles.bottomText}>CARDECON FINANCIAL SIMULATION ENGINE</Text>
        <Text style={styles.bottomText}>© {new Date().getFullYear()} · ALL RIGHTS RESERVED</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  topBar: {
    height: 40,
    backgroundColor: Colors.bgPanel,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderPrimary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  topLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { fontSize: 14, fontFamily: Fonts.mono, color: Colors.blue, letterSpacing: 3 },
  barSep: { width: 1, height: 14, backgroundColor: Colors.borderDim },
  topBarLabel: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 2 },
  logoutBtn: { borderWidth: 1, borderColor: Colors.borderDim, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 2 },
  logoutText: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 1.5 },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },

  card: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: Colors.bgPanel,
    borderWidth: 1,
    borderColor: Colors.borderDim,
    borderRadius: 2,
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderFaint,
    paddingBottom: 8,
  },
  blueDot: { width: 6, height: 6, borderRadius: 1, backgroundColor: Colors.blue },
  cardHeaderText: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.blue, letterSpacing: 2 },

  username: { fontSize: 22, fontFamily: Fonts.mono, color: Colors.textBright, letterSpacing: 2, marginBottom: 4 },
  email: { fontSize: 11, fontFamily: Fonts.mono, color: Colors.textDim, marginBottom: 16 },

  dataRow: { flexDirection: "row", alignItems: "flex-start", gap: 4 },
  dataSep: { width: 1, height: 36, backgroundColor: Colors.borderDim, marginHorizontal: 12, alignSelf: "center" },

  sessionDesc: { fontSize: 12, fontFamily: Fonts.sans, color: Colors.textDim, lineHeight: 18, marginBottom: 16 },

  ctaBtn: {
    backgroundColor: Colors.blue,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    borderRadius: 2,
  },
  ctaBtnText: { fontSize: 13, fontFamily: Fonts.sansBold, color: Colors.bg, letterSpacing: 2 },

  bottomBar: {
    height: 30,
    backgroundColor: Colors.bgPanel,
    borderTopWidth: 1,
    borderTopColor: Colors.borderFaint,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  bottomText: { fontSize: 8, fontFamily: Fonts.mono, color: Colors.textMuted, letterSpacing: 1 },
});
