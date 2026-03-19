import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, Alert, TouchableOpacity, TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  listPersonas, createPersona, deletePersona, updatePersona, PersonaData,
} from "../../services/persona";
import { Colors, useColors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { useThemeStore } from "../../store/themeStore";
import { ThemeModeToggle } from "../../components/theme/ThemeModeToggle";
import { AppTopBar } from "../../components/navigation/AppTopBar";

export default function PersonasScreen() {
  const router = useRouter();
  const { t } = useTranslation();
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
      Alert.alert(t("common.error"), t("personas.errors.load"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    const name = newName.trim() || t("personas.defaultName");
    setCreating(true);
    try {
      await createPersona(name);
      setNewName("");
      setShowCreate(false);
      await load();
    } catch {
      Alert.alert(t("common.error"), t("personas.errors.create"));
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
      Alert.alert(t("common.error"), t("personas.errors.activate"));
    }
  };

  const handleDelete = (persona: PersonaData) => {
    if (persona.is_active) {
      Alert.alert(t("personas.cannotDeleteTitle"), t("personas.cannotDeleteBody"));
      return;
    }
    Alert.alert(
      t("personas.deleteTitle"),
      t("personas.deletePrompt", { name: persona.name }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"), style: "destructive",
          onPress: async () => {
            try {
              await deletePersona(persona.id);
              await load();
            } catch (e: any) {
              Alert.alert(t("common.error"), e?.response?.data?.detail ?? t("personas.errors.delete"));
            }
          },
        },
      ]
    );
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push("/(game)/index");
    }
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
      <AppTopBar
        label={isNormal ? t("personas.topBar") : t("personas.topBarPro")}
        onBack={handleBack}
        rightContent={
          <>
            <ThemeModeToggle compact />
            <TouchableOpacity
              style={[styles.createBtn, { borderColor: colors.blue + "88" }]}
              onPress={() => setShowCreate(!showCreate)}
            >
              <Text style={[styles.createBtnText, { color: colors.blue }]}>{isNormal ? t("personas.new") : t("personas.newPro")}</Text>
            </TouchableOpacity>
          </>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {isNormal ? (
          <View style={[styles.card, { backgroundColor: colors.bgPanel, borderColor: colors.borderDim, borderRadius: 18 }]}>
            <Text style={{ fontSize: 15, fontFamily: Fonts.sansBold, color: colors.textBright, marginBottom: 6 }}>
              {t("personas.heroTitle")}
            </Text>
            <Text style={{ fontSize: 12, fontFamily: Fonts.sans, color: colors.textPrimary, lineHeight: 18 }}>
              {t("personas.heroBody")}
            </Text>
          </View>
        ) : null}
        {/* Create form */}
        {showCreate && (
          <View style={[styles.card, { backgroundColor: colors.bgPanel, borderColor: colors.borderDim, borderRadius: isNormal ? 18 : 2 }]}>
            <View style={[styles.cardHeader, { borderBottomColor: colors.borderFaint }]}>
              <View style={[styles.blueDot, { backgroundColor: colors.blue }]} />
              <Text style={[styles.cardHeaderText, { color: colors.blue }]}>{isNormal ? t("personas.createTitle") : t("personas.createTitlePro")}</Text>
            </View>
            <Text style={[styles.fieldLabel, { color: colors.textDim }]}>{isNormal ? t("personas.nameLabel") : t("personas.nameLabelPro")}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bgCard, borderColor: colors.borderDim, color: colors.textBright, borderRadius: isNormal ? 14 : 2 }]}
              value={newName}
              onChangeText={setNewName}
              placeholder={t("personas.namePlaceholder")}
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
                <Text style={styles.ctaBtnText}>{creating ? t("personas.creating") : t("personas.createCta")}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Text style={[styles.cancelText, { color: colors.textDim }]}>{t("common.cancel")}</Text>
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
                      <Text style={styles.activeBadgeText}>{t("personas.active")}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.personaMeta, { color: colors.textDim }]}>
                  {isNormal
                    ? t("personas.metaNormal", { count: persona.cards_played, date: new Date(persona.created_at).toLocaleDateString() })
                    : t("personas.metaPro", { count: persona.cards_played, date: new Date(persona.created_at).toLocaleDateString() })}
                </Text>
              </View>
              <View style={styles.personaActions}>
                {!persona.is_active && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleActivate(persona)}
                  >
                    <Text style={styles.actionBtnText}>{t("personas.activate")}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => router.push(`/(profile)/persona/${persona.id}`)}
                >
                  <Text style={styles.actionBtnText}>{t("personas.view")}</Text>
                </TouchableOpacity>
                {!persona.is_active && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDelete(persona)}
                  >
                    <Text style={[styles.actionBtnText, { color: Colors.red }]}>{t("personas.deleteShort")}</Text>
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
