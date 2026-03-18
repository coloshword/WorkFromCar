import {
  GoogleSignin,
} from '@react-native-google-signin/google-signin';
import { Alert } from 'react-native';
import { authFetch } from "../utils/fetchUtils";
import {
  AccessTokenProvider
} from "../context/AccessTokenContext";

export async function signIn() {
  return await GoogleSignin.signIn();
}

export const silentLogin = async () => {
  try {
    const res = await GoogleSignin.signInSilently();
    if (res.data) {
      const { accessToken } = await GoogleSignin.getTokens();
      return accessToken;
    }
  } catch (error) {
    console.error("Silent login failed", error);
  }
  return null;
};

export const onLogin = async () => {
  const res = await signIn();
  if (!res.data) {
    Alert.alert("Error", "Login failed. Please try again.");
    throw new Error("Login failed");
  }
  const idToken = res.data.idToken;
  if (!idToken) throw new Error("No idToken");
  const { accessToken } = await GoogleSignin.getTokens();
  const response = await authFetch("/api/auth/google", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ idToken }),
  }, 20_000);
  if (!response.ok) {
    Alert.alert("Error", "Login failed. Please try again.");
    throw new Error("Login failed");
  }
  const { token } = await response.json();
  return {
    accessToken,
    token
  };
};
