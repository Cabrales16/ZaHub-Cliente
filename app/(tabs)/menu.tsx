// app/(tabs)/menu.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabaseClient";

type Pizza = {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  tag: string | null;
  imagen_url: string | null;
};

export default function MenuScreen() {
  const router = useRouter();
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleOpenDetail = (pizza: Pizza) => {
    router.push({
      pathname: "/(tabs)/pizza-detail",
      params: { pizzaId: pizza.id },
    });
  };


  const renderPizza = ({ item }: { item: Pizza }) => {
    const isSelected = selectedIds.includes(item.id);

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => handleOpenDetail(item)}
        onLongPress={() => toggleSelect(item.id)}
        className={`border rounded-2xl p-3 mb-3 flex-row ${
          isSelected
            ? "bg-slate-800 border-red-500/70"
            : "bg-slate-900 border-slate-800"
        }`}
      >
        {item.imagen_url ? (
          <Image
            source={{ uri: item.imagen_url }}
            className="w-16 h-16 rounded-xl mr-3 bg-slate-800"
            resizeMode="cover"
          />
        ) : (
          <View className="w-16 h-16 rounded-xl mr-3 bg-slate-800 items-center justify-center">
            <Ionicons name="pizza-outline" size={20} color="#9CA3AF" />
          </View>
        )}

        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <Text className="text-white text-base font-semibold mr-2">
              {item.nombre}
            </Text>
            {item.tag && (
              <Text className="text-[10px] px-2 py-1 rounded-full bg-red-500/20 text-red-300 font-semibold uppercase">
                {item.tag}
              </Text>
            )}
          </View>

          {item.descripcion ? (
            <Text className="text-slate-400 text-xs mb-2">
              {item.descripcion}
            </Text>
          ) : null}

          <Text className="text-orange-400 font-bold">
            {new Intl.NumberFormat("es-CO", {
              style: "currency",
              currency: "COP",
            }).format(item.precio)}
          </Text>
        </View>

        <View className="justify-center items-center ml-2">
          {isSelected ? (
            <Ionicons name="checkmark-circle" size={22} color="#22C55E" />
          ) : (
            <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    const fetchPizzas = async () => {
      setLoading(true);
      setErrorMsg("");

      const { data, error } = await supabase
        .from("productos")
        .select("id, nombre, descripcion, precio, tag, imagen_url")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error cargando productos:", error);
        setErrorMsg("No se pudo cargar el menú de Zas.");
      } else {
        setPizzas((data || []) as Pizza[]);
      }

      setLoading(false);
    };

    fetchPizzas();
  }, []);

  return (
    <View className="flex-1 bg-slate-950 pt-12 px-5">
      <View className="mb-2">
        <Text className="text-white text-xl font-bold">Menú de pizzas</Text>
        <Text className="text-slate-400 text-xs mt-1">
          Toca una Za para ver sus detalles. Mantén pulsado para seleccionar
          varias si quieres armar varios pedidos seguidos.
        </Text>
        {selectedIds.length > 0 && (
          <Text className="text-emerald-400 text-[11px] mt-2">
            Zas seleccionadas: {selectedIds.length}
          </Text>
        )}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#fb923c" />
        </View>
      ) : errorMsg ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-red-400 text-xs text-center">{errorMsg}</Text>
        </View>
      ) : (
        <FlatList
          data={pizzas}
          keyExtractor={(item) => item.id}
          renderItem={renderPizza}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
