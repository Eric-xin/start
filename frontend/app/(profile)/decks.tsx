import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, Alert, TouchableOpacity, Switch, useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import {
  getProgress, updateProgress, purchaseDeck,
  ProgressData, StrategyInfo, DeckInfo,
} from "../../services/progress";
import { getPortfolio } from "../../services/portfolio";
import { Colors, useColors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { useThemeStore } from "../../store/themeStore";
import { ThemeModeToggle } from "../../components/theme/ThemeModeToggle";
import { AppTopBar } from "../../components/navigation/AppTopBar";

const STRATEGY_ICONS: Record<string, string> = {
  savings: "💵",
  bonds: "📄",
  stocks: "📈",
  index: "🗂",
  alternatives: "🔮",
};

const STRATEGY_DESCRIPTIONS: Record<string, string> = {
  savings: "Cash, money market funds, and savings accounts. Low risk, low return.",
  bonds: "Government and corporate debt instruments. Fixed income with predictable cash flows.",
  stocks: "Equity ownership in public companies. Higher volatility, higher expected return.",
  index: "Diversified market exposure via index funds and ETFs. Passive investing at its core.",
  alternatives: "Commodities, derivatives, real estate, and crypto. Advanced instruments.",
};

const DECK_ICONS: Record<string, string> = {
  savings_core: "🏦",
  bonds_core: "📋",
  stocks_core: "📊",
  crypto_deck: "🪙",
  index_core: "📦",
  real_estate_deck: "🏠",
  derivatives_deck: "⚗️",
  great_depression_deck: "📰",
  covid_era_deck: "🧬",
};

export default function DecksScreen() {
  const router = useRouter();
  const colors = useColors();
  const isNormal = useThemeStore((state) => state.mode === "normal");
  const { width } = useWindowDimensions();
  const isWide = width >= 1100;
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [capital, setCapital] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [purchasingDeck, setPurchasingDeck] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getProgress(), getPortfolio()])
      .then(([p, pf]) => {
        setProgress(p);
        setCapital(pf.capital);
      })
      .catch(() => Alert.alert("Error", "Could not load deck settings."))
      .finally(() => setLoading(false));
  }, []);

  const handlePurchaseDeck = async (deck: DeckInfo) => {
    if (!deck.is_purchasable || !deck.shop_price) return;
    if (capital < deck.shop_price) {
      Alert.alert("Insufficient Capital", `You need $${deck.shop_price.toLocaleString()} to buy this deck.`);
      return;
    }
    setPurchasingDeck(deck.key);
    try {
      const resp = await purchaseDeck(deck.key);
      setProgress(resp.progress);
      setCapital(resp.remaining_capital);
      Alert.alert("Deck Purchased", `${deck.label} unlocked for $${deck.shop_price.toLocaleString()}.`);
    } catch {
      Alert.alert("Purchase Failed", "Could not purchase this deck right now.");
    } finally {
      setPurchasingDeck(null);
    }
  };

  const handleToggleStrategy = async (key: string, currentlyEnabled: boolean) => {
    if (!progress) return;
    const strategy = progress.strategies.find((s) => s.key === key);
    if (!strategy?.is_unlocked) return;

    const enabled = new Set(progress.enabled_strategies);
    if (currentlyEnabled) {
      if (enabled.size <= 1) {
        Alert.alert("Required", "At least one strategy must remain enabled.");
        return;
      }
      enabled.delete(key);
    } else {
      enabled.add(key);
    }

    setSaving(true);
    try {
      const updated = await updateProgress({ enabled_strategies: Array.from(enabled) });
      setProgress(updated);
    } catch {
      Alert.alert("Error", "Could not update strategy settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDeck = async (key: string, currentlyEnabled: boolean) => {
    if (!progress) return;
    const deck = progress.decks.find((d) => d.key === key);
    if (!deck?.is_unlocked) return;

    const enabled = new Set(progress.enabled_decks);
    if (currentlyEnabled) {
      if (enabled.size <= 1) {
        Alert.alert("Required", "At least one deck must remain enabled.");
        return;
      }
      enabled.delete(key);
    } else {
      enabled.add(key);
    }

    setSaving(true);
    try {
      const updated = await updateProgress({ enabled_decks: Array.from(enabled) });
      setProgress(updated);
    } catch {
      Alert.alert("Error", "Could not update deck settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.blue} size="large" />
      </View>
    );
  }

  // Group decks by strategy
  const decksByStrategy: Record<string, DeckInfo[]> = {};
  for (const deck of progress?.decks ?? []) {
    if (!decksByStrategy[deck.strategy]) decksByStrategy[deck.strategy] = [];
    decksByStrategy[deck.strategy].push(deck);
  }

  const totalCards = progress?.total_cards_played ?? 0;
  const unlockedStrategies = progress?.unlocked_strategies.length ?? 0;
  const unlockedDecks = progress?.unlocked_decks.length ?? 0;
  const enabledDecks = progress?.enabled_decks.length ?? 0;
  const totalDecks = progress?.decks.length ?? 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <AppTopBar
        label={isNormal ? "Learning Decks" : "INVESTMENT DECKS"}
        onBack={() => router.back()}
        rightContent={
          <>
            <ThemeModeToggle navSized />
            {saving ? <ActivityIndicator color={colors.blue} size="small" /> : null}
          </>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.hero, isWide && styles.heroWide]}>
          <View style={[styles.heroMain, { backgroundColor: colors.bgPanel, borderColor: colors.borderDim, borderRadius: isNormal ? 24 : 2 }]}>
            <Text style={[styles.heroEyebrow, { color: isNormal ? colors.blueBright : colors.blue }]}>
              {isNormal ? "BUILD YOUR LESSON MENU" : "DECK CONTROL"}
            </Text>
            <Text style={[styles.heroTitle, { color: colors.textBright }]}>
              {isNormal ? "Choose what you want to practice next." : "Configure active strategies and deck exposure."}
            </Text>
            <Text style={[styles.heroBody, { color: colors.textPrimary }]}>
              {isNormal
                ? "Turn themes on to see more of them while you play. Start simple, then unlock more advanced packs when you feel ready."
                : "Strategies are the top-level investment categories. Each strategy contains one or more specialized decks that shape which cards appear in sessions."}
            </Text>

            <View style={styles.statsRow}>
              <View style={[styles.statBlock, { backgroundColor: colors.bg, borderColor: colors.borderDim, borderRadius: isNormal ? 16 : 2 }]}>
                <Text style={[styles.statLabel, { color: colors.textDim }]}>{isNormal ? "Cards seen" : "TOTAL CARDS"}</Text>
                <Text style={[styles.statValue, { color: colors.textBright }]}>{totalCards}</Text>
              </View>
              <View style={[styles.statBlock, { backgroundColor: colors.bg, borderColor: colors.borderDim, borderRadius: isNormal ? 16 : 2 }]}>
                <Text style={[styles.statLabel, { color: colors.textDim }]}>{isNormal ? "Themes" : "STRATEGIES"}</Text>
                <Text style={[styles.statValue, { color: colors.teal }]}>{unlockedStrategies}/5</Text>
              </View>
              <View style={[styles.statBlock, { backgroundColor: colors.bg, borderColor: colors.borderDim, borderRadius: isNormal ? 16 : 2 }]}>
                <Text style={[styles.statLabel, { color: colors.textDim }]}>{isNormal ? "Decks" : "DECKS"}</Text>
                <Text style={[styles.statValue, { color: colors.blue }]}>{unlockedDecks}/{totalDecks}</Text>
              </View>
            </View>
          </View>

          <View style={styles.heroSide}>
            <View style={[styles.summaryCard, { backgroundColor: colors.bgPanel, borderColor: colors.borderDim, borderRadius: isNormal ? 24 : 2 }]}>
              <Text style={[styles.summaryTitle, { color: isNormal ? colors.blueBright : colors.blue }]}>
                {isNormal ? "Quick status" : "STATUS"}
              </Text>
              <Text style={[styles.summaryLine, { color: colors.textPrimary }]}>
                {enabledDecks} active deck{enabledDecks === 1 ? "" : "s"}
              </Text>
              <Text style={[styles.summaryLine, { color: colors.textPrimary }]}>
                ${Math.round(capital).toLocaleString()} ready to spend
              </Text>
              <Text style={[styles.summaryNote, { color: colors.textDim }]}>
                {isNormal ? "Locked packs open as you keep learning." : "Unlock additional content through play progression."}
              </Text>
            </View>
          </View>
        </View>

        {/* Strategies with nested decks */}
        <View style={[styles.strategyGrid, isWide && styles.strategyGridWide]}>
          {progress?.strategies.map((strat) => {
            const decks = decksByStrategy[strat.key] ?? [];
            const icon = STRATEGY_ICONS[strat.key] ?? "•";
            const desc = STRATEGY_DESCRIPTIONS[strat.key] ?? "";

            return (
              <View
                key={strat.key}
                style={[
                  styles.strategyBlock,
                  isWide && styles.strategyBlockWide,
                  {
                    backgroundColor: colors.bgPanel,
                    borderColor: colors.borderDim,
                    borderRadius: isNormal ? 18 : 2,
                  },
                  !strat.is_unlocked && styles.lockedBlock,
                ]}
              >
              {/* Strategy header */}
              <View style={styles.strategyHeader}>
                <View style={styles.strategyLeft}>
                  <Text style={styles.strategyIcon}>{icon}</Text>
                  <View style={styles.strategyMeta}>
                    <Text style={[styles.strategyLabel, { color: !strat.is_unlocked ? colors.textMuted : colors.textBright, fontFamily: isNormal ? Fonts.sansBold : Fonts.mono }]}>
                      {isNormal ? strat.label : strat.label.toUpperCase()}
                    </Text>
                    <Text style={[styles.strategyStage, { color: colors.textMuted }]}>
                      {isNormal ? (strat.is_unlocked ? "Ready to use" : `Opens after ${strat.unlock_at} cards`) : `STAGE ${strat.stage}`}
                    </Text>
                  </View>
                </View>
                <View style={styles.strategyRight}>
                  {strat.is_unlocked ? (
                    <Switch
                      value={strat.is_enabled}
                      onValueChange={() => handleToggleStrategy(strat.key, strat.is_enabled)}
                      trackColor={{ false: colors.borderDim, true: colors.blue + "88" }}
                      thumbColor={strat.is_enabled ? colors.blue : colors.textMuted}
                      ios_backgroundColor={colors.borderDim}
                    />
                  ) : (
                    <View style={styles.lockBadge}>
                      <Text style={[styles.lockText, { color: colors.textMuted }]}>🔒 LOCKED</Text>
                      <Text style={[styles.unlockAt, { color: colors.textMuted }]}>{strat.unlock_at} cards</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Strategy description */}
              <Text style={[styles.strategyDesc, { color: colors.textPrimary }, !strat.is_unlocked && { opacity: 0.4 }]}>
                {isNormal
                  ? desc
                      .replace("Low risk, low return.", "Usually safer, but slower-growing.")
                      .replace("Higher volatility, higher expected return.", "Can grow faster, but feels bumpier.")
                      .replace("Advanced instruments.", "More advanced and trickier to master.")
                  : desc}
              </Text>

              {/* Status indicator */}
              {strat.is_unlocked && (
                <View style={[styles.stratStatus, { borderTopColor: colors.borderFaint }, strat.is_enabled && { borderTopColor: colors.green + "33" }]}>
                  <Text style={[styles.stratStatusText, { color: strat.is_enabled ? colors.green : colors.textMuted }]}>
                    {strat.is_enabled ? (isNormal ? "● Theme turned on" : "● STRATEGY ACTIVE") : (isNormal ? "○ Theme turned off" : "○ STRATEGY DISABLED")}
                  </Text>
                </View>
              )}

              {/* Decks within this strategy */}
              {decks.length > 0 && (
                <View style={[styles.decksContainer, { backgroundColor: isNormal ? colors.bgSurface : Colors.bg + "80", borderTopColor: colors.borderDim }]}>
                  <Text style={[styles.decksLabel, { color: colors.textMuted }]}>{isNormal ? "CARD PACKS" : "CARD DECKS"}</Text>
                  {decks.map((deck, idx) => {
                    const deckIcon = DECK_ICONS[deck.key] ?? "📁";
                    return (
                      <View
                        key={deck.key}
                        style={[
                          styles.deckRow,
                          { backgroundColor: isNormal ? colors.bgPanel : "transparent" },
                          idx < decks.length - 1 && styles.deckRowBorder,
                          !deck.is_unlocked && styles.deckLocked,
                        ]}
                      >
                        <View style={styles.deckLeft}>
                          <Text style={styles.deckIcon}>{deckIcon}</Text>
                          <View style={styles.deckMeta}>
                            <Text style={[styles.deckLabel, { color: !deck.is_unlocked ? colors.textMuted : colors.textBright, fontFamily: isNormal ? Fonts.sansBold : Fonts.mono }]}>
                              {deck.label}
                            </Text>
                            {deck.description ? (
                              <Text style={[styles.deckDesc, { color: colors.textPrimary }]}>{deck.description}</Text>
                            ) : null}
                            {!deck.is_unlocked && (
                              <Text style={[styles.deckUnlockAt, { color: colors.textMuted }]}>
                                {deck.is_purchasable && deck.shop_price
                                  ? (isNormal ? `Unlock now for $${deck.shop_price.toLocaleString()}` : `Buy for $${deck.shop_price.toLocaleString()}`)
                                  : (isNormal ? `Opens after ${deck.unlock_at} cards` : `Unlocks at ${deck.unlock_at} cards`)}
                              </Text>
                            )}
                          </View>
                        </View>
                        <View style={styles.deckRight}>
                          {deck.is_unlocked ? (
                            <Switch
                              value={deck.is_enabled}
                              onValueChange={() => handleToggleDeck(deck.key, deck.is_enabled)}
                              trackColor={{ false: colors.borderDim, true: colors.teal + "88" }}
                              thumbColor={deck.is_enabled ? colors.teal : colors.textMuted}
                              ios_backgroundColor={colors.borderDim}
                              disabled={!strat.is_enabled}
                              style={!strat.is_enabled ? { opacity: 0.4 } : undefined}
                            />
                          ) : (
                            deck.is_purchasable && deck.shop_price ? (
                              <TouchableOpacity
                                style={[styles.buyBtn, { borderColor: colors.amber, backgroundColor: colors.amber + "22", borderRadius: isNormal ? 999 : 2 }]}
                                onPress={() => handlePurchaseDeck(deck)}
                                disabled={purchasingDeck === deck.key || capital < deck.shop_price}
                              >
                                <Text
                                  style={[
                                    styles.buyBtnText,
                                    { color: colors.amber },
                                    (purchasingDeck === deck.key || capital < deck.shop_price) && { opacity: 0.5 },
                                  ]}
                                >
                                  {purchasingDeck === deck.key ? "BUYING..." : "BUY"}
                                </Text>
                              </TouchableOpacity>
                            ) : (
                              <Text style={styles.deckLockIcon}>🔒</Text>
                            )
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
              </View>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loading: { flex: 1, backgroundColor: Colors.bg, alignItems: "center", justifyContent: "center" },

  topBar: {
    height: 40, backgroundColor: Colors.bgPanel,
    borderBottomWidth: 1, borderBottomColor: Colors.borderPrimary,
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 10,
  },
  backText: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 1.5 },
  logo: { fontSize: 13, fontFamily: Fonts.mono, color: Colors.blue, letterSpacing: 3 },
  barSep: { width: 1, height: 14, backgroundColor: Colors.borderDim },
  topLabel: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 2, flex: 1 },

  scroll: { padding: 20, gap: 14, alignItems: "center" },
  hero: {
    width: "100%",
    maxWidth: 1100,
    gap: 14,
  },
  heroWide: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  heroMain: {
    flex: 1.2,
    borderWidth: 1,
    padding: 20,
  },
  heroSide: {
    flex: 0.7,
    minWidth: 280,
  },
  heroEyebrow: {
    fontSize: 10,
    fontFamily: Fonts.sansBold,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontFamily: Fonts.sansBold,
    marginBottom: 10,
  },
  heroBody: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Fonts.sans,
    marginBottom: 14,
  },
  summaryCard: {
    borderWidth: 1,
    padding: 20,
    gap: 10,
  },
  summaryTitle: {
    fontSize: 12,
    fontFamily: Fonts.sansBold,
    letterSpacing: 1.2,
  },
  summaryLine: {
    fontSize: 16,
    fontFamily: Fonts.sansBold,
  },
  summaryNote: {
    fontSize: 11,
    lineHeight: 18,
    fontFamily: Fonts.sans,
  },

  statsRow: {
    width: "100%", maxWidth: 620,
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  statBlock: { flex: 1, minWidth: 140, padding: 14, alignItems: "center", borderWidth: 1 },
  statBorder: { borderLeftWidth: 1, borderLeftColor: Colors.borderDim },
  statLabel: { fontSize: 7, fontFamily: Fonts.sansBold, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 4 },
  statValue: { fontSize: 18, fontFamily: Fonts.mono, color: Colors.textBright, letterSpacing: 1 },

  infoCard: {
    width: "100%", maxWidth: 620,
    backgroundColor: Colors.bgPanel, borderWidth: 1, borderColor: Colors.borderFaint,
    borderLeftWidth: 3, borderLeftColor: Colors.blue,
    borderRadius: 2, padding: 14,
  },
  infoText: { fontSize: 11, fontFamily: Fonts.sans, color: Colors.textDim, lineHeight: 16 },

  strategyBlock: {
    width: "100%", maxWidth: 620,
    backgroundColor: Colors.bgPanel, borderWidth: 1, borderColor: Colors.borderDim,
    borderRadius: 2, overflow: "hidden",
  },
  strategyGrid: {
    width: "100%",
    maxWidth: 1100,
    gap: 14,
  },
  strategyGridWide: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  strategyBlockWide: {
    width: "48.5%",
    maxWidth: undefined,
  },
  lockedBlock: { opacity: 0.65 },

  strategyHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    padding: 18, paddingBottom: 10,
  },
  strategyLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  strategyIcon: { fontSize: 22 },
  strategyMeta: { gap: 3 },
  strategyLabel: { fontSize: 14, fontFamily: Fonts.mono, color: Colors.textBright, letterSpacing: 1 },
  strategyStage: { fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.textMuted, letterSpacing: 1.5 },
  strategyRight: { alignItems: "flex-end", paddingTop: 2 },
  lockBadge: { alignItems: "flex-end", gap: 2 },
  lockText: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.textMuted, letterSpacing: 1 },
  unlockAt: { fontSize: 8, fontFamily: Fonts.mono, color: Colors.textMuted },

  strategyDesc: { fontSize: 11, fontFamily: Fonts.sans, color: Colors.textDim, lineHeight: 16, paddingHorizontal: 18, marginBottom: 10 },

  stratStatus: {
    marginHorizontal: 18, paddingTop: 8, marginBottom: 10,
    borderTopWidth: 1, borderTopColor: Colors.borderFaint,
  },
  stratStatusOn: { borderTopColor: Colors.green + "33" },
  stratStatusText: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.textMuted, letterSpacing: 1.5 },

  decksContainer: {
    borderTopWidth: 1, borderTopColor: Colors.borderDim,
    backgroundColor: Colors.bg + "80",
  },
  decksLabel: {
    fontSize: 7, fontFamily: Fonts.sansBold, color: Colors.textMuted,
    letterSpacing: 2, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 4,
  },
  deckRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 18, paddingVertical: 12,
  },
  deckRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderFaint },
  deckLocked: { opacity: 0.5 },
  deckLeft: { flexDirection: "row", alignItems: "flex-start", gap: 10, flex: 1 },
  deckIcon: { fontSize: 16, marginTop: 1 },
  deckMeta: { flex: 1, gap: 2 },
  deckLabel: { fontSize: 12, fontFamily: Fonts.mono, color: Colors.textBright, letterSpacing: 0.5 },
  deckDesc: { fontSize: 10, fontFamily: Fonts.sans, color: Colors.textMuted, lineHeight: 14 },
  deckUnlockAt: { fontSize: 9, fontFamily: Fonts.mono, color: Colors.textMuted, marginTop: 2 },
  deckRight: { paddingLeft: 12 },
  deckLockIcon: { fontSize: 14, opacity: 0.5 },
  buyBtn: {
    borderWidth: 1,
    borderColor: Colors.amber,
    backgroundColor: Colors.amber + "22",
    borderRadius: 2,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  buyBtnText: {
    fontSize: 9,
    fontFamily: Fonts.sansBold,
    color: Colors.amber,
    letterSpacing: 1.2,
  },
});
