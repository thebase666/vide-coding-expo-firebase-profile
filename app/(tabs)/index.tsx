import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";

export default function IndexPage() {
  const { logout } = useAuth();
  const [submitting, setSubmitting] = React.useState(false);

  async function onLogout() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await logout();
      // router.replace("/login");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>IndexPage</Text>

        <Pressable
          onPress={onLogout}
          disabled={submitting}
          style={({ pressed }) => [
            styles.button,
            submitting ? styles.buttonDisabled : null,
            pressed && !submitting ? styles.buttonPressed : null,
          ]}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Logout</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    gap: 12,
  },
  title: { fontSize: 18, fontWeight: "700" },
  button: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonPressed: { transform: [{ scale: 0.99 }] },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
});
