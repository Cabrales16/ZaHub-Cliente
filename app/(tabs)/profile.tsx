// app/(tabs)/profile.tsx
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabaseClient";

type UserInfo = {
  email: string | null;
  name: string | null;
  role: string | null;
};

export default function ProfileScreen() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo>({
    email: null,
    name: null,
    role: null,
  });

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) return;

      const meta: any = user.user_metadata || {};
      setUserInfo({
        email: user.email,
        name: meta.full_name || null,
        role: (meta.role || "").toString().toUpperCase() || null,
      });
    };

    loadUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <View className="flex-1 bg-slate-950 pt-14 px-6">
      <Text className="text-white text-2xl font-bold mb-1">Mi perfil</Text>
      <Text className="text-slate-400 text-xs mb-6">
        Administra tu cuenta de ZaHub, revisa tus datos y cierra sesión cuando quieras.
      </Text>

      <View className="bg-slate-900 rounded-2xl p-4 mb-4 border border-slate-800">
        <Text className="text-slate-400 text-xs mb-1">Nombre</Text>
        <Text className="text-white text-base font-semibold mb-3">
          {userInfo.name || "ZaLover"}
        </Text>

        <Text className="text-slate-400 text-xs mb-1">Correo electrónico</Text>
        <Text className="text-slate-100 text-sm mb-3">
          {userInfo.email || "—"}
        </Text>

        <Text className="text-slate-400 text-xs mb-1">Rol</Text>
        <Text className="text-emerald-400 text-xs font-semibold">
          {userInfo.role || "CLIENTE"}
        </Text>
      </View>

      <View className="bg-slate-900 rounded-2xl p-4 border border-slate-800 mb-6">
        <Text className="text-slate-200 text-sm font-semibold mb-1">
          Preferencias de la cuenta
        </Text>
        <Text className="text-slate-400 text-xs">
          Próximamente podrás editar tus datos, ver tu historial de pedidos y
          configurar notificaciones personalizadas.
        </Text>
      </View>

      <TouchableOpacity
        className="bg-red-500 py-3 rounded-full items-center mt-auto mb-6"
        onPress={handleLogout}
      >
        <Text className="text-white text-base font-semibold">Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}
