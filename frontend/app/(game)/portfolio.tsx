import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert, useWindowDimensions, Animated,
} from "react-native";
import { useRouter } from "expo-router";
import Svg, { Polyline, Polygon, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import { usePortfolioStore } from "../../store/portfolioStore";
import {
  getPortfolio, claimDailyIncome, getNetWorthHistory, getRecentPlays,
  getNextCard, PortfolioData, NetWorthPoint, CardPlayData,
} from "../../services/portfolio";
import { Colors, useColors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { useThemeStore } from "../../store/themeStore";
import { ThemeModeToggle } from "../../components/theme/ThemeModeToggle";
import { AppTopBar } from "../../components/navigation/AppTopBar";

const RANK_LABELS = ["", "ANALYST", "ASSOCIATE", "VP", "MD"];
const BAND_COLORS: Record<string, string> = {
  red: "#d32f2f", green: "#2e7d32", amber: "#f57f17",
  purple: "#6a1b9a", steel_blue: "#1565c0",
};

function Sparkline({ data, width, height }: { data: NetWorthPoint[]; width: number; height: number }) {
  const colors = useColors();
  if (data.length < 2) {
    return (
      <View style={{ width, height, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 10, fontFamily: Fonts.mono, color: colors.textMuted, letterSpacing: 1 }}>
          PLAY CARDS TO BUILD NET WORTH HISTORY
        </Text>
      </View>
    );
  }

  const values = data.map((d) => d.net_worth);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 6;

  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (width - pad * 2);
    const y = pad + (1 - (v - min) / range) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const polyPoints = pts.join(" ");
  const firstX = pad;
  const lastX = pad + (width - pad * 2);
  const bottom = height - pad + 2;
  const fillPoints = `${firstX},${bottom} ${polyPoints} ${lastX},${bottom}`;

  const isUp = values[values.length - 1] >= values[0];
  const lineColor = isUp ? colors.green : colors.red;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <SvgGradient id="fill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={lineColor} stopOpacity="0.2" />
          <Stop offset="1" stopColor={lineColor} stopOpacity="0" />
        </SvgGradient>
      </Defs>
      <Polygon points={fillPoints} fill="url(#fill)" />
      <Polyline points={polyPoints} stroke={lineColor} strokeWidth={1.5} fill="none" />
    </Svg>
  );
}

function SectionHeader({ title }: { title: string }) {
  const colors = useColors();
  return (
    <View style={sh.row}>
      <View style={[sh.dot, { backgroundColor: colors.blue }]} />
      <Text style={[sh.title, { color: colors.blue }]}>{title}</Text>
    </View>
  );
}
const sh = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  dot: { width: 5, height: 5, borderRadius: 1, backgroundColor: Colors.blue },
  title: { fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.blue, letterSpacing: 2 },
});

