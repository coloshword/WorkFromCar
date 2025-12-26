// app/(tabs)/index.tsx
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Button } from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { authFetch } from "../backend/utils";

const ACCESS_TOKEN_KEY = "WFC_ACCESS_TOKEN";

export default function Index() {
  const [isBooting, setIsBooting] = useState(true);
  const [authOnlyText, setAuthOnlyText] = useState<string>("");

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

        // token exists -> hit authOnly
        const res = await authFetch("/api/auth/authOnly");
        const bodyText = await res.text();

        if (cancelled) return;

        if (!res.ok) {
          setAuthOnlyText(`Error ${res.status}: ${bodyText}`);
        } else {
          setAuthOnlyText(bodyText);
        }

        setIsBooting(false);
      } catch (e: any) {
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
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 10 }}>
      <Text style={{ fontSize: 22, fontWeight: "600" }}>WorkFromCar</Text>
      <Text>You’re signed in ✅</Text>

      <Text style={{ marginTop: 10, fontWeight: "600" }}>authOnly response:</Text>
      <Text selectable style={{ textAlign: "center" }}>
        {authOnlyText || "(empty)"}
      </Text>

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