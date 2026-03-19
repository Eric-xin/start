import React, { useState, useEffect, useMemo } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { createDailySession, createSession, getDailyStatus, getSessions, SessionData, DailyStatusData } from "../../services/game";
import { listPersonas, PersonaData } from "../../services/persona";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import { useAuthStore } from "../../store/authStore";
import { useGameStore } from "../../store/gameStore";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";

const DEFAULT_WEEKDAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function getWeekStartLocal(date: Date) {
  // NOTE: This function now computes the start of the week in UTC, not local time.
  // It aligns the week strip with UTC-based dates such as `session.daily_date`.
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const mondayBasedDay = (start.getUTCDay() + 6) % 7;
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - mondayBasedDay);
  return start;
}

function hasSessionBeenPlayed(session: SessionData) {
  if (session.is_daily) {
    return session.daily_cards_played > 0 || session.daily_completed;
  }

  const createdAt = session.created_at ? new Date(session.created_at) : null;
  const updatedAt = session.updated_at ? new Date(session.updated_at) : null;
  const hasValidDates =
    createdAt instanceof Date &&
    updatedAt instanceof Date &&
    !Number.isNaN(createdAt.getTime()) &&
    !Number.isNaN(updatedAt.getTime());

  const hasBeenUpdated = hasValidDates && updatedAt.getTime() > createdAt.getTime();

  return hasBeenUpdated || session.progress > 0;
}

function buildCurrentWeekDays(sessions: SessionData[], weekdayLabels: string[]) {
  const weekStart = getWeekStartLocal(new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
  const playedDays = new Set<number>();

  sessions.forEach((session) => {
    if (!hasSessionBeenPlayed(session)) return;

    let playedAt: Date | null = null;

    // For daily sessions, prefer the UTC-based `daily_date` over timestamps to
    // avoid timezone boundary issues when determining the played day.
    if (session.is_daily && (session as any).daily_date) {
      playedAt = new Date((session as any).daily_date as string);
    } else {
      playedAt = new Date(session.updated_at || session.created_at);
    }

    if (Number.isNaN(playedAt.getTime())) return;
    if (playedAt < weekStart || playedAt >= weekEnd) return;

    // Use UTC day so the week strip is explicitly UTC-based.
    const dayIndex = (playedAt.getUTCDay() + 6) % 7;
    playedDays.add(dayIndex);
  });

  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);

  return Array.from({ length: 7 }).map((_, i) => {
    const dayDate = new Date(weekStart);
    dayDate.setUTCDate(weekStart.getUTCDate() + i);
    dayDate.setUTCHours(0, 0, 0, 0);

    return {
      key: DEFAULT_WEEKDAY_LABELS[i],
      label: weekdayLabels[i] ?? DEFAULT_WEEKDAY_LABELS[i],
      dateNumber: dayDate.getUTCDate(),
      isPlayed: playedDays.has(i),
      isToday: dayDate.getTime() === todayUtc.getTime(),
    };
  });
}

function GridBg() {
  const { width, height } = useWindowDimensions();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: Math.ceil(height / 32) }).map((_, i) => (
        <View key={`h${i}`} style={{ position: "absolute", top: i * 32, left: 0, right: 0, height: 1, backgroundColor: Colors.borderFaint }} />
      ))}
      {Array.from({ length: Math.ceil(width / 64) }).map((_, i) => (
        <View key={`v${i}`} style={{ position: "absolute", left: i * 64, top: 0, bottom: 0, width: 1, backgroundColor: Colors.borderFaint, opacity: 0.5 }} />
      ))}
    </View>
  );
}

function DataBlock({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <View style={db.block}>
      <Text style={db.label}>{label}</Text>
      <Text style={[db.value, accent ? { color: accent } : {}]}>{value}</Text>
      {sub && <Text style={db.sub}>{sub}</Text>}
    </View>
  );
}

const db = StyleSheet.create({
  block: { alignItems: "flex-start" },
  label: { fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 1.5, marginBottom: 2 },
  value: { fontSize: 18, fontFamily: Fonts.mono, color: Colors.textBright, letterSpacing: 1 },
  sub: { fontSize: 9, fontFamily: Fonts.mono, color: Colors.textDim, marginTop: 1 },
});

