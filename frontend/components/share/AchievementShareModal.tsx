import React, { useRef, useState } from "react";
import {
  Modal, View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from "react-native";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { AchievementData } from "../../services/achievements";
import { AchievementShareCard, CARD_W, CARD_H } from "./AchievementShareCard";
import { Fonts } from "../../constants/fonts";

const TIER_COLORS: Record<string, string> = {
  bronze:   "#cd7f32",
  silver:   "#c0c0c0",
  gold:     "#ffd700",
  platinum: "#e8e0ff",
};

interface Props {
  achievement: AchievementData | null;
  onClose: () => void;
}

export function AchievementShareModal({ achievement, onClose }: Props) {
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  if (!achievement) return null;

  const accent = TIER_COLORS[achievement.tier] ?? "#0a6cf5";

  const handleShare = async () => {
    if (!cardRef.current) return;
    setSharing(true);
    try {
      const uri = await captureRef(cardRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: achievement.title,
        });
      }
    } catch {
      // sharing cancelled or failed — silently ignore
    } finally {
      setSharing(false);
    }
  };

  return (
    <Modal
      visible={!!achievement}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Label */}
          <Text style={styles.previewLabel}>SHARE PREVIEW</Text>

          {/* Card preview — also the capture target */}
          <View
            ref={cardRef}
            collapsable={false}
            style={{ width: CARD_W, height: CARD_H, borderRadius: 4, overflow: "hidden" }}
          >
            <AchievementShareCard achievement={achievement} />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.shareBtn, { backgroundColor: accent }, sharing && { opacity: 0.6 }]}
              onPress={handleShare}
              disabled={sharing}
            >
              {sharing ? (
                <ActivityIndicator size="small" color="#050b14" />
              ) : (
                <Text style={styles.shareBtnText}>SHARE</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={sharing}>
              <Text style={styles.cancelText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(5, 11, 20, 0.92)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  sheet: {
    alignItems: "center",
    gap: 16,
  },
  previewLabel: {
    fontSize: 8,
    fontFamily: Fonts.sansBold,
    color: "#253a55",
    letterSpacing: 3,
  },
  actions: {
    alignItems: "center",
    gap: 10,
    width: CARD_W,
  },
  shareBtn: {
    width: "100%",
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 2,
  },
  shareBtnText: {
    fontSize: 11,
    fontFamily: Fonts.sansBold,
    color: "#050b14",
    letterSpacing: 3,
  },
  cancelBtn: {
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 9,
    fontFamily: Fonts.sansBold,
    color: "#4a7aaa",
    letterSpacing: 2,
  },
});
