// app/_layout.tsx
import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#020617"
        translucent={false}
      />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#020617" },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" /> 
      </Stack>
    </>
  );
}
