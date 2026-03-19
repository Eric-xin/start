import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="personas" />
      <Stack.Screen name="persona/[id]" />
      <Stack.Screen name="decks" />
    </Stack>
  );
}
