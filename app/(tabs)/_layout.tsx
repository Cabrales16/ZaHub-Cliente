// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

function TabBarIcon({
  name,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
}) {
  const color = focused ? "#fb923c" : "#9ca3af";
  return <Ionicons name={name} size={20} color={color} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#020617",
          borderTopColor: "#1f2937",
          height: 64,
        },
        tabBarActiveTintColor: "#fb923c",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="home-outline" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="menu"
        options={{
          title: "Menú",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="pizza-outline" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="custom-za"
        options={{
          title: "Crea tu Za",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="construct-outline" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          title: "Carrito",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="cart-outline" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="person-circle-outline" focused={focused} />
          ),
        }}
      />

      {/* Ruta oculta para detalle de Za (no aparece en la barra) */}
      <Tabs.Screen
        name="pizza-detail"
        options={{
          href: null,
        }}
      />

      {/* Ruta oculta para detalle de promoción */}
      <Tabs.Screen
        name="promo-detail"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
