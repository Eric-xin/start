import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, Alert, TouchableOpacity, TextInput, useWindowDimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { getPersona, getTrajectory, updatePersona, PersonaData, TrajectoryData } from "../../../services/persona";
import { PCAMap } from "../../../components/PCAMap";
import { Colors, useColors } from "../../../constants/colors";
import { Fonts } from "../../../constants/fonts";
import { useThemeStore } from "../../../store/themeStore";
import { ThemeModeToggle } from "../../../components/theme/ThemeModeToggle";
import { AppTopBar } from "../../../components/navigation/AppTopBar";
import { sharePersonaPDF } from "../../../hooks/useShare";

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

function TraitBar({ trait, value, t }: { trait: string; value: number; t: (k: string) => string }) {
  const colors = useColors();
  const pct = Math.round(value);
  const color = value > 65 ? colors.red : value > 50 ? colors.amber : colors.green;
  return (
    <View style={[styles.traitCard, { borderBottomColor: colors.borderFaint }]}>
      <View style={styles.traitHeader}>
        <Text style={[styles.traitName, { color: colors.textBright }]}>{t(`personaDetail.traits.labels.${trait}`)}</Text>
        <Text style={[styles.traitScore, { color }]}>{pct}/100</Text>
      </View>
      <View style={[styles.traitTrack, { backgroundColor: colors.borderDim }]}>
        <View style={[styles.traitFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[styles.traitDesc, { color: colors.textMuted }]}>{t(`personaDetail.traits.descriptions.${trait}`)}</Text>
    </View>
  );
}

export default function PersonaDetailScreen() {
  const router = useRouter();
  const { t } = useTranslation();
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
  const [sharingPDF, setSharingPDF] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([getPersona(id), getTrajectory(id)])
      .then(([p, t]) => {
        setPersona(p);
        setNameInput(p.name);
        setTrajectory(t);
      })
      .catch(() => Alert.alert(t("common.error"), t("personaDetail.errors.load")))
      .finally(() => setLoading(false));
  }, [id, t]);

  const handleRename = async () => {
    if (!persona || !nameInput.trim()) return;
    setSaving(true);
    try {
      const updated = await updatePersona(persona.id, { name: nameInput.trim() });
      setPersona(updated);
      setEditName(false);
    } catch {
      Alert.alert(t("common.error"), t("personaDetail.errors.rename"));
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
      Alert.alert(t("common.error"), t("personaDetail.errors.activate"));
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
            {persona.is_active
              ? (isNormal ? t("personaDetail.activeTitle") : t("personaDetail.activeTitlePro"))
              : (isNormal ? t("personaDetail.overviewTitle") : t("personaDetail.overviewTitlePro"))}
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
            <Text style={[styles.saveBtnText, { color: colors.bg }]}>{saving ? "..." : t("personaDetail.save")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditName(false)}>
            <Text style={[styles.cancelBtnText, { color: colors.textDim }]}>{t("common.cancel")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.nameRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.personaName, { color: colors.textBright, fontFamily: isNormal ? Fonts.sansBold : Fonts.mono }]}>{persona.name}</Text>
            {isNormal ? (
              <Text style={{ fontSize: 12, fontFamily: Fonts.sans, color: colors.textPrimary, marginTop: 6 }}>
                {t("personaDetail.overviewBody")}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity onPress={() => setEditName(true)}>
            <Text style={[styles.editLink, { color: colors.textDim }]}>{isNormal ? t("personaDetail.rename") : t("personaDetail.renamePro")}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.metaRow}>
        <View style={styles.metaBadge}>
          <Text style={[styles.metaLabel, { color: colors.textMuted }]}>{isNormal ? t("personaDetail.meta.choices") : t("personaDetail.meta.choicesPro")}</Text>
          <Text style={[styles.metaValue, { color: colors.textBright }]}>{persona.cards_played}</Text>
        </View>
        <View style={styles.metaBadge}>
          <Text style={[styles.metaLabel, { color: colors.textMuted }]}>{isNormal ? t("personaDetail.meta.checkpoints") : t("personaDetail.meta.checkpointsPro")}</Text>
          <Text style={[styles.metaValue, { color: colors.textBright }]}>{trajectory?.snapshots.length ?? 0}</Text>
        </View>
        <View style={styles.metaBadge}>
          <Text style={[styles.metaLabel, { color: colors.textMuted }]}>{isNormal ? t("personaDetail.meta.started") : t("personaDetail.meta.startedPro")}</Text>
          <Text style={[styles.metaValue, { color: colors.textBright }]}>{new Date(persona.created_at).toLocaleDateString()}</Text>
        </View>
      </View>

      {!persona.is_active && (
        <TouchableOpacity
          style={[styles.activateBtn, { backgroundColor: colors.blue, borderRadius: isNormal ? 999 : 2 }, saving && { opacity: 0.5 }]}
          onPress={handleActivate}
          disabled={saving}
        >
          <Text style={[styles.activateBtnText, { color: colors.bg }]}>{isNormal ? t("personaDetail.activate") : t("personaDetail.activatePro")}</Text>
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
            <Text style={[styles.cardHeaderText, { color: colors.blue }]}>{isNormal ? t("personaDetail.meaning") : t("personaDetail.meaningPro")}</Text>
          </View>
          <Text style={[styles.interpretation, { color: colors.textPrimary }]}>{persona.interpretation}</Text>
        </View>
      )}

      <View style={[styles.card, cardSurfaceStyle]}>
        <View style={[styles.cardHeader, { borderBottomColor: colors.borderFaint }]}>
          <View style={[styles.blueDot, { backgroundColor: colors.blue }]} />
          <Text style={[styles.cardHeaderText, { color: colors.blue }]}>{isNormal ? t("personaDetail.growthMap") : t("personaDetail.growthMapPro")}</Text>
        </View>
        <Text style={[styles.pcaDesc, { color: colors.textDim }]}>
          {isNormal
            ? t("personaDetail.pcaDesc")
            : t("personaDetail.pcaDescPro")}
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
        <Text style={[styles.cardHeaderText, { color: colors.blue }]}>{isNormal ? t("personaDetail.traitBreakdown") : t("personaDetail.traitBreakdownPro")}</Text>
      </View>
      {Object.entries(TRAIT_LABELS).map(([key]) => (
        <TraitBar key={key} trait={key} value={(persona.traits as any)[key] ?? 50} t={t} />
      ))}
    </View>
  ) : null;

  const handleSharePDF = async () => {
    if (!persona) return;
    setSharingPDF(true);
    try {
      await sharePersonaPDF(persona);
    } catch {
      Alert.alert(t("common.error"), "Could not generate PDF.");
    } finally {
      setSharingPDF(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push("/(profile)/personas");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <AppTopBar
        label={isNormal ? t("personaDetail.topBar") : t("personaDetail.topBarPro")}
        onBack={handleBack}
        rightContent={
          <>
            <ThemeModeToggle compact />
            <TouchableOpacity
              style={[styles.pdfBtn, sharingPDF && { opacity: 0.5 }]}
              onPress={handleSharePDF}
              disabled={sharingPDF}
            >
              {sharingPDF
                ? <ActivityIndicator size="small" color={colors.blue} />
                : <Text style={[styles.pdfBtnText, { color: colors.blue }]}>PDF ↑</Text>
              }
            </TouchableOpacity>
          </>
        }
      />

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

  pdfBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.borderDim,
    borderRadius: 2,
    marginLeft: 8,
    minWidth: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  pdfBtnText: {
    fontSize: 9,
    fontFamily: Fonts.sansBold,
    letterSpacing: 1,
    color: Colors.blue,
  },
});
