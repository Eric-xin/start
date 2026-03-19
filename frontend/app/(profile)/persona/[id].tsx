import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, Alert, TouchableOpacity, TextInput, useWindowDimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getPersona, getTrajectory, updatePersona, PersonaData, TrajectoryData } from "../../../services/persona";
import { PCAMap } from "../../../components/PCAMap";
import { Colors, useColors } from "../../../constants/colors";
import { Fonts } from "../../../constants/fonts";
import { useThemeStore } from "../../../store/themeStore";
import { ThemeModeToggle } from "../../../components/theme/ThemeModeToggle";

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
  const colors = useColors();
  const pct = Math.round(value);
  const color = value > 65 ? colors.red : value > 50 ? colors.amber : colors.green;
  return (
    <View style={[styles.traitCard, { borderBottomColor: colors.borderFaint }]}>
      <View style={styles.traitHeader}>
        <Text style={[styles.traitName, { color: colors.textBright }]}>{TRAIT_LABELS[trait] ?? trait}</Text>
        <Text style={[styles.traitScore, { color }]}>{pct}/100</Text>
      </View>
      <View style={[styles.traitTrack, { backgroundColor: colors.borderDim }]}>
        <View style={[styles.traitFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[styles.traitDesc, { color: colors.textMuted }]}>{TRAIT_DESCRIPTIONS[trait] ?? ""}</Text>
    </View>
  );
}

