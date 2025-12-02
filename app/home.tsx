// app/home.tsx
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home ZaHub</Text>
      <Text style={styles.text}>
            Aquí pronto estará el menú de pizzas, el modo Crea tu Za, el carrito, etc.
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    color: "#9CA3AF",
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  buttonText: {
    color: "#F9FAFB",
    fontSize: 14,
    fontWeight: "600",
  },
});