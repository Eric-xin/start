import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { register } from "../../services/auth";
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

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !username || !password) {
      Alert.alert("Input Required", "All fields are required.");
      return;
    }
    setLoading(true);
    try {
      await register(email, username, password);
      Alert.alert("ACCOUNT CREATED", "Your investor profile is ready. Log in to begin.", [
        { text: "PROCEED", onPress: () => router.replace("/(auth)/login") },
      ]);
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      Alert.alert("REGISTRATION FAILED", Array.isArray(detail) ? detail[0].msg : detail ?? "Unknown error.");
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
        <Text style={styles.topBarSub}>NEW INVESTOR REGISTRATION</Text>
      </View>

      <View style={styles.center}>
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <View style={styles.blueDot} />
            <Text style={styles.panelTitle}>CREATE INVESTOR PROFILE</Text>
          </View>

          <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={Colors.textMuted}
            placeholder="your@email.com"
            selectionColor={Colors.blue}
          />

          <Text style={styles.fieldLabel}>USERNAME</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor={Colors.textMuted}
            placeholder="investor_handle"
            selectionColor={Colors.blue}
          />

          <Text style={styles.fieldLabel}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={Colors.textMuted}
            placeholder="min 8 characters"
            selectionColor={Colors.blue}
          />

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.5 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.submitText}>
              {loading ? "REGISTERING..." : "▶  CREATE ACCOUNT"}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.linkBtn} onPress={() => router.back()}>
            <Text style={styles.linkText}>← BACK TO LOGIN</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomBar}>
        <Text style={styles.bottomText}>SECURE REGISTRATION · DATA ENCRYPTED AT REST</Text>
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
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderFaint,
    paddingBottom: 10,
  },
  blueDot: { width: 6, height: 6, borderRadius: 1, backgroundColor: Colors.blue },
  panelTitle: { fontSize: 9, fontFamily: Fonts.sansBold, color: Colors.blue, letterSpacing: 2 },
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
