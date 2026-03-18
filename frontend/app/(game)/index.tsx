import React, { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { createSession } from "../../services/game";
import { useAuthStore } from "../../store/authStore";
import { useGameStore } from "../../store/gameStore";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";

export default function GameIndexScreen() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const { setSession, reset } = useGameStore();
  const [loading, setLoading] = useState(false);

  const handleNewGame = async () => {
    setLoading(true);
    try {
      reset();
      const session = await createSession();
      setSession(session);
      router.push("/(game)/play");
    } catch (e: any) {
      Alert.alert("Error", "Could not create session. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await clearAuth();
    router.replace("/(auth)/login");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLogo}>CARDECON</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>LOGOUT</Text>
        </TouchableOpacity>
      </View>

      {/* Main content */}
      <View style={styles.content}>
        <Text style={styles.welcome}>
          Welcome back, {user?.username ?? "Investor"}
        </Text>
        <Text style={styles.tagline}>
          Your financial intelligence journey continues.
        </Text>

        <View style={styles.rankBox}>
          <Text style={styles.rankLabel}>CURRENT RANK</Text>
          <Text style={styles.rankValue}>ANALYST I</Text>
          <View style={styles.rankDot} />
        </View>

        <TouchableOpacity
          style={[styles.ctaButton, loading && styles.ctaDisabled]}
          onPress={handleNewGame}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaText}>NEW SESSION →</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          CardEcon v1.0 · Bloomberg Terminal Aesthetic · {new Date().getFullYear()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    height: 44,
    backgroundColor: Colors.terminalDark,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1e3a5f",
  },
  headerLogo: {
    fontSize: 16,
    fontFamily: Fonts.serif,
    color: Colors.bloombergBlue,
    letterSpacing: 3,
  },
  logout: {
    fontSize: 10,
    fontFamily: Fonts.sansBold,
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  welcome: {
    fontSize: 28,
    fontFamily: Fonts.serif,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    fontFamily: Fonts.sans,
    color: Colors.textMuted,
    marginBottom: 48,
  },
  rankBox: {
    backgroundColor: Colors.terminalDark,
    borderWidth: 1,
    borderColor: "#1e3a5f",
    borderRadius: 8,
    padding: 24,
    alignItems: "center",
    marginBottom: 40,
    minWidth: 200,
  },
  rankLabel: {
    fontSize: 9,
    fontFamily: Fonts.sansBold,
    color: Colors.textMuted,
    letterSpacing: 2,
    marginBottom: 8,
  },
  rankValue: {
    fontSize: 22,
    fontFamily: Fonts.serif,
    color: Colors.bloombergBlue,
    letterSpacing: 2,
  },
  rankDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.terminalGreen,
    marginTop: 8,
  },
  ctaButton: {
    backgroundColor: Colors.bloombergBlue,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 4,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: {
    fontSize: 14,
    fontFamily: Fonts.sansBold,
    color: Colors.textPrimary,
    letterSpacing: 3,
  },
  footer: {
    padding: 16,
    alignItems: "center",
  },
  footerText: {
    fontSize: 10,
    fontFamily: Fonts.sans,
    color: Colors.textMuted,
  },
});
