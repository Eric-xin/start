import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
  const styles = createStyles(colors);
  const [draftId, setDraftId] = useState<CompanionId>(selectedId ?? "sage");

  const activeCompanion = useMemo(
    () => COMPANIONS[draftId],
    [draftId]
  );

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{isNormal ? "Choose Your Guide" : "CHOOSE YOUR GUIDE"}</Text>
          <Text style={styles.subtitle}>
            {isNormal ? "Who's coming with you today?" : "Select the companion voice for this run."}
          </Text>

          <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
            {COMPANION_LIST.map((companion) => {
              const active = draftId === companion.id;
              return (
                <Pressable
                  key={companion.id}
                  onPress={() => setDraftId(companion.id)}
                  style={[
                    styles.option,
                    active && {
                      borderColor: companion.accentColor,
                      backgroundColor: companion.accentColor + "14",
                    },
                  ]}
                >
                  <CompanionVisual companionId={companion.id} size={72} />
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={[styles.preview, { borderColor: activeCompanion.accentColor }]}>
            <CompanionVisual companionId={activeCompanion.id} size={108} />
            <Text style={styles.personality}>{activeCompanion.personality}</Text>
            <Text style={styles.quote}>"{activeCompanion.previewQuote}"</Text>
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Close</Text>
            </Pressable>
            <Pressable
              style={[styles.confirmBtn, { backgroundColor: activeCompanion.accentColor }]}
              onPress={() => onConfirm(activeCompanion.id)}
            >
              <Text style={styles.confirmText}>{isNormal ? "Let's go!" : "CONFIRM"}</Text>
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
    backgroundColor: "rgba(10, 14, 24, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 860,
    maxHeight: "92%",
    backgroundColor: colors.bgPanel,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontFamily: Fonts.sansBold,
    color: colors.textBright,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.sans,
    color: colors.textDim,
    marginTop: 6,
    marginBottom: 18,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  option: {
    width: "31%",
    minWidth: 180,
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderDim,
    backgroundColor: colors.bg,
  },
  preview: {
    marginTop: 18,
    borderWidth: 2,
    borderRadius: 20,
    padding: 18,
    alignItems: "center",
    backgroundColor: colors.bg,
  },
  personality: {
    marginTop: 10,
    fontSize: 13,
    fontFamily: Fonts.sansBold,
    color: colors.textBright,
  },
  quote: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Fonts.sans,
    color: colors.textPrimary,
    textAlign: "center",
  },
  actions: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderDim,
  },
  cancelText: {
    fontSize: 12,
    fontFamily: Fonts.sansBold,
    color: colors.textDim,
  },
  confirmBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  confirmText: {
    fontSize: 12,
    fontFamily: Fonts.sansBold,
    color: "#fff",
  },
});
