import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useColors } from "../../../../constants/colors";
import { Fonts } from "../../../../constants/fonts";
import { useThemeStore } from "../../../../store/themeStore";
import { useArenaStore } from "../../../../store/arenaStore";
import { useAuthStore } from "../../../../store/authStore";
import { startGame, getRoom } from "../../../../services/arena";
import { AppTopBar } from "../../../../components/navigation/AppTopBar";
import { ThemeModeToggle } from "../../../../components/theme/ThemeModeToggle";

export default function ArenaLobbyScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const isNormal = useThemeStore((s) => s.mode === "normal");
  const user = useAuthStore((s) => s.user);
  const styles = createStyles(colors, isNormal);

  const { room, players, myPlayerId, setRoom, setMyPlayerId, connectWs, wsConnected } =
    useArenaStore();

  const [starting, setStarting] = useState(false);

  const isHost = room ? String(room.host_user_id) === String(user?.id) : false;

  useEffect(() => {
    if (!code) return;

    connectWs(code).catch(() => {});

    const poll = setInterval(async () => {
      try {
        const fresh = await getRoom(code);
        const me = fresh.players.find((p) => p.user_id === user?.id);
        setRoom(fresh, fresh.players);
        if (me && !myPlayerId) setMyPlayerId(me.id);
        if (fresh.status === "playing") {
          clearInterval(poll);
          router.replace(`/(game)/arena/play/${code}`);
        }
      } catch { /* ignore */ }
    }, 3000);

    return () => clearInterval(poll);
  }, [code]);

  useEffect(() => {
    if (room?.status === "playing") {
      router.replace(`/(game)/arena/play/${code}`);
    }
  }, [room?.status]);

  const handleStart = async () => {
    if (!code) return;
    setStarting(true);
    try {
      await startGame(code);
    } catch (e: any) {
      Alert.alert(t("common.error"), e?.response?.data?.detail ?? t("arena.lobby.errors.start"));
      setStarting(false);
    }
  };

  const handleShare = () => {
    Share.share({
      message: isNormal
        ? t("arena.lobby.shareMessage", { code })
        : t("arena.lobby.shareMessagePro", { code }),
    });
  };

  const sortedPlayers = [...players].sort((a, b) => (a.is_host ? -1 : b.is_host ? 1 : 0));
  const readyCount = players.filter((p) => p.status === "ready").length;

  return (
    <View style={styles.root}>
      <AppTopBar
        label={isNormal ? t("arena.lobby.title") : t("arena.lobby.titlePro")}
        onBack={() => router.replace("/(game)/arena")}
        rightContent={
          <>
            <ThemeModeToggle compact />
            <View style={styles.liveChip}>
              <View style={[styles.liveDot, { backgroundColor: wsConnected ? colors.green : colors.amber }]} />
              <Text style={styles.liveLabel}>{wsConnected ? (isNormal ? t("arena.lobby.live") : t("arena.lobby.livePro")) : "..."}</Text>
            </View>
          </>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Code card */}
        <View style={styles.codeCard}>
          <Text style={styles.codeCardLabel}>{isNormal ? t("arena.lobby.roomCode") : t("arena.lobby.roomCodePro")}</Text>
          <Text style={styles.codeDisplay}>{code}</Text>

          <View style={styles.codeHintRow}>
            <Text style={styles.codeHint}>
              {isNormal ? t("arena.lobby.shareHint") : t("arena.lobby.shareHintPro")}
            </Text>
          </View>

          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareBtnText}>{isNormal ? t("arena.lobby.shareCta") : t("arena.lobby.shareCtaPro")}</Text>
          </TouchableOpacity>
        </View>

        {/* Settings chips */}
        <View style={styles.settingsRow}>
          {[
            { label: isNormal ? t("arena.lobby.settings.rounds") : t("arena.lobby.settings.roundsPro"), value: String(room?.round_count ?? "—"), icon: isNormal ? "🔁" : "" },
            { label: isNormal ? t("arena.lobby.settings.capital") : t("arena.lobby.settings.capitalPro"), value: room ? `$${(room.starting_capital / 1000).toFixed(0)}K` : "—", icon: isNormal ? "💰" : "" },
            { label: isNormal ? t("arena.lobby.settings.max") : t("arena.lobby.settings.maxPro"), value: String(room?.max_players ?? "—"), icon: isNormal ? "👥" : "" },
          ].map((item) => (
            <View key={item.label} style={styles.settingChip}>
              {isNormal && <Text style={styles.settingIcon}>{item.icon}</Text>}
              <Text style={styles.settingVal}>{item.value}</Text>
              <Text style={styles.settingLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Players list */}
        <View style={styles.playersSection}>
          <View style={styles.playersSectionHeader}>
            <Text style={styles.playersSectionTitle}>
              {isNormal ? t("arena.lobby.playersTitle") : t("arena.lobby.playersTitlePro")}
            </Text>
            <Text style={styles.playersCountBadge}>
              {players.length}/{room?.max_players ?? "?"}
              {readyCount > 0 ? (isNormal ? ` · ${readyCount} ready` : ` — ${readyCount} READY`) : ""}
            </Text>
          </View>

          <View style={styles.playersList}>
            {sortedPlayers.map((p, i) => {
              const isMe = p.id === myPlayerId;
              const isDisconnected = p.status === "disconnected";
              return (
                <View key={p.id} style={[
                  styles.playerRow,
                  isMe && styles.playerRowMe,
                  isDisconnected && styles.playerRowDisconnected,
                  i === 0 && styles.playerRowFirst,
                ]}>
                  {/* Avatar placeholder */}
                  <View style={[styles.avatar, { backgroundColor: isMe ? colors.blue : colors.borderDim }]}>
                    <Text style={[styles.avatarText, { color: isMe ? "#fff" : colors.textDim }]}>
                      {p.username[0].toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.playerInfo}>
                    <View style={styles.playerNameRow}>
                      <Text style={[styles.playerName, isMe && styles.playerNameMe]}>
                        {p.username}
                      </Text>
                      {p.is_host && (
                        <View style={styles.hostBadge}>
                          <Text style={styles.hostBadgeText}>{t("arena.lobby.player.host")}</Text>
                        </View>
                      )}
                      {isMe && (
                        <View style={[styles.hostBadge, { backgroundColor: isNormal ? colors.blueDim : "rgba(10,108,245,0.2)", borderColor: colors.blue }]}>
                          <Text style={[styles.hostBadgeText, { color: colors.blue }]}>{t("arena.lobby.player.you")}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.playerStatus}>
                      {isDisconnected
                        ? (isNormal ? t("arena.lobby.player.disconnected") : t("arena.lobby.player.disconnectedPro"))
                        : p.status === "ready"
                        ? (isNormal ? t("arena.lobby.player.connected") : t("arena.lobby.player.connectedPro"))
                        : (isNormal ? t("arena.lobby.player.joining") : t("arena.lobby.player.joiningPro"))}
                    </Text>
                  </View>

                  <View style={[
                    styles.statusDot,
                    { backgroundColor: isDisconnected ? colors.red : p.status === "ready" ? colors.green : colors.amber }
                  ]} />
                </View>
              );
            })}

            {/* Empty slots */}
            {room && Array.from({ length: Math.max(0, Math.min(room.max_players - players.length, 4)) }).map((_, i) => (
              <View key={`empty-${i}`} style={[styles.playerRow, styles.playerRowEmpty]}>
                <View style={[styles.avatar, styles.avatarEmpty]}>
                  <Text style={styles.avatarEmptyText}>?</Text>
                </View>
                <Text style={styles.emptySlotText}>{isNormal ? t("arena.lobby.waitingPlayer") : t("arena.lobby.waitingPlayerPro")}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Start / Wait */}
        {isHost ? (
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={[styles.startBtn, (starting) && styles.startBtnDisabled]}
              onPress={handleStart}
              disabled={starting}
            >
              {starting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.startBtnText}>
                  {isNormal ? t("arena.lobby.startCta") : t("arena.lobby.startCtaPro")}
                </Text>
              )}
            </TouchableOpacity>
            <Text style={styles.startHint}>
              {isNormal
                ? t("arena.lobby.startHint")
                : t("arena.lobby.startHintPro")}
            </Text>
          </View>
        ) : (
          <View style={styles.waitingSection}>
            <View style={styles.waitingInner}>
              <ActivityIndicator color={colors.blue} size="small" />
              <Text style={styles.waitingText}>
                {isNormal ? t("arena.lobby.waitingHost") : t("arena.lobby.waitingHostPro")}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>, isNormal: boolean) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    header: {
      height: 48,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderDim,
      backgroundColor: colors.bgPanel,
    },
    backBtn: { paddingVertical: 6 },
    backBtnText: {
      fontFamily: Fonts.sansBold,
      fontSize: 11,
      color: colors.red,
      letterSpacing: isNormal ? 0.3 : 1,
    },
    headerTitle: {
      fontFamily: isNormal ? Fonts.sansBold : Fonts.mono,
      fontSize: isNormal ? 15 : 12,
      color: colors.textBright,
      letterSpacing: isNormal ? 0.3 : 3,
    },
    liveChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: isNormal ? 999 : 2,
      borderWidth: 1,
      borderColor: colors.borderDim,
      backgroundColor: colors.bgSurface,
    },
    liveDot: { width: 6, height: 6, borderRadius: 3 },
    liveLabel: {
      fontFamily: Fonts.mono,
      fontSize: 9,
      color: colors.textDim,
      letterSpacing: 1,
    },
    scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },

    // Code card
    codeCard: {
      alignItems: "center",
      padding: 24,
      borderRadius: isNormal ? 20 : 2,
      borderWidth: 1.5,
      borderColor: colors.blue,
      backgroundColor: isNormal ? colors.bgPanel : "rgba(10,108,245,0.04)",
      marginBottom: 20,
    },
    codeCardLabel: {
      fontFamily: Fonts.sansBold,
      fontSize: 9,
      color: colors.textDim,
      letterSpacing: isNormal ? 0.5 : 2,
      marginBottom: 8,
    },
    codeDisplay: {
      fontFamily: Fonts.mono,
      fontSize: 48,
      color: colors.blue,
      letterSpacing: 12,
      marginBottom: 8,
    },
    codeHintRow: { marginBottom: 14 },
    codeHint: {
      fontFamily: Fonts.sans,
      fontSize: 12,
      color: colors.textDim,
      textAlign: "center",
      letterSpacing: isNormal ? 0 : 0.3,
    },
    shareBtn: {
      borderWidth: 1,
      borderColor: colors.blue,
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: isNormal ? 999 : 2,
      backgroundColor: isNormal ? colors.blueDim : "transparent",
    },
    shareBtnText: {
      fontFamily: Fonts.sansBold,
      fontSize: 12,
      color: colors.blue,
      letterSpacing: isNormal ? 0.5 : 1.5,
    },

    // Settings
    settingsRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 24,
    },
    settingChip: {
      flex: 1,
      padding: 14,
      borderRadius: isNormal ? 14 : 2,
      borderWidth: 1,
      borderColor: colors.borderFaint,
      backgroundColor: colors.bgSurface,
      alignItems: "center",
      gap: 3,
    },
    settingIcon: { fontSize: 16, marginBottom: 2 },
    settingVal: {
      fontFamily: Fonts.mono,
      fontSize: 16,
      color: colors.textBright,
    },
    settingLabel: {
      fontFamily: Fonts.sansBold,
      fontSize: 8,
      color: colors.textMuted,
      letterSpacing: isNormal ? 0 : 1.2,
    },

    // Players
    playersSection: { marginBottom: 24 },
    playersSectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    playersSectionTitle: {
      fontFamily: Fonts.sansBold,
      fontSize: 11,
      color: colors.textDim,
      letterSpacing: isNormal ? 0.3 : 2,
    },
    playersCountBadge: {
      fontFamily: Fonts.mono,
      fontSize: 10,
      color: colors.textMuted,
    },
    playersList: {
      borderRadius: isNormal ? 16 : 2,
      borderWidth: 1,
      borderColor: colors.borderDim,
      overflow: "hidden",
      backgroundColor: colors.bgPanel,
    },
    playerRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderFaint,
      gap: 12,
    },
    playerRowFirst: {},
    playerRowMe: {
      backgroundColor: isNormal ? colors.blueDim : "rgba(10,108,245,0.07)",
    },
    playerRowDisconnected: { opacity: 0.4 },
    playerRowEmpty: { opacity: 0.4 },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: isNormal ? 18 : 4,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      fontFamily: Fonts.sansBold,
      fontSize: 14,
    },
    avatarEmpty: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.borderFaint,
      borderStyle: "dashed",
    },
    avatarEmptyText: {
      fontFamily: Fonts.mono,
      fontSize: 14,
      color: colors.borderDim,
    },
    playerInfo: { flex: 1 },
    playerNameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 2,
    },
    playerName: {
      fontFamily: isNormal ? Fonts.sansMedium : Fonts.mono,
      fontSize: isNormal ? 14 : 12,
      color: colors.textPrimary,
    },
    playerNameMe: { color: colors.blue },
    playerStatus: {
      fontFamily: Fonts.sans,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: isNormal ? 0 : 0.5,
    },
    hostBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: isNormal ? 999 : 1,
      backgroundColor: isNormal ? colors.bgSurface : "transparent",
      borderWidth: 1,
      borderColor: colors.borderDim,
    },
    hostBadgeText: {
      fontFamily: Fonts.sansBold,
      fontSize: 8,
      color: colors.textDim,
      letterSpacing: 0.5,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    emptySlotText: {
      fontFamily: Fonts.sans,
      fontSize: 12,
      color: colors.textMuted,
      letterSpacing: isNormal ? 0 : 0.5,
    },

    // Actions
    actionSection: {
      gap: 10,
      alignItems: "center",
    },
    startBtn: {
      width: "100%",
      paddingVertical: 16,
      backgroundColor: colors.green,
      borderRadius: isNormal ? 14 : 2,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
    },
    startBtnDisabled: { opacity: 0.5 },
    startBtnText: {
      fontFamily: Fonts.sansBold,
      fontSize: 15,
      color: "#fff",
      letterSpacing: isNormal ? 0.5 : 2,
    },
    startHint: {
      fontFamily: Fonts.sans,
      fontSize: 11,
      color: colors.textMuted,
      textAlign: "center",
      letterSpacing: isNormal ? 0 : 0.3,
    },
    waitingSection: {
      paddingVertical: 20,
      alignItems: "center",
    },
    waitingInner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: isNormal ? 999 : 2,
      borderWidth: 1,
      borderColor: colors.borderDim,
      backgroundColor: colors.bgSurface,
    },
    waitingText: {
      fontFamily: Fonts.mono,
      fontSize: 11,
      color: colors.textDim,
      letterSpacing: isNormal ? 0 : 1,
    },
  });
