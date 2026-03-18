import React from "react";
import { View, StyleSheet } from "react-native";
import { StatBar } from "./StatBar";
import { Colors } from "../../constants/colors";
import { Layout } from "../../constants/layout";
import type { SessionData } from "../../services/game";

interface Props {
  session: SessionData;
}

export function StatsPanel({ session }: Props) {
  const capitalProgress = Math.min(1, (session.capital - 8000) / 12000);
  const capitalDisplay = `$${Math.round(session.capital).toLocaleString()}`;
  const rankDisplay = `RANK ${session.investor_rank}`;

  return (
    <View style={styles.panel}>
      <StatBar
        label="Capital"
        value={capitalProgress}
        color={Colors.amber}
        displayValue={capitalDisplay}
      />
      <StatBar
        label="Progress"
        value={session.progress}
        color={Colors.bloombergBlue}
        displayValue={`Stage ${session.stage}`}
      />
      <StatBar
        label="Rank"
        value={(session.investor_rank - 1) / 3}
        color={Colors.terminalGreen}
        displayValue={rankDisplay}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    height: Layout.statsPanelHeight,
    backgroundColor: Colors.terminalDark,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: "#1e3a5f",
  },
});
