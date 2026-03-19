import { Stack } from "expo-router";
import { Colors } from "../../constants/colors";

export default function GameLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bg },
        animation: "fade",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="play" />
      <Stack.Screen name="sessions" />
      <Stack.Screen name="session/[id]" />
    </Stack>
  );
}