export default function PersonaDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const isNormal = useThemeStore((state) => state.mode === "normal");
  const { width } = useWindowDimensions();
  const isWide = width >= 980;
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
      <View style={[styles.loading, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.blue} size="large" />
      </View>
    );
  }

  if (!persona) return null;

  const cardSurfaceStyle = {
    backgroundColor: colors.bgPanel,
    borderColor: colors.borderDim,
    borderRadius: isNormal ? 18 : 2,
  } as const;

  const overviewCard = (
    <View style={[styles.card, cardSurfaceStyle]}>
      {/* Top bar */}
      <View style={[styles.cardHeader, { borderBottomColor: colors.borderFaint }]}>
        <View style={[styles.statusDot, { backgroundColor: persona.is_active ? colors.green : colors.textMuted }]} />
        <Text style={[styles.cardHeaderText, { color: colors.blue }]}>
          {persona.is_active ? (isNormal ? "Your Active Persona" : "ACTIVE PERSONA") : (isNormal ? "Persona Overview" : "PERSONA")}
        </Text>
      </View>

      {editName ? (
        <View style={styles.renameRow}>
          <TextInput
            style={[styles.renameInput, { backgroundColor: colors.bgCard, borderColor: colors.borderDim, color: colors.textBright, borderRadius: isNormal ? 14 : 2 }]}
            value={nameInput}
            onChangeText={setNameInput}
            autoFocus
            selectionColor={colors.blue}
          />
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.blue, borderRadius: isNormal ? 999 : 2 }]} onPress={handleRename} disabled={saving}>
            <Text style={[styles.saveBtnText, { color: colors.bg }]}>{saving ? "..." : "SAVE"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditName(false)}>
            <Text style={[styles.cancelBtnText, { color: colors.textDim }]}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.nameRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.personaName, { color: colors.textBright, fontFamily: isNormal ? Fonts.sansBold : Fonts.mono }]}>{persona.name}</Text>
            {isNormal ? (
              <Text style={{ fontSize: 12, fontFamily: Fonts.sans, color: colors.textPrimary, marginTop: 6 }}>
                This persona captures how you tend to react to risk, momentum, patience, and diversification.
              </Text>
            ) : null}
          </View>
          <TouchableOpacity onPress={() => setEditName(true)}>
            <Text style={[styles.editLink, { color: colors.textDim }]}>{isNormal ? "Rename" : "RENAME"}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.metaRow}>
        <View style={styles.metaBadge}>
          <Text style={[styles.metaLabel, { color: colors.textMuted }]}>{isNormal ? "Choices made" : "CARDS PLAYED"}</Text>
          <Text style={[styles.metaValue, { color: colors.textBright }]}>{persona.cards_played}</Text>
        </View>
        <View style={styles.metaBadge}>
          <Text style={[styles.metaLabel, { color: colors.textMuted }]}>{isNormal ? "Checkpoints" : "SNAPSHOTS"}</Text>
          <Text style={[styles.metaValue, { color: colors.textBright }]}>{trajectory?.snapshots.length ?? 0}</Text>
        </View>
        <View style={styles.metaBadge}>
          <Text style={[styles.metaLabel, { color: colors.textMuted }]}>{isNormal ? "Started" : "CREATED"}</Text>
          <Text style={[styles.metaValue, { color: colors.textBright }]}>{new Date(persona.created_at).toLocaleDateString()}</Text>
        </View>
      </View>

      {!persona.is_active && (
        <TouchableOpacity
          style={[styles.activateBtn, { backgroundColor: colors.blue, borderRadius: isNormal ? 999 : 2 }, saving && { opacity: 0.5 }]}
          onPress={handleActivate}
          disabled={saving}
        >
          <Text style={[styles.activateBtnText, { color: colors.bg }]}>{isNormal ? "▶ Use This Persona" : "▶ ACTIVATE THIS PERSONA"}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const analysisColumn = (
    <>
      {persona.interpretation && (
        <View style={[styles.card, cardSurfaceStyle]}>
          <View style={[styles.cardHeader, { borderBottomColor: colors.borderFaint }]}>
            <View style={[styles.blueDot, { backgroundColor: colors.blue }]} />
            <Text style={[styles.cardHeaderText, { color: colors.blue }]}>{isNormal ? "📝 What This Means" : "BEHAVIORAL INTERPRETATION"}</Text>
          </View>
          <Text style={[styles.interpretation, { color: colors.textPrimary }]}>{persona.interpretation}</Text>
        </View>
      )}

      <View style={[styles.card, cardSurfaceStyle]}>
        <View style={[styles.cardHeader, { borderBottomColor: colors.borderFaint }]}>
          <View style={[styles.blueDot, { backgroundColor: colors.blue }]} />
          <Text style={[styles.cardHeaderText, { color: colors.blue }]}>{isNormal ? "🧭 Growth Map" : "PERSONA TRAJECTORY (PCA)"}</Text>
        </View>
        <Text style={[styles.pcaDesc, { color: colors.textDim }]}>
          {isNormal
            ? "Each dot is a checkpoint from your learning journey. The path shows how your investor behavior has shifted over time."
            : "Each dot represents a snapshot of your persona vector taken every 10 cards, projected to 2D via principal component analysis."}
        </Text>
        <View style={styles.pcaContainer}>
          <PCAMap
            snapshots={trajectory?.snapshots ?? []}
            varianceExplained={trajectory?.pca_variance_explained ?? []}
            size={isWide ? 340 : 300}
          />
        </View>
      </View>
    </>
  );

  const traitColumn = persona.traits ? (
    <View style={[styles.card, cardSurfaceStyle]}>
      <View style={[styles.cardHeader, { borderBottomColor: colors.borderFaint }]}>
        <View style={[styles.blueDot, { backgroundColor: colors.blue }]} />
        <Text style={[styles.cardHeaderText, { color: colors.blue }]}>{isNormal ? "📊 Trait Breakdown" : "TRAIT BREAKDOWN"}</Text>
      </View>
      {Object.entries(TRAIT_LABELS).map(([key]) => (
        <TraitBar key={key} trait={key} value={(persona.traits as any)[key] ?? 50} />
      ))}
    </View>
  ) : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.topBar, { backgroundColor: colors.bgPanel, borderBottomColor: colors.borderPrimary }]}>
        <Text style={[styles.logo, { color: colors.blue }]}>CARDECON</Text>
        <View style={[styles.barSep, { backgroundColor: colors.borderDim }]} />
        <Text style={[styles.topLabel, { color: colors.textDim }]}>{isNormal ? "🧠 Persona Detail" : "PERSONA ANALYSIS"}</Text>
        <View style={{ flex: 1 }} />
        <ThemeModeToggle compact />
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backText, { color: colors.textDim }]}>BACK →</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.layout, isWide && styles.layoutWide]}>
          <View style={[styles.column, isWide && styles.columnWide]}>
            {overviewCard}
            {traitColumn}
          </View>
          <View style={[styles.column, isWide && styles.columnWide]}>
            {analysisColumn}
          </View>
        </View>
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

  scroll: { padding: 20, gap: 16, alignItems: "center" },
  layout: { width: "100%", maxWidth: 1120, gap: 16 },
  layoutWide: { flexDirection: "row", alignItems: "flex-start" },
  column: { width: "100%", gap: 16 },
  columnWide: { flex: 1 },
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
