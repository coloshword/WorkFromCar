// app/(tabs)/index.tsx
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Button } from "react-native";

const ACCESS_TOKEN_KEY = "WFC_ACCESS_TOKEN";

export default function Index() {
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);

        if (cancelled) return;

        if (!token) {
          router.replace("/(auth)/login" as any);
          return;
        }

        // Logged in: show this screen (or later load user/profile)
        setIsBooting(false);
      } catch (e) {
        // If SecureStore fails for any reason, treat as logged out
        if (!cancelled) {
          router.replace("/(auth)/login" as any);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isBooting) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
        <ActivityIndicator />
        <Text>Checking session…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Text style={{ fontSize: 22, fontWeight: "600" }}>WorkFromCar</Text>
      <Text style={{ marginTop: 8 }}>You’re signed in ✅</Text>
      <Button
        title="Logout"
        onPress={async () => {
          await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
          router.replace("/(auth)/login" as any);
        }}
      />
    </View>
  );
}
