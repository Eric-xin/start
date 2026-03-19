import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, Alert, TouchableOpacity, Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { getProgress, updateProgress, ProgressData, StrategyInfo } from "../../services/progress";
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
  savings: "Cash, money market funds, and savings accounts. Low risk, low return. Your starting foundation.",
  bonds: "Government and corporate debt instruments. Fixed income with predictable cash flows.",
  stocks: "Equity ownership in public companies. Higher volatility, higher expected return.",
  index: "Diversified market exposure via index funds and ETFs. Passive investing at its core.",
  alternatives: "Commodities, derivatives, real estate, and crypto. Complex instruments for advanced investors.",
};

function StrategyCard({ strategy, onToggle }: { strategy: StrategyInfo; onToggle: () => void }) {
  const icon = STRATEGY_ICONS[strategy.key] ?? "•";
  const desc = STRATEGY_DESCRIPTIONS[strategy.key] ?? "";

  return (
    <View style={[styles.strategyCard, !strategy.is_unlocked && styles.lockedCard]}>
      <View style={styles.strategyTop}>
        <View style={styles.strategyLeft}>
          <Text style={styles.strategyIcon}>{icon}</Text>
          <View style={styles.strategyInfo}>
            <Text style={[styles.strategyLabel, !strategy.is_unlocked && { color: Colors.textMuted }]}>
              {strategy.label}
            </Text>
            <Text style={styles.strategyStage}>STAGE {strategy.stage}</Text>
          </View>
        </View>
        <View style={styles.strategyRight}>
          {strategy.is_unlocked ? (
            <Switch
              value={strategy.is_enabled}
              onValueChange={onToggle}
              trackColor={{ false: Colors.borderDim, true: Colors.blue + "88" }}
              thumbColor={strategy.is_enabled ? Colors.blue : Colors.textMuted}
              ios_backgroundColor={Colors.borderDim}
            />
          ) : (
            <View style={styles.lockBadge}>
              <Text style={styles.lockText}>LOCKED</Text>
              <Text style={styles.unlockAt}>{strategy.unlock_at} cards</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={[styles.strategyDesc, !strategy.is_unlocked && { opacity: 0.4 }]}>
        {desc}
      </Text>
      {strategy.is_unlocked && (
        <View style={[styles.statusBar, strategy.is_enabled && styles.statusBarOn]}>
          <Text style={[styles.statusBarText, strategy.is_enabled && { color: Colors.green }]}>
            {strategy.is_enabled ? "● ACTIVE IN SESSIONS" : "○ DISABLED"}
          </Text>
        </View>
      )}
    </View>
  );
}

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

  const handleToggle = async (key: string, currentlyEnabled: boolean) => {
    if (!progress) return;

    const strategy = progress.strategies.find((s) => s.key === key);
    if (!strategy?.is_unlocked) return;

    const enabled = new Set(progress.enabled_strategies);
    if (currentlyEnabled) {
      // Prevent disabling the last enabled strategy
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
      const updated = await updateProgress(Array.from(enabled));
      setProgress(updated);
    } catch {
      Alert.alert("Error", "Could not update strategy settings.");
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

  const enabledCount = progress?.enabled_strategies.length ?? 0;
  const unlockedCount = progress?.unlocked_strategies.length ?? 0;
  const totalCards = progress?.total_cards_played ?? 0;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.logo}>CARDECON</Text>
        <View style={styles.barSep} />
        <Text style={styles.topLabel}>INVESTMENT DECKS</Text>
        {saving && <ActivityIndicator color={Colors.blue} size="small" style={{ marginLeft: "auto" }} />}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <Text style={styles.statLabel}>TOTAL CARDS</Text>
            <Text style={styles.statValue}>{totalCards}</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statLabel}>UNLOCKED</Text>
            <Text style={[styles.statValue, { color: Colors.teal }]}>{unlockedCount}/5</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statLabel}>ACTIVE DECKS</Text>
            <Text style={[styles.statValue, { color: Colors.green }]}>{enabledCount}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Enabled decks determine which investment strategy cards appear in your sessions.
            Unlock new strategies by playing more cards. Disabled strategies are paused globally — your progress is preserved.
          </Text>
        </View>

        {/* Strategy cards */}
        {progress?.strategies.map((s) => (
          <StrategyCard
            key={s.key}
            strategy={s}
            onToggle={() => handleToggle(s.key, s.is_enabled)}
          />
        ))}
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
  topLabel: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 2 },

  scroll: { padding: 20, gap: 14, alignItems: "center" },

  statsRow: {
    width: "100%", maxWidth: 560,
    flexDirection: "row", gap: 0,
    backgroundColor: Colors.bgPanel, borderWidth: 1, borderColor: Colors.borderDim, borderRadius: 2,
  },
  statBlock: {
    flex: 1, padding: 16, alignItems: "center",
    borderRightWidth: 1, borderRightColor: Colors.borderDim,
  },
  statLabel: { fontSize: 7, fontFamily: Fonts.sansBold, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 4 },
  statValue: { fontSize: 18, fontFamily: Fonts.mono, color: Colors.textBright, letterSpacing: 1 },

  infoCard: {
    width: "100%", maxWidth: 560,
    backgroundColor: Colors.bgPanel, borderWidth: 1, borderColor: Colors.borderFaint,
    borderLeftWidth: 3, borderLeftColor: Colors.blue,
    borderRadius: 2, padding: 14,
  },
  infoText: { fontSize: 11, fontFamily: Fonts.sans, color: Colors.textDim, lineHeight: 16 },

  strategyCard: {
    width: "100%", maxWidth: 560,
    backgroundColor: Colors.bgPanel, borderWidth: 1, borderColor: Colors.borderDim,
    borderRadius: 2, padding: 18,
  },
  lockedCard: { opacity: 0.6 },
  strategyTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  strategyLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  strategyIcon: { fontSize: 22 },
  strategyInfo: { gap: 2 },
  strategyLabel: { fontSize: 14, fontFamily: Fonts.mono, color: Colors.textBright, letterSpacing: 0.5 },
  strategyStage: { fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.textMuted, letterSpacing: 1.5 },
  strategyRight: { alignItems: "flex-end" },
  lockBadge: { alignItems: "flex-end", gap: 2 },
  lockText: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.textMuted, letterSpacing: 2 },
  unlockAt: { fontSize: 8, fontFamily: Fonts.mono, color: Colors.textMuted },
  strategyDesc: { fontSize: 11, fontFamily: Fonts.sans, color: Colors.textDim, lineHeight: 16, marginBottom: 10 },
  statusBar: {
    borderTopWidth: 1, borderTopColor: Colors.borderFaint,
    paddingTop: 8, flexDirection: "row", alignItems: "center",
  },
  statusBarOn: { borderTopColor: Colors.green + "33" },
  statusBarText: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.textMuted, letterSpacing: 1.5 },
});
