import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { forgotPassword } from "../../services/auth";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";

function GridBg() {
  const { width, height } = useWindowDimensions();
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}>
      {Array.from({ length: Math.ceil(height / 32) }).map((_, i) => (
        <View key={i} style={{ position: "absolute", top: i * 32, left: 0, right: 0, height: 1, backgroundColor: Colors.borderFaint }} />
      ))}
      {Array.from({ length: Math.ceil(width / 64) }).map((_, i) => (
        <View key={i} style={{ position: "absolute", left: i * 64, top: 0, bottom: 0, width: 1, backgroundColor: Colors.borderFaint, opacity: 0.5 }} />
      ))}
    </View>
  );
}

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (e: any) {
      // Always show success to avoid email enumeration — backend should behave the same
      setSent(true);
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
        <Text style={styles.topBarSub}>ACCOUNT RECOVERY</Text>
      </View>

      <View style={styles.center}>
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <View style={styles.blueDot} />
            <Text style={styles.panelTitle}>PASSWORD RESET</Text>
          </View>

          {sent ? (
            <View style={styles.successBlock}>
              <Text style={styles.successIcon}>✉</Text>
              <Text style={styles.successTitle}>RESET LINK SENT</Text>
              <Text style={styles.successBody}>
                If that email is associated with an account, you'll receive a password reset link shortly.
                Check your inbox and spam folder.
              </Text>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={() => router.replace("/(auth)/login")}
              >
                <Text style={styles.submitText}>← RETURN TO LOGIN</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.description}>
                Enter the email address associated with your account. We'll send you a link to reset your password.
              </Text>

              {error && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorIcon}>⚠</Text>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                value={email}
                onChangeText={(v) => { setEmail(v); setError(null); }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                placeholderTextColor={Colors.textMuted}
                placeholder="your@email.com"
                selectionColor={Colors.blue}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />

              <TouchableOpacity
                style={[styles.submitBtn, loading && { opacity: 0.5 }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={styles.submitText}>
                  {loading ? "SENDING..." : "▶  SEND RESET LINK"}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.divider} />

          <TouchableOpacity style={styles.linkBtn} onPress={() => router.back()}>
            <Text style={styles.linkText}>← BACK TO LOGIN</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomBar}>
        <Text style={styles.bottomText}>SECURE TOKEN · EXPIRES IN 1 HOUR</Text>
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
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderFaint,
    paddingBottom: 10,
  },
  blueDot: { width: 6, height: 6, borderRadius: 1, backgroundColor: Colors.blue },
  panelTitle: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.blue, letterSpacing: 2 },

  description: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    color: Colors.textDim,
    lineHeight: 18,
    marginBottom: 16,
  },

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

  successBlock: { alignItems: "center", paddingVertical: 8, gap: 12 },
  successIcon: { fontSize: 36, color: Colors.blue },
  successTitle: { fontSize: 11, fontFamily: Fonts.sansBold, color: Colors.blue, letterSpacing: 2 },
  successBody: { fontSize: 12, fontFamily: Fonts.sans, color: Colors.textDim, lineHeight: 18, textAlign: "center" },

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
  inputError: { borderColor: "#8b1a1a" },

  submitBtn: {
    backgroundColor: Colors.blue,
    padding: 14,
    borderRadius: 2,
    alignItems: "center",
    marginTop: 20,
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
