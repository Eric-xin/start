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
import { getSessions, SessionData } from "../../services/game";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import { getPortfolio, getRecentPlays, PortfolioData, CardPlayData } from "../../services/portfolio";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";

const TRAIT_KEYS = [
  "risk_appetite",
  "fomo_sensitivity",
  "loss_aversion",
  "patience",
  "diversification_bias",
  "overconfidence",
] as const;

const STRATEGY_ICONS: Record<string, string> = {
  savings: "💵", bonds: "📄", stocks: "📈", index: "🗂", alternatives: "🔮",
};

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
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
}
const sh = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: Colors.borderFaint },
  dot: { width: 6, height: 6, borderRadius: 1, backgroundColor: Colors.blue },
  title: { flex: 1, fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.blue, letterSpacing: 2 },
  actionBtn: { borderWidth: 1, borderColor: Colors.borderDim, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 2 },
  actionText: { fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 1.5 },
});

function EditField({
  label, value, onSave, placeholder, secure, keyboardType,
}: {
  label: string; value: string; onSave: (v: string) => Promise<void>;
  placeholder?: string; secure?: boolean; keyboardType?: any;
}) {
  const { t } = useTranslation();
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
      Alert.alert(t("profile.error"), e?.response?.data?.detail ?? t("profile.updateFailed"));
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
            selectionColor={Colors.blue}
          />
          <TouchableOpacity style={ef.saveBtn} onPress={handleSave} disabled={saving}>
            <Text style={ef.saveTxt}>{saving ? t("profile.saving") : t("profile.save")}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setInput(value); setEditing(false); }}>
            <Text style={ef.cancelTxt}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={ef.row} onPress={() => setEditing(true)}>
          <Text style={ef.value}>{secure ? "••••••••" : (value || placeholder || "—")}</Text>
          <Text style={ef.editTxt}>{t("profile.edit")}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
const ef = StyleSheet.create({
  wrap: { marginBottom: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderFaint, paddingBottom: 10 },
  label: { fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  value: { flex: 1, fontSize: 13, fontFamily: Fonts.mono, color: Colors.textBright, letterSpacing: 0.5 },
  input: { flex: 1, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderDim, borderRadius: 2, padding: 8, color: Colors.textBright, fontFamily: Fonts.mono, fontSize: 13 },
  saveBtn: { backgroundColor: Colors.blue, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 2 },
  saveTxt: { fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.bg, letterSpacing: 1.5 },
  editTxt: { fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 1.5 },
  cancelTxt: { fontSize: 12, color: Colors.textDim, paddingHorizontal: 4 },
});

function TraitMini({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value);
  const color = pct > 65 ? Colors.red : pct > 50 ? Colors.amber : Colors.green;
  return (
    <View style={tm.row}>
      <Text style={tm.label}>{label}</Text>
      <View style={tm.track}><View style={[tm.fill, { width: `${pct}%` as any, backgroundColor: color }]} /></View>
      <Text style={[tm.val, { color }]}>{pct}</Text>
    </View>
  );
}
const tm = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  label: { width: 92, fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 0.8 },
  track: { flex: 1, height: 3, backgroundColor: Colors.borderDim, borderRadius: 2, overflow: "hidden" },
  fill: { height: 3, borderRadius: 2 },
  val: { width: 24, fontSize: 8, fontFamily: Fonts.mono, textAlign: "right" },
});

