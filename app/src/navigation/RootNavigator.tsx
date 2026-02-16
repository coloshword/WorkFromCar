import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import LoginScreen from '../screens/Login';

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
}

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const isAuthed = false;

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isAuthed ? (
          <Stack.Screen 
            name="Home"
            component={() => <Text>Home</Text>}
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
