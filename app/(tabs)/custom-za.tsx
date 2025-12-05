// app/(tabs)/custom-za.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "expo-router";

type Tamano = "PERSONAL" | "MEDIANA" | "FAMILIAR";

type Ingrediente = {
  id: string;
  nombre: string;
  categoria: string | null;
  precio_extra: number;
};

type TipoSeleccion = "NORMAL" | "EXTRA" | "SIN" | null;

const BASE_PRICE_BY_SIZE: Record<Tamano, number> = {
  PERSONAL: 22000,
  MEDIANA: 28000,
  FAMILIAR: 35000,
};

const MASAS = ["Tradicional", "Delgada", "Pan Pizza"];
const BORDES = ["Clásico", "Queso", "Ajo y mantequilla"];

const formatCOP = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
  }).format(value);

export default function CustomZaScreen() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [tamano, setTamano] = useState<Tamano>("PERSONAL");
  const [masa, setMasa] = useState<string>("Tradicional");
  const [borde, setBorde] = useState<string>("Clásico");
  const [nombreZa, setNombreZa] = useState<string>("Mi Za personalizada");

  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [loadingIngs, setLoadingIngs] = useState(true);
  const [errorIngs, setErrorIngs] = useState("");
  const [saving, setSaving] = useState(false);

  // id ingrediente -> NORMAL | EXTRA | SIN | null
  const [seleccionIngredientes, setSeleccionIngredientes] = useState<
    Record<string, TipoSeleccion>
  >({});

  // ──────────────────────────────────────────────
  // 1. Cargar ingredientes desde Supabase
  // ──────────────────────────────────────────────
  useEffect(() => {
    const fetchIngredientes = async () => {
      setLoadingIngs(true);
      setErrorIngs("");

      const { data, error } = await supabase
        .from("ingredientes")
        .select("id, nombre, categoria, precio_extra, activo")
        .eq("activo", true)
        .order("categoria", { ascending: true })
        .order("nombre", { ascending: true });

      if (error) {
        console.error("Error cargando ingredientes:", error);
        setErrorIngs("No se pudieron cargar los ingredientes.");
      } else {
        const normalizados = (data || []).map((ing: any) => ({
          id: ing.id as string,
          nombre: ing.nombre as string,
          categoria: (ing.categoria as string | null) || "otro",
          precio_extra: Number(ing.precio_extra || 0),
        })) as Ingrediente[];

        setIngredientes(normalizados);
      }

      setLoadingIngs(false);
    };

    fetchIngredientes();
  }, []);

  // ──────────────────────────────────────────────
  // 2. Agrupar ingredientes por categoría visual
  // ──────────────────────────────────────────────
  const ingredientesPorCategoria = useMemo(() => {
    const grupos: Record<string, Ingrediente[]> = {};
    ingredientes.forEach((ing) => {
      const cat = (ing.categoria || "otro").toLowerCase();
      if (!grupos[cat]) grupos[cat] = [];
      grupos[cat].push(ing);
    });
    return grupos;
  }, [ingredientes]);

  // Orden de categorías estilo Papa’s
  const ordenCategorias = [
    "salsa",
    "queso",
    "proteina",
    "vegetal",
    "extra",
    "borde",
    "otro",
  ];

  const categoriasOrdenadas = ordenCategorias.filter(
    (c) => ingredientesPorCategoria[c]?.length
  );

  // ──────────────────────────────────────────────
  // 3. Manejar selección de ingredientes
  // ──────────────────────────────────────────────
  const cycleTipo = (actual: TipoSeleccion): TipoSeleccion => {
    if (!actual) return "NORMAL";
    if (actual === "NORMAL") return "EXTRA";
    if (actual === "EXTRA") return "SIN";
    return null; // SIN -> nada
  };

  const toggleIngrediente = (ingId: string) => {
    setSeleccionIngredientes((prev) => {
      const next = { ...prev };
      const actual = prev[ingId] ?? null;
      const nuevo = cycleTipo(actual);
      if (nuevo === null) {
        delete next[ingId];
      } else {
        next[ingId] = nuevo;
      }
      return next;
    });
  };

  // ──────────────────────────────────────────────
  // 4. Calcular precio total aproximado
  // ──────────────────────────────────────────────
  const total = useMemo(() => {
    const base = BASE_PRICE_BY_SIZE[tamano] || 0;

    const mapIngredientes = ingredientes.reduce<Record<string, Ingrediente>>(
      (acc, ing) => {
        acc[ing.id] = ing;
        return acc;
      },
      {}
    );

    let extras = 0;

    for (const [ingId, tipo] of Object.entries(seleccionIngredientes)) {
      if (tipo === "EXTRA") {
        const ing = mapIngredientes[ingId];
        if (ing) extras += ing.precio_extra;
      }
    }

    return base + extras;
  }, [tamano, ingredientes, seleccionIngredientes]);

  // ──────────────────────────────────────────────
  // 5. Acciones: Guardar Za favorita y agregar al carrito (BD)
  // ──────────────────────────────────────────────

  const handleGuardarZa = async () => {
    Alert.alert(
      "Pendiente",
      "En una próxima iteración guardaremos tus Zas favoritas en una tabla dedicada. 😉"
    );
  };

  const handleAgregarAlCarrito = async () => {
    if (saving) return;

    try {
      setSaving(true);

      // 1. Obtener usuario autenticado
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("Error obteniendo usuario auth:", authError);
        setSaving(false);
        Alert.alert(
          "Error",
          "No se pudo validar tu sesión. Intenta volver a iniciar sesión."
        );
        return;
      }

      if (!user) {
        setSaving(false);
        Alert.alert(
          "Inicia sesión",
          "Debes iniciar sesión para agregar tu Za al carrito."
        );
        return;
      }

      // 2. Buscar registro en usuarios_app por auth_user_id
      const { data: usuarioApp, error: usuarioError } = await supabase
        .from("usuarios_app")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (usuarioError || !usuarioApp) {
        console.error("Error obteniendo usuarios_app:", usuarioError);
        setSaving(false);
        Alert.alert(
          "Error",
          "No encontramos tu perfil de usuario en ZaHub. Revisa la tabla usuarios_app."
        );
        return;
      }

      const usuarioId = usuarioApp.id as string;

      // 3. Crear item de carrito (1 unidad por ahora)
      const cantidad = 1;
      const precioUnitario = total;
      const subtotal = total * cantidad;

      const { data: carritoItem, error: carritoError } = await supabase
        .from("carrito_items")
        .insert({
          usuario_id: usuarioId,
          pizza_base_id: null, // Za totalmente personalizada
          nombre_personalizado: nombreZa,
          tamano,
          masa,
          borde,
          cantidad,
          precio_unitario: precioUnitario,
          subtotal,
        })
        .select("id")
        .single();

      if (carritoError || !carritoItem) {
        console.error("Error insertando carrito_items:", carritoError);
        setSaving(false);
        Alert.alert(
          "Error",
          "No se pudo agregar tu Za al carrito. Intenta de nuevo."
        );
        return;
      }

      const carritoItemId = carritoItem.id as string;

      // 4. Insertar ingredientes del item de carrito
      const mapIngredientes = ingredientes.reduce<Record<string, Ingrediente>>(
        (acc, ing) => {
          acc[ing.id] = ing;
          return acc;
        },
        {}
      );

      const ingredientesPayload = Object.entries(seleccionIngredientes).map(
        ([ingredienteId, tipo]) => {
          const ing = mapIngredientes[ingredienteId];
          return {
            carrito_item_id: carritoItemId,
            ingrediente_id: ingredienteId,
            tipo: tipo || "NORMAL",
            precio_extra: tipo === "EXTRA" ? ing?.precio_extra ?? 0 : 0,
          };
        }
      );

      if (ingredientesPayload.length > 0) {
        const { error: ingError } = await supabase
          .from("carrito_item_ingredientes")
          .insert(ingredientesPayload);

        if (ingError) {
          console.error(
            "Error insertando carrito_item_ingredientes:",
            ingError
          );
          // No hacemos return; el item principal existe igual
        }
      }

      setSaving(false);
      Alert.alert("¡Listo! 😋", "Tu Za personalizada fue agregada al carrito.", [
        {
          text: "Ver carrito",
          onPress: () => router.push("/(tabs)/cart"),
        },
        { text: "Seguir creando", style: "cancel" },
      ]);
    } catch (err) {
      console.error(err);
      setSaving(false);
      Alert.alert("Error", "Ocurrió un problema al agregar tu Za al carrito.");
    }
  };

  // ──────────────────────────────────────────────
  // 6. Render
  // ──────────────────────────────────────────────
  if (loadingIngs) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator color="#fb923c" />
        <Text className="text-slate-400 text-xs mt-2">
          Cargando ingredientes para tu Za...
        </Text>
      </View>
    );
  }

  if (errorIngs) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center px-6">
        <Text className="text-red-400 mb-3">{errorIngs}</Text>
        <Text className="text-slate-400 text-xs text-center">
          Revisa la tabla "ingredientes" en Supabase o intenta más tarde.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-950 pt-10 px-4 pb-3">
      {/* Encabezado tipo Papa's */}
      <View className="mb-3">
        <Text className="text-orange-400 text-xs font-semibold uppercase">
          Crea tu Za
        </Text>
        <Text className="text-white text-2xl font-bold">
          Diseña tu propia pizza 🍕
        </Text>
        <Text className="text-slate-400 text-xs mt-1">
          Elige tamaño, masa, borde y toppings. Como en Papa&apos;s Pizzeria,
          pero versión ZaHub.
        </Text>
      </View>

      {/* Pasos */}
      <View className="flex-row justify-between mb-3">
        <Paso label="Base" stepNumber={1} current={step} />
        <Paso label="Ingredientes" stepNumber={2} current={step} />
        <Paso label="Resumen" stepNumber={3} current={step} />
      </View>

      {/* Contenido del paso */}
      <View className="flex-1">
        {step === 1 && (
          <PasoBase
            tamano={tamano}
            setTamano={setTamano}
            masa={masa}
            setMasa={setMasa}
            borde={borde}
            setBorde={setBorde}
            basePrice={BASE_PRICE_BY_SIZE[tamano]}
          />
        )}

        {step === 2 && (
          <PasoIngredientes
            ingredientesPorCategoria={ingredientesPorCategoria}
            categoriasOrdenadas={categoriasOrdenadas}
            seleccionIngredientes={seleccionIngredientes}
            toggleIngrediente={toggleIngrediente}
          />
        )}

        {step === 3 && (
          <PasoResumen
            nombreZa={nombreZa}
            setNombreZa={setNombreZa}
            tamano={tamano}
            masa={masa}
            borde={borde}
            ingredientes={ingredientes}
            seleccionIngredientes={seleccionIngredientes}
            total={total}
          />
        )}
      </View>

      {/* Barra de acciones inferior */}
      <View className="pt-3 border-t border-slate-800">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-slate-400 text-xs">Total aproximado</Text>
          <Text className="text-orange-400 text-lg font-bold">
            {formatCOP(total)}
          </Text>
        </View>

        <View className="flex-row">
          {step > 1 ? (
            <TouchableOpacity
              className="flex-1 border border-slate-600 rounded-full py-3 mr-2 items-center"
              onPress={() =>
                setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : prev))
              }
              disabled={saving}
            >
              <Text className="text-slate-200 text-sm font-semibold">
                Atrás
              </Text>
            </TouchableOpacity>
          ) : (
            <View className="flex-1 mr-2" />
          )}

          {step < 3 ? (
            <TouchableOpacity
              className="flex-1 bg-red-500 rounded-full py-3 items-center"
              onPress={() =>
                setStep((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : prev))
              }
              disabled={saving}
            >
              <Text className="text-white text-sm font-semibold">
                Siguiente
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="flex-1 bg-red-500 rounded-full py-3 items-center"
              onPress={handleAgregarAlCarrito}
              disabled={saving}
            >
              <Text className="text-white text-sm font-semibold">
                {saving ? "Guardando..." : "Agregar al carrito"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {step === 3 && (
          <TouchableOpacity
            className="mt-2 items-center"
            onPress={handleGuardarZa}
            disabled={saving}
          >
            <Text className="text-orange-400 text-xs font-semibold">
              Guardar esta Za como favorita ⭐
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────
// Componentes auxiliares
// ──────────────────────────────────────────────

function Paso({
  label,
  stepNumber,
  current,
}: {
  label: string;
  stepNumber: number;
  current: number;
}) {
  const active = stepNumber === current;
  return (
    <View className="items-center flex-1">
      <View
        className={`w-8 h-8 rounded-full items-center justify-center ${
          active ? "bg-orange-500" : "bg-slate-800"
        }`}
      >
        <Text className="text-white text-sm font-bold">{stepNumber}</Text>
      </View>
      <Text
        className={`text-xs mt-1 ${
          active ? "text-orange-400 font-semibold" : "text-slate-400"
        }`}
      >
        {label}
      </Text>
    </View>
  );
}

function PasoBase(props: {
  tamano: Tamano;
  setTamano: (t: Tamano) => void;
  masa: string;
  setMasa: (m: string) => void;
  borde: string;
  setBorde: (b: string) => void;
  basePrice: number;
}) {
  const { tamano, setTamano, masa, setMasa, borde, setBorde, basePrice } =
    props;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 16 }}
    >
      <Text className="text-slate-300 text-sm mb-2">Tamaño</Text>
      <View className="flex-row mb-3">
        {(["PERSONAL", "MEDIANA", "FAMILIAR"] as Tamano[]).map((t) => {
          const active = t === tamano;
          const label =
            t === "PERSONAL"
              ? "Personal"
              : t === "MEDIANA"
              ? "Mediana"
              : "Familiar";
          return (
            <TouchableOpacity
              key={t}
              className={`flex-1 mr-2 px-3 py-2 rounded-full border ${
                active
                  ? "bg-orange-500 border-orange-400"
                  : "bg-slate-900 border-slate-700"
              }`}
              onPress={() => setTamano(t)}
            >
              <Text
                className={`text-center text-xs ${
                  active ? "text-white font-semibold" : "text-slate-200"
                }`}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text className="text-slate-300 text-sm mb-2">Masa</Text>
      <View className="flex-row flex-wrap mb-3">
        {MASAS.map((m) => {
          const active = m === masa;
          return (
            <TouchableOpacity
              key={m}
              className={`px-3 py-2 rounded-full border mr-2 mb-2 ${
                active
                  ? "bg-slate-800 border-orange-400"
                  : "bg-slate-900 border-slate-700"
              }`}
              onPress={() => setMasa(m)}
            >
              <Text
                className={`text-xs ${
                  active ? "text-orange-300" : "text-slate-200"
                }`}
              >
                {m}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text className="text-slate-300 text-sm mb-2">Borde</Text>
      <View className="flex-row flex-wrap mb-3">
        {BORDES.map((b) => {
          const active = b === borde;
          return (
            <TouchableOpacity
              key={b}
              className={`px-3 py-2 rounded-full border mr-2 mb-2 ${
                active
                  ? "bg-slate-800 border-orange-400"
                  : "bg-slate-900 border-slate-700"
              }`}
              onPress={() => setBorde(b)}
            >
              <Text
                className={`text-xs ${
                  active ? "text-orange-300" : "text-slate-200"
                }`}
              >
                {b}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text className="text-slate-400 text-xs">
        Precio base aproximado:{" "}
        <Text className="text-orange-400 font-semibold">
          {formatCOP(basePrice)}
        </Text>
      </Text>
    </ScrollView>
  );
}

function PasoIngredientes(props: {
  ingredientesPorCategoria: Record<string, Ingrediente[]>;
  categoriasOrdenadas: string[];
  seleccionIngredientes: Record<string, TipoSeleccion>;
  toggleIngrediente: (id: string) => void;
}) {
  const {
    ingredientesPorCategoria,
    categoriasOrdenadas,
    seleccionIngredientes,
    toggleIngrediente,
  } = props;

  const labelCat: Record<string, string> = {
    salsa: "Salsas",
    queso: "Quesos",
    proteina: "Proteínas",
    vegetal: "Vegetales",
    extra: "Extras",
    borde: "Bordes",
    otro: "Otros",
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 16 }}
    >
      {categoriasOrdenadas.map((cat) => (
        <View key={cat} className="mb-3">
          <Text className="text-slate-300 text-sm font-semibold mb-2">
            {labelCat[cat] || cat}
          </Text>

          <View className="flex-row flex-wrap -mx-1">
            {ingredientesPorCategoria[cat].map((ing) => {
              const tipo = seleccionIngredientes[ing.id] || null;
              let estadoText = "No agregado";
              let estadoClass = "text-slate-400";
              if (tipo === "NORMAL") {
                estadoText = "Normal";
                estadoClass = "text-emerald-300";
              } else if (tipo === "EXTRA") {
                estadoText = "Extra";
                estadoClass = "text-orange-300";
              } else if (tipo === "SIN") {
                estadoText = "Sin";
                estadoClass = "text-red-300";
              }

              return (
                <TouchableOpacity
                  key={ing.id}
                  onPress={() => toggleIngrediente(ing.id)}
                  className="w-1/2 px-1 mb-2"
                  activeOpacity={0.85}
                >
                  <View className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-2">
                    <Text
                      className="text-slate-50 text-xs font-semibold mb-1"
                      numberOfLines={1}
                    >
                      {ing.nombre}
                    </Text>
                    <Text className={`text-[10px] ${estadoClass}`}>
                      {estadoText}
                      {tipo === "EXTRA" && ing.precio_extra > 0
                        ? ` (+${formatCOP(ing.precio_extra)})`
                        : ""}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function PasoResumen(props: {
  nombreZa: string;
  setNombreZa: (v: string) => void;
  tamano: Tamano;
  masa: string;
  borde: string;
  ingredientes: Ingrediente[];
  seleccionIngredientes: Record<string, TipoSeleccion>;
  total: number;
}) {
  const {
    nombreZa,
    setNombreZa,
    tamano,
    masa,
    borde,
    ingredientes,
    seleccionIngredientes,
    total,
  } = props;

  const mapIng = ingredientes.reduce<Record<string, Ingrediente>>(
    (acc, ing) => {
      acc[ing.id] = ing;
      return acc;
    },
    {}
  );

  const seleccionLista = Object.entries(seleccionIngredientes).map(
    ([id, tipo]) => ({
      tipo,
      ingrediente: mapIng[id],
    })
  );

  const labelTam =
    tamano === "PERSONAL"
      ? "Personal"
      : tamano === "MEDIANA"
      ? "Mediana"
      : "Familiar";

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 16 }}
    >
      <Text className="text-slate-300 text-sm mb-1">Nombre de tu Za</Text>
      <TextInput
        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-50 text-sm mb-3"
        placeholder="Mi Za especial de media noche"
        placeholderTextColor="#6B7280"
        value={nombreZa}
        onChangeText={setNombreZa}
      />

      <View className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-3 mb-3">
        <Text className="text-slate-300 text-sm font-semibold mb-1">
          Base seleccionada
        </Text>
        <Text className="text-slate-400 text-xs">
          Tamaño: <Text className="text-slate-100">{labelTam}</Text>
        </Text>
        <Text className="text-slate-400 text-xs">
          Masa: <Text className="text-slate-100">{masa}</Text>
        </Text>
        <Text className="text-slate-400 text-xs">
          Borde: <Text className="text-slate-100">{borde}</Text>
        </Text>
      </View>

      <View className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-3 mb-3">
        <Text className="text-slate-300 text-sm font-semibold mb-2">
          Ingredientes seleccionados
        </Text>

        {seleccionLista.length === 0 ? (
          <Text className="text-slate-500 text-xs">
            No has seleccionado ingredientes aún. Puedes volver al paso 2 para
            personalizar tu Za.
          </Text>
        ) : (
          seleccionLista.map(({ ingrediente, tipo }) => {
            if (!ingrediente) return null;
            let tipoText = "";
            let tipoColor = "text-slate-300";

            if (tipo === "NORMAL") {
              tipoText = "Normal";
              tipoColor = "text-emerald-300";
            } else if (tipo === "EXTRA") {
              tipoText = "Extra";
              tipoColor = "text-orange-300";
            } else if (tipo === "SIN") {
              tipoText = "Sin";
              tipoColor = "text-red-300";
            }

            return (
              <View
                key={ingrediente.id}
                className="flex-row items-center justify-between mb-1"
              >
                <Text className="text-slate-200 text-xs">
                  {ingrediente.nombre}
                </Text>
                <Text className={`text-[11px] ${tipoColor}`}>{tipoText}</Text>
              </View>
            );
          })
        )}
      </View>

      <View className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-3">
        <Text className="text-slate-300 text-sm font-semibold mb-1">
          Total estimado
        </Text>
        <Text className="text-orange-400 text-lg font-bold">
          {formatCOP(total)}
        </Text>
        <Text className="text-slate-500 text-[11px] mt-1">
          El precio final puede variar ligeramente según promos y reglas del
          local. Más adelante conectamos este resumen con el sistema real de
          pedidos.
        </Text>
      </View>
    </ScrollView>
  );
}
