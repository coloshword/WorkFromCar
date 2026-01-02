import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet, 
  useColorScheme,
  Animated
} from "react-native";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as SecureStore from "expo-secure-store";
import { API_BASE } from "../env";
import { ACCESS_TOKEN_KEY } from "../config";

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const [msg, setMsg] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const fadeAnim = useState(new Animated.Value(0))[0];

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

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
            router.replace("/dashboard");
          }, 500);
        } catch (error: any) {
          setMsg(`Network error: ${error.message}`);
          setIsLoading(false);
        }
      } else if (response.type === "error") {
        setMsg("Google login error");
        console.log("Google auth error:", response.error);
      } else if (response.type === "dismiss") {
        setMsg("Login cancelled");
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

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.logoContainer}>
          <Text style={[styles.logo, isDark && styles.logoDark]}>🚗</Text>
          <Text style={[styles.title, isDark && styles.titleDark]}>WorkFromCar</Text>
          <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
            Sign in to continue
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.googleButton,
              (!request || isLoading) && styles.googleButtonDisabled
            ]}
            disabled={!request || isLoading}
            onPress={handleGoogleLogin}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          {msg ? (
            <View style={[styles.messageContainer, isDark && styles.messageContainerDark]}>
              <Text style={[styles.messageText, isDark && styles.messageTextDark]}>
                {msg}
              </Text>
            </View>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  containerDark: {
    backgroundColor: "#000",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 60,
  },
  logo: {
    fontSize: 80,
    marginBottom: 16,
  },
  logoDark: {
    opacity: 0.9,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
  },
  titleDark: {
    color: "#fff",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  subtitleDark: {
    color: "#999",
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 320,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4285F4",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: "700",
    marginRight: 12,
    backgroundColor: "#fff",
    color: "#4285F4",
    width: 28,
    height: 28,
    textAlign: "center",
    lineHeight: 28,
    borderRadius: 14,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  messageContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageContainerDark: {
    backgroundColor: "#1c1c1e",
  },
  messageText: {
    fontSize: 14,
    textAlign: "center",
    color: "#333",
  },
  messageTextDark: {
    color: "#fff",
  },
});

