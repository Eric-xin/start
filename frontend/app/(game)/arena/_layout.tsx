import { Stack } from "expo-router";

export default function ArenaLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="lobby/[code]" />
      <Stack.Screen name="play/[code]" />
    </Stack>
  );
}
