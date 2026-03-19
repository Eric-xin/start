import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { COMPANIONS, type CompanionId } from "../../constants/companions";

interface Props {
  companionId: CompanionId;
  onPress: () => void;
}

export function CompanionAvatar({ companionId, onPress }: Props) {
  const companion = COMPANIONS[companionId];

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.avatar,
        {
          borderColor: companion.accentColor,
          backgroundColor: companion.accentColor + "1A",
        },
      ]}
    >
      <Text style={styles.emoji}>{companion.emoji}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  emoji: {
    fontSize: 18,
  },
});
