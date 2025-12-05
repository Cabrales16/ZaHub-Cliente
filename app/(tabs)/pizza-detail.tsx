// app/(tabs)/pizza-detail.tsx
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

type ZaProducto = {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  tag: string | null;
  imagen_url: string | null;
};

export default function PizzaDetailScreen() {
  const router = useRouter();
  const { pizzaId } = useLocalSearchParams<{ pizzaId?: string }>();

  const [za, setZa] = useState<ZaProducto | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
    }).format(value);

  useEffect(() => {
    const fetchZa = async () => {
      if (!pizzaId) {
        setErrorMsg("No se recibió el identificador de la Za.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMsg("");

      const { data, error } = await supabase
        .from("productos")
        .select("id, nombre, descripcion, precio, tag, imagen_url")
        .eq("id", pizzaId)
        .single();

      if (error || !data) {
        console.error("Error cargando Za:", error);
        setErrorMsg("No encontramos los detalles de esta Za.");
        setZa(null);
      } else {
        setZa(data as ZaProducto);
      }

      setLoading(false);
    };

    fetchZa();
  }, [pizzaId]);

  const handleAddToCart = () => {
    if (!za) return;
    console.log(`Agregar al carrito: ${za.nombre} x${quantity}`);
    router.back();
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator color="#fb923c" />
      </View>
    );
  }

  if (errorMsg || !za) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center px-6">
        <Text className="text-red-400 mb-3">
          {errorMsg || "No encontramos los detalles de esta Za."}
        </Text>
        <TouchableOpacity
          className="bg-red-500 rounded-full px-6 py-2"
          onPress={() => router.back()}
        >
          <Text className="text-white text-sm font-semibold">
            Volver al menú
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-950 pt-12 px-5 pb-3">
      {/* Header */}
      <View className="flex-row items-center mb-4">
        <TouchableOpacity className="mr-2" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Detalle de Za</Text>
      </View>

      {/* Contenido + botones fijos abajo */}
      <View className="flex-1">
        <ScrollView
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Imagen */}
          {za.imagen_url ? (
            <Image
              source={{ uri: za.imagen_url }}
              className="w-full h-48 rounded-2xl mb-4 bg-slate-800"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-48 rounded-2xl mb-4 bg-slate-800 items-center justify-center">
              <Ionicons name="pizza-outline" size={40} color="#9CA3AF" />
            </View>
          )}

          {/* Nombre + tag + precio */}
          <View className="mb-3">
            <View className="flex-row items-center mb-1">
              <Text className="text-white text-2xl font-bold mr-2">
                {za.nombre}
              </Text>
              {za.tag && (
                <Text className="text-[10px] px-2 py-1 rounded-full bg-red-500/20 text-red-300 font-semibold uppercase">
                  {za.tag}
                </Text>
              )}
            </View>
            <Text className="text-orange-400 font-bold text-base">
              {formatPrice(za.precio)}
            </Text>
          </View>

          {/* Descripción */}
          <View className="mb-4">
            <Text className="text-slate-300 text-sm mb-1">Descripción</Text>
            <Text className="text-slate-400 text-xs">
              {za.descripcion || "Deliciosa Za preparada al estilo ZaHub."}
            </Text>
          </View>

          {/* Info fija */}
          <View className="mb-4">
            <Text className="text-slate-300 text-sm mb-1">Tamaño y masa</Text>
            <Text className="text-slate-400 text-xs mb-1">
              Tamaño mediano (8 porciones). Masa tradicional, borde clásico.
            </Text>
            <Text className="text-slate-400 text-xs">
              Más adelante podrás elegir tamaño, tipo de masa y borde relleno
              desde esta misma pantalla.
            </Text>
          </View>

          {/* Cantidad */}
          <View className="mb-2">
            <Text className="text-slate-300 text-sm mb-2">Cantidad</Text>
            <View className="flex-row items-center">
              <TouchableOpacity
                className="w-9 h-9 rounded-full border border-slate-600 items-center justify-center"
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Ionicons name="remove" size={16} color="#E5E7EB" />
              </TouchableOpacity>

              <Text className="text-white text-base font-semibold mx-4">
                {quantity}
              </Text>

              <TouchableOpacity
                className="w-9 h-9 rounded-full bg-red-500 items-center justify-center"
                onPress={() => setQuantity((q) => q + 1)}
              >
                <Ionicons name="add" size={16} color="#F9FAFB" />
              </TouchableOpacity>
            </View>

            <Text className="text-slate-400 text-xs mt-2">
              Total aproximado:{" "}
              <Text className="text-orange-400 font-semibold">
                {formatPrice(za.precio * quantity)}
              </Text>
            </Text>
          </View>
        </ScrollView>

        {/* Barra de acciones fija abajo */}
        <View className="flex-row pt-3 border-t border-slate-800">
          <TouchableOpacity
            className="flex-1 bg-red-500 rounded-full py-3 mr-2 items-center"
            onPress={handleAddToCart}
          >
            <Text className="text-white text-sm font-semibold">
              Agregar al carrito
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 border border-slate-600 rounded-full py-3 items-center"
            onPress={() => router.back()}
          >
            <Text className="text-slate-200 text-sm font-semibold">
              Cancelar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
