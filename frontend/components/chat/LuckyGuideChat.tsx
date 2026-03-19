import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from "react-native";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { useGameStore } from "../../store/gameStore";
import { usePortfolioStore } from "../../store/portfolioStore";
import { explainTerm } from "../../services/chat";

type Message = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

const QUICK_PROMPTS = [
  "What is inflation in simple words?",
  "I am new. What is a stock?",
  "What does diversification mean?",
  "Explain this card",
  "What is risk in investing?",
];

function LuckyMascot() {
  const bob = useRef(new Animated.Value(0)).current;
  const blink = useRef(new Animated.Value(1)).current;
  const coinWiggle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -2, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 2, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );

    const blinkLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(2400),
        Animated.timing(blink, { toValue: 0.1, duration: 90, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 110, useNativeDriver: true }),
      ])
    );

    const wiggleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(coinWiggle, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(coinWiggle, { toValue: -1, duration: 420, useNativeDriver: true }),
        Animated.timing(coinWiggle, { toValue: 0, duration: 420, useNativeDriver: true }),
        Animated.delay(1600),
      ])
    );

    bobLoop.start();
    blinkLoop.start();
    wiggleLoop.start();

    return () => {
      bobLoop.stop();
      blinkLoop.stop();
      wiggleLoop.stop();
    };
  }, [blink, bob, coinWiggle]);

  const wiggleRotate = coinWiggle.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-6deg", "6deg"],
  });

  return (
    <Animated.View style={[styles.mascotWrap, { transform: [{ translateY: bob }] }]}>
      <View style={styles.hatBrim} />
      <View style={styles.hatCrown} />
      <View style={styles.hatBand} />

      <View style={styles.mascotHead}>
        <View style={styles.eyeRow}>
          <Animated.View style={[styles.eye, { transform: [{ scaleY: blink }] }]} />
          <Animated.View style={[styles.eye, { transform: [{ scaleY: blink }] }]} />
        </View>
        <View style={styles.blushRow}>
          <View style={styles.blush} />
          <View style={styles.blush} />
        </View>
        <View style={styles.smile} />
      </View>

      <View style={styles.potWrap}>
        <View style={styles.pot} />
        <Animated.Text style={[styles.coins, { transform: [{ rotate: wiggleRotate }] }]}>🪙🪙</Animated.Text>
      </View>
    </Animated.View>
  );
}

