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
    if (!isHydrated || !fontsLoaded) return;

    const inAuth = segments[0] === "(auth)";
    if (!token && !inAuth) {
      router.replace("/(auth)/login");
    } else if (token && inAuth) {
      router.replace("/(game)");
    }
  }, [token, isHydrated, fontsLoaded, segments]);

  const isReady = fontsLoaded && isHydrated;
  const inAuth = segments[0] === "(auth)";
  const redirectPending = isReady && ((!token && !inAuth) || (token && inAuth));
  const showSpinner = !isReady || redirectPending;

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      {/* Slot must always render so the navigator mounts */}
      <Slot />
      {/* Overlay the spinner on top until we're ready */}
      {showSpinner && (
        <View style={[StyleSheet.absoluteFill, styles.loading]}>
          <ActivityIndicator color={Colors.blue} size="large" />
        </View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  loading: {
    backgroundColor: Colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
});