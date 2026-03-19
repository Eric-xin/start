import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COMPANION_LIST, COMPANIONS, type CompanionId } from "../../constants/companions";
import { useColors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { useThemeStore } from "../../store/themeStore";
import { CompanionVisual } from "./CompanionVisual";

interface Props {
  visible: boolean;
  selectedId?: CompanionId | null;
  onClose: () => void;
  onConfirm: (id: CompanionId) => void;
}

export function CompanionSelector({
  visible,
  selectedId,
  onClose,
  onConfirm,
}: Props) {
  const colors = useColors();
  const isNormal = useThemeStore((state) => state.mode === "normal");
  const styles = createStyles(colors, isNormal);
  const initialId = selectedId ?? "sage";
  const [draftId, setDraftId] = useState<CompanionId>(initialId);

  useEffect(() => {
    if (visible) {
      setDraftId(selectedId ?? "sage");
    }
  }, [selectedId, visible]);

  const activeIndex = Math.max(
    0,
    COMPANION_LIST.findIndex((companion) => companion.id === draftId)
  );
  const activeCompanion = useMemo(() => COMPANIONS[draftId], [draftId]);

  const shift = (direction: -1 | 1) => {
    const nextIndex =
      (activeIndex + direction + COMPANION_LIST.length) % COMPANION_LIST.length;
    setDraftId(COMPANION_LIST[nextIndex].id);
  };

  const neighbors = [
    COMPANION_LIST[(activeIndex - 1 + COMPANION_LIST.length) % COMPANION_LIST.length],
    COMPANION_LIST[activeIndex],
    COMPANION_LIST[(activeIndex + 1) % COMPANION_LIST.length],
  ];

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{isNormal ? "Choose Your Guide" : "CHOOSE YOUR GUIDE"}</Text>
          <Text style={styles.subtitle}>
            {isNormal
              ? "Slide through the guide belt, meet each personality, and bring one with you."
              : "Cycle through available companion profiles and confirm a guide."}
          </Text>

          <View style={styles.beltShell}>
            <TouchableOpacity style={styles.arrowBtn} onPress={() => shift(-1)}>
              <Text style={styles.arrowText}>‹</Text>
            </TouchableOpacity>

            <View style={styles.beltTrack}>
              {neighbors.map((companion, index) => {
                const active = companion.id === draftId;
                const scale = index === 1 ? 1 : 0.78;
                return (
                  <Pressable
                    key={`${companion.id}-${index}`}
                    onPress={() => setDraftId(companion.id)}
                    style={[
                      styles.beltCard,
                      {
                        transform: [{ scale }],
                        opacity: active ? 1 : 0.72,
                        borderColor: active ? companion.accentColor : colors.borderDim,
                        backgroundColor: active ? companion.accentColor + "14" : colors.bg,
                      },
                    ]}
                  >
                    <CompanionVisual companionId={companion.id} size={active ? 96 : 72} />
                    <Text style={[styles.beltName, active && { color: companion.accentColor }]}>
                      {companion.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <TouchableOpacity style={styles.arrowBtn} onPress={() => shift(1)}>
              <Text style={styles.arrowText}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.preview, { borderColor: activeCompanion.accentColor }]}>
            <Text style={styles.previewName}>{activeCompanion.name}</Text>
            <Text style={styles.personality}>{activeCompanion.personality}</Text>
            <Text style={styles.quote}>"{activeCompanion.previewQuote}"</Text>
          </View>

          <View style={styles.dotRow}>
            {COMPANION_LIST.map((companion) => (
              <Pressable
                key={companion.id}
                onPress={() => setDraftId(companion.id)}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      companion.id === draftId ? companion.accentColor : colors.borderDim,
                    transform: [{ scale: companion.id === draftId ? 1.1 : 1 }],
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>{isNormal ? "Close" : "CLOSE"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: activeCompanion.accentColor }]}
              onPress={() => onConfirm(activeCompanion.id)}
            >
              <Text style={styles.confirmText}>{isNormal ? `Let's go with ${activeCompanion.name}!` : "LET'S GO"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>, isNormal: boolean) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(10, 14, 24, 0.45)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    card: {
      width: "100%",
      maxWidth: 860,
      backgroundColor: colors.bgPanel,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: colors.borderPrimary,
      padding: 24,
    },
    title: {
      fontSize: 24,
      fontFamily: Fonts.sansBold,
      color: colors.textBright,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 21,
      fontFamily: Fonts.sans,
      color: colors.textDim,
      textAlign: "center",
      marginTop: 8,
      marginBottom: 18,
      paddingHorizontal: 16,
    },
    beltShell: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 16,
    },
    arrowBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.borderDim,
      backgroundColor: colors.bg,
      alignItems: "center",
      justifyContent: "center",
    },
    arrowText: {
      fontSize: 28,
      lineHeight: 30,
      fontFamily: Fonts.sansBold,
      color: colors.textBright,
      marginTop: -2,
    },
    beltTrack: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      minHeight: 190,
    },
    beltCard: {
      flex: 1,
      maxWidth: 190,
      minHeight: 170,
      borderWidth: 1,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 12,
      paddingVertical: 16,
      gap: 10,
    },
    beltName: {
      fontSize: 15,
      fontFamily: Fonts.sansBold,
      color: colors.textBright,
      textAlign: "center",
    },
    preview: {
      borderWidth: 2,
      borderRadius: 22,
      backgroundColor: colors.bg,
      padding: 18,
      alignItems: "center",
    },
    previewName: {
      fontSize: 24,
      fontFamily: Fonts.sansBold,
      color: colors.textBright,
      marginBottom: 4,
    },
    personality: {
      fontSize: 13,
      fontFamily: Fonts.sansBold,
      color: colors.textDim,
      textAlign: "center",
      marginBottom: 8,
    },
    quote: {
      fontSize: 14,
      lineHeight: 21,
      fontFamily: Fonts.sans,
      color: colors.textPrimary,
      textAlign: "center",
    },
    dotRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
      marginTop: 16,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    actions: {
      marginTop: 20,
      flexDirection: "row",
      gap: 12,
      justifyContent: "center",
    },
    cancelBtn: {
      borderWidth: 1,
      borderColor: colors.borderDim,
      borderRadius: 999,
      backgroundColor: colors.bg,
      paddingHorizontal: 16,
      paddingVertical: 11,
    },
    cancelText: {
      fontSize: 12,
      fontFamily: Fonts.sansBold,
      color: colors.textDim,
    },
    confirmBtn: {
      borderRadius: 999,
      paddingHorizontal: 20,
      paddingVertical: 11,
      maxWidth: "70%",
    },
    confirmText: {
      fontSize: 12,
      fontFamily: Fonts.sansBold,
      color: "#fff",
      textAlign: "center",
      letterSpacing: isNormal ? 0.2 : 1.2,
    },
  });
