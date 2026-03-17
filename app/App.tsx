import LoginScreen from './src/screens/Login';
import RootNavigator from './src/navigation/RootNavigator';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Config from "react-native-config";
import { AccessTokenProvider } from './src/context/AccessTokenContext';

const webClientId = Config.GOOGLE_WEB_CLIENT_ID;
const iosClientId = Config.GOOGLE_AUTH_CLIENT_ID_APP;
GoogleSignin.configure({
  webClientId,
  scopes: [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/contacts.readonly',
    'https://www.googleapis.com/auth/gmail.readonly',
  ],
  iosClientId
});

const App = () => (
  <AccessTokenProvider accessToken={null}>
    <RootNavigator />
  </AccessTokenProvider>
);

export default App;
