import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

export default function Settings() {
  const handleLogout = () => {
    Alert.alert('Logout', 'Coming soon');
  };

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'Coming soon');
  };

  return (
    <View style={styles.root}>
      <Pressable style={styles.row} onPress={handleLogout}>
        <Text style={styles.rowText}>Logout</Text>
      </Pressable>
      <Pressable style={styles.row} onPress={handleDeleteAccount}>
        <Text style={[styles.rowText, styles.destructive]}>Delete Account</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f271f',
  },
  row: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  rowText: {
    color: '#e8fff6',
    fontSize: 16,
    fontWeight: '500',
  },
  destructive: {
    color: '#ef4444',
  },
});
