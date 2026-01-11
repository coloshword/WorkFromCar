import React, { useEffect, useState } from "react";
import { View, useColorScheme, Animated } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { styles } from "./styles";
import LoginHeader from "./LoginHeader";
import GoogleLoginButton from "./GoogleLoginButton";
import StatusMessage from "./StatusMessage";
import { useGoogleAuth } from "./useGoogleAuth";

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const fadeAnim = useState(new Animated.Value(0))[0];
  
  const { msg, isLoading, request, handleGoogleLogin } = useGoogleAuth();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <LoginHeader />

        <View style={styles.buttonContainer}>
          <GoogleLoginButton
            onPress={handleGoogleLogin}
            disabled={!request || isLoading}
            isLoading={isLoading}
          />

          <StatusMessage message={msg} />
        </View>
      </Animated.View>
    </View>
  );
}