export default function PortfolioScreen() {
  const router = useRouter();
  const colors = useColors();
  const isNormal = useThemeStore((state) => state.mode === "normal");
  const { setPortfolio, setCurrentCard } = usePortfolioStore();
  const { width } = useWindowDimensions();

  const [portfolio, setLocalPortfolio] = useState<PortfolioData | null>(null);
  const [history, setHistory] = useState<NetWorthPoint[]>([]);
  const [recentPlays, setRecentPlays] = useState<CardPlayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.55, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [p, h, plays] = await Promise.all([
        getPortfolio(),
        getNetWorthHistory(),
        getRecentPlays(10),
      ]);
      setLocalPortfolio(p);
      setPortfolio(p);
      setHistory(h);
      setRecentPlays(plays);
    } catch {
      Alert.alert("Error", "Could not load portfolio.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, []);

  const handleClaimIncome = async () => {
    if (!portfolio?.can_claim_income || claiming) return;
    setClaiming(true);
    try {
      const result = await claimDailyIncome();
      const updated = await getPortfolio();
      setLocalPortfolio(updated);
      setPortfolio(updated);
      Alert.alert(
        "INCOME RECEIVED",
        `${result.message}\nStreak: ${result.streak} day${result.streak !== 1 ? "s" : ""}`,
      );
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.detail ?? "Could not claim income.");
    } finally {
      setClaiming(false);
    }
  };

  const handlePlay = async () => {
    try {
      const card = await getNextCard();
      setCurrentCard(card);
      router.push("/(game)/play");
    } catch {
      Alert.alert("Error", "Could not load cards.");
    }
  };

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.blue} size="large" />
        <Text style={[styles.loadingText, { color: colors.textDim }]}>
          {isNormal ? "Loading your money picture..." : "LOADING PORTFOLIO"}
        </Text>
      </View>
    );
  }

  const p = portfolio!;
  const startingCapital = 10_000;
  const allTimeGain = p.net_worth - startingCapital;
  const isProfit = allTimeGain >= 0;
  const gainColor = isProfit ? colors.green : colors.red;
  const gainPrefix = isProfit ? "+" : "";
  const gainPct = ((allTimeGain / startingCapital) * 100);
  const chartW = Math.min(width - 40, 720);
  const isWide = width >= 760;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <AppTopBar
        label={isNormal ? "Portfolio" : "PORTFOLIO"}
        onBack={() => router.back()}
        rightContent={
          <>
            <ThemeModeToggle navSized />
            <TouchableOpacity style={[styles.playBtnSmall, { backgroundColor: colors.blue, borderRadius: isNormal ? 999 : 2 }]} onPress={handlePlay}>
              <Text style={[styles.playBtnSmallText, { color: colors.bg }]}>{isNormal ? "▶ Keep Learning" : "▶ PLAY CARDS"}</Text>
            </TouchableOpacity>
          </>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {isNormal ? (
          <View style={[styles.card, { backgroundColor: colors.bgPanel, borderColor: colors.borderDim, borderRadius: 18 }]}>
            <Text style={{ fontSize: 15, fontFamily: Fonts.sansBold, color: colors.textBright, marginBottom: 6 }}>
              Your money story at a glance
            </Text>
            <Text style={{ fontSize: 12, fontFamily: Fonts.sans, color: colors.textPrimary, lineHeight: 18 }}>
              Focus on three things here: how much you have now, whether you are growing over time, and what kinds of decisions are helping or hurting.
            </Text>
          </View>
        ) : null}

        {/* ── Net worth strip ── */}
        <View style={[styles.worthStrip, { backgroundColor: colors.bgPanel, borderColor: colors.borderDim, borderRadius: isNormal ? 20 : 2 }]}>
          <View style={[styles.worthBlock, { borderRightWidth: 1, borderRightColor: colors.borderDim }]}>
            <Text style={[styles.worthLabel, { color: colors.textMuted }]}>{isNormal ? "🏦 Total value" : "NET WORTH"}</Text>
            <Text style={[styles.worthValue, { color: colors.textBright }]}>
              ${p.net_worth.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={[styles.worthSub, { color: gainColor }]}>
              {gainPrefix}${Math.abs(allTimeGain).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              {"  "}({gainPrefix}{Math.abs(gainPct).toFixed(1)}%)
            </Text>
          </View>
          <View style={[styles.worthBlock, { borderRightWidth: 1, borderRightColor: colors.borderDim }]}>
            <Text style={[styles.worthLabel, { color: colors.textMuted }]}>{isNormal ? "💵 Cash" : "CAPITAL"}</Text>
            <Text style={[styles.worthValue, { color: colors.textBright }]}>
              ${p.capital.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={[styles.worthSub, { color: colors.textDim }]}>{isNormal ? "Ready to invest" : "AVAILABLE TO INVEST"}</Text>
          </View>
          <View style={styles.worthBlock}>
            <Text style={[styles.worthLabel, { color: colors.textMuted }]}>{isNormal ? "🏆 Best so far" : "PEAK NET WORTH"}</Text>
            <Text style={[styles.worthValue, { color: colors.textBright }]}>
              ${p.peak_net_worth.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </Text>
            <Text style={[styles.worthSub, { color: colors.textDim }]}>
              {isNormal
                ? `${p.total_cards_played} decisions made so far`
                : `STAGE ${p.stage}/5 · RANK ${p.investor_rank} — ${RANK_LABELS[p.investor_rank]}`}
            </Text>
          </View>
        </View>

        {/* ── Stats strip ── */}
        <View style={[styles.statsStrip, { backgroundColor: colors.bgPanel, borderColor: colors.borderDim, borderRadius: isNormal ? 20 : 2 }]}>
          <View style={[styles.statBlock, { borderRightWidth: 1, borderRightColor: colors.borderDim }]}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{isNormal ? "Choices made" : "CARDS PLAYED"}</Text>
            <Text style={[styles.statValue, { color: colors.textBright }]}>{p.total_cards_played}</Text>
          </View>
          <View style={[styles.statBlock, { borderRightWidth: 1, borderRightColor: colors.borderDim }]}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{isNormal ? "Income streak" : "INCOME STREAK"}</Text>
            <Text style={[styles.statValue, { color: colors.teal }]}>{p.income_streak}d</Text>
          </View>
          <View style={[styles.statBlock, { borderRightWidth: 1, borderRightColor: colors.borderDim }]}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{isNormal ? "Income earned" : "TOTAL RECEIVED"}</Text>
            <Text style={[styles.statValue, { color: colors.blue }]}>
              ${(p.total_income_received / 1000).toFixed(1)}k
            </Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{isNormal ? "Investor rank" : "INVESTOR RANK"}</Text>
            <Text style={[styles.statValue, { color: colors.textBright }]}>{p.investor_rank} / 4</Text>
          </View>
        </View>

        {/* ── Daily income claim ── */}
        {p.can_claim_income ? (
          <Animated.View style={[{ width: "100%", maxWidth: 720 }, { opacity: pulseAnim }]}>
            <TouchableOpacity
              style={[styles.incomeBtn, { backgroundColor: colors.green, borderRadius: isNormal ? 18 : 2 }]}
              onPress={handleClaimIncome}
              disabled={claiming}
            >
              {claiming ? (
                <ActivityIndicator color={colors.bg} size="small" />
              ) : (
                <>
                  <Text style={[styles.incomeBtnLabel, { color: colors.bg + "cc" }]}>{isNormal ? "Daily income ready" : "DAILY INCOME AVAILABLE"}</Text>
                  <Text style={[styles.incomeBtnAmount, { color: colors.bg }]}>
                    +${p.pending_income.toLocaleString("en-US", { maximumFractionDigits: 0 })}  ·  TAP TO CLAIM
                  </Text>
                  <Text style={[styles.incomeStreak, { color: colors.bg + "bb" }]}>
                    {p.income_streak > 0 ? `${p.income_streak}-DAY STREAK BONUS INCLUDED` : "FIRST CLAIM — START YOUR STREAK"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={[styles.incomeClaimed, { backgroundColor: colors.bgPanel, borderColor: colors.borderFaint, borderRadius: isNormal ? 18 : 2 }]}>
            <Text style={[styles.incomeClaimedText, { color: colors.textMuted }]}>
              {isNormal ? "✓ Daily income claimed · next one tomorrow" : "✓  DAILY INCOME CLAIMED  ·  NEXT AVAILABLE TOMORROW"}
            </Text>
            <Text style={[styles.incomeClaimedSub, { color: colors.textMuted }]}>
              {isNormal
                ? `Streak: ${p.income_streak} days · Base: $500 · Bonus: $${100 * (p.stage - 1)}`
                : `STREAK: ${p.income_streak} DAYS  ·  BASE: $500  ·  STAGE BONUS: $${100 * (p.stage - 1)}`}
            </Text>
          </View>
        )}

        {/* ── Net worth history ── */}
        <View style={[styles.card, { backgroundColor: colors.bgPanel, borderColor: colors.borderDim, borderRadius: isNormal ? 18 : 2 }]}>
          <SectionHeader title="NET WORTH HISTORY" />
          <Sparkline data={history} width={chartW - 32} height={100} />
          {history.length >= 2 && (
            <View style={styles.chartFooter}>
              <Text style={styles.chartFooterText}>CARD 1</Text>
              <Text style={styles.chartFooterText}>{history.length} PLAYS</Text>
              <Text style={styles.chartFooterText}>CARD {history.length}</Text>
            </View>
          )}
        </View>

        {/* ── Progress ── */}
        <View style={[styles.rowCards, isWide && { flexDirection: "row" }]}>
          <View style={[styles.card, { backgroundColor: colors.bgPanel, borderColor: colors.borderDim, borderRadius: isNormal ? 18 : 2 }, isWide && { flex: 1 }]}>
            <SectionHeader title="LEARNING STAGE" />
            <View style={styles.stageRow}>
              <Text style={styles.stageBig}>STAGE {p.stage}</Text>
              <Text style={styles.stageOf}>/ 5</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, {
                width: `${Math.min(((p.total_cards_played % 20) / 20) * 100, 100)}%`
              }]} />
            </View>
            <Text style={styles.progressHint}>
              {20 - (p.total_cards_played % 20)} cards until Stage {Math.min(p.stage + 1, 5)}
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.bgPanel, borderColor: colors.borderDim, borderRadius: isNormal ? 18 : 2 }, isWide && { flex: 1 }]}>
            <SectionHeader title="INCOME BREAKDOWN" />
            <View style={styles.incomeBreakdown}>
              <View style={styles.incomeLine}>
                <Text style={[styles.incomeLineLabel, { color: colors.textDim }]}>Base salary</Text>
                <Text style={[styles.incomeLineValue, { color: colors.textBright }]}>$500 / day</Text>
              </View>
              <View style={styles.incomeLine}>
                <Text style={[styles.incomeLineLabel, { color: colors.textDim }]}>Stage bonus (×{p.stage - 1})</Text>
                <Text style={[styles.incomeLineValue, { color: colors.textBright }]}>+${100 * (p.stage - 1)} / day</Text>
              </View>
              <View style={styles.incomeLine}>
                <Text style={[styles.incomeLineLabel, { color: colors.textDim }]}>Streak bonus ({p.income_streak}d)</Text>
                <Text style={[styles.incomeLineValue, { color: colors.teal }]}>
                  +${Math.min(p.income_streak * 25, 250)} / day
                </Text>
              </View>
              <View style={[styles.incomeLine, styles.incomeTotal]}>
                <Text style={[styles.incomeTotalLabel, { color: colors.textDim }]}>TODAY'S INCOME</Text>
                <Text style={[styles.incomeTotalValue, { color: colors.green }]}>
                  ${p.pending_income.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Recent decisions ── */}
        {recentPlays.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.bgPanel, borderColor: colors.borderDim, borderRadius: isNormal ? 18 : 2 }]}>
            <SectionHeader title="RECENT DECISIONS" />
            {recentPlays.map((play) => {
              const bandColor = BAND_COLORS[play.card?.card_band_color ?? "steel_blue"] ?? colors.blue;
              const accepted = play.action === "right";
              const capChange = play.capital_after - play.capital_before;
              const changeColor = capChange >= 0 ? colors.green : colors.red;
              return (
                <View key={play.id} style={[styles.playRow, { borderTopColor: colors.borderFaint }]}>
                  <View style={[styles.playBand, { backgroundColor: bandColor }]} />
                  <Text style={styles.playEmoji}>{play.card?.emoji ?? "•"}</Text>
                  <View style={styles.playMeta}>
                    <Text style={[styles.playTitle, { color: colors.textBright, fontFamily: isNormal ? Fonts.sansBold : Fonts.mono }]} numberOfLines={1}>
                      {play.card?.title ?? "Unknown Card"}
                    </Text>
                    <Text style={[styles.playTime, { color: colors.textMuted }]}>
                      {new Date(play.created_at).toLocaleString("en-US", {
                        month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </Text>
                  </View>
                  <View style={styles.playRight}>
                    <Text style={[styles.playVerdict, { color: accepted ? colors.green : colors.textDim }]}>
                      {accepted ? "✓ ACCEPTED" : "✗ DECLINED"}
                    </Text>
                    <Text style={[styles.playChange, { color: changeColor }]}>
                      {capChange >= 0 ? "+" : ""}${capChange.toFixed(2)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loading: { flex: 1, backgroundColor: Colors.bg, alignItems: "center", justifyContent: "center", gap: 14 },
  loadingText: { fontSize: 10, fontFamily: Fonts.mono, color: Colors.textDim, letterSpacing: 2 },

  topBar: {
    height: 40, backgroundColor: Colors.bgPanel,
    borderBottomWidth: 1, borderBottomColor: Colors.borderPrimary,
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 10,
  },
  backText: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 1.5 },
  logo: { fontSize: 13, fontFamily: Fonts.mono, color: Colors.blue, letterSpacing: 3 },
  barSep: { width: 1, height: 14, backgroundColor: Colors.borderDim },
  topLabel: { fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 2 },
  playBtnSmall: {
    backgroundColor: Colors.blue, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 2,
  },
  playBtnSmallText: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.bg, letterSpacing: 1.5 },

  topBtn: {
    backgroundColor: Colors.borderDim, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 2,
  },
  topBtnText: { fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 1.5 },

  scroll: { padding: 20, gap: 14, alignItems: "center" },

  worthStrip: {
    width: "100%", maxWidth: 720, flexDirection: "row",
    backgroundColor: Colors.bgPanel,
    borderWidth: 1, borderColor: Colors.borderDim, borderRadius: 2,
  },
  worthBlock: { flex: 1, padding: 18 },
  worthLabel: { fontSize: 7, fontFamily: Fonts.sansBold, color: Colors.textMuted, letterSpacing: 2, marginBottom: 5 },
  worthValue: { fontSize: 22, fontFamily: Fonts.mono, color: Colors.textBright, letterSpacing: 0.5 },
  worthSub: { fontSize: 10, fontFamily: Fonts.mono, color: Colors.textDim, marginTop: 3 },

  statsStrip: {
    width: "100%", maxWidth: 720, flexDirection: "row",
    backgroundColor: Colors.bgPanel,
    borderWidth: 1, borderColor: Colors.borderDim, borderRadius: 2,
  },
  statBlock: { flex: 1, padding: 14, alignItems: "center" },
  statLabel: { fontSize: 7, fontFamily: Fonts.sansBold, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 4 },
  statValue: { fontSize: 16, fontFamily: Fonts.mono, color: Colors.textBright },

  incomeBtn: {
    backgroundColor: Colors.green, borderRadius: 2, padding: 18,
    alignItems: "center", gap: 4,
  },
  incomeBtnLabel: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.bg + "cc", letterSpacing: 2 },
  incomeBtnAmount: { fontSize: 20, fontFamily: Fonts.mono, color: Colors.bg, letterSpacing: 1 },
  incomeStreak: { fontSize: 9, fontFamily: Fonts.mono, color: Colors.bg + "bb", letterSpacing: 1 },
  incomeClaimed: {
    width: "100%", maxWidth: 720,
    backgroundColor: Colors.bgPanel, borderWidth: 1, borderColor: Colors.borderFaint, borderRadius: 2,
    padding: 14, alignItems: "center", gap: 4,
  },
  incomeClaimedText: { fontSize: 10, fontFamily: Fonts.sansBold, color: Colors.textMuted, letterSpacing: 1.5 },
  incomeClaimedSub: { fontSize: 9, fontFamily: Fonts.mono, color: Colors.textMuted },

  card: {
    width: "100%", maxWidth: 720,
    backgroundColor: Colors.bgPanel,
    borderWidth: 1, borderColor: Colors.borderDim, borderRadius: 2,
    padding: 16,
  },
  chartFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  chartFooterText: { fontSize: 8, fontFamily: Fonts.mono, color: Colors.textMuted, letterSpacing: 1 },

  rowCards: { width: "100%", maxWidth: 720, gap: 14 },

  stageRow: { flexDirection: "row", alignItems: "baseline", gap: 4, marginBottom: 10 },
  stageBig: { fontSize: 24, fontFamily: Fonts.mono, color: Colors.textBright },
  stageOf: { fontSize: 14, fontFamily: Fonts.mono, color: Colors.textMuted },
  progressTrack: { height: 6, backgroundColor: Colors.borderDim, borderRadius: 1, marginBottom: 6 },
  progressFill: { height: "100%", backgroundColor: Colors.blue, borderRadius: 1 },
  progressHint: { fontSize: 9, fontFamily: Fonts.sans, color: Colors.textMuted },

  incomeBreakdown: { gap: 8 },
  incomeLine: { flexDirection: "row", justifyContent: "space-between" },
  incomeLineLabel: { fontSize: 11, fontFamily: Fonts.sans, color: Colors.textDim },
  incomeLineValue: { fontSize: 11, fontFamily: Fonts.mono, color: Colors.textBright },
  incomeTotal: {
    borderTopWidth: 1, borderTopColor: Colors.borderFaint, paddingTop: 8, marginTop: 4,
  },
  incomeTotalLabel: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 1.5 },
  incomeTotalValue: { fontSize: 16, fontFamily: Fonts.mono },

  playRow: {
    flexDirection: "row", alignItems: "center",
    borderTopWidth: 1, borderTopColor: Colors.borderFaint, paddingVertical: 10, gap: 10,
  },
  playBand: { width: 3, minHeight: 36, borderRadius: 1 },
  playEmoji: { fontSize: 18, width: 24 },
  playMeta: { flex: 1 },
  playTitle: { fontSize: 12, fontFamily: Fonts.mono, color: Colors.textBright },
  playTime: { fontSize: 9, fontFamily: Fonts.mono, color: Colors.textMuted, marginTop: 2 },
  playRight: { alignItems: "flex-end", gap: 2 },
  playVerdict: { fontSize: 9, fontFamily: Fonts.sansBold, letterSpacing: 1.5 },
  playChange: { fontSize: 11, fontFamily: Fonts.mono },
});
