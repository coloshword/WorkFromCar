import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Keychain from 'react-native-keychain';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useAccessToken } from '../context/AccessTokenContext';

export default function Settings() {
  const { setAuthToken } = useAccessToken();

  const performLogout = async () => {
    try {
      await Keychain.resetGenericPassword();
    } catch (e) {
      console.warn('Failed to clear keychain', e);
    }
    try {
      await GoogleSignin.signOut();
    } catch (e) {
      console.warn('Google sign out failed', e);
    }
    setAuthToken(null);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: performLogout },
    ]);
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
