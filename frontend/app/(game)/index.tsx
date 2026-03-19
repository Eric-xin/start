import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { getNextCard, getPortfolio, type PortfolioData, updateCompanion } from "../../services/portfolio";
import { listPersonas, type PersonaData } from "../../services/persona";
import { useAuthStore } from "../../store/authStore";
import { usePortfolioStore } from "../../store/portfolioStore";
import { useColors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { useThemeStore } from "../../store/themeStore";
import { CompanionSelector } from "../../components/companion/CompanionSelector";
import { COMPANIONS, type CompanionId } from "../../constants/companions";
import { CompanionVisual } from "../../components/companion/CompanionVisual";
import { useCompanionStore } from "../../store/companionStore";

const RANK_LABELS = ["—", "ANALYST I", "ASSOCIATE II", "DIRECTOR III", "MD IV"];

function GridBg() {
  const colors = useColors();
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}>
      {Array.from({ length: 28 }).map((_, i) => (
        <View key={`h${i}`} style={{ position: "absolute", top: i * 32, left: 0, right: 0, height: 1, backgroundColor: colors.borderFaint }} />
      ))}
      {Array.from({ length: 24 }).map((_, i) => (
        <View key={`v${i}`} style={{ position: "absolute", left: i * 64, top: 0, bottom: 0, width: 1, backgroundColor: colors.borderFaint, opacity: 0.5 }} />
      ))}
    </View>
  );
}

function DataBlock({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  const colors = useColors();
  const styles = createDataBlockStyles(colors);

  return (
    <View style={styles.block}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, accent ? { color: accent } : null]}>{value}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  );
}

