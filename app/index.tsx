// app/index.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ImageBackground,
} from "react-native";
import { useRouter } from "expo-router";

export default function IndexScreen() {
  const router = useRouter();

  const handleStart = () => {
    router.push("/login");
  };

  return (
    <ImageBackground
      source={require("../assets/BackgroundPizza.jpg")} // 👈 Asegúrate que el nombre sea EXACTO
      resizeMode="cover"
      className="flex-1"
    >
      <View className="flex-1 bg-black/40 px-6 justify-center">
        <View className="items-center">
          <Image
            source={require("../assets/LogoNoBack.png")}
            className="w-28 h-28 mb-3"
            resizeMode="contain"
          />

          <Text className="text-white text-4xl font-extrabold text-center mb-2">
            ZaHub
          </Text>

          <Text className="text-orange-400 text-sm font-semibold mb-1">
            El algoritmo del antojo perfecto 🍕
          </Text>

          <Text className="text-slate-300 text-center text-sm mb-8">
            Pide tus pizzas favoritas, crea combinaciones únicas
            y guarda tus Zas perfectas para la próxima antojada.
          </Text>

          <TouchableOpacity
            className="bg-red-500 px-12 py-3 rounded-full mb-3 shadow-lg shadow-red-900/40"
            onPress={handleStart}
          >
            <Text className="text-white text-lg font-semibold text-center">
              Empezar
            </Text>
          </TouchableOpacity>

          <Text className="text-slate-400 text-xs text-center">
            Inicia sesión o crea tu cuenta para continuar.
          </Text>
        </View>
      </View>
    </ImageBackground>
  );
}
