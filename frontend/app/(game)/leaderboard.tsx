import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Colors, useColors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { usePortfolioStore } from "../../store/portfolioStore";
import { useThemeStore } from "../../store/themeStore";
import { ThemeModeToggle } from "../../components/theme/ThemeModeToggle";
import { AppTopBar } from "../../components/navigation/AppTopBar";
import { LEADERBOARD_SEED } from "../../seeds/leaderboard";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatValue(n: number): string {
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000)     return "$" + (n / 1_000).toFixed(1) + "K";
  return "$" + n.toLocaleString("en-US");
}

function medalFor(rank: number): string | null {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  initials,
  size = 36,
  color,
  isYou,
}: {
  initials: string;
  size?: number;
  color: string;
  isYou?: boolean;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isYou ? color : colors.bgCard,
          borderWidth: isYou ? 0 : 1,
          borderColor: colors.borderDim,
          alignItems: "center",
          justifyContent: "center",
        },
      ]}
    >
      <Text
        style={{
          fontFamily: Fonts.sansBold,
          fontSize: size * 0.38,
          color: isYou ? "#fff" : colors.textDim,
          fontWeight: "700",
        }}
      >
        {initials}
      </Text>
    </View>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

interface RankedPlayer {
  id: string;
  name: string;
  initials: string;
  net_worth: number;
  rank: number;
  isYou: boolean;
}

