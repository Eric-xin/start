import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { register } from "../../services/auth";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !username || !password) {
      Alert.alert("Error", "All fields are required.");
      return;
    }
    setLoading(true);
    try {
      await register(email, username, password);
      Alert.alert(
        "Account Created",
        "Check your email to verify your account, then log in.",
        [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
      );
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      Alert.alert("Registration Failed", Array.isArray(detail) ? detail[0].msg : detail ?? "Unknown error");
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
        <Text style={styles.subtitle}>CREATE YOUR INVESTOR PROFILE</Text>

        <View style={styles.form}>
          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={Colors.textMuted}
            placeholder="your@email.com"
          />

          <Text style={styles.label}>USERNAME</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor={Colors.textMuted}
            placeholder="investor_handle"
          />

          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={Colors.textMuted}
            placeholder="Min 8 characters"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.back()}
          >
            <Text style={styles.linkText}>← Back to login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  logo: { fontSize: 36, fontFamily: Fonts.serif, color: Colors.bloombergBlue, letterSpacing: 4, marginBottom: 4 },
  subtitle: { fontSize: 10, fontFamily: Fonts.sansBold, color: Colors.textMuted, letterSpacing: 3, marginBottom: 48 },
  form: { width: "100%", maxWidth: 400 },
  label: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.textMuted, letterSpacing: 2, marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: Colors.terminalDark, borderWidth: 1, borderColor: "#1e3a5f", borderRadius: 4, padding: 12, color: Colors.textPrimary, fontFamily: Fonts.sans, fontSize: 14 },
  button: { backgroundColor: Colors.bloombergBlue, padding: 14, borderRadius: 4, alignItems: "center", marginTop: 24 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: Colors.textPrimary, fontFamily: Fonts.sansBold, fontSize: 13, letterSpacing: 2 },
  linkButton: { alignItems: "center", marginTop: 16, padding: 8 },
  linkText: { color: Colors.textMuted, fontFamily: Fonts.sans, fontSize: 13 },
});
