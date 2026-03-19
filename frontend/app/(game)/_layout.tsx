import { Stack } from "expo-router";
import { Colors } from "../../constants/colors";

export default function GameLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bg },
        animation: "fade",
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="investing-intro" />
      <Stack.Screen name="index" />
      <Stack.Screen name="play" />
      <Stack.Screen name="portfolio" />
      <Stack.Screen name="achievements" />
      <Stack.Screen name="simulation" />
      <Stack.Screen name="leaderboard" />
    </Stack>
  );
}
