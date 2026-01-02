import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { ACCESS_TOKEN_KEY } from "./config";

export default function Index() {
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
        
        if (token) {
          router.replace("/dashboard");
        } else {
          router.replace("/(auth)/login");
        }
      } catch (error) {
        router.replace("/(auth)/login");
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

