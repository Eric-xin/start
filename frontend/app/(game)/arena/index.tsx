import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "../../../constants/colors";
import { Fonts } from "../../../constants/fonts";
import { useThemeStore } from "../../../store/themeStore";
import { useAuthStore } from "../../../store/authStore";
import { useArenaStore } from "../../../store/arenaStore";
import { createRoom, joinRoom } from "../../../services/arena";

const ROUND_OPTIONS = [5, 10, 15, 20];
const CAPITAL_OPTIONS = [5_000, 10_000, 25_000, 50_000];
const PLAYER_OPTIONS = [2, 4, 6, 8];

export default function ArenaHubScreen() {
  const router = useRouter();
  const colors = useColors();
  const isNormal = useThemeStore((s) => s.mode === "normal");
  const user = useAuthStore((s) => s.user);
  const setRoom = useArenaStore((s) => s.setRoom);
  const setMyPlayerId = useArenaStore((s) => s.setMyPlayerId);
  const reset = useArenaStore((s) => s.reset);

  const styles = createStyles(colors, isNormal);

  const [tab, setTab] = useState<"create" | "join">("create");
  const [loading, setLoading] = useState(false);

  const [rounds, setRounds] = useState(10);
  const [capital, setCapital] = useState(10_000);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [roomCode, setRoomCode] = useState("");

  const handleCreate = async () => {
    setLoading(true);
    try {
      reset();
      const room = await createRoom(rounds, capital, maxPlayers);
      const me = room.players.find((p) => p.user_id === user?.id);
      setRoom(room, room.players);
      if (me) setMyPlayerId(me.id);
      router.push(`/(game)/arena/lobby/${room.code}`);
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.detail ?? "Could not create room");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    const code = roomCode.trim().toUpperCase();
    if (code.length < 4) {
      Alert.alert("Invalid code", "Please enter a valid room code");
      return;
    }
    setLoading(true);
    try {
      reset();
      const room = await joinRoom(code);
      const me = room.players.find((p) => p.user_id === user?.id);
      setRoom(room, room.players);
      if (me) setMyPlayerId(me.id);
      router.push(`/(game)/arena/lobby/${room.code}`);
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.detail ?? "Room not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{isNormal ? "← Back" : "← BACK"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isNormal ? "Arena" : "ARENA"}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          {isNormal ? (
            <Text style={styles.heroEmoji}>⚔️</Text>
          ) : (
            <View style={styles.heroBracket}>
              <Text style={styles.heroBracketText}>[ ARENA ]</Text>
            </View>
          )}
          <Text style={styles.heroTitle}>
            {isNormal ? "Multiplayer Arena" : "MULTIPLAYER ARENA"}
          </Text>
          <Text style={styles.heroSubtitle}>
            {isNormal
              ? "Same cards, real stakes. See who makes the best decisions under pressure."
              : "IDENTICAL CARD SEQUENCES FOR ALL PLAYERS — ONE WINNER."}
          </Text>

          {/* Rules row */}
          <View style={styles.rulesRow}>
            {[
              { icon: isNormal ? "🃏" : "01", label: isNormal ? "Same cards" : "SAME DECK" },
              { icon: isNormal ? "⏳" : "02", label: isNormal ? "Wait for all" : "SYNC PLAY" },
              { icon: isNormal ? "📈" : "03", label: isNormal ? "Live standings" : "LIVE BOARD" },
              { icon: isNormal ? "🏆" : "04", label: isNormal ? "Best wins" : "BEST WINS" },
            ].map((r) => (
              <View key={r.label} style={styles.ruleChip}>
                <Text style={styles.ruleChipIcon}>{r.icon}</Text>
                <Text style={styles.ruleChipLabel}>{r.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tab selector */}
        <View style={styles.tabs}>
          {(["create", "join"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === "create"
                  ? isNormal ? "Create Room" : "CREATE"
                  : isNormal ? "Join Room" : "JOIN"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Create form */}
        {tab === "create" && (
          <View style={styles.form}>
            <OptionRow
              label={isNormal ? "Number of Rounds" : "ROUNDS"}
              options={ROUND_OPTIONS}
              selected={rounds}
              onSelect={setRounds}
              format={(v) => String(v)}
              colors={colors}
              isNormal={isNormal}
            />
            <OptionRow
              label={isNormal ? "Starting Capital" : "STARTING CAPITAL"}
              options={CAPITAL_OPTIONS}
              selected={capital}
              onSelect={setCapital}
              format={(v) => `$${(v / 1000).toFixed(0)}K`}
              colors={colors}
              isNormal={isNormal}
            />
            <OptionRow
              label={isNormal ? "Max Players" : "MAX PLAYERS"}
              options={PLAYER_OPTIONS}
              selected={maxPlayers}
              onSelect={setMaxPlayers}
              format={(v) => String(v)}
              colors={colors}
              isNormal={isNormal}
            />

            {/* Summary */}
            <View style={styles.summaryBox}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryVal}>{rounds}</Text>
                <Text style={styles.summaryKey}>{isNormal ? "rounds" : "ROUNDS"}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryVal}>${(capital / 1000).toFixed(0)}K</Text>
                <Text style={styles.summaryKey}>{isNormal ? "start" : "CAPITAL"}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryVal}>{maxPlayers}</Text>
                <Text style={styles.summaryKey}>{isNormal ? "players max" : "MAX PLY"}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
              onPress={handleCreate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {isNormal ? "Create Room →" : "CREATE ROOM →"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Join form */}
        {tab === "join" && (
          <View style={styles.form}>
            <Text style={styles.joinLabel}>
              {isNormal ? "Enter Room Code" : "ROOM CODE"}
            </Text>
            <View style={styles.codeInputWrap}>
              <TextInput
                style={styles.codeInput}
                value={roomCode}
                onChangeText={(t) => setRoomCode(t.toUpperCase())}
                placeholder="_ _ _ _ _ _"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={8}
              />
            </View>

            <Text style={styles.joinHint}>
              {isNormal
                ? "Ask your friend for their 6-character room code, or tap the share link they sent."
                : "ENTER 6-CHAR ALPHANUMERIC CODE FROM ROOM HOST"}
            </Text>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{isNormal ? "or" : "OR"}</Text>
              <View style={styles.dividerLine} />
            </View>

            <Text style={styles.joinHint}>
              {isNormal
                ? "You can also open a share link from your friend directly — it'll bring you right here."
                : "SHARE LINKS WILL AUTO-FILL THE CODE ON OPEN"}
            </Text>

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
              onPress={handleJoin}
              disabled={loading || roomCode.trim().length < 4}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {isNormal ? "Join Room →" : "JOIN ROOM →"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function OptionRow({
  label,
  options,
  selected,
  onSelect,
  format,
  colors,
  isNormal,
}: {
  label: string;
  options: number[];
  selected: number;
  onSelect: (v: number) => void;
  format: (v: number) => string;
  colors: any;
  isNormal: boolean;
}) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text
        style={{
          fontFamily: Fonts.sansBold,
          fontSize: 10,
          color: colors.textDim,
          letterSpacing: isNormal ? 0.4 : 1.5,
          marginBottom: 9,
        }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {options.map((v) => (
          <TouchableOpacity
            key={v}
            onPress={() => onSelect(v)}
            style={{
              flex: 1,
              paddingVertical: 11,
              borderRadius: isNormal ? 12 : 2,
              borderWidth: 1.5,
              borderColor: selected === v ? colors.blue : colors.borderDim,
              backgroundColor: selected === v
                ? (isNormal ? colors.blueDim : "rgba(10,108,245,0.12)")
                : colors.bgSurface,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontFamily: Fonts.mono,
                fontSize: 13,
                color: selected === v ? colors.blue : colors.textPrimary,
                letterSpacing: 0.5,
              }}
            >
              {format(v)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>, isNormal: boolean) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
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
    backBtn: { paddingVertical: 6, paddingRight: 12 },
    backBtnText: {
      fontFamily: Fonts.sansBold,
      fontSize: 11,
      color: colors.textDim,
      letterSpacing: isNormal ? 0.3 : 1.5,
    },
    headerTitle: {
      fontFamily: isNormal ? Fonts.sansBold : Fonts.mono,
      fontSize: isNormal ? 16 : 13,
      color: colors.blue,
      letterSpacing: isNormal ? 0.5 : 4,
    },
    scroll: {
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 48,
    },
    hero: {
      alignItems: "center",
      marginBottom: 32,
    },
    heroEmoji: {
      fontSize: 44,
      marginBottom: 10,
    },
    heroBracket: {
      borderWidth: 1,
      borderColor: colors.blue,
      paddingHorizontal: 16,
      paddingVertical: 5,
      marginBottom: 14,
    },
    heroBracketText: {
      fontFamily: Fonts.mono,
      fontSize: 11,
      color: colors.blue,
      letterSpacing: 4,
    },
    heroTitle: {
      fontFamily: isNormal ? Fonts.sansBold : Fonts.mono,
      fontSize: isNormal ? 30 : 20,
      color: colors.textBright,
      letterSpacing: isNormal ? 0 : 3,
      marginBottom: 10,
      textAlign: "center",
    },
    heroSubtitle: {
      fontFamily: Fonts.sans,
      fontSize: 13,
      color: colors.textDim,
      textAlign: "center",
      lineHeight: 20,
      letterSpacing: isNormal ? 0 : 0.3,
      maxWidth: 340,
      marginBottom: 20,
    },
    rulesRow: {
      flexDirection: "row",
      gap: 8,
      flexWrap: "wrap",
      justifyContent: "center",
    },
    ruleChip: {
      flexDirection: isNormal ? "row" : "column",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: isNormal ? 999 : 2,
      borderWidth: 1,
      borderColor: colors.borderDim,
      backgroundColor: colors.bgSurface,
    },
    ruleChipIcon: {
      fontSize: isNormal ? 14 : 10,
      fontFamily: Fonts.mono,
      color: colors.blue,
    },
    ruleChipLabel: {
      fontFamily: Fonts.sansBold,
      fontSize: isNormal ? 11 : 9,
      color: colors.textPrimary,
      letterSpacing: isNormal ? 0 : 1,
    },
    tabs: {
      flexDirection: "row",
      borderWidth: 1,
      borderColor: colors.borderDim,
      borderRadius: isNormal ? 14 : 2,
      overflow: "hidden",
      marginBottom: 24,
      backgroundColor: colors.bgSurface,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: "center",
    },
    tabActive: {
      backgroundColor: colors.blue,
    },
    tabText: {
      fontFamily: Fonts.sansBold,
      fontSize: 12,
      color: colors.textDim,
      letterSpacing: isNormal ? 0.3 : 1.5,
    },
    tabTextActive: {
      color: "#fff",
    },
    form: {
      marginBottom: 28,
    },
    summaryBox: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
      padding: 16,
      borderRadius: isNormal ? 14 : 2,
      backgroundColor: isNormal ? colors.bgSurface : "rgba(10,108,245,0.06)",
      borderWidth: 1,
      borderColor: colors.borderDim,
      marginBottom: 20,
    },
    summaryItem: {
      alignItems: "center",
      gap: 3,
    },
    summaryVal: {
      fontFamily: Fonts.mono,
      fontSize: 20,
      color: colors.blue,
    },
    summaryKey: {
      fontFamily: Fonts.sansBold,
      fontSize: 9,
      color: colors.textMuted,
      letterSpacing: isNormal ? 0.3 : 1.5,
    },
    summaryDivider: {
      width: 1,
      height: 32,
      backgroundColor: colors.borderDim,
    },
    primaryBtn: {
      backgroundColor: colors.blue,
      paddingVertical: 15,
      borderRadius: isNormal ? 14 : 2,
      alignItems: "center",
    },
    primaryBtnDisabled: {
      opacity: 0.5,
    },
    primaryBtnText: {
      fontFamily: Fonts.sansBold,
      fontSize: 14,
      color: "#fff",
      letterSpacing: isNormal ? 0.5 : 2,
    },
    joinLabel: {
      fontFamily: Fonts.sansBold,
      fontSize: 10,
      color: colors.textDim,
      letterSpacing: isNormal ? 0.5 : 1.5,
      marginBottom: 10,
    },
    codeInputWrap: {
      borderWidth: 2,
      borderColor: colors.borderPrimary,
      borderRadius: isNormal ? 14 : 2,
      backgroundColor: colors.bgSurface,
      marginBottom: 14,
      overflow: "hidden",
    },
    codeInput: {
      fontFamily: Fonts.mono,
      fontSize: 36,
      color: colors.blue,
      paddingVertical: 16,
      paddingHorizontal: 20,
      textAlign: "center",
      letterSpacing: 10,
    },
    joinHint: {
      fontFamily: Fonts.sans,
      fontSize: 12,
      color: colors.textDim,
      textAlign: "center",
      lineHeight: 18,
      marginBottom: 16,
      letterSpacing: isNormal ? 0 : 0.3,
    },
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 14,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.borderFaint,
    },
    dividerText: {
      fontFamily: Fonts.sansBold,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: isNormal ? 0 : 1,
    },
  });
