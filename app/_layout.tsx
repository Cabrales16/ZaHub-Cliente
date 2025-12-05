// app/_layout.tsx
import "../global.css";

import { Stack } from "expo-router";
import { StatusBar, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

WebBrowser.maybeCompleteAuthSession();

function InnerLayout() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        // deja espacio de la barra del sistema + un extra para “levantar” la app
        paddingBottom: insets.bottom + 12, // ajusta 12 a 8/16 según cómo lo veas en tu cel
        backgroundColor: "#020617",
      }}
    >
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
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#020617"
        translucent={false}
      />
      <InnerLayout />
    </SafeAreaProvider>
  );
}