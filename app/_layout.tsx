// app/_layout.tsx
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";

// Necesario para que AuthSession cierre bien el flujo de OAuth
WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" backgroundColor="#020617" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="home" />
      </Stack>
    </>
  );
}