// ─── Password Change Modal ──────────────────────────────────────────────────
function PasswordSection() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = async () => {
    if (next.length < 8) { Alert.alert(t("profile.tooShort"), t("profile.passwordMinError")); return; }
    if (next !== confirm) { Alert.alert(t("profile.mismatch"), t("profile.passwordMismatchError")); return; }
    setSaving(true);
    try {
      await changePassword(cur, next);
      Alert.alert(t("profile.success"), t("profile.passwordUpdated"));
      setCur(""); setNext(""); setConfirm(""); setOpen(false);
    } catch (e: any) {
      Alert.alert(t("profile.error"), e?.response?.data?.detail ?? t("profile.updateFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <TouchableOpacity style={pw.row} onPress={() => setOpen(true)}>
        <Text style={pw.label}>{t("profile.password")}</Text>
        <Text style={pw.value}>••••••••</Text>
        <Text style={pw.edit}>{t("profile.change")}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={pw.form}>
      <Text style={pw.formLabel}>{t("profile.changePassword")}</Text>
      {[
        { label: t("profile.current"), val: cur, set: setCur },
        { label: t("profile.new"), val: next, set: setNext },
        { label: t("profile.confirmNew"), val: confirm, set: setConfirm },
      ].map(({ label, val, set }) => (
        <View key={label} style={pw.field}>
          <Text style={pw.fieldLabel}>{label}</Text>
          <TextInput
            style={pw.input}
            value={val}
            onChangeText={set}
            secureTextEntry
            selectionColor={Colors.blue}
          />
        </View>
      ))}
      <View style={pw.actions}>
        <TouchableOpacity style={[pw.saveBtn, saving && { opacity: 0.5 }]} onPress={handleChange} disabled={saving}>
          <Text style={pw.saveBtnTxt}>{saving ? t("profile.saving") : t("profile.updatePassword")}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setOpen(false)}>
          <Text style={pw.cancel}>{t("profile.cancel")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const pw = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderFaint },
  label: { fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.textMuted, letterSpacing: 1.5, width: 80 },
  value: { flex: 1, fontSize: 13, fontFamily: Fonts.mono, color: Colors.textBright },
  edit: { fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 1.5 },
  form: { paddingTop: 10, gap: 10 },
  formLabel: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.blue, letterSpacing: 2, marginBottom: 4 },
  field: { gap: 4 },
  fieldLabel: { fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.textMuted, letterSpacing: 1.5 },
  input: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderDim, borderRadius: 2, padding: 8, color: Colors.textBright, fontFamily: Fonts.mono, fontSize: 13 },
  actions: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 4 },
  saveBtn: { backgroundColor: Colors.blue, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 2 },
  saveBtnTxt: { fontSize: 10, fontFamily: Fonts.sansBold, color: Colors.bg, letterSpacing: 2 },
  cancel: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 1.5 },
});

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, setUser, clearAuth } = useAuthStore();
  const { width } = useWindowDimensions();
  const isWide = width >= 760;

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
      if (enabled.size <= 1) { Alert.alert(t("profile.required"), t("profile.atLeastOneDeck")); return; }
      enabled.delete(key);
    } else {
      enabled.add(key);
    }
    setTogglingDeck(key);
    try {
      const updated = await updateProgress({ enabled_decks: Array.from(enabled) });
      setProgress(updated);
    } catch { Alert.alert(t("profile.error"), t("profile.couldNotUpdateDeck")); }
    finally { setTogglingDeck(null); }
  };

  const handleToggleStrategy = async (key: string, currentlyEnabled: boolean) => {
    if (!progress) return;
    const enabled = new Set(progress.enabled_strategies);
    if (currentlyEnabled) {
      if (enabled.size <= 1) { Alert.alert(t("profile.required"), t("profile.atLeastOneStrategy")); return; }
      enabled.delete(key);
    } else { enabled.add(key); }
    try {
      const updated = await updateProgress({ enabled_strategies: Array.from(enabled) });
      setProgress(updated);
    } catch { Alert.alert(t("profile.error"), t("profile.couldNotUpdateStrategy")); }
  };

  if (loading) {
    return <View style={s.loading}><ActivityIndicator color={Colors.blue} size="large" /></View>;
  }

  // Group decks by strategy
  const decksByStrategy: Record<string, typeof progress.decks> = {};
  progress?.decks.forEach((d) => {
    if (!decksByStrategy[d.strategy]) decksByStrategy[d.strategy] = [];
    decksByStrategy[d.strategy].push(d);
  });

  // ── Left column ───────────────────────────────────────────────────────────
  const leftCol = (
    <>
      {/* Account settings */}
      <View style={s.card}>
        <SectionHeader title={t("profile.accountSettings")} />
        <EditField label={t("profile.username")} value={user?.username ?? ""} onSave={handleSaveUsername} placeholder={t("profile.username").toLowerCase()} />
        <EditField label={t("profile.emailAddress")} value={user?.email ?? ""} onSave={handleSaveEmail} placeholder={t("profile.emailAddress").toLowerCase()} keyboardType="email-address" />
        <PasswordSection />
        <View style={s.accountMeta}>
          <View style={s.metaBadge}>
            <Text style={s.metaLabel}>{t("profile.tier")}</Text>
            <Text style={[s.metaValue, { color: Colors.blue }]}>{user?.subscription_tier?.toUpperCase() ?? "—"}</Text>
          </View>
          <View style={s.metaBadge}>
            <Text style={s.metaLabel}>{t("profile.role")}</Text>
            <Text style={s.metaValue}>{user?.role?.toUpperCase() ?? "—"}</Text>
          </View>
          <View style={s.metaBadge}>
            <Text style={s.metaLabel}>{t("profile.memberSince")}</Text>
            <Text style={s.metaValue}>{user?.created_at ? new Date(user.created_at as any).getFullYear() : "—"}</Text>
          </View>
        </View>
      </View>

      {/* Active Persona */}
      <View style={s.card}>
        <SectionHeader
          title={t("profile.activePersona")}
          action={t("profile.manage")}
          onAction={() => router.push("/(profile)/personas")}
        />
        {activePersona ? (
          <>
            <View style={s.personaRow}>
              <View>
                <Text style={s.personaName}>{activePersona.name}</Text>
                <Text style={s.personaSub}>{t("profile.cardsPlayedN", { count: activePersona.cards_played })}</Text>
              </View>
              <TouchableOpacity
                style={s.viewBtn}
                onPress={() => router.push(`/(profile)/persona/${activePersona.id}`)}
              >
                <Text style={s.viewBtnText}>{t("profile.viewTrajectory")}</Text>
              </TouchableOpacity>
            </View>
            {activePersona.traits && (
              <View style={{ marginTop: 10 }}>
                {TRAIT_KEYS.map((key) => (
                  <TraitMini
                    key={key}
                    label={t(`personaDetail.traits.${key}`)}
                    value={(activePersona.traits as any)[key] ?? 50}
                  />
                ))}
              </View>
            )}
            {activePersona.interpretation && (
              <Text style={s.interpretation}>{activePersona.interpretation}</Text>
            )}
          </>
        ) : (
          <Text style={s.emptyTxt}>{t("profile.noPersonas")}</Text>
        )}
      </View>

      {/* Recent Decisions */}
      <View style={s.card}>
        <SectionHeader
          title="RECENT DECISIONS"
          action="VIEW PORTFOLIO →"
          onAction={() => router.push("/(game)/portfolio")}
        />
        {recentPlays.length === 0 ? (
          <Text style={s.emptyTxt}>No card plays yet. Start playing to build history.</Text>
        ) : (
          recentPlays.map((play) => {
            const capChange = play.capital_after - play.capital_before;
            const isUp = capChange >= 0;
            return (
              <View key={play.id} style={s.sessionRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.sessionCapital}>{play.card?.emoji ?? "•"} {play.card?.title ?? "Card"}</Text>
                  <Text style={s.sessionMeta}>
                    {play.action === "right" ? "ACCEPTED" : "DECLINED"} · {new Date(play.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={[s.sessionDelta, { color: isUp ? Colors.green : Colors.red }]}>
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
      <View style={s.card}>
        <SectionHeader title={t("profile.progress")} />
        <View style={s.statsRow}>
          <View style={s.statBlock}>
            <Text style={s.statLabel}>{t("profile.cardsPlayed")}</Text>
            <Text style={s.statValue}>{progress?.total_cards_played ?? 0}</Text>
          </View>
          <View style={s.statBlock}>
            <Text style={s.statLabel}>{t("decks.strategies")}</Text>
            <Text style={[s.statValue, { color: Colors.teal }]}>{progress?.unlocked_strategies.length ?? 1}/5</Text>
          </View>
          <View style={s.statBlock}>
            <Text style={s.statLabel}>{t("decks.decks")}</Text>
            <Text style={[s.statValue, { color: Colors.blue }]}>{progress?.unlocked_decks.length ?? 1}/{progress?.decks.length ?? 7}</Text>
          </View>
        </View>
      </View>

      {/* Strategies & Decks */}
      <View style={s.card}>
        <SectionHeader
          title={t("profile.strategiesDecks")}
          action={t("profile.fullSettings")}
          onAction={() => router.push("/(profile)/decks")}
        />
        <Text style={s.deckHint}>{t("profile.deckHint")}</Text>

        {progress?.strategies.map((strat) => {
          const decks = decksByStrategy[strat.key] ?? [];
          return (
            <View key={strat.key} style={s.stratBlock}>
              {/* Strategy row */}
              <View style={[s.stratRow, !strat.is_unlocked && s.lockedRow]}>
                <Text style={s.stratIcon}>{STRATEGY_ICONS[strat.key]}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.stratLabel, !strat.is_unlocked && { color: Colors.textMuted }]}>
                    {strat.label}
                  </Text>
                  {!strat.is_unlocked && (
                    <Text style={s.unlockHint}>{t("profile.unlocksAt", { count: strat.unlock_at })}</Text>
                  )}
                </View>
                {strat.is_unlocked ? (
                  <Switch
                    value={strat.is_enabled}
                    onValueChange={() => handleToggleStrategy(strat.key, strat.is_enabled)}
                    trackColor={{ false: Colors.borderDim, true: Colors.blue + "88" }}
                    thumbColor={strat.is_enabled ? Colors.blue : Colors.textMuted}
                    ios_backgroundColor={Colors.borderDim}
                    style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                  />
                ) : (
                  <View style={s.lockTag}><Text style={s.lockTagTxt}>{t("profile.locked")}</Text></View>
                )}
              </View>

              {/* Deck rows within this strategy */}
              {decks.map((deck) => (
                <View key={deck.key} style={[s.deckRow, !deck.is_unlocked && s.lockedRow]}>
                  <View style={s.deckIndent} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.deckLabel, !deck.is_unlocked && { color: Colors.textMuted }]}>
                      {deck.label}
                    </Text>
                    {!deck.is_unlocked && (
                      <Text style={s.unlockHint}>{t("profile.unlocksAt", { count: deck.unlock_at })}</Text>
                    )}
                  </View>
                  {deck.is_unlocked ? (
                    togglingDeck === deck.key ? (
                      <ActivityIndicator size="small" color={Colors.blue} />
                    ) : (
                      <Switch
                        value={deck.is_enabled}
                        onValueChange={() => handleToggleDeck(deck.key, deck.is_enabled)}
                        trackColor={{ false: Colors.borderDim, true: Colors.blue + "66" }}
                        thumbColor={deck.is_enabled ? Colors.blue : Colors.textMuted}
                        ios_backgroundColor={Colors.borderDim}
                        style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }}
                      />
                    )
                  ) : (
                    <View style={s.lockTag}><Text style={s.lockTagTxt}>{t("profile.locked")}</Text></View>
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
        <Text style={s.logoutTxt}>{t("profile.logout")}</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <View style={s.container}>
      {/* Top bar */}
      <View style={s.topBar}>
        <Text style={s.logo}>CARDECON</Text>
        <View style={s.barSep} />
        <Text style={s.topLabel}>{t("profile.profile")}</Text>
        <View style={{ flex: 1 }} />
        <LanguageSwitcher compact />
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>{t("profile.back")}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[s.scroll, isWide && s.scrollWide]}>
        {isWide ? (
          <View style={s.columns}>
            <View style={s.col}>{leftCol}</View>
            <View style={s.colDivider} />
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

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loading: { flex: 1, backgroundColor: Colors.bg, alignItems: "center", justifyContent: "center" },

  topBar: {
    height: 40, backgroundColor: Colors.bgPanel,
    borderBottomWidth: 1, borderBottomColor: Colors.borderPrimary,
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 10,
  },
  backBtn: { paddingRight: 4 },
  backText: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 1.5 },
  logo: { fontSize: 13, fontFamily: Fonts.mono, color: Colors.blue, letterSpacing: 3 },
  barSep: { width: 1, height: 14, backgroundColor: Colors.borderDim },
  topLabel: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 2 },

  scroll: { padding: 20 },
  scrollWide: { padding: 24 },
  columns: { flexDirection: "row", gap: 0, alignItems: "flex-start" },
  col: { flex: 1, gap: 16 },
  colDivider: { width: 1, backgroundColor: Colors.borderFaint, marginHorizontal: 20, alignSelf: "stretch" },
  singleCol: { gap: 16 },

  card: {
    backgroundColor: Colors.bgPanel,
    borderWidth: 1, borderColor: Colors.borderDim, borderRadius: 2, padding: 18,
  },

  // Account
  accountMeta: { flexDirection: "row", gap: 16, flexWrap: "wrap", marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.borderFaint },
  metaBadge: { gap: 2 },
  metaLabel: { fontSize: 7, fontFamily: Fonts.sansBold, color: Colors.textMuted, letterSpacing: 1.5 },
  metaValue: { fontSize: 12, fontFamily: Fonts.mono, color: Colors.textBright },

  // Persona
  personaRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  personaName: { fontSize: 15, fontFamily: Fonts.mono, color: Colors.textBright, letterSpacing: 0.5 },
  personaSub: { fontSize: 9, fontFamily: Fonts.mono, color: Colors.textDim, marginTop: 2 },
  viewBtn: { borderWidth: 1, borderColor: Colors.borderDim, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 2 },
  viewBtnText: { fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 1.5 },
  interpretation: { fontSize: 11, fontFamily: Fonts.sans, color: Colors.textDim, lineHeight: 16, fontStyle: "italic", marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.borderFaint },

  // Sessions
  sessionRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderFaint },
  sessionCapital: { fontSize: 13, fontFamily: Fonts.mono, color: Colors.textBright, letterSpacing: 0.5 },
  sessionMeta: { fontSize: 9, fontFamily: Fonts.mono, color: Colors.textDim, marginTop: 2 },
  sessionDelta: { fontSize: 12, fontFamily: Fonts.mono, letterSpacing: 0.5 },
  emptyTxt: { fontSize: 11, fontFamily: Fonts.mono, color: Colors.textMuted },

  // Progress stats
  statsRow: { flexDirection: "row" },
  statBlock: { flex: 1, alignItems: "center", paddingVertical: 8, borderRightWidth: 1, borderRightColor: Colors.borderFaint },
  statLabel: { fontSize: 7, fontFamily: Fonts.sansBold, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 4 },
  statValue: { fontSize: 18, fontFamily: Fonts.mono, color: Colors.textBright },

  // Strategies + decks
  deckHint: { fontSize: 10, fontFamily: Fonts.sans, color: Colors.textDim, lineHeight: 14, marginBottom: 12 },
  stratBlock: { borderBottomWidth: 1, borderBottomColor: Colors.borderFaint, paddingBottom: 2, marginBottom: 4 },
  stratRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  lockedRow: { opacity: 0.45 },
  stratIcon: { fontSize: 16 },
  stratLabel: { fontSize: 12, fontFamily: Fonts.mono, color: Colors.textBright, letterSpacing: 0.5 },
  unlockHint: { fontSize: 8, fontFamily: Fonts.mono, color: Colors.textMuted, marginTop: 1 },
  lockTag: { borderWidth: 1, borderColor: Colors.borderDim, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 2 },
  lockTagTxt: { fontSize: 7, fontFamily: Fonts.sansBold, color: Colors.textMuted, letterSpacing: 1.5 },
  deckRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 5, paddingLeft: 4 },
  deckIndent: { width: 2, height: 16, backgroundColor: Colors.borderDim, borderRadius: 1, marginRight: 4 },
  deckLabel: { fontSize: 10, fontFamily: Fonts.mono, color: Colors.textPrimary },

  // Logout
  logoutBtn: { borderWidth: 1, borderColor: Colors.red + "55", padding: 12, alignItems: "center", borderRadius: 2, marginBottom: 32 },
  logoutTxt: { fontSize: 10, fontFamily: Fonts.sansBold, color: Colors.red, letterSpacing: 2 },
});
