import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, Alert, TouchableOpacity, TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import {
  listPersonas, createPersona, deletePersona, updatePersona, PersonaData,
} from "../../services/persona";
import { Colors, useColors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { useThemeStore } from "../../store/themeStore";
import { ThemeModeToggle } from "../../components/theme/ThemeModeToggle";

export default function PersonasScreen() {
  const router = useRouter();
  const colors = useColors();
  const isNormal = useThemeStore((state) => state.mode === "normal");
  const [personas, setPersonas] = useState<PersonaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    try {
      const data = await listPersonas();
      setPersonas(data);
    } catch {
      Alert.alert("Error", "Could not load personas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    const name = newName.trim() || "New Persona";
    setCreating(true);
    try {
      await createPersona(name);
      setNewName("");
      setShowCreate(false);
      await load();
    } catch {
      Alert.alert("Error", "Could not create persona.");
    } finally {
      setCreating(false);
    }
  };

  const handleActivate = async (persona: PersonaData) => {
    if (persona.is_active) return;
    try {
      await updatePersona(persona.id, { is_active: true });
      await load();
    } catch {
      Alert.alert("Error", "Could not activate persona.");
    }
  };

  const handleDelete = (persona: PersonaData) => {
    if (persona.is_active) {
      Alert.alert("Cannot Delete", "Activate another persona first before deleting this one.");
      return;
    }
    Alert.alert(
      "Delete Persona",
      `Delete "${persona.name}"? All trajectory snapshots will be lost.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete", style: "destructive",
          onPress: async () => {
            try {
              await deletePersona(persona.id);
              await load();
            } catch (e: any) {
              Alert.alert("Error", e?.response?.data?.detail ?? "Could not delete.");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.blue} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Top bar */}
      <View style={[styles.topBar, { backgroundColor: colors.bgPanel, borderBottomColor: colors.borderPrimary }]}>
        <Text style={[styles.logo, { color: colors.blue }]}>CARDECON</Text>
        <View style={[styles.barSep, { backgroundColor: colors.borderDim }]} />
        <Text style={[styles.topLabel, { color: colors.textDim }]}>{isNormal ? "🧠 Personas" : "PERSONAS"}</Text>
        <ThemeModeToggle compact />
        <TouchableOpacity
          style={[styles.createBtn, { borderColor: colors.blue + "88" }]}
          onPress={() => setShowCreate(!showCreate)}
        >
          <Text style={[styles.createBtnText, { color: colors.blue }]}>{isNormal ? "+ New" : "+ NEW"}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backText, { color: colors.textDim }]}>BACK →</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {isNormal ? (
          <View style={[styles.card, { backgroundColor: colors.bgPanel, borderColor: colors.borderDim, borderRadius: 18 }]}>
            <Text style={{ fontSize: 15, fontFamily: Fonts.sansBold, color: colors.textBright, marginBottom: 6 }}>
              Pick the kind of investor you want to practice as
            </Text>
            <Text style={{ fontSize: 12, fontFamily: Fonts.sans, color: colors.textPrimary, lineHeight: 18 }}>
              Personas let you try different habits and risk styles. Activate one to shape how the game explains choices and tracks progress.
            </Text>
          </View>
        ) : null}
        {/* Create form */}
        {showCreate && (
          <View style={[styles.card, { backgroundColor: colors.bgPanel, borderColor: colors.borderDim, borderRadius: isNormal ? 18 : 2 }]}>
            <View style={[styles.cardHeader, { borderBottomColor: colors.borderFaint }]}>
              <View style={[styles.blueDot, { backgroundColor: colors.blue }]} />
              <Text style={[styles.cardHeaderText, { color: colors.blue }]}>{isNormal ? "Create a New Persona" : "CREATE PERSONA"}</Text>
            </View>
            <Text style={[styles.fieldLabel, { color: colors.textDim }]}>{isNormal ? "Persona name" : "PERSONA NAME"}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bgCard, borderColor: colors.borderDim, color: colors.textBright, borderRadius: isNormal ? 14 : 2 }]}
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Risk Taker, Conservative..."
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.blue}
              autoFocus
            />
            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.ctaBtn, { backgroundColor: colors.blue, borderRadius: isNormal ? 999 : 2 }, creating && { opacity: 0.5 }]}
                onPress={handleCreate}
                disabled={creating}
              >
                <Text style={styles.ctaBtnText}>{creating ? "CREATING..." : "▶ CREATE"}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Text style={[styles.cancelText, { color: colors.textDim }]}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Persona list */}
        {personas.map((persona) => (
          <View key={persona.id} style={[styles.card, { backgroundColor: colors.bgPanel, borderColor: persona.is_active ? colors.blue + "66" : colors.borderDim, borderRadius: isNormal ? 18 : 2 }, persona.is_active && styles.activeCard]}>
            <View style={styles.personaTop}>
              <View style={styles.personaLeft}>
                <View style={styles.nameRow}>
                  <View style={[styles.activeDot, { backgroundColor: persona.is_active ? colors.green : colors.borderDim }]} />
                  <Text style={[styles.personaName, { color: colors.textBright, fontFamily: isNormal ? Fonts.sansBold : Fonts.mono }]}>{persona.name}</Text>
                  {persona.is_active && (
                    <View style={[styles.activeBadge, { backgroundColor: colors.green + "22", borderColor: colors.green + "55" }]}>
                      <Text style={styles.activeBadgeText}>ACTIVE</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.personaMeta, { color: colors.textDim }]}>
                  {isNormal
                    ? `${persona.cards_played} learning choices made · Created ${new Date(persona.created_at).toLocaleDateString()}`
                    : `${persona.cards_played} cards played · Created ${new Date(persona.created_at).toLocaleDateString()}`}
                </Text>
              </View>
              <View style={styles.personaActions}>
                {!persona.is_active && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleActivate(persona)}
                  >
                    <Text style={styles.actionBtnText}>ACTIVATE</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => router.push(`/(profile)/persona/${persona.id}`)}
                >
                  <Text style={styles.actionBtnText}>VIEW →</Text>
                </TouchableOpacity>
                {!persona.is_active && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDelete(persona)}
                  >
                    <Text style={[styles.actionBtnText, { color: Colors.red }]}>DEL</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Mini traits */}
            {persona.traits && (
              <View style={styles.miniTraits}>
                {Object.entries(persona.traits).slice(0, 3).map(([key, val]) => {
                  const pct = Math.round(val as number);
                  const color = pct > 65 ? Colors.red : pct > 50 ? Colors.amber : Colors.green;
                  return (
                    <View key={key} style={styles.miniTrait}>
                      <Text style={styles.miniTraitLabel}>{key.replace(/_/g, " ").toUpperCase()}</Text>
                      <View style={styles.miniTrack}>
                        <View style={[styles.miniFill, { width: `${pct}%` as any, backgroundColor: color }]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
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
  topLabel: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 2, flex: 1 },
  createBtn: { borderWidth: 1, borderColor: Colors.blue + "88", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 2 },
  createBtnText: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.blue, letterSpacing: 1.5 },

  scroll: { padding: 20, gap: 16, alignItems: "center" },
  card: {
    width: "100%", maxWidth: 560,
    backgroundColor: Colors.bgPanel, borderWidth: 1, borderColor: Colors.borderDim,
    borderRadius: 2, padding: 20,
  },
  activeCard: { borderColor: Colors.blue + "66" },

  cardHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginBottom: 14, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.borderFaint,
  },
  blueDot: { width: 6, height: 6, borderRadius: 1, backgroundColor: Colors.blue },
  cardHeaderText: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.blue, letterSpacing: 2 },

  fieldLabel: { fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 2, marginBottom: 6 },
  input: {
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderDim,
    borderRadius: 2, padding: 10,
    color: Colors.textBright, fontFamily: Fonts.mono, fontSize: 13,
  },
  formActions: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 14 },
  ctaBtn: { backgroundColor: Colors.blue, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 2 },
  ctaBtnText: { fontSize: 11, fontFamily: Fonts.sansBold, color: Colors.bg, letterSpacing: 2 },
  cancelText: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 1.5 },

  personaTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  personaLeft: { flex: 1, gap: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  personaName: { fontSize: 15, fontFamily: Fonts.mono, color: Colors.textBright, letterSpacing: 0.5 },
  activeBadge: {
    backgroundColor: Colors.green + "22", borderWidth: 1, borderColor: Colors.green + "55",
    paddingHorizontal: 6, paddingVertical: 1, borderRadius: 2,
  },
  activeBadgeText: { fontSize: 7, fontFamily: Fonts.sansBold, color: Colors.green, letterSpacing: 2 },
  personaMeta: { fontSize: 9, fontFamily: Fonts.mono, color: Colors.textDim },
  personaActions: { flexDirection: "row", gap: 6, alignItems: "center", marginLeft: 8 },
  actionBtn: {
    borderWidth: 1, borderColor: Colors.borderDim,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 2,
  },
  deleteBtn: { borderColor: Colors.red + "44" },
  actionBtnText: { fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 1 },

  miniTraits: { marginTop: 12, gap: 6 },
  miniTrait: { flexDirection: "row", alignItems: "center", gap: 8 },
  miniTraitLabel: { width: 90, fontSize: 7, fontFamily: Fonts.sansBold, color: Colors.textMuted, letterSpacing: 1 },
  miniTrack: { flex: 1, height: 3, backgroundColor: Colors.borderDim, borderRadius: 2, overflow: "hidden" },
  miniFill: { height: 3, borderRadius: 2 },
});