export function LuckyGuideChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hey, I am Lucky. Ask me anything about money words, even super basic questions. I will keep it simple and friendly.",
    },
  ]);
  const scrollRef = useRef<ScrollView>(null);

  const gameCard = useGameStore((s) => s.currentCard);
  const portfolioCard = usePortfolioStore((s) => s.currentCard);
  const cardContext = gameCard || portfolioCard;

  const stage = useMemo(() => {
    const candidate = (gameCard?.stage_min ?? portfolioCard?.stage_min) || 1;
    return Math.max(1, Math.min(5, candidate));
  }, [gameCard?.stage_min, portfolioCard?.stage_min]);

  const submit = async (rawText: string) => {
    const question = rawText.trim();
    if (!question || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      text: question,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const payloadQuestion =
        question.toLowerCase() === "explain this card" && cardContext
          ? `Explain this card: ${cardContext.title}. ${cardContext.body}`
          : question;

      const resp = await explainTerm({
        question: payloadQuestion,
        stage,
        context: cardContext
          ? {
              title: cardContext.title,
              body: cardContext.body,
              topics: cardContext.topics,
            }
          : undefined,
      });

      const suggestionText =
        resp.suggestions.length > 0
          ? `\n\nTry also: ${resp.suggestions.slice(0, 3).join(" • ")}`
          : "";

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: `${resp.answer}${suggestionText}\n\n${resp.disclaimer}`,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 40);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const fallbackText = typeof detail === "string" ? detail : "I could not answer right now. Please try again.";
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          text: `${fallbackText}\n\nEducational only, not financial advice.`,
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 40);
    }
  };

  return (
    <View pointerEvents="box-none" style={styles.root}>
      {open && (
        <View style={styles.overlay} pointerEvents="box-none">
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <View style={styles.panel}>
              <View style={styles.header}>
                <LuckyMascot />
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>LUCKY GUIDE</Text>
                  <Text style={styles.subtitle}>Zero-knowledge friendly finance helper</Text>
                </View>
                <TouchableOpacity onPress={() => setOpen(false)} style={styles.closeBtn}>
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                ref={scrollRef}
                style={styles.messages}
                contentContainerStyle={styles.messagesContent}
                onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
              >
                {messages.map((m) => (
                  <View key={m.id} style={[styles.msgRow, m.role === "user" ? styles.msgRowUser : styles.msgRowAssistant]}>
                    <View style={[styles.bubble, m.role === "user" ? styles.bubbleUser : styles.bubbleAssistant]}>
                      <Text style={styles.bubbleText}>{m.text}</Text>
                    </View>
                  </View>
                ))}
                {loading && (
                  <View style={styles.loaderRow}>
                    <ActivityIndicator color={Colors.blue} size="small" />
                  </View>
                )}
              </ScrollView>

              <View style={styles.newbieHintWrap}>
                <Text style={styles.newbieHint}>No prior investing knowledge needed. Ask anything.</Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRow}>
                {QUICK_PROMPTS.map((prompt) => (
                  <TouchableOpacity key={prompt} style={styles.quickChip} onPress={() => submit(prompt)}>
                    <Text style={styles.quickChipText}>{prompt}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.inputRow}>
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder="Ask anything, like: What is inflation?"
                  placeholderTextColor={Colors.textMuted}
                  style={styles.input}
                  onSubmitEditing={() => submit(input)}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={[styles.sendBtn, (!input.trim() || loading) && { opacity: 0.5 }]}
                  onPress={() => submit(input)}
                  disabled={!input.trim() || loading}
                >
                  <Text style={styles.sendText}>ASK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setOpen((v) => !v)}>
        <Text style={styles.fabIcon}>🍀</Text>
        <Text style={styles.fabText}>Lucky</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "rgba(5,10,20,0.45)",
    paddingHorizontal: 12,
    paddingBottom: 90,
  },
  panel: {
    width: "100%",
    maxWidth: 520,
    maxHeight: "76%",
    backgroundColor: Colors.bgPanel,
    borderColor: "#2fbf71",
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDim,
  },
  title: {
    fontFamily: Fonts.mono,
    color: "#99f5b3",
    fontSize: 13,
    letterSpacing: 1.2,
  },
  subtitle: {
    fontFamily: Fonts.sans,
    color: Colors.textDim,
    fontSize: 11,
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: Colors.borderDim,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: Colors.textDim,
    fontSize: 14,
  },
  mascotWrap: {
    width: 62,
    height: 46,
    justifyContent: "center",
  },
  hatBrim: {
    position: "absolute",
    left: 4,
    top: 7,
    width: 31,
    height: 5,
    borderRadius: 4,
    backgroundColor: "#1f8a3f",
  },
  hatCrown: {
    position: "absolute",
    left: 10,
    top: 2,
    width: 18,
    height: 7,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor: "#33b35f",
  },
  hatBand: {
    position: "absolute",
    left: 12,
    top: 6,
    width: 14,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#ffd166",
  },
  mascotHead: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#64e08a",
    position: "absolute",
    left: 6,
    top: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#39b665",
  },
  eyeRow: { flexDirection: "row", gap: 7, marginTop: -3 },
  eye: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#092b13" },
  blushRow: {
    position: "absolute",
    top: 14,
    width: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  blush: {
    width: 4,
    height: 2,
    borderRadius: 2,
    backgroundColor: "#ffd6de",
  },
  smile: {
    width: 11,
    height: 4,
    borderBottomWidth: 1.5,
    borderBottomColor: "#092b13",
    borderRadius: 5,
    marginTop: 5,
  },
  potWrap: {
    position: "absolute",
    right: -1,
    bottom: 0,
    alignItems: "center",
  },
  pot: {
    width: 22,
    height: 13,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: "#223047",
    borderWidth: 1,
    borderColor: "#3a4d6d",
  },
  coins: {
    position: "absolute",
    top: -10,
    fontSize: 10,
  },
  newbieHintWrap: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderFaint,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#102018",
  },
  newbieHint: {
    fontFamily: Fonts.sans,
    fontSize: 10,
    color: "#9fd3a8",
  },
  messages: { maxHeight: 330 },
  messagesContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  msgRow: { flexDirection: "row" },
  msgRowUser: { justifyContent: "flex-end" },
  msgRowAssistant: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "88%",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
  },
  bubbleUser: {
    backgroundColor: Colors.blue + "22",
    borderColor: Colors.blueDim,
  },
  bubbleAssistant: {
    backgroundColor: Colors.bgSurface,
    borderColor: Colors.borderDim,
  },
  bubbleText: {
    fontFamily: Fonts.sans,
    color: Colors.textPrimary,
    fontSize: 12,
    lineHeight: 17,
  },
  loaderRow: {
    alignItems: "flex-start",
    paddingVertical: 4,
    paddingLeft: 4,
  },
  quickRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderFaint,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderFaint,
    paddingVertical: 8,
    paddingHorizontal: 10,
    maxHeight: 52,
  },
  quickChip: {
    borderWidth: 1,
    borderColor: "#2f6c4b",
    backgroundColor: "#123023",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
  },
  quickChipText: {
    fontSize: 10,
    color: "#b1e7bf",
    fontFamily: Fonts.sansBold,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    padding: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.borderDim,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: Platform.select({ ios: 9, android: 6, default: 8 }),
    color: Colors.textBright,
    fontFamily: Fonts.sans,
    backgroundColor: Colors.bgSurface,
    fontSize: 12,
  },
  sendBtn: {
    borderWidth: 1,
    borderColor: "#26c06d",
    backgroundColor: "#18462f",
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  sendText: {
    color: Colors.green,
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    letterSpacing: 1,
  },
  fab: {
    position: "absolute",
    right: 14,
    bottom: 18,
    borderWidth: 1,
    borderColor: "#2fbf71",
    backgroundColor: "#123523",
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
  },
  fabIcon: { fontSize: 14 },
  fabText: {
    fontFamily: Fonts.sansBold,
    color: "#9cffb9",
    fontSize: 11,
    letterSpacing: 0.8,
  },
});
