import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { onLogin } from '../api/auth';
import { useAccessToken } from '../context/AccessTokenContext';
import * as Keychain from 'react-native-keychain';
import GoogleLogo from '../components/icons/GoogleLogo';

const LoginScreen = () => {
  const { setAuthToken } = useAccessToken();
  const [loading, setLoading] = useState(false);

  const handleLogin = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { accessToken, token } = await onLogin();
      if (accessToken) setAuthToken(accessToken);
      if (token) {
        await Keychain.setGenericPassword('jwt', token);
      }
    } catch (e: any) {
      Alert.alert('Login failed', e?.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, [loading, setAuthToken]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0f271f" />

      <View style={styles.content}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>W</Text>
        </View>

        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <Pressable
          style={({ pressed }) => [
            styles.googleBtn,
            pressed && styles.googleBtnPressed,
            loading && styles.googleBtnDisabled,
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#0f271f" />
          ) : (
            <View style={styles.googleBtnInner}>
              <GoogleLogo />
              <Text style={styles.googleBtnText}>Sign in with Google</Text>
            </View>
          )}
        </Pressable>
      </View>

      <Text style={styles.footer}>
        By signing in, you agree to our Terms of Service
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f271f',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(34,197,94,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  logoText: {
    color: '#22c55e',
    fontSize: 30,
    fontWeight: '700',
  },
  title: {
    color: '#e8fff6',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  subtitle: {
    color: 'rgba(232,255,246,0.45)',
    fontSize: 15,
    marginBottom: 40,
  },
  googleBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: '#e8fff6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleBtnPressed: {
    opacity: 0.85,
  },
  googleBtnDisabled: {
    opacity: 0.6,
  },
  googleBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  googleBtnText: {
    color: '#0f271f',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    color: 'rgba(232,255,246,0.3)',
    fontSize: 12,
    paddingBottom: 24,
    paddingHorizontal: 32,
  },
});

export default LoginScreen;
