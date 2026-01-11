import React from "react";
import { View, Text, useColorScheme } from "react-native";
import { styles } from "./styles";

interface StatusMessageProps {
  message: string;
}

export default function StatusMessage({ message }: StatusMessageProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (!message) return null;

  return (
    <View style={[styles.messageContainer, isDark && styles.messageContainerDark]}>
      <Text style={[styles.messageText, isDark && styles.messageTextDark]}>
        {message}
      </Text>
    </View>
  );
}
