// app/(tabs)/index.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabaseClient";

type Promotion = {
  id: string;
  titulo: string;
  subtitulo: string | null;
  badge: string | null;
  image_url: string | null;
  orden?: number | null;
};

type PromotionCardProps = {
  promo: Promotion;
  onPress: () => void;
};

function PromotionCard({ promo, onPress }: PromotionCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800"
      style={{ flex: 1, marginBottom: 16, marginHorizontal: 4 }}
    >
      {promo.image_url ? (
        <Image
          source={{ uri: promo.image_url }}
          className="w-full h-32"
          resizeMode="cover"
        />
      ) : (
        <View className="w-full h-32 bg-slate-800 items-center justify-center">
          <Ionicons name="pizza-outline" size={28} color="#9CA3AF" />
        </View>
      )}

      <View className="p-3">
        {promo.badge ? (
          <Text className="text-[10px] self-start px-2 py-1 rounded-full bg-red-500/20 text-red-300 font-semibold uppercase mb-2">
            {promo.badge}
          </Text>
        ) : null}

        <Text
          className="text-white text-sm font-semibold mb-1"
          numberOfLines={2}
        >
          {promo.titulo}
        </Text>

        {promo.subtitulo ? (
          <Text className="text-slate-400 text-xs" numberOfLines={3}>
            {promo.subtitulo}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default function HomeTabsScreen() {
  const router = useRouter();
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loadingPromos, setLoadingPromos] = useState(true);
  const [errorPromos, setErrorPromos] = useState("");

  const goToMenu = () => {
    // 👈 nos quedamos dentro del grupo (tabs)
    router.push("/(tabs)/menu");
  };

  const goToPromoDetail = (promoId: string) => {
    // 👈 también dentro del grupo (tabs), así NO se esconde la barra
    router.push(`/(tabs)/promo-detail?promoId=${promoId}`);
  };

  useEffect(() => {
    const fetchPromos = async () => {
      setLoadingPromos(true);
      setErrorPromos("");

      const { data, error } = await supabase
        .from("promociones")
        .select("id, titulo, subtitulo, badge, image_url, orden")
        .eq("is_active", true)
        .order("orden", { ascending: true })
        .limit(20);

      if (error) {
        console.error("Error cargando promociones:", error);
        setErrorPromos("No se pudieron cargar las promociones.");
      } else {
        setPromos((data || []) as Promotion[]);
      }

      setLoadingPromos(false);
    };

    fetchPromos();
  }, []);

  if (loadingPromos) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator color="#fb923c" />
      </View>
    );
  }

  if (errorPromos || promos.length === 0) {
    return (
      <View className="flex-1 bg-slate-950 pt-12 px-4">
        <View className="mb-4">
          <Text className="text-white text-3xl font-bold mb-1">
            ¿Se te antoja algo hoy? 🍕
          </Text>
          <Text className="text-slate-400 text-sm">
            En este momento no podemos mostrar promociones. Inténtalo de nuevo
            en unos minutos.
          </Text>
        </View>

        <View className="mt-10">
          <Text className="text-red-400 text-xs mb-2">
            {errorPromos ||
              "Aún no hay promociones activas. Vuelve más tarde. 🍕"}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-950 pt-12 px-4">
      <FlatList
        data={promos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PromotionCard
            promo={item}
            onPress={() => goToPromoDetail(item.id)}
          />
        )}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 4 }}
        ListHeaderComponent={
          <View className="mb-4">
            {/* Header más llamativo */}
            <View className="mb-4">
              <Text className="text-white text-3xl font-bold mb-1">
                ¿Se te antoja algo hoy? 🍕
              </Text>
              <Text className="text-slate-400 text-sm">
                Descubre promos pensadas para tu antojo perfecto y arma tu Za
                ideal en segundos.
              </Text>
            </View>

            {/* Título sección + link menú */}
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs text-slate-400 font-semibold">
                NOVEDADES Y PROMOCIONES
              </Text>

              <TouchableOpacity onPress={goToMenu}>
                <Text className="text-orange-400 text-xs font-semibold">
                  Ver menú completo
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        }
      />
    </View>
  );
}
