// app/(tabs)/promo-detail.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabaseClient";

type Promotion = {
  id: string;
  titulo: string;
  subtitulo: string | null;
  badge: string | null;
  image_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
};

export default function PromoDetailScreen() {
  const router = useRouter();
  const { promoId } = useLocalSearchParams<{ promoId?: string }>();

  const [promo, setPromo] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchPromo = async () => {
      if (!promoId) {
        setErrorMsg("No se recibió el identificador de la promoción.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMsg("");

      const { data, error } = await supabase
        .from("promociones")
        .select(
          "id, titulo, subtitulo, badge, image_url, starts_at, ends_at"
        )
        .eq("id", promoId)
        .single();

      if (error || !data) {
        console.error("Error cargando promoción:", error);
        setErrorMsg("No encontramos los detalles de esta promoción.");
        setPromo(null);
      } else {
        setPromo(data as Promotion);
      }

      setLoading(false);
    };

    fetchPromo();
  }, [promoId]);

  const formatDate = (value: string | null) => {
    if (!value) return null;
    return new Date(value).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator color="#fb923c" />
      </View>
    );
  }

  if (errorMsg || !promo) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center px-6">
        <Text className="text-red-400 mb-3">
          {errorMsg || "No encontramos los detalles de esta promoción."}
        </Text>
        <TouchableOpacity
          className="bg-red-500 rounded-full px-6 py-2"
          onPress={() => router.back()}
        >
          <Text className="text-white text-sm font-semibold">
            Volver al inicio
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const start = formatDate(promo.starts_at);
  const end = formatDate(promo.ends_at);

  return (
    <View className="flex-1 bg-slate-950 pt-12 px-5 pb-3">
      {/* Header */}
      <View className="flex-row items-center mb-4">
        <TouchableOpacity className="mr-2" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">
          Detalle de promoción
        </Text>
      </View>

      <View className="flex-1">
        <ScrollView
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Imagen */}
          {promo.image_url ? (
            <Image
              source={{ uri: promo.image_url }}
              className="w-full h-48 rounded-2xl mb-4 bg-slate-800"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-48 rounded-2xl mb-4 bg-slate-800 items-center justify-center">
              <Ionicons name="pricetag-outline" size={40} color="#9CA3AF" />
            </View>
          )}

          {/* Badge + título */}
          {promo.badge && (
            <Text className="text-[10px] self-start px-2 py-1 rounded-full bg-red-500/20 text-red-300 font-semibold uppercase mb-2">
              {promo.badge}
            </Text>
          )}

          <Text className="text-white text-2xl font-bold mb-2">
            {promo.titulo}
          </Text>

          {promo.subtitulo && (
            <Text className="text-slate-300 text-sm mb-4">
              {promo.subtitulo}
            </Text>
          )}

          {/* Vigencia */}
          {(start || end) && (
            <View className="mb-4">
              <Text className="text-slate-300 text-sm mb-1">Vigencia</Text>
              <Text className="text-slate-400 text-xs">
                {start && end
                  ? `Disponible del ${start} al ${end}.`
                  : start
                  ? `Disponible desde el ${start}.`
                  : `Disponible hasta el ${end}.`}
              </Text>
            </View>
          )}

          {/* Nota */}
          <View className="mb-2">
            <Text className="text-slate-400 text-xs">
              Aplica solo para pedidos realizados desde la app ZaHub. Pueden
              aplicar restricciones adicionales según disponibilidad.
            </Text>
          </View>
        </ScrollView>

        {/* Barra de acciones */}
        <View className="flex-row pt-3 border-t border-slate-800">
          <TouchableOpacity
            className="flex-1 bg-red-500 rounded-full py-3 mr-2 items-center"
            onPress={() => router.push("/(tabs)/menu")}
          >
            <Text className="text-white text-sm font-semibold">
              Ver Zas del menú
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 border border-slate-600 rounded-full py-3 items-center"
            onPress={() => router.back()}
          >
            <Text className="text-slate-200 text-sm font-semibold">
              Cerrar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
