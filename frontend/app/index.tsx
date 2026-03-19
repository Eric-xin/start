import { Redirect } from "expo-router";
import { useAuthStore } from "../store/authStore";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Colors } from "../constants/colors";

export default function Index() {
  const { token, isHydrated, skipInvestingIntro } = useAuthStore();

  if (!isHydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.blue} size="large" />
      </View>
    );
  }

  if (token) {
    return <Redirect href={skipInvestingIntro ? "/(game)" : "/(game)/investing-intro"} />;
  }
  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
});
