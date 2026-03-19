import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { FloatingPanel } from "./FloatingPanel";
import { getNewsFeed, formatRelativeTime, type NewsItem } from "../../services/gameHud";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";

const SENTIMENT_COLOR: Record<string, string> = {
  bullish: Colors.green,
  bearish: Colors.red,
  mixed: Colors.amber,
};

const URGENCY_COLOR: Record<string, string> = {
  high: Colors.red,
  medium: Colors.blue,
  low: Colors.textMuted,
};

const URGENCY_LABEL: Record<string, string> = {
  high: "BREAKING",
  medium: "DEVELOPING",
  low: "BACKGROUND",
};

const CATEGORY_LABEL: Record<string, string> = {
  inflation: "INFLATION",
  rate_hike: "RATES ↑",
  rate_cut: "RATES ↓",
  market_crash: "RISK-OFF",
  market_rally: "RISK-ON",
  crypto_volatility: "CRYPTO",
  gold_move: "GOLD / PM",
  tech_move: "TECH",
  recession_fear: "MACRO",
  commodity: "COMMODITIES",
  bond_market: "FIXED INCOME",
  geopolitical: "GEO-POLITICAL",
};

function NewsCard({ item, isExpanded, onToggle }: {
  item: NewsItem;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const sentimentColor = SENTIMENT_COLOR[item.sentiment] ?? Colors.textDim;
  const urgencyColor = URGENCY_COLOR[item.urgency] ?? Colors.textMuted;

  return (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.75} style={[card.container, isExpanded && card.expanded]}>
      {/* Left sentiment stripe */}
      <View style={[card.stripe, { backgroundColor: sentimentColor }]} />

      <View style={card.content}>
        {/* Meta row */}
        <View style={card.meta}>
          <View style={[card.urgencyBadge, { borderColor: urgencyColor }]}>
            <Text style={[card.urgencyText, { color: urgencyColor }]}>
              {URGENCY_LABEL[item.urgency] ?? item.urgency.toUpperCase()}
            </Text>
          </View>
          <Text style={card.category}>
            {CATEGORY_LABEL[item.category] ?? item.category.toUpperCase()}
          </Text>
          <Text style={card.time}>{formatRelativeTime(item.timestamp)}</Text>
          <View style={[card.dot, { backgroundColor: sentimentColor }]} />
        </View>

        {/* Headline */}
        <Text style={card.headline} numberOfLines={isExpanded ? undefined : 2}>{item.headline}</Text>

        {/* Body — only shown when expanded */}
        {isExpanded && (
          <Text style={card.body}>{item.body}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const card = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: Colors.borderFaint,
    borderRadius: 2,
    marginBottom: 8,
    backgroundColor: Colors.bgCard,
    overflow: "hidden",
  },
  expanded: {
    borderColor: Colors.borderDim,
  },
  stripe: {
    width: 3,
    minHeight: 56,
  },
  content: {
    flex: 1,
    padding: 10,
    gap: 5,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  urgencyBadge: {
    borderWidth: 1,
    borderRadius: 1,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  urgencyText: {
    fontSize: 7,
    fontFamily: Fonts.sansBold,
    letterSpacing: 1,
  },
  category: {
    fontSize: 8,
    fontFamily: Fonts.mono,
    color: Colors.textDim,
    letterSpacing: 0.5,
    flex: 1,
  },
  time: {
    fontSize: 8,
    fontFamily: Fonts.mono,
    color: Colors.textMuted,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  headline: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
    color: Colors.textBright,
    lineHeight: 17,
  },
  body: {
    fontSize: 10,
    fontFamily: Fonts.sans,
    color: Colors.textPrimary,
    lineHeight: 15,
    marginTop: 2,
  },
});

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function NewsPanel({ visible, onClose }: Props) {
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
      title="MARKET INTELLIGENCE"
      subtitle="TAP HEADLINE TO EXPAND"
      onClose={onClose}
      width={620}
      height={560}
    >
      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.blue} />
          <Text style={styles.loadingText}>SCANNING FEEDS...</Text>
        </View>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
      {items && !loading && (
        <>
          <View style={styles.legend}>
            {[
              { color: Colors.green, label: "BULLISH" },
              { color: Colors.red, label: "BEARISH" },
              { color: Colors.amber, label: "MIXED" },
            ].map(({ color, label }) => (
              <View key={label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: color }]} />
                <Text style={styles.legendText}>{label}</Text>
              </View>
            ))}
          </View>
          {items.map((item) => (
            <NewsCard
              key={item.id}
              item={item}
              isExpanded={expandedId === item.id}
              onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
            />
          ))}
          <Text style={styles.footnote}>
            Intelligence generated from upcoming market event analysis · For educational simulation only
          </Text>
        </>
      )}
    </FloatingPanel>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 40 },
  loadingText: { fontSize: 10, fontFamily: Fonts.mono, color: Colors.textDim, letterSpacing: 2 },
  errorText: { fontSize: 11, fontFamily: Fonts.sans, color: Colors.red, textAlign: "center", paddingVertical: 24 },
  legend: { flexDirection: "row", gap: 16, marginBottom: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.textMuted, letterSpacing: 1 },
  footnote: { fontSize: 8, fontFamily: Fonts.sans, color: Colors.textMuted, marginTop: 8, lineHeight: 13 },
});
