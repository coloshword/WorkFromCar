import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import * as Keychain from "react-native-keychain";

import LoginScreen from '../screens/Login';
import VoiceDashboardScreen from '../screens/VoiceDashboard';
import { useAccessToken } from '../context/AccessTokenContext';
import { silentLogin } from '../api/auth';

type RootStackParamList = {
  Login: undefined;
  VoiceDashboard: undefined;
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

  const isAuthed = !!authToken && !!hasJwt;

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isAuthed ? (
          <Stack.Screen 
            name="VoiceDashboard"
            component={VoiceDashboardScreen}
          />
        ) : (
          <Stack.Screen 
            name="Login"
            component={LoginScreen}
            options={{ title: "" }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default RootNavigator;
