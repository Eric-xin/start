import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { useAppFonts } from "../hooks/useFont";
import { useAuthStore } from "../store/authStore";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { Colors } from "../constants/colors";

export default function RootLayout() {
  const [fontsLoaded] = useAppFonts();
  const router = useRouter();
  const segments = useSegments();
  const { token, isHydrated, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const inAuth = segments[0] === "(auth)";
    if (!token && !inAuth) {
      router.replace("/(auth)/login");
    } else if (token && inAuth) {
      router.replace("/(game)/index");
    }
  }, [token, isHydrated, segments]);

  if (!fontsLoaded || !isHydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.bloombergBlue} size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <Slot />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loading: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
