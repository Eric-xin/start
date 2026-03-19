import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { FloatingPanel } from "./FloatingPanel";
import { getNewsFeed, formatRelativeTime, type NewsItem } from "../../services/gameHud";
import { useColors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { useThemeStore } from "../../store/themeStore";

const CATEGORY_LABEL: Record<string, string> = {
  inflation: "Prices",
  rate_hike: "Rates up",
  rate_cut: "Rates down",
  market_crash: "Risk off",
  market_rally: "Market rally",
  crypto_volatility: "Crypto",
  gold_move: "Gold",
  tech_move: "Tech",
  recession_fear: "Economy",
  commodity: "Commodities",
  bond_market: "Bonds",
  geopolitical: "World news",
};

function sentimentColor(sentiment: string, colors: ReturnType<typeof useColors>) {
  if (sentiment === "bullish") return colors.green;
  if (sentiment === "bearish") return colors.red;
  return colors.amber;
}

function urgencyColor(urgency: string, colors: ReturnType<typeof useColors>) {
  if (urgency === "high") return colors.red;
  if (urgency === "medium") return colors.blue;
  return colors.textMuted;
}

function urgencyLabel(urgency: string, isNormal: boolean) {
  if (isNormal) {
    if (urgency === "high") return "⚡ Big deal";
    if (urgency === "medium") return "👀 Worth watching";
    return "🧩 Background";
  }
  if (urgency === "high") return "BREAKING";
  if (urgency === "medium") return "DEVELOPING";
  return "BACKGROUND";
}

function sentimentLabel(sentiment: string, isNormal: boolean) {
  if (isNormal) {
    if (sentiment === "bullish") return "Good for markets";
    if (sentiment === "bearish") return "Risky for markets";
    return "Mixed effect";
  }
  return sentiment.toUpperCase();
}

function NewsCard({
  item,
  isExpanded,
  onToggle,
}: {
  item: NewsItem;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const colors = useColors();
  const isNormal = useThemeStore((state) => state.mode === "normal");
  const styles = createCardStyles(colors, isNormal);
  const impactColor = sentimentColor(item.sentiment, colors);
  const badgeColor = urgencyColor(item.urgency, colors);

  return (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.8} style={[styles.container, isExpanded && styles.expanded]}>
      <View style={[styles.stripe, { backgroundColor: impactColor }]} />

      <View style={styles.content}>
        <View style={styles.meta}>
          <View style={[styles.urgencyBadge, { borderColor: badgeColor, backgroundColor: badgeColor + "12" }]}>
            <Text style={[styles.urgencyText, { color: badgeColor }]}>
              {urgencyLabel(item.urgency, isNormal)}
            </Text>
          </View>
          <Text style={styles.category}>
            {CATEGORY_LABEL[item.category] ?? item.category}
          </Text>
          <Text style={styles.time}>{formatRelativeTime(item.timestamp)}</Text>
        </View>

        <Text style={styles.headline} numberOfLines={isExpanded ? undefined : isNormal ? 3 : 2}>
          {item.headline}
        </Text>

        <Text style={[styles.summary, { color: impactColor }]}>
          {sentimentLabel(item.sentiment, isNormal)}
        </Text>

        {isExpanded ? (
          <Text style={styles.body}>{item.body}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function NewsPanel({ visible, onClose }: Props) {
  const colors = useColors();
  const isNormal = useThemeStore((state) => state.mode === "normal");
  const styles = createStyles(colors, isNormal);
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    setError(null);
    setExpandedId(null);
    getNewsFeed()
      .then((r) => setItems(r.items))
      .catch(() => setError("Unable to load news feed."))
      .finally(() => setLoading(false));
  }, [visible]);

  return (
    <FloatingPanel
      visible={visible}
      title={isNormal ? "📰 What's Moving Markets?" : "MARKET INTELLIGENCE"}
      subtitle={isNormal ? "Tap a story to read the simple version" : "TAP HEADLINE TO EXPAND"}
      onClose={onClose}
      width={640}
      height={600}
    >
      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.blue} />
          <Text style={styles.loadingText}>{isNormal ? "Checking today's stories..." : "SCANNING FEEDS..."}</Text>
        </View>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
      {items && !loading && (
        <>
          {isNormal ? (
            <View style={styles.helperCard}>
              <Text style={styles.helperTitle}>How to read this</Text>
              <Text style={styles.helperText}>Each story shows whether it could help, hurt, or shake the market. Start with the headline, then expand anything you want explained in plain language.</Text>
            </View>
          ) : (
            <View style={styles.legend}>
              {[
                { color: colors.green, label: "BULLISH" },
                { color: colors.red, label: "BEARISH" },
                { color: colors.amber, label: "MIXED" },
              ].map(({ color, label }) => (
                <View key={label} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: color }]} />
                  <Text style={styles.legendText}>{label}</Text>
                </View>
              ))}
            </View>
          )}
          {items.map((item) => (
            <NewsCard
              key={item.id}
              item={item}
              isExpanded={expandedId === item.id}
              onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
            />
          ))}
          <Text style={styles.footnote}>
            {isNormal
              ? "These stories are part of the simulation and are meant to help you practice reading market signals."
              : "Intelligence generated from upcoming market event analysis · For educational simulation only"}
          </Text>
        </>
      )}
    </FloatingPanel>
  );
}

