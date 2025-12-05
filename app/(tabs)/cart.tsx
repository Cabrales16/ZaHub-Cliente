// app/(tabs)/cart.tsx
import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabaseClient";
import { useRouter, useFocusEffect } from "expo-router";

type Tamano = "PERSONAL" | "MEDIANA" | "FAMILIAR";

type CarritoItem = {
  id: string;
  usuario_id: string;
  pizza_base_id: string | null;
  nombre_personalizado: string | null;
  tamano: Tamano;
  masa: string | null;
  borde: string | null;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
};

type CarritoItemIngrediente = {
  id: string;
  carrito_item_id: string;
  ingrediente_id: string;
  tipo: "NORMAL" | "EXTRA" | "SIN";
  precio_extra: number;
};

const formatCOP = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
  }).format(value);

export default function CartScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CarritoItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [usuarioAppId, setUsuarioAppId] = useState<string | null>(null);

  // ──────────────────────────────────────────────
  // 1. Cargar carrito (se llamará cada vez que el tab gane foco)
  // ──────────────────────────────────────────────
  const loadCart = useCallback(async () => {
    setLoading(true);

    // 1. Usuario autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("Error autenticación:", authError);
      setLoading(false);
      Alert.alert(
        "Error",
        "No se pudo validar tu sesión. Vuelve a iniciar sesión."
      );
      return;
    }

    if (!user) {
      setLoading(false);
      Alert.alert("Inicia sesión", "Debes iniciar sesión para ver tu carrito.", [
        {
          text: "Ir a inicio",
          onPress: () => router.push("/login"),
        },
      ]);
      return;
    }

    // 2. Buscar usuario_app
    const { data: usuarioApp, error: usuarioError } = await supabase
      .from("usuarios_app")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (usuarioError || !usuarioApp) {
      console.error("Error usuarios_app:", usuarioError);
      setLoading(false);
      Alert.alert(
        "Error",
        "No encontramos tu perfil en usuarios_app. Revisa la configuración."
      );
      return;
    }

    const usuarioId = usuarioApp.id as string;
    setUsuarioAppId(usuarioId);

    // 3. Cargar items de carrito
    const { data: carritoData, error: carritoError } = await supabase
      .from("carrito_items")
      .select(
        "id, usuario_id, pizza_base_id, nombre_personalizado, tamano, masa, borde, cantidad, precio_unitario, subtotal"
      )
      .eq("usuario_id", usuarioId)
      .order("created_at", { ascending: true });

    if (carritoError) {
      console.error("Error carrito_items:", carritoError);
      setLoading(false);
      Alert.alert("Error", "No se pudieron cargar los productos del carrito.");
      return;
    }

    const normalizados: CarritoItem[] = (carritoData || []).map((it: any) => ({
      id: it.id,
      usuario_id: it.usuario_id,
      pizza_base_id: it.pizza_base_id,
      nombre_personalizado: it.nombre_personalizado,
      tamano: it.tamano,
      masa: it.masa,
      borde: it.borde,
      cantidad: Number(it.cantidad || 0),
      precio_unitario: Number(it.precio_unitario || 0),
      subtotal: Number(it.subtotal || 0),
    }));

    setItems(normalizados);
    setLoading(false);
  }, [router]);

  // 👉 Esto hace que loadCart se ejecute cada vez que entras al tab "Carrito"
  useFocusEffect(
    useCallback(() => {
      loadCart();
    }, [loadCart])
  );

  // ──────────────────────────────────────────────
  // 2. Total del carrito
  // ──────────────────────────────────────────────
  const totalCarrito = useMemo(
    () => items.reduce((acc, it) => acc + it.subtotal, 0),
    [items]
  );

  // ──────────────────────────────────────────────
  // 3. Actualizar cantidad / eliminar item
  // ──────────────────────────────────────────────
  const updateCantidad = async (itemId: string, nuevaCantidad: number) => {
    if (saving) return;

    const item = items.find((it) => it.id === itemId);
    if (!item) return;

    if (nuevaCantidad <= 0) {
      await removeItem(itemId);
      return;
    }

    try {
      setSaving(true);
      const nuevoSubtotal = item.precio_unitario * nuevaCantidad;

      const { error } = await supabase
        .from("carrito_items")
        .update({
          cantidad: nuevaCantidad,
          subtotal: nuevoSubtotal,
        })
        .eq("id", itemId);

      if (error) {
        console.error("Error actualizando cantidad:", error);
        Alert.alert("Error", "No se pudo actualizar la cantidad.");
      } else {
        setItems((prev) =>
          prev.map((it) =>
            it.id === itemId
              ? { ...it, cantidad: nuevaCantidad, subtotal: nuevoSubtotal }
              : it
          )
        );
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Ocurrió un problema al actualizar el carrito.");
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (itemId: string) => {
    if (saving) return;
    try {
      setSaving(true);

      const { error: ingError } = await supabase
        .from("carrito_item_ingredientes")
        .delete()
        .eq("carrito_item_id", itemId);

      if (ingError) {
        console.error("Error borrando ingredientes de carrito:", ingError);
      }

      const { error: itemError } = await supabase
        .from("carrito_items")
        .delete()
        .eq("id", itemId);

      if (itemError) {
        console.error("Error borrando item de carrito:", itemError);
        Alert.alert("Error", "No se pudo eliminar el producto del carrito.");
      } else {
        setItems((prev) => prev.filter((it) => it.id !== itemId));
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Ocurrió un problema al eliminar el producto.");
    } finally {
      setSaving(false);
    }
  };

  const clearCartLocallyAndDB = async () => {
    if (!usuarioAppId || items.length === 0) return;

    const { error: ingError } = await supabase
      .from("carrito_item_ingredientes")
      .delete()
      .in(
        "carrito_item_id",
        items.map((i) => i.id)
      );

    if (ingError) {
      console.error("Error limpiando ingredientes carrito:", ingError);
    }

    const { error: itemsError } = await supabase
      .from("carrito_items")
      .delete()
      .eq("usuario_id", usuarioAppId);

    if (itemsError) {
      console.error("Error limpiando carrito_items:", itemsError);
    }

    setItems([]);
  };

  // ──────────────────────────────────────────────
  // 4. Confirmar pedido -> pedidos + pedido_items + pedido_item_ingredientes
  // ──────────────────────────────────────────────
  const handleConfirmarPedido = async () => {
    if (saving) return;
    if (!usuarioAppId) {
      Alert.alert(
        "Error",
        "No se pudo identificar tu usuario. Vuelve a iniciar sesión."
      );
      return;
    }

    if (items.length === 0) {
      Alert.alert("Carrito vacío", "Agrega alguna Za antes de continuar.");
      return;
    }

    Alert.alert(
      "Confirmar pedido",
      `Vas a crear un pedido por ${formatCOP(totalCarrito)}.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          style: "default",
          onPress: async () => {
            try {
              setSaving(true);

              const { data: pedido, error: pedidoError } = await supabase
                .from("pedidos")
                .insert({
                  cliente_id: usuarioAppId,
                  estado: "PENDIENTE",
                  total: totalCarrito,
                  metodo_pago: null,
                  direccion_entrega:
                    "Pendiente por confirmar (generado desde la app ZaHub)",
                  referencia_direccion: null,
                  notas_cliente: null,
                  canal: "APP_MOBILE",
                  asignado_a_usuario_id: null,
                })
                .select("id")
                .single();

              if (pedidoError || !pedido) {
                console.error("Error creando pedido:", pedidoError);
                Alert.alert(
                  "Error",
                  "No se pudo crear el pedido. Intenta más tarde."
                );
                setSaving(false);
                return;
              }

              const pedidoId = pedido.id as string;

              for (const item of items) {
                const { data: pedidoItem, error: pedidoItemError } =
                  await supabase
                    .from("pedido_items")
                    .insert({
                      pedido_id: pedidoId,
                      pizza_base_id: item.pizza_base_id,
                      nombre_personalizado: item.nombre_personalizado,
                      tamano: item.tamano,
                      cantidad: item.cantidad,
                      precio_unitario: item.precio_unitario,
                      subtotal: item.subtotal,
                    })
                    .select("id")
                    .single();

                if (pedidoItemError || !pedidoItem) {
                  console.error(
                    "Error creando pedido_item para carrito_item",
                    item.id,
                    pedidoItemError
                  );
                  continue;
                }

                const pedidoItemId = pedidoItem.id as string;

                const { data: carIng, error: carIngError } = await supabase
                  .from("carrito_item_ingredientes")
                  .select(
                    "id, carrito_item_id, ingrediente_id, tipo, precio_extra"
                  )
                  .eq("carrito_item_id", item.id);

                if (carIngError) {
                  console.error(
                    "Error obteniendo carrito_item_ingredientes:",
                    carIngError
                  );
                  continue;
                }

                const payloadIngredientes: Partial<CarritoItemIngrediente>[] =
                  (carIng || []).map((ci: any) => ({
                    ingrediente_id: ci.ingrediente_id,
                    tipo: ci.tipo,
                    precio_extra: Number(ci.precio_extra || 0),
                    pedido_item_id: pedidoItemId,
                  })) as any;

                if (payloadIngredientes.length > 0) {
                  const { error: pedidoIngError } = await supabase
                    .from("pedido_item_ingredientes")
                    .insert(payloadIngredientes);

                  if (pedidoIngError) {
                    console.error(
                      "Error insertando pedido_item_ingredientes:",
                      pedidoIngError
                    );
                  }
                }
              }

              await clearCartLocallyAndDB();

              setSaving(false);
              Alert.alert(
                "Pedido creado 🎉",
                "Tu pedido fue registrado como PENDIENTE. Te notificaremos su estado.",
                [
                  {
                    text: "Ver pedidos",
                    onPress: () => router.push("/(tabs)/orders"),
                  },
                  {
                    text: "Volver al inicio",
                    onPress: () => router.push("/(tabs)"),
                  },
                ]
              );
            } catch (e) {
              console.error(e);
              setSaving(false);
              Alert.alert(
                "Error",
                "Ocurrió un problema al crear el pedido."
              );
            }
          },
        },
      ]
    );
  };

  // ──────────────────────────────────────────────
  // 5. Render
  // ──────────────────────────────────────────────
  if (loading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator color="#fb923c" />
        <Text className="text-slate-400 text-xs mt-2">
          Cargando tu carrito...
        </Text>
      </View>
    );
  }

  const empty = items.length === 0;

  return (
    <View className="flex-1 bg-slate-950 pt-10 px-4 pb-3">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View>
          <Text className="text-white text-2xl font-bold">Tu carrito 🛒</Text>
          <Text className="text-slate-400 text-xs">
            Revisa tus Zas antes de confirmar el pedido.
          </Text>
        </View>
        <Ionicons name="cart-outline" size={24} color="#fb923c" />
      </View>

      {empty ? (
        <View className="flex-1 items-center justify-center">
          <Ionicons name="pizza-outline" size={40} color="#4b5563" />
          <Text className="text-slate-300 text-sm mt-2">
            Aún no tienes Zas en tu carrito.
          </Text>
          <TouchableOpacity
            className="mt-3 px-4 py-2 rounded-full bg-red-500"
            onPress={() => router.push("/(tabs)")}
          >
            <Text className="text-white text-xs font-semibold">
              Ver promociones
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Lista de items */}
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 12 }}
          >
            {items.map((item) => {
              const labelTam =
                item.tamano === "PERSONAL"
                  ? "Personal"
                  : item.tamano === "MEDIANA"
                  ? "Mediana"
                  : "Familiar";

              return (
                <View
                  key={item.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl px-3 py-3 mb-3"
                >
                  <View className="flex-row justify-between items-start mb-1">
                    <View className="flex-1 mr-2">
                      <Text
                        className="text-white text-sm font-semibold"
                        numberOfLines={2}
                      >
                        {item.nombre_personalizado || "Za personalizada"}
                      </Text>
                      <Text className="text-slate-400 text-[11px] mt-1">
                        Tamaño: {labelTam}
                      </Text>
                      {item.masa && (
                        <Text className="text-slate-400 text-[11px]">
                          Masa: {item.masa}
                        </Text>
                      )}
                      {item.borde && (
                        <Text className="text-slate-400 text-[11px]">
                          Borde: {item.borde}
                        </Text>
                      )}
                    </View>

                    <TouchableOpacity
                      onPress={() => removeItem(item.id)}
                      disabled={saving}
                    >
                      <Ionicons name="trash-outline" size={18} color="#f97373" />
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row items-center justify-between mt-2">
                    <View className="flex-row items-center">
                      <TouchableOpacity
                        className="w-7 h-7 rounded-full border border-slate-600 items-center justify-center mr-2"
                        onPress={() =>
                          updateCantidad(item.id, item.cantidad - 1)
                        }
                        disabled={saving}
                      >
                        <Text className="text-slate-200 text-sm">-</Text>
                      </TouchableOpacity>
                      <Text className="text-slate-100 text-sm">
                        {item.cantidad}
                      </Text>
                      <TouchableOpacity
                        className="w-7 h-7 rounded-full border border-slate-600 items-center justify-center ml-2"
                        onPress={() =>
                          updateCantidad(item.id, item.cantidad + 1)
                        }
                        disabled={saving}
                      >
                        <Text className="text-slate-200 text-sm">+</Text>
                      </TouchableOpacity>
                    </View>

                    <View className="items-end">
                      <Text className="text-slate-400 text-[11px]">
                        c/u {formatCOP(item.precio_unitario)}
                      </Text>
                      <Text className="text-orange-400 text-sm font-bold">
                        {formatCOP(item.subtotal)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Barra inferior */}
          <View className="pt-3 border-t border-slate-800">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-slate-400 text-xs">Total del carrito</Text>
              <Text className="text-orange-400 text-lg font-bold">
                {formatCOP(totalCarrito)}
              </Text>
            </View>

            <TouchableOpacity
              className="bg-red-500 rounded-full py-3 items-center"
              onPress={handleConfirmarPedido}
              disabled={saving}
            >
              <Text className="text-white text-sm font-semibold">
                {saving ? "Procesando pedido..." : "Confirmar pedido"}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}
