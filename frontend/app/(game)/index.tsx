import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
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
import { ThemeModeToggle } from "../../components/theme/ThemeModeToggle";
import { AppTopBar } from "../../components/navigation/AppTopBar";

function GridBg() {
  const colors = useColors();
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}>
      {Array.from({ length: 28 }).map((_, i) => (
        <View
          key={`h${i}`}
          style={{ position: "absolute", top: i * 32, left: 0, right: 0, height: 1, backgroundColor: colors.borderFaint }}
        />
      ))}
      {Array.from({ length: 24 }).map((_, i) => (
        <View
          key={`v${i}`}
          style={{ position: "absolute", left: i * 64, top: 0, bottom: 0, width: 1, backgroundColor: colors.borderFaint, opacity: 0.35 }}
        />
      ))}
    </View>
  );
}

function SnapshotCard({
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
  return (
    <View
      style={{
        flex: 1,
        minWidth: 140,
        backgroundColor: colors.bg,
        borderWidth: 1,
        borderColor: colors.borderDim,
        borderRadius: 18,
        padding: 14,
      }}
    >
      <Text style={{ fontSize: 11, fontFamily: Fonts.sansBold, color: colors.textDim, marginBottom: 6 }}>{label}</Text>
      <Text style={{ fontSize: 22, fontFamily: Fonts.sansBold, color: accent ?? colors.textBright }}>{value}</Text>
      {sub ? <Text style={{ fontSize: 11, fontFamily: Fonts.sans, color: colors.textPrimary, marginTop: 6 }}>{sub}</Text> : null}
    </View>
  );
}

function QuickLink({
  label,
  sub,
  onPress,
}: {
  label: string;
  sub: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        minWidth: 160,
        backgroundColor: colors.bgPanel,
        borderWidth: 1,
        borderColor: colors.borderDim,
        borderRadius: 20,
        padding: 16,
      }}
    >
      <Text style={{ fontSize: 14, fontFamily: Fonts.sansBold, color: colors.textBright, marginBottom: 6 }}>{label}</Text>
      <Text style={{ fontSize: 12, fontFamily: Fonts.sans, color: colors.textPrimary, lineHeight: 18 }}>{sub}</Text>
    </TouchableOpacity>
  );
}

