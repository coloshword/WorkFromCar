import React, { useEffect, useState } from "react";
import { View, Text, Button } from "react-native";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as SecureStore from "expo-secure-store";
import { API_BASE } from "../env";
import { ACCESS_TOKEN_KEY } from "../config";

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const [msg, setMsg] = useState<string>("");

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });

  useEffect(() => {
    if (!response) return;

    (async () => {
      if (response.type === "success") {
        setMsg("Google login success ✅");
        const idToken =
          response.authentication?.idToken ||
          response.params?.id_token;
        if (!idToken) {
          setMsg("Logged in but no id_token found (check config)");
          return;
        }
        const endpoint = `${API_BASE}/api/auth/google`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({idToken}),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          setMsg(`Backend failed: ${res.status} ${text}`);
          return;
        }
        const body = await res.json();
        const { token } = body;
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
        router.replace("/(tabs)");
      } else if (response.type === "error") {
        setMsg("Google login error ❌");
        console.log("Google auth error:", response.error);
      } else if (response.type === "dismiss") {
        setMsg("Dismissed");
      } else {
        setMsg(`Response: ${response.type}`);
      }
    })();
  }, [response]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "600" }}>Login</Text>

      <Button
        title="Continue with Google"
        disabled={!request}
        onPress={() => {
          setMsg("");
          promptAsync();
        }}
      />

      {msg ? <Text>{msg}</Text> : null}
    </View>
  );
}
