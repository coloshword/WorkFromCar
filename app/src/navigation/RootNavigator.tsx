import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import * as Keychain from "react-native-keychain";

import LoginScreen from '../screens/Login';
import VoiceDashboardScreen from '../screens/VoiceDashboard2';
import VoiceDashboardScreen2 from '../screens/VoiceDashboard2';
import SettingsScreen from '../screens/Settings';
import { useAccessToken } from '../context/AccessTokenContext';
import { silentLogin } from '../api/auth';
import DemoScreen from '../screens/Demo';


export type RootStackParamList = {
  Login: undefined;
  VoiceDashboard: undefined;
  Settings: undefined;
  Demo: undefined;
}

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { authToken, setAuthToken } = useAccessToken();
  const [hasJwt, setHasJwt] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const credentials = await Keychain.getGenericPassword();
      const jwtExists = !!credentials;
      setHasJwt(jwtExists);

      if (jwtExists && !authToken) {
        const token = await silentLogin();
        if (token) {
          setAuthToken(token);
        }
      }
    };
    checkAuth();
  }, []);

  const isAuthed = !!authToken;

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isAuthed ? (
          <>
            <Stack.Screen
              name="VoiceDashboard"
              component={VoiceDashboardScreen2}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                title: 'Settings',
                headerStyle: { backgroundColor: '#08110e' },
                headerTintColor: '#e8fff6',
                headerTitleStyle: { color: '#e8fff6' },
              }}
            />
          </>
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

export default RootNavigator;