export default function GameIndexScreen() {
  const router = useRouter();
  const colors = useColors();
  const isNormal = useThemeStore((state) => state.mode === "normal");
  const setMode = useThemeStore((state) => state.setMode);
  const styles = createStyles(colors, isNormal);
  const { width } = useWindowDimensions();
  const isWide = width >= 1040;
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

  const quickLinks = [
    { label: isNormal ? "🧪 Simulation" : "SIMULATION", sub: isNormal ? "Try simple what-if scenarios before you risk anything." : "Run persona-driven historical backtests.", to: "/(game)/simulation" },
    { label: isNormal ? "💼 Portfolio" : "PORTFOLIO", sub: isNormal ? "See where your money is and what changed recently." : "Review capital, net worth, and recent moves.", to: "/(game)/portfolio" },
    { label: isNormal ? "🧠 Personas" : "PERSONAS", sub: isNormal ? "Compare your investor styles and switch the one you want to train." : "Manage active and archived personas.", to: "/(profile)/personas" },
    { label: isNormal ? "🃏 Decks" : "DECKS", sub: isNormal ? "Choose the lesson packs you want to see more often." : "Configure strategies and deck availability.", to: "/(profile)/decks" },
    { label: isNormal ? "🏆 Achievements" : "ACHIEVEMENTS", sub: isNormal ? "Track milestones and see what to unlock next." : "Review progression achievements.", to: "/(game)/achievements" },
  ];

  return (
    <View style={styles.container}>
      <GridBg />

      <AppTopBar
        label={isNormal ? "Home Base" : "INDEX"}
        rightContent={
          <>
            <ThemeModeToggle navSized />
            <TouchableOpacity style={styles.navBtn} onPress={() => router.push("/(profile)")}>
              <Text style={styles.navBtnText}>{isNormal ? "Profile" : "PROFILE"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navBtn, styles.logoutBtn]} onPress={clearAuth}>
              <Text style={styles.navBtnText}>{isNormal ? "Log Out" : "LOGOUT"}</Text>
            </TouchableOpacity>
          </>
        }
      />

      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, isWide && styles.heroWide]}>
          <View style={styles.heroMain}>
            <Text style={styles.eyebrow}>{isNormal ? "WELCOME BACK" : "SESSION READY"}</Text>
            <Text style={styles.heroTitle}>
              {isNormal ? `Hi ${user?.username ?? "Investor"}, ready for today's learning run?` : "Primary investor console online."}
            </Text>
            <Text style={styles.heroBody}>
              {isNormal
                ? "Your home screen now highlights the money story, your current learning style, and the guide helping you through the next decisions."
                : "Portfolio, persona, and deck systems are loaded. Choose a module or continue the active run."}
            </Text>

            <View style={styles.snapshotRow}>
              <SnapshotCard
                label={isNormal ? "🏦 Total value" : "NET WORTH"}
                value={loadingData ? "..." : `$${(portfolio?.net_worth ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
                sub={isNormal ? "Your overall money picture" : "Portfolio total"}
                accent={colors.blue}
              />
              <SnapshotCard
                label={isNormal ? "🧠 Active style" : "ACTIVE PERSONA"}
                value={loadingData ? "..." : activePersona?.name ?? "Explorer"}
                sub={isNormal ? "How the game is reading your choices" : "Current investor style"}
                accent={colors.teal}
              />
              <SnapshotCard
                label={isNormal ? "💵 Income" : "INCOME"}
                value={loadingData ? "..." : portfolio?.can_claim_income ? "Ready" : "Claimed"}
                sub={portfolio?.can_claim_income ? `+$${portfolio.pending_income.toFixed(0)} available now` : isNormal ? "Next claim tomorrow" : "Next cycle pending"}
                accent={portfolio?.can_claim_income ? colors.green : colors.textDim}
              />
            </View>

            <View style={styles.heroActions}>
              <TouchableOpacity style={styles.primaryCta} onPress={handlePlay} disabled={launching}>
                {launching ? <ActivityIndicator color={colors.bg} size="small" /> : <Text style={styles.primaryCtaText}>{isNormal ? "Start Playing" : "▶ START PLAYING"}</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryCta} onPress={() => router.push("/(game)/portfolio")}>
                <Text style={styles.secondaryCtaText}>{isNormal ? "Open Portfolio" : "OPEN PORTFOLIO"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.heroSide}>
            <View style={styles.guideCard}>
              <Text style={styles.panelTitle}>{isNormal ? "🧭 Your Guide" : "GUIDE SYSTEM"}</Text>
              {currentCompanion ? (
                <>
                  <View style={styles.guideTop}>
                    <CompanionVisual companionId={currentCompanion.id} size={92} />
                    <View style={styles.guideCopy}>
                      <Text style={styles.guideName}>{currentCompanion.name}</Text>
                      <Text style={styles.guideRole}>{currentCompanion.personality}</Text>
                    </View>
                  </View>
                  <Text style={styles.guideQuote}>"{currentCompanion.previewQuote}"</Text>
                </>
              ) : (
                <Text style={styles.guideQuote}>
                  {isNormal ? "Pick a guide to make the game feel more personal and easier to follow." : "Select a companion voice for the session."}
                </Text>
              )}
              <TouchableOpacity style={styles.ghostBtn} onPress={() => setSelectorVisible(true)}>
                <Text style={styles.ghostBtnText}>{currentCompanion ? (isNormal ? "Change Guide" : "CHANGE GUIDE") : (isNormal ? "Choose Guide" : "SELECT GUIDE")}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modeCard}>
              <Text style={styles.panelTitle}>{isNormal ? "🎨 Viewing Style" : "VIEW MODE"}</Text>
              <View style={styles.modeGrid}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setMode("normal")}
                  style={[styles.modePane, isNormal && styles.modePaneActive]}
                >
                  <Text style={styles.modePaneTitle}>Normal</Text>
                  <Text style={styles.modePaneBody}>Friendly labels, more breathing room, easier summaries, and a softer learning feel.</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setMode("pro")}
                  style={[styles.modePane, !isNormal && styles.modePaneActive]}
                >
                  <Text style={styles.modePaneTitle}>Pro</Text>
                  <Text style={styles.modePaneBody}>Dense market detail, faster scanning, terminal-style layouts, and the full trading feel.</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{isNormal ? "Explore the app" : "MODULE ACCESS"}</Text>
          <View style={styles.quickGrid}>
            {quickLinks.map((item) => (
              <QuickLink key={item.to} label={item.label} sub={item.sub} onPress={() => router.push(item.to as never)} />
            ))}
          </View>
        </View>

        <View style={[styles.section, isWide && styles.lowerGrid]}>
          <View style={styles.learningCard}>
            <Text style={styles.panelTitle}>{isNormal ? "📘 Your learning snapshot" : "LEARNING SNAPSHOT"}</Text>
            <Text style={styles.learningText}>
              {isNormal
                ? `You are currently learning as ${activePersona?.name ?? "an Explorer"} with ${currentCompanion?.name ?? "a guide"} by your side. The next best step is to keep making decisions and let your style evolve.`
                : `Active persona: ${activePersona?.name ?? "N/A"}. Companion: ${currentCompanion?.name ?? "N/A"}. Continue sessions to refine your trajectory.`}
            </Text>
          </View>

          <View style={styles.learningCard}>
            <Text style={styles.panelTitle}>{isNormal ? "✅ System check" : "SYSTEM STATUS"}</Text>
            <View style={styles.statusRow}>
              <SnapshotCard label={isNormal ? "Guide system" : "PERSONA ENGINE"} value="ONLINE" accent={colors.green} />
              <SnapshotCard label={isNormal ? "Card flow" : "CARD PIPELINE"} value="READY" accent={colors.green} />
            </View>
          </View>
        </View>
      </ScrollView>

      <CompanionSelector
        visible={selectorVisible}
        selectedId={(portfolio?.companion_id as CompanionId | null) ?? null}
        onClose={() => setSelectorVisible(false)}
        onConfirm={handleCompanionConfirm}
      />
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>, isNormal: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    contentScroll: { flex: 1 },
    content: {
      padding: 24,
      gap: 20,
      alignItems: "center",
      paddingBottom: 36,
    },
    navBtn: {
      borderWidth: 1,
      borderColor: colors.borderDim,
      borderRadius: isNormal ? 999 : 2,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: isNormal ? colors.bg : "transparent",
    },
    navBtnText: {
      fontSize: 10,
      fontFamily: Fonts.sansBold,
      color: colors.textDim,
      letterSpacing: isNormal ? 0.4 : 1.2,
    },
    logoutBtn: {
      marginLeft: 2,
    },
    hero: {
      width: "100%",
      maxWidth: 1180,
      gap: 18,
    },
    heroWide: {
      flexDirection: "row",
      alignItems: "stretch",
    },
    heroMain: {
      flex: 1.3,
      backgroundColor: colors.bgPanel,
      borderWidth: 1,
      borderColor: colors.borderDim,
      borderRadius: isNormal ? 28 : 2,
      padding: 24,
    },
    heroSide: {
      flex: 0.9,
      gap: 18,
    },
    eyebrow: {
      fontSize: 11,
      fontFamily: Fonts.sansBold,
      color: colors.blue,
      letterSpacing: isNormal ? 0.8 : 2,
      marginBottom: 10,
    },
    heroTitle: {
      fontSize: isNormal ? 32 : 24,
      lineHeight: isNormal ? 38 : 30,
      fontFamily: isNormal ? Fonts.sansBold : Fonts.mono,
      color: colors.textBright,
      marginBottom: 12,
    },
    heroBody: {
      fontSize: 14,
      lineHeight: 22,
      fontFamily: Fonts.sans,
      color: colors.textPrimary,
      marginBottom: 18,
      maxWidth: 760,
    },
    snapshotRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginBottom: 18,
    },
    heroActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    primaryCta: {
      minWidth: 190,
      backgroundColor: colors.blue,
      borderRadius: isNormal ? 999 : 2,
      paddingHorizontal: 20,
      paddingVertical: 15,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryCtaText: {
      fontSize: 13,
      fontFamily: Fonts.sansBold,
      color: colors.bg,
      letterSpacing: isNormal ? 0.3 : 1.4,
    },
    secondaryCta: {
      minWidth: 180,
      borderWidth: 1,
      borderColor: colors.blue + "55",
      borderRadius: isNormal ? 999 : 2,
      paddingHorizontal: 18,
      paddingVertical: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.bg,
    },
    secondaryCtaText: {
      fontSize: 12,
      fontFamily: Fonts.sansBold,
      color: colors.blue,
      letterSpacing: isNormal ? 0.2 : 1.2,
    },
    guideCard: {
      backgroundColor: colors.bgPanel,
      borderWidth: 1,
      borderColor: colors.borderDim,
      borderRadius: isNormal ? 24 : 2,
      padding: 20,
    },
    guideTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      marginBottom: 12,
    },
    guideCopy: {
      flex: 1,
      gap: 4,
    },
    guideName: {
      fontSize: 20,
      fontFamily: Fonts.sansBold,
      color: colors.textBright,
    },
    guideRole: {
      fontSize: 12,
      fontFamily: Fonts.sans,
      color: colors.textDim,
      lineHeight: 18,
    },
    guideQuote: {
      fontSize: 13,
      lineHeight: 20,
      fontFamily: Fonts.sans,
      color: colors.textPrimary,
      marginBottom: 14,
    },
    modeCard: {
      backgroundColor: colors.bgPanel,
      borderWidth: 1,
      borderColor: colors.borderDim,
      borderRadius: isNormal ? 24 : 2,
      padding: 20,
      gap: 14,
    },
    panelTitle: {
      fontSize: 12,
      fontFamily: Fonts.sansBold,
      color: colors.blue,
      letterSpacing: isNormal ? 0.4 : 1.8,
    },
    modeGrid: {
      gap: 10,
    },
    modePane: {
      borderWidth: 1,
      borderColor: colors.borderDim,
      borderRadius: 16,
      padding: 14,
      backgroundColor: colors.bg,
    },
    modePaneActive: {
      borderColor: colors.blue,
      backgroundColor: colors.blueDim,
    },
    modePaneTitle: {
      fontSize: 14,
      fontFamily: Fonts.sansBold,
      color: colors.textBright,
      marginBottom: 6,
    },
    modePaneBody: {
      fontSize: 12,
      fontFamily: Fonts.sans,
      color: colors.textPrimary,
      lineHeight: 18,
    },
    ghostBtn: {
      alignSelf: "flex-start",
      borderWidth: 1,
      borderColor: colors.borderDim,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 9,
      backgroundColor: colors.bg,
    },
    ghostBtnText: {
      fontSize: 11,
      fontFamily: Fonts.sansBold,
      color: colors.textDim,
    },
    section: {
      width: "100%",
      maxWidth: 1180,
      gap: 14,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: Fonts.sansBold,
      color: colors.textBright,
    },
    quickGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 14,
    },
    lowerGrid: {
      flexDirection: "row",
      alignItems: "stretch",
    },
    learningCard: {
      flex: 1,
      minWidth: 260,
      backgroundColor: colors.bgPanel,
      borderWidth: 1,
      borderColor: colors.borderDim,
      borderRadius: isNormal ? 24 : 2,
      padding: 20,
      gap: 12,
    },
    learningText: {
      fontSize: 13,
      fontFamily: Fonts.sans,
      lineHeight: 21,
      color: colors.textPrimary,
    },
    statusRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
  });
