// app/register.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabaseClient";
import { Ionicons } from "@expo/vector-icons";

function isValidEmail(email: string) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Al menos 8 caracteres, con mayúsculas, minúsculas, número y caracter no alfanumérico
function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }
  if (!/[A-Z]/.test(password)) {
    return "La contraseña debe incluir al menos una letra mayúscula.";
  }
  if (!/[a-z]/.test(password)) {
    return "La contraseña debe incluir al menos una letra minúscula.";
  }
  if (!/[0-9]/.test(password)) {
    return "La contraseña debe incluir al menos un número.";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "La contraseña debe incluir al menos un carácter especial.";
  }
  return null;
}

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordInfo, setShowPasswordInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleRegister = async () => {
    setErrorMsg("");
    setInfoMsg("");

    if (!name || !email || !password) {
      setErrorMsg("Por favor completa todos los campos.");
      return;
    }

    if (name.trim().length < 3) {
      setErrorMsg("El nombre debe tener al menos 3 caracteres.");
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMsg("Ingresa un correo electrónico válido.");
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setErrorMsg(passwordError);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name.trim(),
            role: "CLIENTE", // 👈 el rol se guarda aquí
          },
        },
      });

      // Caso en que el correo ya exista
      if (!error && data?.user && data.user.identities?.length === 0) {
        setErrorMsg("Este correo ya está registrado. Intenta iniciar sesión.");
        return;
      }

      if (error) {
        console.log("Supabase signUp error:", error);
        const message = error.message?.toLowerCase?.() || "";

        if (
          message.includes("already registered") ||
          message.includes("user already exists") ||
          message.includes("already exists")
        ) {
          setErrorMsg("Este correo ya está registrado. Intenta iniciar sesión.");
        } else if (message.includes("password")) {
          setErrorMsg(
            "La contraseña no cumple los requisitos. Revisa las indicaciones."
          );
        } else {
          setErrorMsg(
            "Ocurrió un error al registrarte. Intenta de nuevo más tarde."
          );
        }

        return;
      }

      setInfoMsg("");
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error("Error register:", error);
      setErrorMsg("Ocurrió un error al registrarte. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    setShowSuccessModal(false);
    router.replace("/login");
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const togglePasswordInfo = () => {
    setShowPasswordInfo((prev) => !prev);
  };

  return (
    <View className="flex-1 bg-slate-950 px-6 justify-center">
      {/* Flecha para volver a login */}
      <TouchableOpacity
        className="absolute top-12 left-6"
        onPress={() => router.replace("/login")}
      >
        <Ionicons name="arrow-back" size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* Logo + texto */}
      <View className="items-center mb-3">
        <Image
          source={require("../assets/LogoNoBack.png")}
          className="w-20 h-20 mb-1"
          resizeMode="contain"
        />
        <Text className="text-slate-50 text-2xl font-bold">ZaHub</Text>
      </View>

      <Text className="text-slate-200 text-lg text-center mb-5">
        Crear cuenta
      </Text>

      {errorMsg ? (
        <Text className="text-red-300 text-center mb-3">{errorMsg}</Text>
      ) : null}
      {infoMsg ? (
        <Text className="text-emerald-300 text-center mb-3">{infoMsg}</Text>
      ) : null}

      {/* Formulario */}
      <View className="mb-6 space-y-4">
        <View>
          <Text className="text-slate-400 mb-1 text-sm">Nombre completo</Text>
          <TextInput
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-50"
            placeholder="Tu nombre"
            placeholderTextColor="#6B7280"
            value={name}
            onChangeText={setName}
          />
        </View>

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
          {/* Label + icono info */}
          <View className="flex-row items-center mb-1 space-x-1">
            <Text className="text-slate-400 text-sm">Contraseña</Text>
            <TouchableOpacity
              onPress={togglePasswordInfo}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>

          {showPasswordInfo && (
            <View className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 mb-2">
              <Text className="text-slate-400 text-xs">
                Requisitos: mínimo 8 caracteres, con mayúsculas, minúsculas,
                números y un carácter especial.
              </Text>
            </View>
          )}

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
          loading ? "opacity-70" : ""
        }`}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="text-slate-50 text-base font-semibold">
            Registrar
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={goToLogin}>
        <Text className="text-slate-400 text-center text-sm">
          ¿Ya tienes cuenta?{" "}
          <Text className="text-orange-400 font-semibold">Inicia sesión</Text>
        </Text>
      </TouchableOpacity>

      {/* Modal éxito registro */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View className="flex-1 bg-black/60 justify-center items-center">
          <View className="bg-slate-950 rounded-2xl p-5 w-4/5 items-center border border-slate-700">
            <Ionicons
              name="mail-open-outline"
              size={40}
              color="#10B981"
              style={{ marginBottom: 8 }}
            />
            <Text className="text-slate-50 text-lg font-bold mb-1 text-center">
              ¡Registro exitoso!
            </Text>
            <Text className="text-slate-300 text-sm text-center mb-4">
              Te enviamos un correo de confirmación. Revisa tu bandeja de
              entrada (y spam) para activar tu cuenta.
            </Text>
            <TouchableOpacity
              className="bg-red-500 rounded-full py-2 px-5"
              onPress={goToLogin}
            >
              <Text className="text-slate-50 text-sm font-semibold">
                Ir a iniciar sesión
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
