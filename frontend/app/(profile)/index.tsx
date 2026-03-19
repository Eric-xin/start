import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert, TextInput, useWindowDimensions, Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../store/authStore";
import { updateUser, changePassword } from "../../services/user";
import { listPersonas, PersonaData } from "../../services/persona";
import { getProgress, updateProgress, ProgressData } from "../../services/progress";
import { getPortfolio, getRecentPlays, PortfolioData, CardPlayData } from "../../services/portfolio";
import { useColors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { useThemeStore } from "../../store/themeStore";
import { ThemeModeToggle } from "../../components/theme/ThemeModeToggle";
import { AppTopBar } from "../../components/navigation/AppTopBar";

const TRAIT_LABELS: Record<string, string> = {
  risk_appetite: "Risk Appetite",
  fomo_sensitivity: "FOMO",
  loss_aversion: "Loss Aversion",
  patience: "Patience",
  diversification_bias: "Diversification",
  overconfidence: "Overconfidence",
};

const STRATEGY_ICONS: Record<string, string> = {
  savings: "💵", bonds: "📄", stocks: "📈", index: "🗂", alternatives: "🔮",
};

// ─── Dynamic Styles Generator ──────────────────────────────────────────────────
function getStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    loading: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },

    scroll: { padding: 20 },
    scrollWide: { padding: 24 },
    columns: { flexDirection: "row", gap: 0, alignItems: "flex-start" },
    col: { flex: 1, gap: 16 },
    colDivider: { width: 1, backgroundColor: colors.borderFaint, marginHorizontal: 20, alignSelf: "stretch" },
    singleCol: { gap: 16 },

    card: {
      backgroundColor: colors.bgPanel,
      borderWidth: 1, borderColor: colors.borderDim, borderRadius: 2, padding: 18,
    },

    // Account
    accountMeta: { flexDirection: "row", gap: 16, flexWrap: "wrap", marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.borderFaint },
    metaBadge: { gap: 2 },
    metaLabel: { fontSize: 7, fontFamily: Fonts.sansBold, color: colors.textMuted, letterSpacing: 1.5 },
    metaValue: { fontSize: 12, fontFamily: Fonts.mono, color: colors.textBright },
    replayIntroBtn: {
      marginTop: 12,
      borderWidth: 1,
      borderColor: colors.borderDim,
      borderRadius: 2,
      paddingVertical: 10,
      paddingHorizontal: 12,
      alignItems: "center",
    },
    replayIntroTxt: {
      fontSize: 9,
      fontFamily: Fonts.sansBold,
      color: colors.blue,
      letterSpacing: 1.5,
    },

    // Persona
    personaRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
    personaName: { fontSize: 15, fontFamily: Fonts.mono, color: colors.textBright, letterSpacing: 0.5 },
    personaSub: { fontSize: 9, fontFamily: Fonts.mono, color: colors.textDim, marginTop: 2 },
    viewBtn: { borderWidth: 1, borderColor: colors.borderDim, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 2 },
    viewBtnText: { fontSize: 8, fontFamily: Fonts.sansBold, color: colors.textDim, letterSpacing: 1.5 },
    interpretation: { fontSize: 11, fontFamily: Fonts.sans, color: colors.textDim, lineHeight: 16, fontStyle: "italic", marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.borderFaint },

    // Sessions
    sessionRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderFaint },
    sessionCapital: { fontSize: 13, fontFamily: Fonts.mono, color: colors.textBright, letterSpacing: 0.5 },
    sessionMeta: { fontSize: 9, fontFamily: Fonts.mono, color: colors.textDim, marginTop: 2 },
    sessionDelta: { fontSize: 12, fontFamily: Fonts.mono, letterSpacing: 0.5 },
    emptyTxt: { fontSize: 11, fontFamily: Fonts.mono, color: colors.textMuted },

    // Progress stats
    statsRow: { flexDirection: "row" },
    statBlock: { flex: 1, alignItems: "center", paddingVertical: 8, borderRightWidth: 1, borderRightColor: colors.borderFaint },
    statLabel: { fontSize: 7, fontFamily: Fonts.sansBold, color: colors.textMuted, letterSpacing: 1.5, marginBottom: 4 },
    statValue: { fontSize: 18, fontFamily: Fonts.mono, color: colors.textBright },

    // Strategies + decks
    deckHint: { fontSize: 10, fontFamily: Fonts.sans, color: colors.textDim, lineHeight: 14, marginBottom: 12 },
    stratBlock: { borderBottomWidth: 1, borderBottomColor: colors.borderFaint, paddingBottom: 2, marginBottom: 4 },
    stratRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
    lockedRow: { opacity: 0.45 },
    stratIcon: { fontSize: 16 },
    stratLabel: { fontSize: 12, fontFamily: Fonts.mono, color: colors.textBright, letterSpacing: 0.5 },
    unlockHint: { fontSize: 8, fontFamily: Fonts.mono, color: colors.textMuted, marginTop: 1 },
    lockTag: { borderWidth: 1, borderColor: colors.borderDim, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 2 },
    lockTagTxt: { fontSize: 7, fontFamily: Fonts.sansBold, color: colors.textMuted, letterSpacing: 1.5 },
    deckRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 5, paddingLeft: 4 },
    deckIndent: { width: 2, height: 16, backgroundColor: colors.borderDim, borderRadius: 1, marginRight: 4 },
    deckLabel: { fontSize: 10, fontFamily: Fonts.mono, color: colors.textPrimary },

    // Logout
    logoutBtn: { borderWidth: 1, borderColor: colors.red + "55", padding: 12, alignItems: "center", borderRadius: 2, marginBottom: 32 },
    logoutTxt: { fontSize: 10, fontFamily: Fonts.sansBold, color: colors.red, letterSpacing: 2 },
  });
}

function getSectionHeaderStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.borderFaint },
    dot: { width: 6, height: 6, borderRadius: 1, backgroundColor: colors.blue },
    title: { flex: 1, fontSize: 9, fontFamily: Fonts.sansBold, color: colors.blue, letterSpacing: 2 },
    actionBtn: { borderWidth: 1, borderColor: colors.borderDim, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 2 },
    actionText: { fontSize: 8, fontFamily: Fonts.sansBold, color: colors.textDim, letterSpacing: 1.5 },
  });
}

function getEditFieldStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    wrap: { marginBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.borderFaint, paddingBottom: 10 },
    label: { fontSize: 8, fontFamily: Fonts.sansBold, color: colors.textMuted, letterSpacing: 1.5, marginBottom: 4 },
    row: { flexDirection: "row", alignItems: "center", gap: 8 },
    value: { flex: 1, fontSize: 13, fontFamily: Fonts.mono, color: colors.textBright, letterSpacing: 0.5 },
    input: { flex: 1, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.borderDim, borderRadius: 2, padding: 8, color: colors.textBright, fontFamily: Fonts.mono, fontSize: 13 },
    saveBtn: { backgroundColor: colors.blue, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 2 },
    saveTxt: { fontSize: 8, fontFamily: Fonts.sansBold, color: colors.bg, letterSpacing: 1.5 },
    editTxt: { fontSize: 8, fontFamily: Fonts.sansBold, color: colors.textDim, letterSpacing: 1.5 },
    cancelTxt: { fontSize: 12, color: colors.textDim, paddingHorizontal: 4 },
  });
}

function getTraitMiniStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
    label: { width: 92, fontSize: 8, fontFamily: Fonts.sansBold, color: colors.textDim, letterSpacing: 0.8 },
    track: { flex: 1, height: 3, backgroundColor: colors.borderDim, borderRadius: 2, overflow: "hidden" },
    fill: { height: 3, borderRadius: 2 },
    val: { width: 24, fontSize: 8, fontFamily: Fonts.mono, textAlign: "right" },
  });
}

function getPasswordSectionStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderFaint },
    label: { fontSize: 8, fontFamily: Fonts.sansBold, color: colors.textMuted, letterSpacing: 1.5, width: 80 },
    value: { flex: 1, fontSize: 13, fontFamily: Fonts.mono, color: colors.textBright },
    edit: { fontSize: 8, fontFamily: Fonts.sansBold, color: colors.textDim, letterSpacing: 1.5 },
    form: { paddingTop: 10, gap: 10 },
    formLabel: { fontSize: 9, fontFamily: Fonts.sansBold, color: colors.blue, letterSpacing: 2, marginBottom: 4 },
    field: { gap: 4 },
    fieldLabel: { fontSize: 8, fontFamily: Fonts.sansBold, color: colors.textMuted, letterSpacing: 1.5 },
    input: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.borderDim, borderRadius: 2, padding: 8, color: colors.textBright, fontFamily: Fonts.mono, fontSize: 13 },
    actions: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 4 },
    saveBtn: { backgroundColor: colors.blue, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 2 },
    saveBtnTxt: { fontSize: 10, fontFamily: Fonts.sansBold, color: colors.bg, letterSpacing: 2 },
    cancel: { fontSize: 9, fontFamily: Fonts.sansBold, color: colors.textDim, letterSpacing: 1.5 },
  });
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const isNormal = useThemeStore((state) => state.mode === "normal");
  const { user, setUser, clearAuth, setSkipInvestingIntro } = useAuthStore();
  const { width } = useWindowDimensions();
  const isWide = width >= 760;

  const s = getStyles(colors);
  const sh = getSectionHeaderStyles(colors);
  const ef = getEditFieldStyles(colors);
  const tm = getTraitMiniStyles(colors);
  const pw = getPasswordSectionStyles(colors);

  const cardSurfaceStyle = {
    backgroundColor: colors.bgPanel,
    borderColor: colors.borderDim,
    borderRadius: isNormal ? 18 : 2,
  } as const;

  // ─── Helper Components ───────────────────────────────────────────────────
  const SectionHeader = ({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) => (
    <View style={sh.row}>
      <View style={sh.dot} />
      <Text style={sh.title}>{title}</Text>
      {action && onAction && (
        <TouchableOpacity onPress={onAction} style={sh.actionBtn}>
          <Text style={sh.actionText}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const EditField = ({
    label, value, onSave, placeholder, secure, keyboardType,
  }: {
    label: string; value: string; onSave: (v: string) => Promise<void>;
    placeholder?: string; secure?: boolean; keyboardType?: any;
  }) => {
    const [editing, setEditing] = useState(false);
    const [input, setInput] = useState(value);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
      if (!input.trim() || input === value) { setEditing(false); return; }
      setSaving(true);
      try {
        await onSave(input.trim());
        setEditing(false);
      } catch (e: any) {
        Alert.alert(t("common.error"), e?.response?.data?.detail ?? t("profileHome.errors.updateFailed"));
      } finally {
        setSaving(false);
      }
    };

    return (
      <View style={ef.wrap}>
        <Text style={ef.label}>{label}</Text>
        {editing ? (
          <View style={ef.row}>
            <TextInput
              style={ef.input}
              value={input}
              onChangeText={setInput}
              autoFocus
              secureTextEntry={secure}
              keyboardType={keyboardType}
              selectionColor={colors.blue}
            />
            <TouchableOpacity style={ef.saveBtn} onPress={handleSave} disabled={saving}>
              <Text style={ef.saveTxt}>{saving ? "..." : t("profileHome.account.save")}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setInput(value); setEditing(false); }}>
              <Text style={ef.cancelTxt}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={ef.row} onPress={() => setEditing(true)}>
            <Text style={ef.value}>{secure ? "••••••••" : (value || placeholder || "—")}</Text>
            <Text style={ef.editTxt}>{t("profileHome.account.edit")}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const TraitMini = ({ label, value }: { label: string; value: number }) => {
    const pct = Math.round(value);
    const color = pct > 65 ? colors.red : pct > 50 ? colors.amber : colors.green;
    return (
      <View style={tm.row}>
        <Text style={tm.label}>{label}</Text>
        <View style={tm.track}><View style={[tm.fill, { width: `${pct}%` as any, backgroundColor: color }]} /></View>
        <Text style={[tm.val, { color }]}>{pct}</Text>
      </View>
    );
  };

  const PasswordSection = () => {
    const [open, setOpen] = useState(false);
    const [cur, setCur] = useState("");
    const [next, setNext] = useState("");
    const [confirm, setConfirm] = useState("");
    const [saving, setSaving] = useState(false);

    const handleChange = async () => {
      if (next.length < 8) { Alert.alert(t("profileHome.password.tooShortTitle"), t("profileHome.password.tooShortBody")); return; }
      if (next !== confirm) { Alert.alert(t("profileHome.password.mismatchTitle"), t("profileHome.password.mismatchBody")); return; }
      setSaving(true);
      try {
        await changePassword(cur, next);
        Alert.alert(t("profileHome.password.successTitle"), t("profileHome.password.successBody"));
        setCur(""); setNext(""); setConfirm(""); setOpen(false);
      } catch (e: any) {
        Alert.alert(t("common.error"), e?.response?.data?.detail ?? t("profileHome.password.error"));
      } finally {
        setSaving(false);
      }
    };

    if (!open) {
      return (
        <TouchableOpacity style={pw.row} onPress={() => setOpen(true)}>
          <Text style={pw.label}>{t("profileHome.password.label")}</Text>
          <Text style={pw.value}>••••••••</Text>
          <Text style={pw.edit}>{t("profileHome.password.change")}</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={pw.form}>
        <Text style={pw.formLabel}>{t("profileHome.password.changeTitle")}</Text>
        {[
          { label: t("profileHome.password.current"), val: cur, set: setCur },
          { label: t("profileHome.password.new"), val: next, set: setNext },
          { label: t("profileHome.password.confirm"), val: confirm, set: setConfirm },
        ].map(({ label, val, set }) => (
          <View key={label} style={pw.field}>
            <Text style={pw.fieldLabel}>{label}</Text>
            <TextInput
              style={pw.input}
              value={val}
              onChangeText={set}
              secureTextEntry
              selectionColor={colors.blue}
            />
          </View>
        ))}
        <View style={pw.actions}>
          <TouchableOpacity style={[pw.saveBtn, saving && { opacity: 0.5 }]} onPress={handleChange} disabled={saving}>
            <Text style={pw.saveBtnTxt}>{saving ? t("profileHome.password.saving") : t("profileHome.password.update")}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setOpen(false)}>
            <Text style={pw.cancel}>{t("common.cancel")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const [activePersona, setActivePersona] = useState<PersonaData | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [portfolio, setPortfolioData] = useState<PortfolioData | null>(null);
  const [recentPlays, setRecentPlays] = useState<CardPlayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingDeck, setTogglingDeck] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [personas, prog, port, plays] = await Promise.all([
        listPersonas(), getProgress(), getPortfolio(), getRecentPlays(3),
      ]);
      setActivePersona(personas.find((p) => p.is_active) ?? personas[0] ?? null);
      setProgress(prog);
      setPortfolioData(port);
      setRecentPlays(plays);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const handleSaveUsername = async (v: string) => {
    const updated = await updateUser({ username: v });
    setUser(updated as any);
  };
  const handleSaveEmail = async (v: string) => {
    const updated = await updateUser({ email: v });
    setUser(updated as any);
  };

  const handleToggleDeck = async (key: string, currentlyEnabled: boolean) => {
    if (!progress) return;
    const enabled = new Set(progress.enabled_decks);
    if (currentlyEnabled) {
      if (enabled.size <= 1) { Alert.alert(t("profileHome.requiredTitle"), t("profileHome.keepOneDeck")); return; }
      enabled.delete(key);
    } else {
      enabled.add(key);
    }
    setTogglingDeck(key);
    try {
      const updated = await updateProgress({ enabled_decks: Array.from(enabled) });
      setProgress(updated);
    } catch { Alert.alert(t("common.error"), t("profileHome.errors.updateDeck")); }
    finally { setTogglingDeck(null); }
  };

  const handleToggleStrategy = async (key: string, currentlyEnabled: boolean) => {
    if (!progress) return;
    const enabled = new Set(progress.enabled_strategies);
    if (currentlyEnabled) {
      if (enabled.size <= 1) { Alert.alert(t("profileHome.requiredTitle"), t("profileHome.keepOneStrategy")); return; }
      enabled.delete(key);
    } else { enabled.add(key); }
    try {
      const updated = await updateProgress({ enabled_strategies: Array.from(enabled) });
      setProgress(updated);
    } catch { Alert.alert(t("common.error"), t("profileHome.errors.updateStrategy")); }
  };

  if (loading) {
    return <View style={s.loading}><ActivityIndicator color={colors.blue} size="large" /></View>;
  }

  if (!progress) {
    return <View style={s.loading}><ActivityIndicator color={colors.blue} size="large" /></View>;
  }

  // Group decks by strategy
  const decksByStrategy: Record<string, typeof progress.decks> = {};
  progress.decks.forEach((d) => {
    if (!decksByStrategy[d.strategy]) decksByStrategy[d.strategy] = [];
    decksByStrategy[d.strategy].push(d);
  });

  // ── Left column ───────────────────────────────────────────────────────────
  const leftCol = (
    <>
      {/* Account settings */}
      <View style={[s.card, cardSurfaceStyle]}>
        <SectionHeader title={t("profileHome.account.title")} />
        <EditField label={t("profileHome.account.username")} value={user?.username ?? ""} onSave={handleSaveUsername} placeholder={t("profileHome.account.usernamePlaceholder")} />
        <EditField label={t("profileHome.account.email")} value={user?.email ?? ""} onSave={handleSaveEmail} placeholder={t("profileHome.account.emailPlaceholder")} keyboardType="email-address" />
        <PasswordSection />
        <View style={s.accountMeta}>
          <View style={s.metaBadge}>
            <Text style={s.metaLabel}>{t("profileHome.account.tier")}</Text>
            <Text style={[s.metaValue, { color: colors.blue }]}>{user?.subscription_tier?.toUpperCase() ?? "NORMAL"}</Text>
          </View>
          <View style={s.metaBadge}>
            <Text style={s.metaLabel}>{t("profileHome.account.role")}</Text>
            <Text style={s.metaValue}>{user?.role?.toUpperCase() ?? "USER"}</Text>
          </View>
          <View style={s.metaBadge}>
            <Text style={s.metaLabel}>{t("profileHome.account.memberSince")}</Text>
            <Text style={s.metaValue}>{user?.created_at ? new Date(user.created_at as any).getFullYear() : "—"}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={s.replayIntroBtn}
          onPress={async () => {
            await setSkipInvestingIntro(false);
            router.push("/(game)/investing-intro");
          }}
        >
          <Text style={s.replayIntroTxt}>{t("profile.replayIntro")}</Text>
        </TouchableOpacity>
      </View>

      {/* Active Persona */}
      <View style={[s.card, cardSurfaceStyle]}>
        <SectionHeader
          title={t("profileHome.activePersona.title")}
          action={t("profileHome.activePersona.manage")}
          onAction={() => router.push("/(profile)/personas")}
        />
        {activePersona ? (
          <>
            <View style={s.personaRow}>
              <View>
                <Text style={s.personaName}>{activePersona.name}</Text>
                <Text style={s.personaSub}>{t("profileHome.activePersona.cardsPlayed", { count: activePersona.cards_played })}</Text>
              </View>
              <TouchableOpacity
                style={s.viewBtn}
                onPress={() => router.push(`/(profile)/persona/${activePersona.id}`)}
              >
                <Text style={s.viewBtnText}>{t("profileHome.activePersona.view")}</Text>
              </TouchableOpacity>
            </View>
            {activePersona.traits && (
              <View style={{ marginTop: 10 }}>
                {Object.entries(TRAIT_LABELS).map(([k, l]) => (
                  <TraitMini key={k} label={l} value={(activePersona.traits as any)[k] ?? 50} />
                ))}
              </View>
            )}
            {activePersona.interpretation && (
              <Text style={s.interpretation}>{activePersona.interpretation}</Text>
            )}
          </>
        ) : (
          <Text style={s.emptyTxt}>{t("profileHome.activePersona.empty")}</Text>
        )}
      </View>

      {/* Recent Decisions */}
      <View style={[s.card, cardSurfaceStyle]}>
        <SectionHeader
          title={t("profileHome.recent.title")}
          action={t("profileHome.recent.viewPortfolio")}
          onAction={() => router.push("/(game)/portfolio")}
        />
        {recentPlays.length === 0 ? (
          <Text style={s.emptyTxt}>{t("profileHome.recent.empty")}</Text>
        ) : (
          recentPlays.map((play) => {
            const capChange = play.capital_after - play.capital_before;
            const isUp = capChange >= 0;
            return (
              <View key={play.id} style={s.sessionRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.sessionCapital}>{play.card?.emoji ?? "•"} {play.card?.title ?? "Card"}</Text>
                  <Text style={s.sessionMeta}>
                    {play.action === "right" ? t("profileHome.recent.accepted") : t("profileHome.recent.declined")} · {new Date(play.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={[s.sessionDelta, { color: isUp ? colors.green : colors.red }]}>
                  {isUp ? "+" : ""}${capChange.toFixed(2)}
                </Text>
              </View>
            );
          })
        )}
      </View>
    </>
  );

  // ── Right column ──────────────────────────────────────────────────────────
  const rightCol = (
    <>
      {/* Progress overview */}
      <View style={[s.card, cardSurfaceStyle]}>
        <SectionHeader title={t("profileHome.progress.title")} />
        <View style={s.statsRow}>
          <View style={s.statBlock}>
            <Text style={s.statLabel}>{t("profileHome.progress.cardsPlayed")}</Text>
            <Text style={s.statValue}>{progress?.total_cards_played ?? 0}</Text>
          </View>
          <View style={s.statBlock}>
            <Text style={s.statLabel}>{t("profileHome.progress.strategies")}</Text>
            <Text style={[s.statValue, { color: colors.teal }]}>{progress?.unlocked_strategies.length ?? 1}/5</Text>
          </View>
          <View style={s.statBlock}>
            <Text style={s.statLabel}>{t("profileHome.progress.decks")}</Text>
            <Text style={[s.statValue, { color: colors.blue }]}>{progress?.unlocked_decks.length ?? 1}/{progress?.decks.length ?? 7}</Text>
          </View>
        </View>
      </View>

      {/* Strategies & Decks */}
      <View style={[s.card, cardSurfaceStyle]}>
        <SectionHeader
          title={t("profileHome.strategyDecks.title")}
          action={t("profileHome.strategyDecks.settings")}
          onAction={() => router.push("/(profile)/decks")}
        />
        <Text style={s.deckHint}>{t("profileHome.strategyDecks.hint")}</Text>

        {progress?.strategies.map((strat) => {
          const decks = decksByStrategy[strat.key] ?? [];
          return (
            <View key={strat.key} style={s.stratBlock}>
              {/* Strategy row */}
              <View style={[s.stratRow, !strat.is_unlocked && s.lockedRow]}>
                <Text style={s.stratIcon}>{STRATEGY_ICONS[strat.key]}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.stratLabel, !strat.is_unlocked && { color: colors.textMuted }]}>
                    {strat.label}
                  </Text>
                  {!strat.is_unlocked && (
                    <Text style={s.unlockHint}>{t("profileHome.strategyDecks.unlocksAt", { count: strat.unlock_at })}</Text>
                  )}
                </View>
                {strat.is_unlocked ? (
                  <Switch
                    value={strat.is_enabled}
                    onValueChange={() => handleToggleStrategy(strat.key, strat.is_enabled)}
                    trackColor={{ false: colors.borderDim, true: colors.blue + "88" }}
                    thumbColor={strat.is_enabled ? colors.blue : colors.textMuted}
                    ios_backgroundColor={colors.borderDim}
                    style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                  />
                ) : (
                  <View style={s.lockTag}><Text style={s.lockTagTxt}>{t("profileHome.strategyDecks.locked")}</Text></View>
                )}
              </View>

              {/* Deck rows within this strategy */}
              {decks.map((deck) => (
                <View key={deck.key} style={[s.deckRow, !deck.is_unlocked && s.lockedRow]}>
                  <View style={s.deckIndent} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.deckLabel, !deck.is_unlocked && { color: colors.textMuted }]}>
                      {deck.label}
                    </Text>
                    {!deck.is_unlocked && (
                      <Text style={s.unlockHint}>{t("profileHome.strategyDecks.cardsNeeded", { count: deck.unlock_at })}</Text>
                    )}
                  </View>
                  {deck.is_unlocked ? (
                    togglingDeck === deck.key ? (
                      <ActivityIndicator size="small" color={colors.blue} />
                    ) : (
                      <Switch
                        value={deck.is_enabled}
                        onValueChange={() => handleToggleDeck(deck.key, deck.is_enabled)}
                        trackColor={{ false: colors.borderDim, true: colors.blue + "66" }}
                        thumbColor={deck.is_enabled ? colors.blue : colors.textMuted}
                        ios_backgroundColor={colors.borderDim}
                        style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }}
                      />
                    )
                  ) : (
                    <View style={s.lockTag}><Text style={s.lockTagTxt}>{t("profileHome.strategyDecks.locked")}</Text></View>
                  )}
                </View>
              ))}
            </View>
          );
        })}
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={s.logoutBtn}
        onPress={async () => { await clearAuth(); router.replace("/(auth)/login"); }}
      >
        <Text style={s.logoutTxt}>{t("profileHome.logout")}</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <View style={[s.container, { backgroundColor: colors.bg }]}>
      <AppTopBar
        label={isNormal ? t("profileHome.topLabel") : t("profileHome.topLabelPro")}
        onBack={() => router.back()}
        rightContent={<ThemeModeToggle compact />}
      />

      <ScrollView contentContainerStyle={[s.scroll, isWide && s.scrollWide]}>
        {isWide ? (
          <View style={s.columns}>
            <View style={s.col}>{leftCol}</View>
            <View style={[s.colDivider, { backgroundColor: colors.borderFaint }]} />
            <View style={s.col}>{rightCol}</View>
          </View>
        ) : (
          <View style={s.singleCol}>
            {leftCol}
            {rightCol}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

