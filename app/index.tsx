// app/index.tsx
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function IndexScreen() {
  const router = useRouter();

  const handleStart = () => {
    router.push("/login");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>ZaHub 🍕</Text>
      <Text style={styles.subtitle}>El algoritmo del antojo perfecto</Text>

      <TouchableOpacity style={styles.button} onPress={handleStart}>
        <Text style={styles.buttonText}>Empezar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050816",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logo: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 40,
  },
  button: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 999,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});