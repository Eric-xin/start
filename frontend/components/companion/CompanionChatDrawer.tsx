import React, { useMemo, useState } from "react";
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { COMPANIONS, type CompanionId } from "../../constants/companions";
import { useColors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { useCompanionStore } from "../../store/companionStore";
import { askCompanion, type CompanionChatContext } from "../../services/companionChat";

interface Props {
  companionId: CompanionId;
  context: CompanionChatContext;
}

export function CompanionChatDrawer({ companionId, context }: Props) {
  const colors = useColors();
  const styles = createStyles(colors);
  const companion = COMPANIONS[companionId];
  const llmMode = useCompanionStore((state) => state.llmMode);
  const llmLoading = useCompanionStore((state) => state.llmLoading);
  const llmMessages = useCompanionStore((state) => state.llmMessages);
  const articles = useCompanionStore((state) => state.articles);
  const closeLLM = useCompanionStore((state) => state.closeLLM);
  const setLLMLoading = useCompanionStore((state) => state.setLLMLoading);
  const addLLMMessage = useCompanionStore((state) => state.addLLMMessage);
  const setArticles = useCompanionStore((state) => state.setArticles);
  const [input, setInput] = useState("");

  const displayMessages = useMemo(() => llmMessages.slice(-10), [llmMessages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || llmLoading) return;

    setInput("");
    addLLMMessage({ role: "user", content: trimmed });
    setLLMLoading(true);
    try {
      const result = await askCompanion(companionId, trimmed, context);
      addLLMMessage({ role: "assistant", content: result.reply });
      setArticles(result.articles);
    } catch {
      addLLMMessage({
        role: "assistant",
        content: "I hit a snag reaching the research tools just now. Try again in a moment.",
      });
      setArticles([]);
    } finally {
      setLLMLoading(false);
    }
  };

  return (
    <Modal visible={llmMode} transparent animationType="fade" onRequestClose={closeLLM}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{companion.emoji} {companion.name}</Text>
            <Pressable onPress={closeLLM}>
              <Text style={styles.close}>Close</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.history} contentContainerStyle={styles.historyContent}>
            {displayMessages.length === 0 ? (
              <Text style={styles.empty}>Ask about the current card, the market, or the bigger idea behind the lesson.</Text>
            ) : (
              displayMessages.map((message, index) => (
                <View
                  key={`${message.role}-${index}`}
                  style={[
                    styles.message,
                    message.role === "user" ? styles.userMessage : styles.assistantMessage,
                  ]}
                >
                  <Text style={styles.messageRole}>{message.role === "user" ? "You" : companion.name}</Text>
                  <Text style={styles.messageText}>{message.content}</Text>
                </View>
              ))
            )}

            {articles.length > 0 ? (
              <View style={styles.articleBlock}>
                <Text style={styles.articleTitle}>Related articles</Text>
                {articles.map((article) => (
                  <Pressable key={article.url} onPress={() => Linking.openURL(article.url)}>
                    <Text style={styles.articleLink}>• {article.title}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.inputRow}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={`Ask ${companion.name} anything...`}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              editable={!llmLoading}
              onSubmitEditing={handleSend}
            />
            <Pressable
              onPress={handleSend}
              disabled={llmLoading}
              style={[styles.sendBtn, { backgroundColor: companion.accentColor, opacity: llmLoading ? 0.6 : 1 }]}
            >
              <Text style={styles.sendText}>{llmLoading ? "..." : "Send →"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(10, 14, 24, 0.32)",
  },
  sheet: {
    height: "52%",
    backgroundColor: colors.bgPanel,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
    padding: 18,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.sansBold,
    color: colors.textBright,
  },
  close: {
    fontSize: 12,
    fontFamily: Fonts.sansBold,
    color: colors.textDim,
  },
  history: {
    flex: 1,
    marginTop: 12,
  },
  historyContent: {
    gap: 10,
    paddingBottom: 12,
  },
  empty: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Fonts.sans,
    color: colors.textDim,
  },
  message: {
    borderRadius: 16,
    padding: 12,
  },
  userMessage: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.borderDim,
  },
  assistantMessage: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
  },
  messageRole: {
    fontSize: 11,
    fontFamily: Fonts.sansBold,
    color: colors.textDim,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Fonts.sans,
    color: colors.textBright,
  },
  articleBlock: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderFaint,
  },
  articleTitle: {
    fontSize: 12,
    fontFamily: Fonts.sansBold,
    color: colors.textBright,
    marginBottom: 6,
  },
  articleLink: {
    fontSize: 12,
    lineHeight: 19,
    fontFamily: Fonts.sans,
    color: colors.blue,
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginTop: 12,
  },
  input: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderDim,
    backgroundColor: colors.bg,
    paddingHorizontal: 14,
    color: colors.textBright,
    fontFamily: Fonts.sans,
  },
  sendBtn: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sendText: {
    fontSize: 12,
    fontFamily: Fonts.sansBold,
    color: "#fff",
  },
});
