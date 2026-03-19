import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, Alert, TouchableOpacity, TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import {
  listPersonas, createPersona, deletePersona, updatePersona, PersonaData,
} from "../../services/persona";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";

export default function PersonasScreen() {
  const router = useRouter();
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
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.blue} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.logo}>CARDECON</Text>
        <View style={styles.barSep} />
        <Text style={styles.topLabel}>PERSONAS</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => setShowCreate(!showCreate)}
        >
          <Text style={styles.createBtnText}>+ NEW</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Create form */}
        {showCreate && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.blueDot} />
              <Text style={styles.cardHeaderText}>CREATE PERSONA</Text>
            </View>
            <Text style={styles.fieldLabel}>PERSONA NAME</Text>
            <TextInput
              style={styles.input}
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Risk Taker, Conservative..."
              placeholderTextColor={Colors.textMuted}
              selectionColor={Colors.blue}
              autoFocus
            />
            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.ctaBtn, creating && { opacity: 0.5 }]}
                onPress={handleCreate}
                disabled={creating}
              >
                <Text style={styles.ctaBtnText}>{creating ? "CREATING..." : "▶ CREATE"}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Text style={styles.cancelText}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Persona list */}
        {personas.map((persona) => (
          <View key={persona.id} style={[styles.card, persona.is_active && styles.activeCard]}>
            <View style={styles.personaTop}>
              <View style={styles.personaLeft}>
                <View style={styles.nameRow}>
                  <View style={[styles.activeDot, { backgroundColor: persona.is_active ? Colors.green : Colors.borderDim }]} />
                  <Text style={styles.personaName}>{persona.name}</Text>
                  {persona.is_active && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>ACTIVE</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.personaMeta}>
                  {persona.cards_played} cards played · Created {new Date(persona.created_at).toLocaleDateString()}
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
