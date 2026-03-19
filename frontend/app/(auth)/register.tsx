import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { register } from "../../services/auth";
import LanguageSwitcher from "../../components/LanguageSwitcher";
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

function parseError(e: any, t: (key: string) => string): string {
  const detail = e?.response?.data?.detail;
  if (!detail) return t("auth.errors.unableConnect");
  if (Array.isArray(detail)) {
    const msg = detail[0]?.msg ?? "";
    if (msg.toLowerCase().includes("email")) return t("auth.errors.validEmail");
    if (msg.toLowerCase().includes("password")) return t("auth.minPassword");
    return msg;
  }
  const s = String(detail).toLowerCase();
  if (s.includes("email") && s.includes("exist")) return t("auth.errors.emailTaken");
  if (s.includes("username") && s.includes("exist")) return t("auth.errors.usernameTaken");
  if (s.includes("email")) return t("auth.errors.emailTaken");
  if (s.includes("username")) return t("auth.errors.usernameTaken");
  return String(detail);
}

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async () => {
    setError(null);
    if (!email.trim() || !username.trim() || !password) {
      setError(t("auth.allFieldsRequired"));
      return;
    }
    if (password.length < 8) {
      setError(t("auth.minPassword"));
      return;
    }
    setLoading(true);
    try {
      await register(email.trim(), username.trim(), password);
      setSuccess(true);
    } catch (e: any) {
      setError(parseError(e, t));
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
        <Text style={styles.topBarSub}>{t("auth.topSubRegister")}</Text>
      </View>

      <View style={styles.center}>
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <View style={styles.blueDot} />
            <Text style={styles.panelTitle}>{t("auth.panelRegister")}</Text>
          </View>

          <LanguageSwitcher />

          {success ? (
            <View style={styles.successBlock}>
              <Text style={styles.successIcon}>✓</Text>
              <Text style={styles.successTitle}>{t("auth.createSuccessTitle")}</Text>
              <Text style={styles.successBody}>
                {t("auth.createSuccessBody")}
              </Text>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={() => router.replace("/(auth)/login")}
              >
                <Text style={styles.submitText}>{`▶  ${t("auth.proceedToLogin")}`}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {error && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorIcon}>⚠</Text>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Text style={styles.fieldLabel}>{t("auth.emailAddress")}</Text>
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
                returnKeyType="next"
              />

              <Text style={styles.fieldLabel}>{t("auth.username")}</Text>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                value={username}
                onChangeText={(v) => { setUsername(v); setError(null); }}
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={Colors.textMuted}
                placeholder="investor_handle"
                selectionColor={Colors.blue}
                returnKeyType="next"
              />

              <Text style={styles.fieldLabel}>{t("auth.password")}</Text>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                value={password}
                onChangeText={(v) => { setPassword(v); setError(null); }}
                secureTextEntry
                placeholderTextColor={Colors.textMuted}
                placeholder="min 8 characters"
                selectionColor={Colors.blue}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />

              <TouchableOpacity
                style={[styles.submitBtn, loading && { opacity: 0.5 }]}
                onPress={handleRegister}
                disabled={loading}
              >
                <Text style={styles.submitText}>
                  {loading ? t("auth.registering") : `▶  ${t("auth.registerAction")}`}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.divider} />

          <TouchableOpacity style={styles.linkBtn} onPress={() => router.back()}>
            <Text style={styles.linkText}>{t("auth.backToLogin")}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomBar}>
        <Text style={styles.bottomText}>{t("auth.secureRegistration")}</Text>
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

  successBlock: { alignItems: "center", paddingVertical: 12, gap: 12 },
  successIcon: { fontSize: 36, color: Colors.green },
  successTitle: { fontSize: 11, fontFamily: Fonts.sansBold, color: Colors.green, letterSpacing: 2 },
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
    marginTop: 22,
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
