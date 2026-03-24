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
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const colors = useColors();
  const isNormal = useThemeStore((state) => state.mode === "normal");
  const setMode = useThemeStore((state) => state.setMode);
  const styles = createStyles(colors, isNormal);
  const { width } = useWindowDimensions();
  const isWide = width >= 1040;
  const isNarrow = width < 520;
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
          t("home.alerts.connectionTitle"),
          t("home.alerts.connectionBody")
        );
      })
      .finally(() => setLoadingData(false));
  }, [setCompanion, setPortfolio, t]);

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
      Alert.alert(t("common.error"), t("home.alerts.loadCards"));
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
      Alert.alert(t("common.error"), t("home.alerts.saveGuide"));
    }
  };

  const quickLinks = [
    { label: isNormal ? t("home.links.simulation") : t("home.linksPro.simulation"), sub: isNormal ? t("home.linksSub.simulation") : t("home.linksSubPro.simulation"), to: "/(game)/simulation" },
    { label: isNormal ? t("home.links.portfolio") : t("home.linksPro.portfolio"), sub: isNormal ? t("home.linksSub.portfolio") : t("home.linksSubPro.portfolio"), to: "/(game)/portfolio" },
    { label: isNormal ? t("home.links.personas") : t("home.linksPro.personas"), sub: isNormal ? t("home.linksSub.personas") : t("home.linksSubPro.personas"), to: "/(profile)/personas" },
    { label: isNormal ? t("home.links.decks") : t("home.linksPro.decks"), sub: isNormal ? t("home.linksSub.decks") : t("home.linksSubPro.decks"), to: "/(profile)/decks" },
    { label: isNormal ? t("home.links.achievements") : t("home.linksPro.achievements"), sub: isNormal ? t("home.linksSub.achievements") : t("home.linksSubPro.achievements"), to: "/(game)/achievements" },
    { label: isNormal ? t("home.links.leaderboard") : t("home.linksPro.leaderboard"), sub: isNormal ? t("home.linksSub.leaderboard") : t("home.linksSubPro.leaderboard"), to: "/(game)/leaderboard" },
    { label: isNormal ? t("home.links.arena") : t("home.linksPro.arena"), sub: isNormal ? t("home.linksSub.arena") : t("home.linksSubPro.arena"), to: "/(game)/arena" },
  ];

  return (
    <View style={styles.container}>
      <GridBg />

      <AppTopBar
        label={isNormal ? t("topbar.homeBase") : t("home.topBarPro")}
        rightContent={
          <>
            <ThemeModeToggle compact={isNarrow} navSized={!isNarrow} />
            <TouchableOpacity style={[styles.navBtn, isNarrow && styles.navBtnNarrow]} onPress={() => router.push("/(profile)")}>
              <Text style={styles.navBtnText}>{isNormal ? t("topbar.profile") : t("home.profilePro")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navBtn, styles.logoutBtn, isNarrow && styles.navBtnNarrow]} onPress={clearAuth}>
              <Text style={styles.navBtnText}>{isNormal ? t("home.logout") : t("home.logoutPro")}</Text>
            </TouchableOpacity>
          </>
        }
      />

      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, isWide && styles.heroWide]}>
          <View style={styles.heroMain}>
            <Text style={styles.eyebrow}>{isNormal ? t("home.eyebrow") : t("home.eyebrowPro")}</Text>
            <Text style={styles.heroTitle}>
              {isNormal ? t("home.heroTitle", { user: user?.username ?? t("home.defaultUser") }) : t("home.heroTitlePro")}
            </Text>
            <Text style={styles.heroBody}>
              {isNormal
                ? t("home.heroBody")
                : t("home.heroBodyPro")}
            </Text>

            <View style={styles.snapshotRow}>
              <SnapshotCard
                label={isNormal ? t("home.cards.totalValue") : t("home.cards.totalValuePro")}
                value={loadingData ? "..." : `$${(portfolio?.net_worth ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
                sub={isNormal ? t("home.cards.totalValueSub") : t("home.cards.totalValueSubPro")}
                accent={colors.blue}
              />
              <SnapshotCard
                label={isNormal ? t("home.cards.activeStyle") : t("home.cards.activeStylePro")}
                value={loadingData ? "..." : activePersona?.name ?? t("home.defaultPersona")}
                sub={isNormal ? t("home.cards.activeStyleSub") : t("home.cards.activeStyleSubPro")}
                accent={colors.teal}
              />
              <SnapshotCard
                label={isNormal ? t("home.cards.income") : t("home.cards.incomePro")}
                value={loadingData ? "..." : portfolio?.can_claim_income ? t("home.cards.incomeReady") : t("home.cards.incomeClaimed")}
                sub={portfolio?.can_claim_income ? t("home.cards.incomeAvailable", { amount: portfolio.pending_income.toFixed(0) }) : isNormal ? t("home.cards.incomeNext") : t("home.cards.incomeNextPro")}
                accent={portfolio?.can_claim_income ? colors.green : colors.textDim}
              />
            </View>

            <View style={styles.heroActions}>
              <TouchableOpacity style={styles.primaryCta} onPress={handlePlay} disabled={launching}>
                {launching ? <ActivityIndicator color={colors.bg} size="small" /> : <Text style={styles.primaryCtaText}>{isNormal ? t("home.cta.start") : t("home.cta.startPro")}</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryCta} onPress={() => router.push("/(game)/portfolio")}>
                <Text style={styles.secondaryCtaText}>{isNormal ? t("home.cta.portfolio") : t("home.cta.portfolioPro")}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.heroSide}>
            <View style={styles.guideCard}>
              <Text style={styles.panelTitle}>{isNormal ? t("home.guide.title") : t("home.guide.titlePro")}</Text>
              {currentCompanion ? (
                <>
                  <View style={styles.guideTop}>
                    <CompanionVisual companionId={currentCompanion.id} size={92} />
                    <View style={styles.guideCopy}>
                      <Text style={styles.guideName}>{currentCompanion.name}</Text>
                      <Text style={styles.guideRole}>{currentCompanion.personality}</Text>
                    </View>
                  </View>
                  {/* <Text style={styles.guideQuote}>"{currentCompanion.previewQuote}"</Text> */}
                </>
              ) : (
                <Text style={styles.guideQuote}>
                  {isNormal ? t("home.guide.empty") : t("home.guide.emptyPro")}
                </Text>
              )}
              <TouchableOpacity style={styles.ghostBtn} onPress={() => setSelectorVisible(true)}>
                <Text style={styles.ghostBtnText}>{currentCompanion ? (isNormal ? t("home.guide.change") : t("home.guide.changePro")) : (isNormal ? t("home.guide.choose") : t("home.guide.choosePro"))}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modeCard}>
              <Text style={styles.panelTitle}>{isNormal ? t("home.mode.title") : t("home.mode.titlePro")}</Text>
              <View style={styles.modeGrid}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setMode("normal")}
                  style={[styles.modePane, isNormal && styles.modePaneActive]}
                >
                  <Text style={styles.modePaneTitle}>{t("home.mode.normal")}</Text>
                  <Text style={styles.modePaneBody}>{t("home.mode.normalBody")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setMode("pro")}
                  style={[styles.modePane, !isNormal && styles.modePaneActive]}
                >
                  <Text style={styles.modePaneTitle}>{t("home.mode.pro")}</Text>
                  <Text style={styles.modePaneBody}>{t("home.mode.proBody")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Arena Feature Banner */}
        <TouchableOpacity
          style={styles.arenaBanner}
          onPress={() => router.push("/(game)/arena" as never)}
          activeOpacity={0.88}
        >
          <View style={styles.arenaBannerLeft}>
            <View style={styles.arenaBadge}>
              <Text style={styles.arenaBadgeText}>{t("home.arena.new")}</Text>
            </View>
            <Text style={styles.arenaBannerTitle}>{isNormal ? t("home.arena.title") : t("home.arena.titlePro")}</Text>
            <Text style={styles.arenaBannerSub}>
              {isNormal
                ? t("home.arena.sub")
                : t("home.arena.subPro")}
            </Text>
          </View>
          <Text style={styles.arenaBannerArrow}>{isNormal ? t("home.arena.arrow") : t("home.arena.arrowPro")}</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{isNormal ? t("home.sectionTitle") : t("home.sectionTitlePro")}</Text>
          <View style={styles.quickGrid}>
            {quickLinks.filter(l => l.to !== "/(game)/arena").map((item) => (
              <QuickLink key={item.to} label={item.label} sub={item.sub} onPress={() => router.push(item.to as never)} />
            ))}
          </View>
        </View>

        <View style={[styles.section, isWide && styles.lowerGrid]}>
          <View style={styles.learningCard}>
            <Text style={styles.panelTitle}>{isNormal ? t("home.snapshot.title") : t("home.snapshot.titlePro")}</Text>
            <Text style={styles.learningText}>
              {isNormal
                ? t("home.snapshot.body", {
                    persona: activePersona?.name ?? t("home.defaultPersonaLong"),
                    companion: currentCompanion?.name ?? t("home.defaultGuide"),
                  })
                : t("home.snapshot.bodyPro", {
                    persona: activePersona?.name ?? "N/A",
                    companion: currentCompanion?.name ?? "N/A",
                  })}
            </Text>
          </View>

          <View style={styles.learningCard}>
            <Text style={styles.panelTitle}>{isNormal ? t("home.system.title") : t("home.system.titlePro")}</Text>
            <View style={styles.statusRow}>
              <SnapshotCard label={isNormal ? t("home.system.guide") : t("home.system.guidePro")} value={t("home.system.online")} accent={colors.green} />
              <SnapshotCard label={isNormal ? t("home.system.cards") : t("home.system.cardsPro")} value={t("home.system.ready")} accent={colors.green} />
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
    navBtnNarrow: {
      paddingHorizontal: 8,
      paddingVertical: 5,
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
      gap: 14,
    },
    guideTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      marginTop: 4,
      marginBottom: 6,
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
      marginBottom: 2,
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
    arenaBanner: {
      width: "100%",
      maxWidth: 1180,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: isNormal ? colors.bgPanel : "#07122b",
      borderWidth: 1.5,
      borderColor: colors.blue,
      borderRadius: isNormal ? 24 : 2,
      paddingHorizontal: 24,
      paddingVertical: 20,
      overflow: "hidden",
    },
    arenaBannerLeft: {
      flex: 1,
      gap: 6,
    },
    arenaBadge: {
      alignSelf: "flex-start",
      backgroundColor: colors.blue,
      borderRadius: isNormal ? 999 : 1,
      paddingHorizontal: 8,
      paddingVertical: 2,
      marginBottom: 2,
    },
    arenaBadgeText: {
      fontFamily: Fonts.sansBold,
      fontSize: 9,
      color: "#fff",
      letterSpacing: 1.5,
    },
    arenaBannerTitle: {
      fontFamily: isNormal ? Fonts.sansBold : Fonts.mono,
      fontSize: isNormal ? 20 : 14,
      color: colors.textBright,
      letterSpacing: isNormal ? 0 : 2,
    },
    arenaBannerSub: {
      fontFamily: Fonts.sans,
      fontSize: 12,
      color: colors.textPrimary,
      lineHeight: 18,
      letterSpacing: isNormal ? 0 : 0.3,
    },
    arenaBannerArrow: {
      fontFamily: Fonts.mono,
      fontSize: 22,
      color: colors.blue,
      marginLeft: 16,
    },
  });
