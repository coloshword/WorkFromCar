import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import * as Keychain from "react-native-keychain";

import LoginScreen from '../screens/Login';
import VoiceDashboardScreen2 from '../screens/VoiceDashboard2';
import { useAccessToken } from '../context/AccessTokenContext';
import { silentLogin } from '../api/auth';


type RootStackParamList = {
  Login: undefined;
  VoiceDashboard: undefined;
  Demo: undefined;
}

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { authToken, setAuthToken } = useAccessToken();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const credentials = await Keychain.getGenericPassword();
        const jwtExists = !!credentials;

        if (jwtExists) {
          const token = await silentLogin();
          if (token) {
            setAuthToken(token);
          }
        }
      } finally {
        setAuthChecked(true);
      }
    };
    checkAuth();
  }, [setAuthToken]);

  const isAuthed = !!authToken;

  if (!authChecked) {
    return (
      <View style={styles.bootSplash}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isAuthed ? (
          <Stack.Screen 
            name="VoiceDashboard"
            component={VoiceDashboardScreen2}
            options={{ headerShown: false }}
          />
        ) : (
          <Stack.Screen 
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  bootSplash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RootNavigator;