function LeaderRow({ player, maxValue }: { player: RankedPlayer; maxValue: number }) {
  const colors = useColors();
  const { t } = useTranslation();
  const isNormal = useThemeStore((s) => s.mode === "normal");
  const medal = medalFor(player.rank);
  const barFraction = maxValue > 0 ? player.net_worth / maxValue : 0;

  const rowBg = player.isYou
    ? isNormal
      ? colors.blueDim
      : "#0a2040"
    : isNormal
    ? "#ffffff"
    : Colors.bgPanel;

  const rowBorder = player.isYou ? colors.blue : colors.borderFaint;

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: rowBg,
          borderColor: rowBorder,
          borderWidth: player.isYou ? 1.5 : 1,
        },
      ]}
    >
      {/* Rank */}
      <View style={styles.rankCol}>
        {medal ? (
          <Text style={styles.medal}>{medal}</Text>
        ) : (
          <Text style={[styles.rankNum, { color: colors.textDim }]}>
            {player.rank}
          </Text>
        )}
      </View>

      {/* Avatar + Name */}
      <Avatar
        initials={player.initials}
        size={34}
        color={colors.blue}
        isYou={player.isYou}
      />
      <View style={styles.nameBlock}>
        <Text style={[styles.name, { color: colors.textBright }]} numberOfLines={1}>
          {player.name}
          {player.isYou && (
            <Text style={[styles.youTag, { color: colors.blue }]}> · {t("leaderboard.you")}</Text>
          )}
        </Text>

        {/* Bar */}
        <View style={[styles.barTrack, { backgroundColor: colors.borderFaint }]}>
          <View
            style={[
              styles.barFill,
              {
                width: `${Math.max(barFraction * 100, 2)}%` as any,
                backgroundColor: player.isYou
                  ? colors.blue
                  : player.rank <= 3
                  ? colors.green
                  : colors.borderDim,
              },
            ]}
          />
        </View>
      </View>

      {/* Value */}
      <Text style={[styles.value, { color: player.isYou ? colors.blue : colors.green }]}>
        {formatValue(player.net_worth)}
      </Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function LeaderboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const isNormal = useThemeStore((s) => s.mode === "normal");
  const portfolio = usePortfolioStore((s) => s.portfolio);

  const userNetWorth: number = (portfolio as any)?.net_worth ?? 50_000;
  const userName: string    = (portfolio as any)?.companion_id
    ? "You"
    : "You";

  const ranked = useMemo<RankedPlayer[]>(() => {
    const all = [
      ...LEADERBOARD_SEED.map((p) => ({ ...p, isYou: false })),
      { id: "you", name: userName, initials: "YO", net_worth: userNetWorth, isYou: true },
    ]
      .sort((a, b) => b.net_worth - a.net_worth)
      .map((p, i) => ({ ...p, rank: i + 1 }));
    return all;
  }, [userNetWorth, userName]);

  const you = ranked.find((p) => p.isYou)!;
  const maxValue = ranked[0]?.net_worth ?? 1;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push("/(game)");
    }
  };

  return (
    <View style={[styles.screen, isNormal && { backgroundColor: colors.bg }]}>

      <AppTopBar
        label={isNormal ? t("leaderboard.topBar") : t("leaderboard.topBarPro")}
        onBack={handleBack}
        rightContent={<ThemeModeToggle compact />}
      />

      {/* ── Your rank banner ───────────────────────────────────────────────── */}
      <View
        style={[
          styles.banner,
          {
            backgroundColor: isNormal ? colors.bgPanel : Colors.bgPanel,
            borderBottomColor: colors.borderFaint,
          },
        ]}
      >
        <View style={styles.bannerLeft}>
          <Text style={[styles.bannerLabel, { color: colors.textDim }]}>
            {isNormal ? t("leaderboard.positionNormal") : t("leaderboard.positionPro")}
          </Text>
          <Text style={[styles.bannerRank, { color: colors.blue }]}>
            {medalFor(you?.rank) ?? `#${you?.rank}`}{" "}
            <Text style={[styles.bannerRankOf, { color: colors.textDim }]}>
              {t("leaderboard.outOf", { count: ranked.length })}
            </Text>
          </Text>
        </View>
        <View style={styles.bannerRight}>
          <Text style={[styles.bannerLabel, { color: colors.textDim }]}>
            {isNormal ? t("leaderboard.valueNormal") : t("leaderboard.valuePro")}
          </Text>
          <Text style={[styles.bannerValue, { color: colors.green }]}>
            {formatValue(userNetWorth)}
          </Text>
        </View>
      </View>

      {/* ── List ───────────────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.listContent,
          isNormal && { backgroundColor: colors.bg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {ranked.map((p) => (
          <LeaderRow key={p.id} player={p} maxValue={maxValue} />
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },


  // Banner
  banner: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    backgroundColor: Colors.bgPanel,
    gap: 24,
  },
  bannerLeft: { flex: 1 },
  bannerRight: { flex: 1, alignItems: "flex-end" },
  bannerLabel: {
    fontSize: 9,
    fontFamily: Fonts.mono,
    color: Colors.textDim,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  bannerRank: {
    fontSize: 22,
    fontFamily: Fonts.sansBold,
    color: Colors.blue,
    fontWeight: "700",
  },
  bannerRankOf: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    color: Colors.textDim,
    fontWeight: "400",
  },
  bannerValue: {
    fontSize: 20,
    fontFamily: Fonts.mono,
    color: Colors.green,
    fontWeight: "600",
  },

  // List
  scroll: { flex: 1 },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    backgroundColor: Colors.bg,
  },

  // Row
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderFaint,
    backgroundColor: Colors.bgPanel,
  },
  rankCol: {
    width: 28,
    alignItems: "center",
  },
  medal: {
    fontSize: 18,
  },
  rankNum: {
    fontSize: 13,
    fontFamily: Fonts.mono,
    fontWeight: "600",
    color: Colors.textDim,
  },
  nameBlock: {
    flex: 1,
    gap: 5,
  },
  name: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    fontWeight: "500",
    color: Colors.textBright,
  },
  youTag: {
    fontSize: 11,
    fontFamily: Fonts.mono,
    color: Colors.blue,
    fontWeight: "600",
  },
  barTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.borderFaint,
    overflow: "hidden",
  },
  barFill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.green,
  },
  value: {
    fontSize: 13,
    fontFamily: Fonts.mono,
    fontWeight: "600",
    color: Colors.green,
    minWidth: 72,
    textAlign: "right",
  },

});
