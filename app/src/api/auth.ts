import {
  GoogleSignin,
} from '@react-native-google-signin/google-signin';
import { Alert } from 'react-native';
import { API_BASE_URL } from "../utils/utils";
import {
  AccessTokenProvider
} from "../context/AccessTokenContext";

export async function signIn() {
  return await GoogleSignin.signIn();
}

export const onLogin = async () => {
  const res = await signIn();
  if (!res.data) {
    Alert.alert("error logging in")
    throw new Error("Error logging in");
  }
  const idToken = res.data.idToken;
  if (!idToken) throw new Error("No idToken");
  const { accessToken } = await GoogleSignin.getTokens();
  const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ idToken }),
  });
  if (!response.ok) {
    Alert.alert("error logging in")
    throw new Error("Error logging in");
  }
  const { token } = await response.json();
  return {
    accessToken,
    token
  };
};
