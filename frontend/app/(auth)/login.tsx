import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { login, getMe } from "../../services/auth";
import { useAuthStore } from "../../store/authStore";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert("Error", "Please enter your credentials.");
      return;
    }
    setLoading(true);
    try {
      const tokens = await login(identifier, password);
      const user = await getMe(tokens.access_token);
      await setAuth(tokens.access_token, tokens.refresh_token, user);
      router.replace("/(game)/index");
    } catch (e: any) {
      Alert.alert("Login Failed", e?.response?.data?.detail ?? "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>CARDECON</Text>
        <Text style={styles.subtitle}>FINANCIAL INTELLIGENCE PLATFORM</Text>

        <View style={styles.form}>
          <Text style={styles.label}>EMAIL OR USERNAME</Text>
          <TextInput
            style={styles.input}
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholderTextColor={Colors.textMuted}
            placeholder="Enter email or username"
          />

          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={Colors.textMuted}
            placeholder="Enter password"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? "AUTHENTICATING..." : "LOGIN"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push("/(auth)/register")}
          >
            <Text style={styles.linkText}>No account? Register →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  logo: {
    fontSize: 36,
    fontFamily: Fonts.serif,
    color: Colors.bloombergBlue,
    letterSpacing: 4,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    fontFamily: Fonts.sansBold,
    color: Colors.textMuted,
    letterSpacing: 3,
    marginBottom: 48,
  },
  form: {
    width: "100%",
    maxWidth: 400,
  },
  label: {
    fontSize: 9,
    fontFamily: Fonts.sansBold,
    color: Colors.textMuted,
    letterSpacing: 2,
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: Colors.terminalDark,
    borderWidth: 1,
    borderColor: "#1e3a5f",
    borderRadius: 4,
    padding: 12,
    color: Colors.textPrimary,
    fontFamily: Fonts.sans,
    fontSize: 14,
  },
  button: {
    backgroundColor: Colors.bloombergBlue,
    padding: 14,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.textPrimary,
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    letterSpacing: 2,
  },
  linkButton: {
    alignItems: "center",
    marginTop: 16,
    padding: 8,
  },
  linkText: {
    color: Colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 13,
  },
});