export default function GameIndexScreen() {
  const router = useRouter();
  const colors = useColors();
  const isNormal = useThemeStore((state) => state.mode === "normal");
  const styles = createStyles(colors, isNormal);
  const { user, clearAuth } = useAuthStore();
  const { setPortfolio, setCurrentCard } = usePortfolioStore();
  const setCompanion = useCompanionStore((state) => state.setCompanion);
  const [launching, setLaunching] = useState(false);
  const [portfolio, setLocalPortfolio] = useState<PortfolioData | null>(null);
  const [activePersona, setActivePersona] = useState<PersonaData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const currentCompanion = useMemo(
    () => (portfolio?.companion_id ? COMPANIONS[portfolio.companion_id as CompanionId] : null),
    [portfolio?.companion_id]
  );

  useEffect(() => {
    Promise.all([getPortfolio(), listPersonas()])
      .then(([p, personas]) => {
        setLocalPortfolio(p);
        setPortfolio(p);
        setActivePersona(personas.find((pa) => pa.is_active) ?? personas[0] ?? null);
        if (p.companion_id) {
          setCompanion(p.companion_id as CompanionId);
        } else {
          setSelectorVisible(true);
        }
      })
      .catch((error: unknown) => {
        console.warn("Game index bootstrap failed", error);
        Alert.alert(
          "Connection issue",
          "CardEcon couldn't reach the backend. If you're testing on a device, make sure the API URL points to your computer's LAN IP instead of localhost."
        );
      })
      .finally(() => setLoadingData(false));
  }, [setCompanion, setPortfolio]);

  const handlePlay = async () => {
    if (!portfolio?.companion_id) {
      setSelectorVisible(true);
      return;
    }

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

  const handleCompanionConfirm = async (companionId: CompanionId) => {
    try {
      const updated = await updateCompanion(companionId);
      setLocalPortfolio(updated);
      setPortfolio(updated);
      setCompanion(companionId);
      setSelectorVisible(false);
    } catch {
      Alert.alert("Error", "Could not save your guide just now.");
    }
  };

  return (
    <View style={styles.container}>
      <GridBg />

      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <Text style={styles.logo}>CARDECON</Text>
          <View style={styles.barSep} />
          <Text style={styles.topBarLabel}>{isNormal ? "Home" : "INDEX"}</Text>
        </View>
        <View style={styles.topRight}>
          <TouchableOpacity style={styles.topBtn} onPress={() => router.push("/(profile)")}>
            <Text style={styles.topBtnText}>PROFILE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.topBtn} onPress={() => router.push("/(profile)/personas")}>
            <Text style={styles.topBtnText}>PERSONAS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.topBtn} onPress={() => router.push("/(game)/simulation")}>
            <Text style={styles.topBtnText}>SIMULATION</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.topBtn} onPress={() => router.push("/(profile)/decks")}>
            <Text style={styles.topBtnText}>DECKS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.topBtn} onPress={() => router.push("/(game)/achievements")}>
            <Text style={styles.topBtnText}>ACHIEVEMENTS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={clearAuth}>
            <Text style={styles.logoutText}>LOGOUT</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.blueDot} />
            <Text style={styles.cardHeaderText}>{isNormal ? "👤 Investor Profile" : "INVESTOR PROFILE"}</Text>
          </View>
          <Text style={styles.username}>{user?.username?.toUpperCase() ?? "INVESTOR"}</Text>
          <Text style={styles.email}>{user?.email ?? "—"}</Text>

          <View style={styles.dataRow}>
            <DataBlock
              label={isNormal ? "🏦 Total Value" : "NET WORTH"}
              value={loadingData ? "..." : `$${(portfolio?.net_worth ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
              accent={colors.blue}
            />
            <View style={styles.dataSep} />
            <DataBlock
              label={isNormal ? "📚 Stage / Rank" : "STAGE / RANK"}
              value={loadingData ? "..." : `S${portfolio?.stage ?? 1} / R${portfolio?.investor_rank ?? 1}`}
              sub={portfolio ? RANK_LABELS[portfolio.investor_rank] : undefined}
              accent={colors.teal}
            />
            <View style={styles.dataSep} />
            <DataBlock
              label={isNormal ? "💵 Daily Income" : "INCOME"}
              value={loadingData ? "..." : portfolio?.can_claim_income ? "READY" : "CLAIMED"}
              sub={portfolio?.can_claim_income ? `+$${portfolio.pending_income.toFixed(0)} available` : "tomorrow"}
              accent={portfolio?.can_claim_income ? colors.green : colors.textDim}
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.blueDot} />
            <Text style={styles.cardHeaderText}>{isNormal ? "🧭 Your Guide" : "GUIDE SYSTEM"}</Text>
          </View>

          {currentCompanion ? (
            <View style={styles.guideRow}>
              <CompanionVisual companionId={currentCompanion.id} size={88} />
              <View style={styles.guideCopy}>
                <Text style={styles.guideName}>{currentCompanion.name}</Text>
                <Text style={styles.guideBody}>{currentCompanion.previewQuote}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.sessionDesc}>
              {isNormal ? "Pick a companion to guide your investing journey." : "Select a companion guide before starting a run."}
            </Text>
          )}

          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setSelectorVisible(true)}>
            <Text style={styles.secondaryBtnText}>{isNormal ? "Change Guide" : "CHANGE GUIDE"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.blueDot} />
            <Text style={styles.cardHeaderText}>{isNormal ? "🎮 Play Control" : "PLAY CONTROL"}</Text>
          </View>

          <Text style={styles.sessionDesc}>
            {isNormal
              ? "Swipe cards to make investment choices, learn from the outcomes, and grow your portfolio over time."
              : "Continuous gameplay — swipe cards to make investment decisions. Each decision updates your behavioral profile"}{" "}
            {activePersona ? <Text style={{ color: colors.teal }}>{isNormal ? activePersona.name : `"${activePersona.name}"`}</Text> : null}
            {isNormal ? " while your guide reacts in real time." : " and adjusts your capital. Log in daily to collect salary."}
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.continueBtn} onPress={() => router.push("/(game)/portfolio")}>
              <Text style={styles.continueBtnText}>{isNormal ? "View Portfolio →" : "VIEW PORTFOLIO →"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ctaBtn, launching && { opacity: 0.5 }]}
              onPress={handlePlay}
              disabled={launching}
            >
              {launching ? (
                <ActivityIndicator color={colors.bg} size="small" />
              ) : (
                <Text style={styles.ctaBtnText}>{isNormal ? "Start Playing" : "▶  START PLAYING"}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.blueDot, { backgroundColor: colors.green }]} />
            <Text style={styles.cardHeaderText}>{isNormal ? "✅ System Status" : "SYSTEM STATUS"}</Text>
          </View>
          <View style={styles.dataRow}>
            <DataBlock label="PERSONA ENGINE" value="ONLINE" accent={colors.green} />
            <View style={styles.dataSep} />
            <DataBlock label="CARD PIPELINE" value="READY" accent={colors.green} />
            <View style={styles.dataSep} />
            <DataBlock label="VERSION" value="1.0.0" />
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Text style={styles.bottomText}>CARDECON FINANCIAL SIMULATION ENGINE</Text>
        <Text style={styles.bottomText}>© {new Date().getFullYear()} · ALL RIGHTS RESERVED</Text>
      </View>

      <CompanionSelector
        visible={selectorVisible}
        selectedId={(portfolio?.companion_id as CompanionId | null) ?? null}
        onClose={() => setSelectorVisible(false)}
        onConfirm={handleCompanionConfirm}
      />
    </View>
  );
}

const createDataBlockStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    block: { alignItems: "flex-start" },
    label: { fontSize: 8, fontFamily: Fonts.sansBold, color: colors.textDim, letterSpacing: 1.5, marginBottom: 2 },
    value: { fontSize: 18, fontFamily: Fonts.mono, color: colors.textBright, letterSpacing: 1 },
    sub: { fontSize: 9, fontFamily: Fonts.mono, color: colors.textDim, marginTop: 1 },
  });

const createStyles = (colors: ReturnType<typeof useColors>, isNormal: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    topBar: {
      height: 40,
      backgroundColor: colors.bgPanel,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderPrimary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
    },
    topLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    topRight: { flexDirection: "row", alignItems: "center", gap: 6 },
    logo: { fontSize: 14, fontFamily: Fonts.mono, color: colors.blue, letterSpacing: 3 },
    barSep: { width: 1, height: 14, backgroundColor: colors.borderDim },
    topBarLabel: { fontSize: 9, fontFamily: Fonts.sansBold, color: colors.textDim, letterSpacing: 2 },
    topBtn: {
      borderWidth: 1,
      borderColor: colors.borderDim,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: isNormal ? 999 : 2,
      backgroundColor: isNormal ? colors.bg : "transparent",
    },
    topBtnText: { fontSize: 8, fontFamily: Fonts.sansBold, color: colors.textDim, letterSpacing: 1.5 },
    logoutBtn: {
      borderWidth: 1,
      borderColor: colors.borderDim,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: isNormal ? 999 : 2,
      marginLeft: 4,
    },
    logoutText: { fontSize: 9, fontFamily: Fonts.sansBold, color: colors.textDim, letterSpacing: 1.5 },
    contentScroll: {
      flex: 1,
    },
    content: {
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      gap: 16,
      flexGrow: 1,
      paddingBottom: 32,
    },
    card: {
      width: "100%",
      maxWidth: 620,
      backgroundColor: colors.bgPanel,
      borderWidth: 1,
      borderColor: colors.borderDim,
      borderRadius: isNormal ? 20 : 2,
      padding: 20,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderFaint,
      paddingBottom: 8,
    },
    blueDot: { width: 6, height: 6, borderRadius: 1, backgroundColor: colors.blue },
    cardHeaderText: { fontSize: 9, fontFamily: Fonts.sansBold, color: colors.blue, letterSpacing: 2 },
    username: { fontSize: 22, fontFamily: Fonts.mono, color: colors.textBright, letterSpacing: 2, marginBottom: 4 },
    email: { fontSize: 11, fontFamily: Fonts.mono, color: colors.textDim, marginBottom: 16 },
    dataRow: { flexDirection: "row", alignItems: "flex-start", gap: 4 },
    dataSep: { width: 1, height: 36, backgroundColor: colors.borderDim, marginHorizontal: 12, alignSelf: "center" },
    sessionDesc: { fontSize: 12, fontFamily: Fonts.sans, color: colors.textDim, lineHeight: 18, marginBottom: 16 },
    buttonRow: { flexDirection: "column", gap: 12, marginBottom: 12 },
    ctaBtn: {
      flex: 1,
      backgroundColor: colors.blue,
      paddingVertical: 14,
      paddingHorizontal: 12,
      alignItems: "center",
      borderRadius: isNormal ? 999 : 2,
    },
    ctaBtnText: { fontSize: 12, fontFamily: Fonts.sansBold, color: colors.bg, letterSpacing: isNormal ? 0.5 : 2 },
    continueBtn: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.blue + "66",
      paddingVertical: 14,
      paddingHorizontal: 12,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: isNormal ? 999 : 2,
    },
    continueBtnText: { fontSize: 11, fontFamily: Fonts.sansBold, color: colors.blue, letterSpacing: isNormal ? 0.5 : 1.5 },
    guideRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      marginBottom: 14,
    },
    guideCopy: {
      flex: 1,
      gap: 8,
    },
    guideName: {
      fontSize: 18,
      fontFamily: Fonts.sansBold,
      color: colors.textBright,
    },
    guideBody: {
      fontSize: 13,
      lineHeight: 20,
      fontFamily: Fonts.sans,
      color: colors.textPrimary,
    },
    secondaryBtn: {
      alignSelf: "flex-start",
      borderWidth: 1,
      borderColor: colors.borderDim,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    secondaryBtnText: {
      fontSize: 11,
      fontFamily: Fonts.sansBold,
      color: colors.textDim,
    },
    bottomBar: {
      height: 30,
      backgroundColor: colors.bgPanel,
      borderTopWidth: 1,
      borderTopColor: colors.borderFaint,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
    },
    bottomText: { fontSize: 8, fontFamily: Fonts.mono, color: colors.textMuted, letterSpacing: 1 },
  });
