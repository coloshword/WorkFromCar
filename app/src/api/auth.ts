import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import Config from "react-native-config";

export const signIn = async () => {
  const webClientId = Config.GOOGLE_WEB_CLIENT_ID;
  GoogleSignin.configure({
    webClientId,
    scopes: [
      "https://www.googleapis.com/auth/gmail.send"
    ]
  })
}
