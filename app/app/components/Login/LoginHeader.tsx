import React from "react";
import { View, Text, useColorScheme } from "react-native";
import { styles } from "./styles";

export default function LoginHeader() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.logoContainer}>
      <Text style={[styles.logo, isDark && styles.logoDark]}>🚗</Text>
      <Text style={[styles.title, isDark && styles.titleDark]}>WorkFromCar</Text>
      <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
        Sign in to continue
      </Text>
    </View>
  );
}
