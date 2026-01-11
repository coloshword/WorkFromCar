import React from "react";
import { TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { styles } from "./styles";

interface GoogleLoginButtonProps {
  onPress: () => void;
  disabled: boolean;
  isLoading: boolean;
}

export default function GoogleLoginButton({ 
  onPress, 
  disabled, 
  isLoading 
}: GoogleLoginButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.googleButton,
        disabled && styles.googleButtonDisabled
      ]}
      disabled={disabled}
      onPress={onPress}
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
  );
}
