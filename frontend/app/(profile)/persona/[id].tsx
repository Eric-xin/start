import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, Alert, TouchableOpacity, TextInput,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getPersona, getTrajectory, updatePersona, PersonaData, TrajectoryData } from "../../../services/persona";
import { PCAMap } from "../../../components/PCAMap";
import { Colors } from "../../../constants/colors";
import { Fonts } from "../../../constants/fonts";

const TRAIT_LABELS: Record<string, string> = {
  risk_appetite: "Risk Appetite",
  fomo_sensitivity: "FOMO Sensitivity",
  loss_aversion: "Loss Aversion",
  patience: "Patience",
  diversification_bias: "Diversification Bias",
  overconfidence: "Overconfidence",
};

const TRAIT_DESCRIPTIONS: Record<string, string> = {
  risk_appetite: "Willingness to accept volatility for higher returns",
  fomo_sensitivity: "Tendency to act on fear of missing market moves",
  loss_aversion: "Emotional weight placed on losses vs. equivalent gains",
  patience: "Time horizon; preference for long-term vs. short-term",
  diversification_bias: "Tendency to spread vs. concentrate positions",
  overconfidence: "Tendency to over-weight personal analysis vs. market signals",
};

function TraitBar({ trait, value }: { trait: string; value: number }) {
  const pct = Math.round(value);
  const color = value > 65 ? Colors.red : value > 50 ? Colors.amber : Colors.green;
  return (
    <View style={styles.traitCard}>
      <View style={styles.traitHeader}>
        <Text style={styles.traitName}>{TRAIT_LABELS[trait] ?? trait}</Text>
        <Text style={[styles.traitScore, { color }]}>{pct}/100</Text>
      </View>
      <View style={styles.traitTrack}>
        <View style={[styles.traitFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={styles.traitDesc}>{TRAIT_DESCRIPTIONS[trait] ?? ""}</Text>
    </View>
  );
}

export default function PersonaDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [persona, setPersona] = useState<PersonaData | null>(null);
  const [trajectory, setTrajectory] = useState<TrajectoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editName, setEditName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([getPersona(id), getTrajectory(id)])
      .then(([p, t]) => {
        setPersona(p);
        setNameInput(p.name);
        setTrajectory(t);
      })
      .catch(() => Alert.alert("Error", "Could not load persona."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleRename = async () => {
    if (!persona || !nameInput.trim()) return;
    setSaving(true);
    try {
      const updated = await updatePersona(persona.id, { name: nameInput.trim() });
      setPersona(updated);
      setEditName(false);
    } catch {
      Alert.alert("Error", "Could not rename persona.");
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async () => {
    if (!persona || persona.is_active) return;
    setSaving(true);
    try {
      const updated = await updatePersona(persona.id, { is_active: true });
      setPersona(updated);
    } catch {
      Alert.alert("Error", "Could not activate persona.");
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

  if (!persona) return null;

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.logo}>CARDECON</Text>
        <View style={styles.barSep} />
        <Text style={styles.topLabel}>PERSONA ANALYSIS</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.statusDot, { backgroundColor: persona.is_active ? Colors.green : Colors.textMuted }]} />
            <Text style={styles.cardHeaderText}>
              {persona.is_active ? "ACTIVE PERSONA" : "PERSONA"}
            </Text>
          </View>

          {editName ? (
            <View style={styles.renameRow}>
              <TextInput
                style={styles.renameInput}
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
                selectionColor={Colors.blue}
              />
              <TouchableOpacity style={styles.saveBtn} onPress={handleRename} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? "..." : "SAVE"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditName(false)}>
                <Text style={styles.cancelBtnText}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.nameRow}>
              <Text style={styles.personaName}>{persona.name}</Text>
              <TouchableOpacity onPress={() => setEditName(true)}>
                <Text style={styles.editLink}>RENAME</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Text style={styles.metaLabel}>CARDS PLAYED</Text>
              <Text style={styles.metaValue}>{persona.cards_played}</Text>
            </View>
            <View style={styles.metaBadge}>
              <Text style={styles.metaLabel}>SNAPSHOTS</Text>
              <Text style={styles.metaValue}>{trajectory?.snapshots.length ?? 0}</Text>
            </View>
            <View style={styles.metaBadge}>
              <Text style={styles.metaLabel}>CREATED</Text>
              <Text style={styles.metaValue}>{new Date(persona.created_at).toLocaleDateString()}</Text>
            </View>
          </View>

          {!persona.is_active && (
            <TouchableOpacity
              style={[styles.activateBtn, saving && { opacity: 0.5 }]}
              onPress={handleActivate}
              disabled={saving}
            >
              <Text style={styles.activateBtnText}>▶ ACTIVATE THIS PERSONA</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Interpretation */}
        {persona.interpretation && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.blueDot} />
              <Text style={styles.cardHeaderText}>BEHAVIORAL INTERPRETATION</Text>
            </View>
            <Text style={styles.interpretation}>{persona.interpretation}</Text>
          </View>
        )}

        {/* PCA Trajectory */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.blueDot} />
            <Text style={styles.cardHeaderText}>PERSONA TRAJECTORY (PCA)</Text>
          </View>
          <Text style={styles.pcaDesc}>
            Each dot represents a snapshot of your persona vector taken every 10 cards,
            projected to 2D via principal component analysis.
          </Text>
          <View style={styles.pcaContainer}>
            <PCAMap
              snapshots={trajectory?.snapshots ?? []}
              varianceExplained={trajectory?.pca_variance_explained ?? []}
              size={300}
            />
          </View>
        </View>

        {/* Trait Breakdown */}
        {persona.traits && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.blueDot} />
              <Text style={styles.cardHeaderText}>TRAIT BREAKDOWN</Text>
            </View>
            {Object.entries(TRAIT_LABELS).map(([key]) => (
              <TraitBar key={key} trait={key} value={(persona.traits as any)[key] ?? 50} />
            ))}
          </View>
        )}
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

  scroll: { padding: 20, gap: 16, alignItems: "center" },
  card: {
    width: "100%", maxWidth: 560,
    backgroundColor: Colors.bgPanel,
    borderWidth: 1, borderColor: Colors.borderDim,
    borderRadius: 2, padding: 20,
  },
  cardHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginBottom: 14, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.borderFaint,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  blueDot: { width: 6, height: 6, borderRadius: 1, backgroundColor: Colors.blue },
  cardHeaderText: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.blue, letterSpacing: 2 },

  nameRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  personaName: { fontSize: 20, fontFamily: Fonts.mono, color: Colors.textBright, letterSpacing: 1 },
  editLink: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 1.5 },

  renameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  renameInput: {
    flex: 1, backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.borderDim,
    borderRadius: 2, padding: 8,
    color: Colors.textBright, fontFamily: Fonts.mono, fontSize: 14,
  },
  saveBtn: { backgroundColor: Colors.blue, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 2 },
  saveBtnText: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.bg, letterSpacing: 1.5 },
  cancelBtn: { paddingHorizontal: 8 },
  cancelBtnText: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 1 },

  metaRow: { flexDirection: "row", gap: 16, flexWrap: "wrap", marginBottom: 4 },
  metaBadge: { gap: 2 },
  metaLabel: { fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.textMuted, letterSpacing: 1.5 },
  metaValue: { fontSize: 12, fontFamily: Fonts.mono, color: Colors.textBright },

  activateBtn: {
    marginTop: 14, backgroundColor: Colors.blue,
    paddingVertical: 10, alignItems: "center", borderRadius: 2,
  },
  activateBtnText: { fontSize: 11, fontFamily: Fonts.sansBold, color: Colors.bg, letterSpacing: 2 },

  interpretation: {
    fontSize: 13, fontFamily: Fonts.sans, color: Colors.textDim,
    lineHeight: 20, fontStyle: "italic",
  },

  pcaDesc: { fontSize: 11, fontFamily: Fonts.sans, color: Colors.textDim, lineHeight: 16, marginBottom: 16 },
  pcaContainer: { alignItems: "center" },

  traitCard: {
    marginBottom: 14, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.borderFaint,
  },
  traitHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  traitName: { fontSize: 11, fontFamily: Fonts.sansBold, color: Colors.textBright, letterSpacing: 0.5 },
  traitScore: { fontSize: 13, fontFamily: Fonts.mono, letterSpacing: 1 },
  traitTrack: { height: 4, backgroundColor: Colors.borderDim, borderRadius: 2, overflow: "hidden", marginBottom: 6 },
  traitFill: { height: 4, borderRadius: 2 },
  traitDesc: { fontSize: 10, fontFamily: Fonts.sans, color: Colors.textMuted, lineHeight: 14 },
});