const createCardStyles = (colors: ReturnType<typeof useColors>, isNormal: boolean) => StyleSheet.create({
  container: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.borderFaint,
    borderRadius: isNormal ? 18 : 2,
    marginBottom: 10,
    backgroundColor: isNormal ? colors.bgPanel : colors.bgCard,
    overflow: "hidden",
  },
  expanded: {
    borderColor: colors.borderDim,
  },
  stripe: {
    width: isNormal ? 6 : 3,
    minHeight: isNormal ? 92 : 56,
  },
  content: {
    flex: 1,
    padding: isNormal ? 14 : 10,
    gap: isNormal ? 8 : 5,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  urgencyBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  urgencyText: {
    fontSize: isNormal ? 10 : 7,
    fontFamily: Fonts.sansBold,
    letterSpacing: isNormal ? 0.2 : 1,
  },
  category: {
    fontSize: isNormal ? 11 : 8,
    fontFamily: isNormal ? Fonts.sansBold : Fonts.mono,
    color: colors.textDim,
    flex: 1,
  },
  time: {
    fontSize: isNormal ? 11 : 8,
    fontFamily: Fonts.mono,
    color: colors.textMuted,
  },
  headline: {
    fontSize: isNormal ? 17 : 12,
    fontFamily: Fonts.sansBold,
    color: colors.textBright,
    lineHeight: isNormal ? 24 : 17,
  },
  summary: {
    fontSize: isNormal ? 12 : 10,
    fontFamily: Fonts.sansBold,
  },
  body: {
    fontSize: isNormal ? 14 : 10,
    fontFamily: Fonts.sans,
    color: colors.textPrimary,
    lineHeight: isNormal ? 21 : 15,
    marginTop: 2,
  },
});

const createStyles = (colors: ReturnType<typeof useColors>, isNormal: boolean) => StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 40 },
  loadingText: { fontSize: 10, fontFamily: Fonts.mono, color: colors.textDim, letterSpacing: 2 },
  errorText: { fontSize: 11, fontFamily: Fonts.sans, color: colors.red, textAlign: "center", paddingVertical: 24 },
  legend: { flexDirection: "row", gap: 16, marginBottom: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { fontSize: 8, fontFamily: Fonts.sansBold, color: colors.textMuted, letterSpacing: 1 },
  helperCard: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.borderDim,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  helperTitle: {
    fontSize: 14,
    fontFamily: Fonts.sansBold,
    color: colors.textBright,
    marginBottom: 6,
  },
  helperText: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    lineHeight: 19,
    color: colors.textPrimary,
  },
  footnote: { fontSize: 8, fontFamily: Fonts.sans, color: colors.textMuted, marginTop: 8, lineHeight: 13 },
});
