import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { getPortfolio, getNextCard, PortfolioData } from "../../services/portfolio";
import { listPersonas, PersonaData } from "../../services/persona";
import { useAuthStore } from "../../store/authStore";
import { usePortfolioStore } from "../../store/portfolioStore";
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
  const { setPortfolio, setCurrentCard } = usePortfolioStore();
  const [launching, setLaunching] = useState(false);
  const [portfolio, setLocalPortfolio] = useState<PortfolioData | null>(null);
  const [activePersona, setActivePersona] = useState<PersonaData | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    Promise.all([getPortfolio(), listPersonas()])
      .then(([p, personas]) => {
        setLocalPortfolio(p);
        setPortfolio(p);
        setActivePersona(personas.find((pa) => pa.is_active) ?? personas[0] ?? null);
      })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, []);

  const handlePlay = async () => {
    setLaunching(true);
    try {
      const card = await getNextCard();
      setCurrentCard(card);
      router.push("/(game)/play");
    } catch {
      Alert.alert("Error", "Could not load cards. Is the backend running?");
    } finally {
      setLaunching(false);
    }
  };

  const handleLogout = async () => {
    await clearAuth();
  };

  return (
    <View style={styles.container}>
      <GridBg />

      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <Text style={styles.logo}>CARDECON</Text>
          <View style={styles.barSep} />
          <Text style={styles.topBarLabel}>INDEX</Text>
        </View>
        <View style={styles.topRight}>
          <TouchableOpacity style={styles.topBtn} onPress={() => router.push("/(profile)/")}>
            <Text style={styles.topBtnText}>PROFILE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.topBtn} onPress={() => router.push("/(profile)/personas")}>
            <Text style={styles.topBtnText}>PERSONAS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.topBtn} onPress={() => router.push("/(profile)/decks")}>
            <Text style={styles.topBtnText}>DECKS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.topBtn} onPress={() => router.push("/(game)/achievements")}>
            <Text style={styles.topBtnText}>ACHIEVEMENTS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>LOGOUT</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main content */}
      <View style={styles.content}>

        {/* Investor profile panel */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.blueDot} />
            <Text style={styles.cardHeaderText}>INVESTOR PROFILE</Text>
          </View>
          <Text style={styles.username}>{user?.username?.toUpperCase() ?? "INVESTOR"}</Text>
          <Text style={styles.email}>{user?.email ?? "—"}</Text>

          <View style={styles.dataRow}>
            <DataBlock
              label="NET WORTH"
              value={loadingData ? "..." : `$${(portfolio?.net_worth ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
              accent={Colors.blue}
            />
            <View style={styles.dataSep} />
            <DataBlock
              label="STAGE / RANK"
              value={loadingData ? "..." : `S${portfolio?.stage ?? 1} / R${portfolio?.investor_rank ?? 1}`}
              sub={portfolio ? RANK_LABELS[portfolio.investor_rank] : undefined}
              accent={Colors.teal}
            />
            <View style={styles.dataSep} />
            <DataBlock
              label="INCOME"
              value={loadingData ? "..." : (portfolio?.can_claim_income ? "READY" : "CLAIMED")}
              sub={portfolio?.can_claim_income ? `+$${portfolio.pending_income.toFixed(0)} available` : "tomorrow"}
              accent={portfolio?.can_claim_income ? Colors.green : Colors.textDim}
            />
          </View>
        </View>

        {/* Play control panel */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.blueDot} />
            <Text style={styles.cardHeaderText}>PLAY CONTROL</Text>
          </View>

          <Text style={styles.sessionDesc}>
            Continuous gameplay — swipe cards to make investment decisions. Each decision
            updates your behavioral profile
            {activePersona ? <Text style={{ color: Colors.teal }}> "{activePersona.name}"</Text> : null}{" "}
            and adjusts your capital. Log in daily to collect salary.
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.continueBtn]}
              onPress={() => router.push("/(game)/portfolio")}
            >
              <Text style={styles.continueBtnText}>VIEW PORTFOLIO →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ctaBtn, launching && { opacity: 0.5 }]}
              onPress={handlePlay}
              disabled={launching}
            >
              {launching
                ? <ActivityIndicator color={Colors.bg} size="small" />
                : <Text style={styles.ctaBtnText}>▶  START PLAYING</Text>
              }
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.historyLink}
            onPress={() => router.push("/(game)/portfolio")}
          >
            <Text style={styles.historyLinkText}>NET WORTH HISTORY & DECISIONS →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.historyLink, { marginTop: 4 }]}
            onPress={() => router.push("/(game)/simulation")}
          >
            <Text style={[styles.historyLinkText, { color: Colors.blue }]}>⬡ SIMULATION ENGINE →</Text>
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
  topRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  logo: { fontSize: 14, fontFamily: Fonts.mono, color: Colors.blue, letterSpacing: 3 },
  barSep: { width: 1, height: 14, backgroundColor: Colors.borderDim },
  topBarLabel: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 2 },
  topBtn: {
    borderWidth: 1, borderColor: Colors.borderDim,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 2,
  },
  topBtnText: { fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 1.5 },
  logoutBtn: {
    borderWidth: 1, borderColor: Colors.borderDim,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 2,
    marginLeft: 4,
  },
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

  buttonRow: { flexDirection: "column", gap: 12, marginBottom: 12 },

  ctaBtn: {
    flex: 1,
    backgroundColor: Colors.blue,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    borderRadius: 2,
  },
  ctaBtnText: { fontSize: 12, fontFamily: Fonts.sansBold, color: Colors.bg, letterSpacing: 2 },

  continueBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.blue + "66",
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 2,
  },
  continueBtnDisabled: { borderColor: Colors.borderDim, opacity: 0.5 },
  continueBtnInner: { alignItems: "center", gap: 3 },
  continueBtnText: { fontSize: 11, fontFamily: Fonts.sansBold, color: Colors.blue, letterSpacing: 1.5 },
  continueBtnSub: { fontSize: 9, fontFamily: Fonts.mono, color: Colors.textDim },

  historyLink: {
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderFaint,
  },
  historyLinkText: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 2 },

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
