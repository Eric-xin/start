import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { login, getMe } from "../../services/auth";
import { useAuthStore } from "../../store/authStore";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";

function GridBg() {
  const { width, height } = useWindowDimensions();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: Math.ceil(height / 32) }).map((_, i) => (
        <View key={i} style={{ position: "absolute", top: i * 32, left: 0, right: 0, height: 1, backgroundColor: Colors.borderFaint }} />
      ))}
      {Array.from({ length: Math.ceil(width / 64) }).map((_, i) => (
        <View key={i} style={{ position: "absolute", left: i * 64, top: 0, bottom: 0, width: 1, backgroundColor: Colors.borderFaint, opacity: 0.5 }} />
      ))}
    </View>
  );
}

function parseError(e: any): string {
  const detail = e?.response?.data?.detail;
  if (!detail) return "Unable to connect. Check your network.";
  if (Array.isArray(detail)) return detail[0]?.msg ?? "Invalid input.";
  const status = e?.response?.status;
  if (status === 401) return "Incorrect credentials. Check your email/username and password.";
  if (status === 403) return "Account not verified. Check your email for the verification link.";
  return String(detail);
}

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    if (!identifier.trim() || !password) {
      setError("Enter your email/username and password.");
      return;
    }
    setLoading(true);
    try {
      const tokens = await login(identifier.trim(), password);
      const user = await getMe(tokens.access_token);
      // setAuth updates the store; the root layout guard handles navigation
      await setAuth(tokens.access_token, tokens.refresh_token, user);
    } catch (e: any) {
      setError(parseError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <GridBg />

      <View style={styles.topBar}>
        <Text style={styles.logo}>CARDECON</Text>
        <Text style={styles.topBarSub}>FINANCIAL INTELLIGENCE PLATFORM</Text>
      </View>

      <View style={styles.center}>
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <View style={styles.blueDot} />
            <Text style={styles.panelTitle}>AUTHENTICATION REQUIRED</Text>
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorIcon}>⚠</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={styles.fieldLabel}>IDENTIFIER</Text>
          <TextInput
            style={[styles.input, error && styles.inputError]}
            value={identifier}
            onChangeText={(v) => { setIdentifier(v); setError(null); }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholderTextColor={Colors.textMuted}
            placeholder="email or username"
            selectionColor={Colors.blue}
            returnKeyType="next"
          />

          <Text style={styles.fieldLabel}>PASSWORD</Text>
          <TextInput
            style={[styles.input, error && styles.inputError]}
            value={password}
            onChangeText={(v) => { setPassword(v); setError(null); }}
            secureTextEntry
            placeholderTextColor={Colors.textMuted}
            placeholder="••••••••"
            selectionColor={Colors.blue}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => router.push("/(auth)/forgot-password")}
          >
            <Text style={styles.forgotText}>FORGOT PASSWORD →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.5 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.submitText}>
              {loading ? "AUTHENTICATING..." : "▶  ACCESS SYSTEM"}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.linkBtn} onPress={() => router.push("/(auth)/register")}>
            <Text style={styles.linkText}>NO ACCOUNT — REGISTER INVESTOR PROFILE →</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomBar}>
        <Text style={styles.bottomText}>SECURE SESSION · TLS 1.3 · JWT AUTHENTICATION</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  topBar: {
    height: 40,
    backgroundColor: Colors.bgPanel,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderPrimary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 14,
  },
  logo: { fontSize: 14, fontFamily: Fonts.mono, color: Colors.blue, letterSpacing: 3 },
  topBarSub: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 2 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },

  panel: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: Colors.bgPanel,
    borderWidth: 1,
    borderColor: Colors.borderDim,
    borderRadius: 2,
    padding: 28,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderFaint,
    paddingBottom: 10,
  },
  blueDot: { width: 6, height: 6, borderRadius: 1, backgroundColor: Colors.blue },
  panelTitle: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.blue, letterSpacing: 2 },

  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#3a0a0a",
    borderWidth: 1,
    borderColor: "#8b1a1a",
    borderRadius: 2,
    padding: 10,
    marginBottom: 8,
  },
  errorIcon: { fontSize: 12, color: "#e05555", marginTop: 1 },
  errorText: { flex: 1, fontSize: 11, fontFamily: Fonts.sans, color: "#e05555", lineHeight: 16 },

  fieldLabel: {
    fontSize: 8,
    fontFamily: Fonts.sansBold,
    color: Colors.textDim,
    letterSpacing: 2,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderDim,
    borderRadius: 2,
    padding: 11,
    color: Colors.textBright,
    fontFamily: Fonts.mono,
    fontSize: 13,
  },
  inputError: {
    borderColor: "#8b1a1a",
  },

  forgotBtn: { alignSelf: "flex-end", marginTop: 8, padding: 2 },
  forgotText: { fontSize: 8, fontFamily: Fonts.sansBold, color: Colors.textMuted, letterSpacing: 1.5 },

  submitBtn: {
    backgroundColor: Colors.blue,
    padding: 14,
    borderRadius: 2,
    alignItems: "center",
    marginTop: 16,
  },
  submitText: { fontSize: 12, fontFamily: Fonts.sansBold, color: Colors.bg, letterSpacing: 2 },

  divider: { height: 1, backgroundColor: Colors.borderFaint, marginVertical: 18 },

  linkBtn: { alignItems: "center", padding: 4 },
  linkText: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.textDim, letterSpacing: 1.5 },

  bottomBar: {
    height: 30,
    backgroundColor: Colors.bgPanel,
    borderTopWidth: 1,
    borderTopColor: Colors.borderFaint,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomText: { fontSize: 8, fontFamily: Fonts.mono, color: Colors.textMuted, letterSpacing: 1 },
});
