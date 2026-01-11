import { useState, useEffect } from "react";
import * as Google from "expo-auth-session/providers/google";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { API_BASE } from "../../env";
import { ACCESS_TOKEN_KEY } from "../../config";

export function useGoogleAuth() {
  const [msg, setMsg] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });

  useEffect(() => {
    if (!response) return;

    (async () => {
      if (response.type === "success") {
        setIsLoading(true);
        setMsg("Authenticating...");
        const idToken =
          response.authentication?.idToken ||
          response.params?.id_token;
        
        if (!idToken) {
          setMsg("Login failed: No ID token received");
          setIsLoading(false);
          return;
        }

        try {
          const endpoint = `${API_BASE}/api/auth/google`;
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({idToken}),
          });

          if (!res.ok) {
            const text = await res.text().catch(() => "Unknown error");
            setMsg(`Authentication failed: ${text}`);
            setIsLoading(false);
            return;
          }

          const body = await res.json();
          const { token } = body;
          await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
          
          setMsg("Success! Redirecting...");
          setTimeout(() => {
            router.replace("../dashboard");
          }, 500);
        } catch (error: any) {
          setMsg(`Network error: ${error.message}`);
          setIsLoading(false);
        }
      } else if (response.type === "error") {
        setMsg("Google login error");
        setIsLoading(false);
      } else if (response.type === "dismiss") {
        setMsg("Login cancelled");
        setIsLoading(false);
      }
    })();
  }, [response]);

  const handleGoogleLogin = async () => {
    setMsg("");
    setIsLoading(true);
    try {
      await promptAsync();
    } catch (error) {
      setMsg("Failed to open login");
      setIsLoading(false);
    }
  };

  return {
    msg,
    isLoading,
    request,
    handleGoogleLogin,
  };
}
