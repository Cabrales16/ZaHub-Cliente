// app/login.tsx
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";

function isValidEmail(email: string) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// URL a la que Supabase redirige al final del flujo (propia de Expo)
const redirectTo = makeRedirectUri();
console.log("🔗 LOGIN redirectTo =", redirectTo);

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const ensureClientRole = async () => {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      await supabase.auth.signOut();
      setErrorMsg("No se pudo obtener la sesión. Intenta de nuevo.");
      return false;
    }

    const role = String((data.user.user_metadata as any)?.role || "").toUpperCase();

    if (role !== "CLIENTE") {
      await supabase.auth.signOut();
      setErrorMsg(
        "Tu cuenta no tiene permisos de CLIENTE para usar esta app."
      );
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    setErrorMsg("");

    if (!email || !password) {
      setErrorMsg("Por favor ingresa correo y contraseña.");
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMsg("Ingresa un correo electrónico válido.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.log("Supabase login error:", error);
        const message = error.message?.toLowerCase?.() || "";

        if (
          message.includes("invalid login credentials") ||
          message.includes("invalid email or password")
        ) {
          setErrorMsg("Correo o contraseña incorrectos.");
        } else {
          setErrorMsg(error.message || "Ocurrió un error al iniciar sesión.");
        }
        return;
      }

      const ok = await ensureClientRole();
      if (!ok) return;

      router.replace("/home");
    } catch (error: any) {
      console.error("Error login:", error);
      setErrorMsg("Ocurrió un error al iniciar sesión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    setGoogleLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,           // 👈 Supabase redirige aquí al final
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        console.error("Supabase Google login error:", error);
        setErrorMsg("No se pudo iniciar sesión con Google.");
        return;
      }

      if (!data?.url) {
        setErrorMsg("No se pudo iniciar sesión con Google.");
        return;
      }

      // 👇 Cerramos cuando el navegador llegue a redirectTo
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo
      );

      if (result.type !== "success") {
        setErrorMsg("Inicio de sesión con Google cancelado.");
        return;
      }

      const ok = await ensureClientRole();
      if (!ok) return;

      router.replace("/home");
    } catch (err: any) {
      console.error("AuthSession error:", err);
      setErrorMsg("Ocurrió un error con Google. Intenta de nuevo.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const goToRegister = () => {
    router.push("/register");
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <View className="flex-1 bg-slate-950 px-6 justify-center">
      {/* Logo + texto */}
      <View className="items-center mb-3">
        <Image
          source={require("../assets/LogoNoBack.png")}
          className="w-20 h-20 mb-1"
          resizeMode="contain"
        />
        <Text className="text-white text-2xl font-bold">ZaHub 🍕</Text>
      </View>

      <Text className="text-slate-200 text-lg text-center mb-5">
        Inicia sesión
      </Text>

      {errorMsg ? (
        <Text className="text-red-300 text-center mb-3">{errorMsg}</Text>
      ) : null}

      {/* Formulario */}
      <View className="mb-6 space-y-4">
        <View>
          <Text className="text-slate-400 mb-1 text-sm">
            Correo electrónico
          </Text>
          <TextInput
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-50"
            placeholder="tucorreo@ejemplo.com"
            placeholderTextColor="#6B7280"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View>
          <Text className="text-slate-400 mb-1 text-sm">Contraseña</Text>
          <View className="relative">
            <TextInput
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 pr-11 text-slate-50"
              placeholder="••••••••"
              placeholderTextColor="#6B7280"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              className="absolute right-3 top-2.5"
              onPress={togglePasswordVisibility}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TouchableOpacity
        className={`bg-red-500 rounded-full py-3 mb-3 items-center ${
          (loading || googleLoading) && "opacity-70"
        }`}
        onPress={handleLogin}
        disabled={loading || googleLoading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="text-slate-50 text-base font-semibold">
            Entrar
          </Text>
        )}
      </TouchableOpacity>

      {/* Botón Google */}
      <TouchableOpacity
        className={`bg-slate-50 rounded-full py-3 mb-4 flex-row items-center justify-center ${
          (loading || googleLoading) && "opacity-70"
        }`}
        onPress={handleGoogleLogin}
        disabled={loading || googleLoading}
      >
        {googleLoading ? (
          <ActivityIndicator color="#111827" />
        ) : (
          <>
            <Ionicons name="logo-google" size={18} color="#111827" />
            <Text className="text-slate-900 text-sm font-semibold ml-2">
              Continuar con Google
            </Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={goToRegister}>
        <Text className="text-slate-400 text-center">
          ¿No tienes cuenta?{" "}
          <Text className="text-orange-400 font-semibold">Regístrate</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}
