import React, { useEffect, useState, useMemo, useCallback } from "react";
import { 
  View, 
  Text, 
  ActivityIndicator, 
  TouchableOpacity, 
  StyleSheet, 
  RefreshControl,
  ScrollView,
  useColorScheme,
  Alert
} from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { authFetch } from "./backend/utils";
import { ACCESS_TOKEN_KEY } from "./config";
import VoiceRecorder from "./components/VoiceRecorder";
import { init } from "expo-whisper";
import { ensureModelOnDisk } from "./utils";
import Agent from "./Agent";

export default function Dashboard() {
  const [isBooting, setIsBooting] = useState(true);
  const [authOnlyText, setAuthOnlyText] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Instantiate Agent once per Dashboard lifecycle
  const agent = useMemo(() => new Agent(), []);

  const fetchAuthData = async () => {
    try {
      const res = await authFetch("/api/auth/authOnly");
      const bodyText = await res.text();

      if (!res.ok) {
        setAuthOnlyText(`Error ${res.status}: ${bodyText}`);
      } else {
        setAuthOnlyText(bodyText);
      }
    } catch (e: any) {
      setAuthOnlyText(`Network error: ${e.message}`);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAuthData();
    setRefreshing(false);
  };

  useEffect(() => {
    (async () => {
      try {
        // Initialize Whisper model for voice recording
        const modelUri = await ensureModelOnDisk();
        await init(modelUri);
      } catch (e) {
        console.error('Whisper init failed', e);
      }
      
      await fetchAuthData();
      setIsBooting(false);
    })();
  }, []);

  const handleTranscriptionComplete = useCallback((transcription: string) => {
    agent.addMessage({
      role: "user",
      content: transcription,
    });
  }, [agent]);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
            router.replace("/(auth)/login");
          },
        },
      ]
    );
  };

  if (isBooting) {
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <ActivityIndicator size="large" color={isDark ? "#fff" : "#007AFF"} />
        <Text style={[styles.loadingText, isDark && styles.textDark]}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.scrollContainer, isDark && styles.containerDark]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.textDark]}>WorkFromCar</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>


      <View style={[styles.card, isDark && styles.cardDark]}>
        <VoiceRecorder onTranscriptionComplete={handleTranscriptionComplete} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },
  containerDark: {
    backgroundColor: "#000",
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#000",
  },
  textDark: {
    color: "#fff",
  },
  textSecondaryDark: {
    color: "#999",
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#ff3b30",
  },
  logoutText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardDark: {
    backgroundColor: "#1c1c1e",
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    color: "#000",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#000",
  },
  responseText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
});

