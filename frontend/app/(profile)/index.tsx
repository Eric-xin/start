import React, { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { listPersonas, PersonaData } from "../../services/persona";
import { getProgress, ProgressData } from "../../services/progress";
import { getSessions, SessionData } from "../../services/game";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";

const TRAIT_LABELS: Record<string, string> = {
  risk_appetite: "Risk Appetite",
  fomo_sensitivity: "FOMO",
  loss_aversion: "Loss Aversion",
  patience: "Patience",
  diversification_bias: "Diversification",
  overconfidence: "Overconfidence",
};

function TopBar({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.topBar}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backText}>← BACK</Text>
      </TouchableOpacity>
      <Text style={styles.logo}>CARDECON</Text>
      <View style={styles.barSep} />
      <Text style={styles.topLabel}>INVESTOR PROFILE</Text>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionDot} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function TraitRow({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value);
  const color = value > 65 ? Colors.red : value > 50 ? Colors.amber : Colors.green;
  return (
    <View style={styles.traitRow}>
      <Text style={styles.traitLabel}>{label}</Text>
      <View style={styles.traitTrack}>
        <View style={[styles.traitFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[styles.traitValue, { color }]}>{pct}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [activePersona, setActivePersona] = useState<PersonaData | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listPersonas(), getProgress(), getSessions()])
      .then(([personas, prog, sess]) => {
        setActivePersona(personas.find((p) => p.is_active) ?? personas[0] ?? null);
        setProgress(prog);
        setSessions(sess);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await clearAuth();
    router.replace("/(auth)/login");
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.blue} size="large" />
      </View>
    );
  }

  const unlockedCount = progress?.unlocked_strategies.length ?? 1;
  const totalStrategies = 5;

  return (
    <View style={styles.container}>
      <TopBar onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Identity */}
        <View style={styles.card}>
          <SectionHeader title="IDENTITY" />
          <Text style={styles.username}>{user?.username?.toUpperCase() ?? "INVESTOR"}</Text>
          <Text style={styles.email}>{user?.email ?? "—"}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeLabel}>TIER</Text>
              <Text style={[styles.badgeValue, { color: Colors.blue }]}>
                {user?.subscription_tier?.toUpperCase() ?? "NORMAL"}
              </Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeLabel}>STRATEGIES</Text>
              <Text style={[styles.badgeValue, { color: Colors.teal }]}>
                {unlockedCount}/{totalStrategies} UNLOCKED
              </Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeLabel}>CARDS PLAYED</Text>
              <Text style={[styles.badgeValue, { color: Colors.green }]}>
                {progress?.total_cards_played ?? 0}
              </Text>
            </View>
          </View>
        </View>

        {/* Active Persona */}
        {activePersona && (
          <View style={styles.card}>
            <SectionHeader title="ACTIVE PERSONA" />
            <View style={styles.personaRow}>
              <View style={styles.personaInfo}>
                <Text style={styles.personaName}>{activePersona.name}</Text>
                <Text style={styles.personaSub}>
                  {activePersona.cards_played} cards played
                </Text>
              </View>
              <TouchableOpacity
                style={styles.navBtn}
                onPress={() => router.push("/(profile)/personas")}
              >
                <Text style={styles.navBtnText}>MANAGE →</Text>
              </TouchableOpacity>
            </View>

            {activePersona.traits && (
              <View style={styles.traitsBlock}>
                {Object.entries(TRAIT_LABELS).map(([key, label]) => (
                  <TraitRow
                    key={key}
                    label={label}
                    value={(activePersona.traits as any)[key] ?? 50}
                  />
                ))}
              </View>
            )}

            {activePersona.interpretation && (
              <Text style={styles.interpretation}>{activePersona.interpretation}</Text>
            )}

            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() => router.push(`/(profile)/persona/${activePersona.id}`)}
            >
              <Text style={styles.outlineBtnText}>VIEW PERSONA TRAJECTORY →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Investment Strategies */}
        <View style={styles.card}>
          <SectionHeader title="INVESTMENT STRATEGIES" />
          <Text style={styles.cardDesc}>
            Strategies unlock as you play. Enable or disable them to control which decks appear in sessions.
          </Text>
          {progress?.strategies.map((s) => (
            <View key={s.key} style={[styles.strategyRow, !s.is_unlocked && styles.strategyLocked]}>
              <View>
                <Text style={[styles.strategyLabel, !s.is_unlocked && { color: Colors.textMuted }]}>
                  {s.label}
                </Text>
                {!s.is_unlocked && (
                  <Text style={styles.strategyUnlockHint}>
                    Unlocks at {s.unlock_at} cards
                  </Text>
                )}
              </View>
              <View style={[styles.strategyStatus, s.is_enabled && styles.strategyEnabled]}>
                <Text style={[styles.strategyStatusText, s.is_enabled && { color: Colors.green }]}>
                  {!s.is_unlocked ? "LOCKED" : s.is_enabled ? "ON" : "OFF"}
                </Text>
              </View>
            </View>
          ))}
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => router.push("/(profile)/decks")}
          >
            <Text style={styles.outlineBtnText}>MANAGE DECKS →</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Sessions */}
        <View style={styles.card}>
          <SectionHeader title="RECENT SESSIONS" />
          {sessions.length === 0 ? (
            <Text style={styles.emptyText}>No sessions yet.</Text>
          ) : (
            sessions.slice(0, 3).map((s) => (
              <View key={s.id} style={styles.sessionRow}>
                <View>
                  <Text style={styles.sessionCapital}>
                    ${Math.round(s.capital).toLocaleString()}
                  </Text>
                  <Text style={styles.sessionSub}>
                    Stage {s.stage} · Rank {s.investor_rank} · {new Date(s.updated_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[styles.sessionDelta, s.capital >= 10000 ? styles.deltaPos : styles.deltaNeg]}>
                  <Text style={[styles.sessionDeltaText, s.capital >= 10000 ? { color: Colors.green } : { color: Colors.red }]}>
                    {s.capital >= 10000 ? "+" : ""}
                    {((s.capital - 10000) / 100).toFixed(1)}%
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>LOG OUT</Text>
        </TouchableOpacity>
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
  backBtn: { paddingHorizontal: 4 },
  backText: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 1.5 },
  logo: { fontSize: 13, fontFamily: Fonts.mono, color: Colors.blue, letterSpacing: 3 },
  barSep: { width: 1, height: 14, backgroundColor: Colors.borderDim },
  topLabel: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 2 },

  scroll: { padding: 20, gap: 16, alignItems: "center" },
  card: {
    width: "100%", maxWidth: 560,
    backgroundColor: Colors.bgPanel,
    borderWidth: 1, borderColor: Colors.borderDim,
    borderRadius: 2, padding: 20,
  },

  sectionHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginBottom: 16, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.borderFaint,
  },
  sectionDot: { width: 6, height: 6, borderRadius: 1, backgroundColor: Colors.blue },
  sectionTitle: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.blue, letterSpacing: 2 },

  username: { fontSize: 22, fontFamily: Fonts.mono, color: Colors.textBright, letterSpacing: 2, marginBottom: 4 },
  email: { fontSize: 11, fontFamily: Fonts.mono, color: Colors.textDim, marginBottom: 16 },
  badgeRow: { flexDirection: "row", gap: 16, flexWrap: "wrap" },
  badge: { gap: 2 },
  badgeLabel: { fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.textMuted, letterSpacing: 1.5 },
  badgeValue: { fontSize: 13, fontFamily: Fonts.mono, letterSpacing: 1 },

  personaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  personaInfo: { gap: 2 },
  personaName: { fontSize: 16, fontFamily: Fonts.mono, color: Colors.textBright, letterSpacing: 1 },
  personaSub: { fontSize: 10, fontFamily: Fonts.mono, color: Colors.textDim },

  traitsBlock: { gap: 8, marginBottom: 16 },
  traitRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  traitLabel: { width: 100, fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 1 },
  traitTrack: { flex: 1, height: 4, backgroundColor: Colors.borderDim, borderRadius: 2, overflow: "hidden" },
  traitFill: { height: 4, borderRadius: 2 },
  traitValue: { width: 28, fontSize: 9, fontFamily: Fonts.mono, textAlign: "right" },

  interpretation: {
    fontSize: 12, fontFamily: Fonts.sans, color: Colors.textDim,
    lineHeight: 18, fontStyle: "italic", marginBottom: 14,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.borderFaint,
  },

  cardDesc: { fontSize: 11, fontFamily: Fonts.sans, color: Colors.textDim, lineHeight: 16, marginBottom: 14 },
  strategyRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderFaint,
  },
  strategyLocked: { opacity: 0.4 },
  strategyLabel: { fontSize: 12, fontFamily: Fonts.mono, color: Colors.textBright, letterSpacing: 0.5 },
  strategyUnlockHint: { fontSize: 9, fontFamily: Fonts.mono, color: Colors.textMuted, marginTop: 2 },
  strategyStatus: {
    borderWidth: 1, borderColor: Colors.borderDim,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 2,
  },
  strategyEnabled: { borderColor: Colors.green + "66" },
  strategyStatusText: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.textMuted, letterSpacing: 1.5 },

  sessionRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderFaint,
  },
  sessionCapital: { fontSize: 14, fontFamily: Fonts.mono, color: Colors.textBright, letterSpacing: 1 },
  sessionSub: { fontSize: 9, fontFamily: Fonts.mono, color: Colors.textDim, marginTop: 2 },
  sessionDelta: { borderWidth: 1, borderColor: Colors.borderDim, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 2 },
  deltaPos: { borderColor: Colors.green + "55" },
  deltaNeg: { borderColor: Colors.red + "55" },
  sessionDeltaText: { fontSize: 10, fontFamily: Fonts.mono },
  emptyText: { fontSize: 11, fontFamily: Fonts.mono, color: Colors.textMuted },

  outlineBtn: {
    marginTop: 14, borderWidth: 1, borderColor: Colors.blue + "66",
    padding: 10, alignItems: "center", borderRadius: 2,
  },
  outlineBtnText: { fontSize: 10, fontFamily: Fonts.sansBold, color: Colors.blue, letterSpacing: 2 },

  navBtn: {
    borderWidth: 1, borderColor: Colors.borderDim,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 2,
  },
  navBtnText: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 1.5 },

  logoutBtn: {
    width: "100%", maxWidth: 560,
    borderWidth: 1, borderColor: Colors.red + "55",
    padding: 12, alignItems: "center", borderRadius: 2, marginBottom: 32,
  },
  logoutText: { fontSize: 10, fontFamily: Fonts.sansBold, color: Colors.red, letterSpacing: 2 },
});
