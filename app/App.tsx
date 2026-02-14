import LoginScreen from './src/screens/Login';
import RootNavigator from './src/navigation/RootNavigator';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Config from "react-native-config";

const webClientId = Config.GOOGLE_WEB_CLIENT_ID;
const iosClientId = Config.GOOGLE_AUTH_CLIENT_ID_APP;
GoogleSignin.configure({
  webClientId,
  scopes: [
    'https://www.googleapis.com/auth/gmail.send'
  ],
  iosClientId
});

const App = () => (
  <RootNavigator />
);

export default App;
