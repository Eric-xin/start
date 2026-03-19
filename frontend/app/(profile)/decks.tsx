import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, Alert, TouchableOpacity, Switch,
} from "react-native";
import { useRouter } from "expo-router";
import {
  getProgress, updateProgress,
  ProgressData, StrategyInfo, DeckInfo,
} from "../../services/progress";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";

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
};

export default function DecksScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProgress()
      .then(setProgress)
      .catch(() => Alert.alert("Error", "Could not load deck settings."))
      .finally(() => setLoading(false));
  }, []);

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
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.blue} size="large" />
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

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.logo}>CARDECON</Text>
        <View style={styles.barSep} />
        <Text style={styles.topLabel}>INVESTMENT DECKS</Text>
        {saving && <ActivityIndicator color={Colors.blue} size="small" style={{ marginLeft: "auto" }} />}
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>BACK →</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Stats strip */}
        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <Text style={styles.statLabel}>TOTAL CARDS</Text>
            <Text style={styles.statValue}>{totalCards}</Text>
          </View>
          <View style={[styles.statBlock, styles.statBorder]}>
            <Text style={styles.statLabel}>STRATEGIES</Text>
            <Text style={[styles.statValue, { color: Colors.teal }]}>{unlockedStrategies}/5</Text>
          </View>
          <View style={[styles.statBlock, styles.statBorder]}>
            <Text style={styles.statLabel}>DECKS</Text>
            <Text style={[styles.statValue, { color: Colors.blue }]}>{unlockedDecks}/7</Text>
          </View>
          <View style={[styles.statBlock, styles.statBorder]}>
            <Text style={styles.statLabel}>ACTIVE</Text>
            <Text style={[styles.statValue, { color: Colors.green }]}>{enabledDecks}</Text>
          </View>
        </View>

        {/* Info banner */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Strategies are the top-level investment categories. Each strategy contains one or more
            specialized decks that filter which cards appear in your sessions. Enable or disable
            individual decks to focus your learning. Unlock new strategies and decks by playing more cards.
          </Text>
        </View>

        {/* Strategies with nested decks */}
        {progress?.strategies.map((strat) => {
          const decks = decksByStrategy[strat.key] ?? [];
          const icon = STRATEGY_ICONS[strat.key] ?? "•";
          const desc = STRATEGY_DESCRIPTIONS[strat.key] ?? "";

          return (
            <View
              key={strat.key}
              style={[styles.strategyBlock, !strat.is_unlocked && styles.lockedBlock]}
            >
              {/* Strategy header */}
              <View style={styles.strategyHeader}>
                <View style={styles.strategyLeft}>
                  <Text style={styles.strategyIcon}>{icon}</Text>
                  <View style={styles.strategyMeta}>
                    <Text style={[styles.strategyLabel, !strat.is_unlocked && { color: Colors.textMuted }]}>
                      {strat.label.toUpperCase()}
                    </Text>
                    <Text style={styles.strategyStage}>STAGE {strat.stage}</Text>
                  </View>
                </View>
                <View style={styles.strategyRight}>
                  {strat.is_unlocked ? (
                    <Switch
                      value={strat.is_enabled}
                      onValueChange={() => handleToggleStrategy(strat.key, strat.is_enabled)}
                      trackColor={{ false: Colors.borderDim, true: Colors.blue + "88" }}
                      thumbColor={strat.is_enabled ? Colors.blue : Colors.textMuted}
                      ios_backgroundColor={Colors.borderDim}
                    />
                  ) : (
                    <View style={styles.lockBadge}>
                      <Text style={styles.lockText}>🔒 LOCKED</Text>
                      <Text style={styles.unlockAt}>{strat.unlock_at} cards</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Strategy description */}
              <Text style={[styles.strategyDesc, !strat.is_unlocked && { opacity: 0.4 }]}>
                {desc}
              </Text>

              {/* Status indicator */}
              {strat.is_unlocked && (
                <View style={[styles.stratStatus, strat.is_enabled && styles.stratStatusOn]}>
                  <Text style={[styles.stratStatusText, strat.is_enabled && { color: Colors.green }]}>
                    {strat.is_enabled ? "● STRATEGY ACTIVE" : "○ STRATEGY DISABLED"}
                  </Text>
                </View>
              )}

              {/* Decks within this strategy */}
              {decks.length > 0 && (
                <View style={styles.decksContainer}>
                  <Text style={styles.decksLabel}>CARD DECKS</Text>
                  {decks.map((deck, idx) => {
                    const deckIcon = DECK_ICONS[deck.key] ?? "📁";
                    return (
                      <View
                        key={deck.key}
                        style={[
                          styles.deckRow,
                          idx < decks.length - 1 && styles.deckRowBorder,
                          !deck.is_unlocked && styles.deckLocked,
                        ]}
                      >
                        <View style={styles.deckLeft}>
                          <Text style={styles.deckIcon}>{deckIcon}</Text>
                          <View style={styles.deckMeta}>
                            <Text style={[styles.deckLabel, !deck.is_unlocked && { color: Colors.textMuted }]}>
                              {deck.label}
                            </Text>
                            {deck.description ? (
                              <Text style={styles.deckDesc}>{deck.description}</Text>
                            ) : null}
                            {!deck.is_unlocked && (
                              <Text style={styles.deckUnlockAt}>Unlocks at {deck.unlock_at} cards</Text>
                            )}
                          </View>
                        </View>
                        <View style={styles.deckRight}>
                          {deck.is_unlocked ? (
                            <Switch
                              value={deck.is_enabled}
                              onValueChange={() => handleToggleDeck(deck.key, deck.is_enabled)}
                              trackColor={{ false: Colors.borderDim, true: Colors.teal + "88" }}
                              thumbColor={deck.is_enabled ? Colors.teal : Colors.textMuted}
                              ios_backgroundColor={Colors.borderDim}
                              disabled={!strat.is_enabled}
                              style={!strat.is_enabled ? { opacity: 0.4 } : undefined}
                            />
                          ) : (
                            <Text style={styles.deckLockIcon}>🔒</Text>
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

  statsRow: {
    width: "100%", maxWidth: 620,
    flexDirection: "row",
    backgroundColor: Colors.bgPanel, borderWidth: 1, borderColor: Colors.borderDim, borderRadius: 2,
  },
  statBlock: { flex: 1, padding: 14, alignItems: "center" },
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
});