export default function GameIndexScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { user, clearAuth } = useAuthStore();
  const { setSession, reset } = useGameStore();
  const [launching, setLaunching] = useState(false);
  const [launchingDaily, setLaunchingDaily] = useState(false);
  const [loadingLast, setLoadingLast] = useState(false);
  const [lastSession, setLastSession] = useState<SessionData | null>(null);
  const [allSessions, setAllSessions] = useState<SessionData[]>([]);
  const [activePersona, setActivePersona] = useState<PersonaData | null>(null);
  const [dailyStatus, setDailyStatus] = useState<DailyStatusData | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  const weekdayLabels = useMemo(
    () => [
      t("common.weekdays.mon"),
      t("common.weekdays.tue"),
      t("common.weekdays.wed"),
      t("common.weekdays.thu"),
      t("common.weekdays.fri"),
      t("common.weekdays.sat"),
      t("common.weekdays.sun"),
    ],
    [i18n.resolvedLanguage]
  );

  const currentWeekDays = useMemo(
    () => buildCurrentWeekDays(allSessions, weekdayLabels),
    [allSessions, weekdayLabels]
  );

  useEffect(() => {
    Promise.all([getSessions(), listPersonas(), getDailyStatus()])
      .then(([sessions, personas, daily]) => {
        setAllSessions(sessions);
        setLastSession(sessions.find((s) => !s.is_daily) ?? sessions[0] ?? null);
        setActivePersona(personas.find((p) => p.is_active) ?? personas[0] ?? null);
        setDailyStatus(daily);
      })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, []);

  const handleNewSession = async () => {
    setLaunching(true);
    try {
      reset();
      const session = await createSession();
      setSession(session);
      router.push("/(game)/play");
    } catch {
      Alert.alert(t("profile.error"), t("auth.errors.unableConnect"));
    } finally {
      setLaunching(false);
    }
  };

  const handleContinueLast = async () => {
    if (!lastSession) return;
    setSession(lastSession);
    router.push("/(game)/play");
  };

  const handleDailySession = async () => {
    setLaunchingDaily(true);
    try {
      reset();
      const session = await createDailySession();
      setSession(session);
      router.push("/(game)/play");
    } catch {
      Alert.alert(t("profile.error"), t("auth.errors.unableConnect"));
    } finally {
      setLaunchingDaily(false);
    }
  };

  const handleLogout = async () => {
    await clearAuth();
    router.replace("/(auth)/login");
  };

  return (
    <View style={styles.container}>
      <GridBg />

      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <Text style={styles.logo}>CARDECON</Text>
          <View style={styles.barSep} />
          <Text style={styles.topBarLabel}>{t("gameIndex.index")}</Text>
        </View>
        <View style={styles.topRight}>
          <LanguageSwitcher compact />
          <TouchableOpacity style={styles.topBtn} onPress={() => router.push("/(profile)/")}>
            <Text style={styles.topBtnText}>{t("gameIndex.profile")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.topBtn} onPress={() => router.push("/(profile)/personas")}>
            <Text style={styles.topBtnText}>{t("gameIndex.personas")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.topBtn} onPress={() => router.push("/(profile)/decks")}>
            <Text style={styles.topBtnText}>{t("gameIndex.decks")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>{t("gameIndex.logout")}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main content */}
      <View style={styles.content}>

        {/* Investor profile panel */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.blueDot} />
            <Text style={styles.cardHeaderText}>{t("gameIndex.investorProfile")}</Text>
          </View>
          <Text style={styles.username}>{user?.username?.toUpperCase() ?? "INVESTOR"}</Text>
          <Text style={styles.email}>{user?.email ?? "—"}</Text>

          <View style={styles.dataRow}>
            <DataBlock label={t("gameIndex.tier")} value={user?.subscription_tier?.toUpperCase() ?? "NORMAL"} accent={Colors.blue} />
            <View style={styles.dataSep} />
            <DataBlock
              label={t("gameIndex.activePersona")}
              value={activePersona?.name ?? (loadingData ? "..." : "—")}
              sub={activePersona ? t("gameIndex.cardsPlayed", { count: activePersona.cards_played }) : undefined}
              accent={Colors.teal}
            />
            <View style={styles.dataSep} />
            <DataBlock label={t("gameIndex.status")} value={t("gameIndex.active")} sub={t("gameIndex.verified")} accent={Colors.green} />
          </View>
        </View>

        {/* Session control panel */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.blueDot} />
            <Text style={styles.cardHeaderText}>{t("gameIndex.sessionControl")}</Text>
          </View>

          <Text style={styles.sessionDesc}>
            {t("gameIndex.sessionDescPrefix")}
            {activePersona ? <Text style={{ color: Colors.teal }}> "{activePersona.name}"</Text> : null}.
          </Text>

          <View style={styles.buttonRow}>
            {/* Continue last */}
            <TouchableOpacity
              style={[
                styles.continueBtn,
                (!lastSession || loadingData) && styles.continueBtnDisabled,
              ]}
              onPress={handleContinueLast}
              disabled={!lastSession || loadingData}
            >
              {loadingData ? (
                <ActivityIndicator color={Colors.blue} size="small" />
              ) : lastSession ? (
                <View style={[styles.continueBtnInner, { flexDirection: "row", gap: 8 }]}>
                  <Text style={styles.continueBtnText}>{t("gameIndex.continueLast")}</Text>
                  <Text style={styles.continueBtnSub}>
                    · ${Math.round(lastSession.capital).toLocaleString()} · {t("gameSessions.stage")} {lastSession.stage}
                  </Text>
                </View>
              ) : (
                <Text style={styles.continueBtnText}>{t("gameIndex.noPriorSession")}</Text>
              )}
            </TouchableOpacity>

            {/* New session */}
            <TouchableOpacity
              style={[styles.ctaBtn, launching && { opacity: 0.5 }]}
              onPress={handleNewSession}
              disabled={launching || launchingDaily || loadingLast}
            >
              {launching
                ? <ActivityIndicator color={Colors.bg} size="small" />
                : <Text style={styles.ctaBtnText}>{`▶  ${t("gameIndex.launchSession")}`}</Text>
              }
            </TouchableOpacity>

            {/* Daily session */}
            <TouchableOpacity
              style={[
                styles.dailyBtn,
                dailyStatus?.completed_today && styles.dailyBtnDone,
                launchingDaily && { opacity: 0.6 },
              ]}
              onPress={handleDailySession}
              disabled={launchingDaily || launching || loadingData}
            >
              <View style={styles.dailyLeft}>
                <Text style={styles.dailyFire}>🔥</Text>
                <View>
                  <Text style={styles.dailyTitle}>{t("gameIndex.launchDaily")}</Text>
                  <Text style={styles.dailySub}>
                    {dailyStatus?.completed_today
                      ? t("gameIndex.completedToday")
                      : t("gameIndex.cardsLeftToday", { count: dailyStatus?.remaining_cards ?? 10 })}
                  </Text>
                </View>
              </View>
              <View style={styles.streakBadge}>
                <Text style={styles.streakLabel}>{t("gameIndex.streak")}</Text>
                <Text style={styles.streakValue}>{dailyStatus?.streak_count ?? 0}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.weekStrip}>
              {currentWeekDays.map((day) => (
                <View
                  key={day.key}
                  style={[
                    styles.weekDay,
                    day.isPlayed && styles.weekDayPlayed,
                    day.isToday && styles.weekDayToday,
                  ]}
                >
                  <Text style={[styles.weekDayLabel, day.isPlayed && styles.weekDayLabelPlayed]}>{day.label}</Text>
                  <Text style={[styles.weekDayDate, day.isPlayed && styles.weekDayDatePlayed]}>{day.dateNumber}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* History link */}
          <TouchableOpacity
            style={styles.historyLink}
            onPress={() => router.push("/(game)/sessions")}
          >
            <Text style={styles.historyLinkText}>{t("gameIndex.viewHistory")}</Text>
          </TouchableOpacity>
        </View>

        {/* System status panel */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.blueDot, { backgroundColor: Colors.green }]} />
            <Text style={styles.cardHeaderText}>{t("gameIndex.systemStatus")}</Text>
          </View>
          <View style={styles.dataRow}>
            <DataBlock label={t("gameIndex.personaEngine")} value={t("gameIndex.online")} accent={Colors.green} />
            <View style={styles.dataSep} />
            <DataBlock label={t("gameIndex.cardPipeline")} value={t("gameIndex.ready")} accent={Colors.green} />
            <View style={styles.dataSep} />
            <DataBlock label={t("gameIndex.version")} value="1.0.0" />
          </View>
        </View>
      </View>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <Text style={styles.bottomText}>{t("gameIndex.footerLeft")}</Text>
        <Text style={styles.bottomText}>© {new Date().getFullYear()} · {t("gameIndex.footerRight")}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  topBar: {
    height: 40,
    backgroundColor: Colors.bgPanel,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderPrimary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  topLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  topRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  logo: { fontSize: 14, fontFamily: Fonts.mono, color: Colors.blue, letterSpacing: 3 },
  barSep: { width: 1, height: 14, backgroundColor: Colors.borderDim },
  topBarLabel: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 2 },
  topBtn: {
    borderWidth: 1, borderColor: Colors.borderDim,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 2,
  },
  topBtnText: { fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 1.5 },
  logoutBtn: {
    borderWidth: 1, borderColor: Colors.borderDim,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 2,
    marginLeft: 4,
  },
  logoutText: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 1.5 },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },

  card: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: Colors.bgPanel,
    borderWidth: 1,
    borderColor: Colors.borderDim,
    borderRadius: 2,
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderFaint,
    paddingBottom: 8,
  },
  blueDot: { width: 6, height: 6, borderRadius: 1, backgroundColor: Colors.blue },
  cardHeaderText: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.blue, letterSpacing: 2 },

  username: { fontSize: 22, fontFamily: Fonts.mono, color: Colors.textBright, letterSpacing: 2, marginBottom: 4 },
  email: { fontSize: 11, fontFamily: Fonts.mono, color: Colors.textDim, marginBottom: 16 },

  dataRow: { flexDirection: "row", alignItems: "flex-start", gap: 4 },
  dataSep: { width: 1, height: 36, backgroundColor: Colors.borderDim, marginHorizontal: 12, alignSelf: "center" },

  sessionDesc: { fontSize: 12, fontFamily: Fonts.sans, color: Colors.textDim, lineHeight: 18, marginBottom: 16 },

  buttonRow: { flexDirection: "column", gap: 12, marginBottom: 12 },

  ctaBtn: {
    flex: 1,
    backgroundColor: Colors.blue,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    borderRadius: 2,
  },
  ctaBtnText: { fontSize: 12, fontFamily: Fonts.sansBold, color: Colors.bg, letterSpacing: 2 },

  continueBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.blue + "66",
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 2,
  },
  continueBtnDisabled: { borderColor: Colors.borderDim, opacity: 0.5 },
  continueBtnInner: { alignItems: "center", gap: 3 },
  continueBtnText: { fontSize: 11, fontFamily: Fonts.sansBold, color: Colors.blue, letterSpacing: 1.5 },
  continueBtnSub: { fontSize: 9, fontFamily: Fonts.mono, color: Colors.textDim },

  dailyBtn: {
    borderWidth: 1,
    borderColor: "#ff8c2a",
    backgroundColor: "#26140a",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#ff7a00",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  dailyBtnDone: {
    borderColor: "#ffb366",
    backgroundColor: "#2e1b0c",
  },
  dailyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dailyFire: {
    fontSize: 22,
  },
  dailyTitle: {
    fontSize: 11,
    fontFamily: Fonts.sansBold,
    color: "#ffd9a3",
    letterSpacing: 1.8,
  },
  dailySub: {
    fontSize: 9,
    fontFamily: Fonts.mono,
    color: "#ffb870",
    marginTop: 2,
  },
  streakBadge: {
    minWidth: 66,
    borderWidth: 1,
    borderColor: "#ff9f43",
    borderRadius: 3,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: "center",
    backgroundColor: "#1e1208",
  },
  streakLabel: {
    fontSize: 8,
    fontFamily: Fonts.sansBold,
    color: "#ffb870",
    letterSpacing: 1.2,
  },
  streakValue: {
    fontSize: 16,
    fontFamily: Fonts.mono,
    color: "#ffddad",
    marginTop: 1,
  },

  weekStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  weekDay: {
    width: 42,
    borderWidth: 1,
    borderColor: Colors.borderDim,
    borderRadius: 3,
    paddingVertical: 6,
    alignItems: "center",
    backgroundColor: Colors.bg,
  },
  weekDayPlayed: {
    borderColor: "#ff8c2a",
    backgroundColor: "#2a160a",
  },
  weekDayToday: {
    borderColor: "#f0c27a",
  },
  weekDayLabel: {
    fontSize: 8,
    fontFamily: Fonts.sansBold,
    color: Colors.textMuted,
    letterSpacing: 1.2,
  },
  weekDayLabelPlayed: {
    color: "#ffd39d",
  },
  weekDayDate: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: Fonts.mono,
    color: Colors.textDim,
  },
  weekDayDatePlayed: {
    color: "#ffe0b7",
  },

  historyLink: {
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderFaint,
  },
  historyLinkText: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 2 },

  bottomBar: {
    height: 30,
    backgroundColor: Colors.bgPanel,
    borderTopWidth: 1,
    borderTopColor: Colors.borderFaint,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  bottomText: { fontSize: 8, fontFamily: Fonts.mono, color: Colors.textMuted, letterSpacing: 1 },
});
