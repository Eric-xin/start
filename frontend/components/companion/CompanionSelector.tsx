import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
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
  const { width } = useWindowDimensions();
  const isWide = width >= 980;
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
            {isNormal ? "Pick the voice and energy you want beside you while you learn." : "Select the companion voice for this run."}
          </Text>

          <View style={[styles.layout, isWide && styles.layoutWide]}>
            <ScrollView
              contentContainerStyle={styles.grid}
              showsVerticalScrollIndicator={false}
              style={[styles.gridScroll, isWide && styles.gridScrollWide]}
            >
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
                    <CompanionVisual companionId={companion.id} size={64} />
                    <Text style={styles.optionName}>{companion.name}</Text>
                    <Text style={styles.optionMood}>{companion.personality}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={[styles.preview, { borderColor: activeCompanion.accentColor }]}>
              <View style={[styles.previewGlow, { backgroundColor: activeCompanion.accentColor + "12" }]} />
              <CompanionVisual companionId={activeCompanion.id} size={112} />
              <Text style={styles.previewName}>{activeCompanion.name}</Text>
              <Text style={styles.personality}>{activeCompanion.personality}</Text>
              <Text style={styles.quote}>"{activeCompanion.previewQuote}"</Text>
              <View style={styles.previewTagRow}>
                <View style={[styles.previewTag, { borderColor: activeCompanion.accentColor + "55" }]}>
                  <Text style={[styles.previewTagText, { color: activeCompanion.accentColor }]}>{isNormal ? "Friendly guide" : "VOICE PROFILE"}</Text>
                </View>
                <View style={styles.previewTag}>
                  <Text style={styles.previewTagText}>{isNormal ? "Always on-screen" : "SESSION READY"}</Text>
                </View>
              </View>
            </View>
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
    maxWidth: 960,
    maxHeight: "90%",
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
  layout: {
    gap: 18,
  },
  layoutWide: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  gridScroll: {
    width: "100%",
    maxHeight: 340,
  },
  gridScrollWide: {
    flex: 1,
    maxHeight: undefined,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  option: {
    width: "47%",
    minWidth: 140,
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderDim,
    backgroundColor: colors.bg,
    paddingHorizontal: 12,
    gap: 6,
  },
  optionName: {
    fontSize: 14,
    fontFamily: Fonts.sansBold,
    color: colors.textBright,
  },
  optionMood: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: Fonts.sans,
    color: colors.textDim,
    textAlign: "center",
  },
  preview: {
    borderWidth: 2,
    borderRadius: 20,
    padding: 18,
    alignItems: "center",
    backgroundColor: colors.bg,
    justifyContent: "center",
    width: "100%",
    minWidth: 0,
    position: "relative",
    overflow: "hidden",
  },
  previewGlow: {
    position: "absolute",
    top: -30,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  previewName: {
    marginTop: 12,
    fontSize: 24,
    fontFamily: Fonts.sansBold,
    color: colors.textBright,
  },
  personality: {
    marginTop: 6,
    fontSize: 13,
    fontFamily: Fonts.sansBold,
    color: colors.textBright,
    textAlign: "center",
  },
  quote: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Fonts.sans,
    color: colors.textPrimary,
    textAlign: "center",
  },
  previewTagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    marginTop: 12,
  },
  previewTag: {
    borderWidth: 1,
    borderColor: colors.borderDim,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.bgPanel,
  },
  previewTagText: {
    fontSize: 10,
    fontFamily: Fonts.sansBold,
    color: colors.textDim,
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
