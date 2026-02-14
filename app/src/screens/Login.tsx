import { Pressable, StyleSheet, Text, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { signIn } from "../api/auth";
import {
  GoogleSignin,
} from '@react-native-google-signin/google-signin';
import { API_BASE_URL } from "../utils";

const LoginScreen = ({}) => {
  const onLogin = async () => {
    const res = await signIn();
    if (!res.data) {
      Alert.alert("error logging in")
      return;
    }
    const idToken = res.data.idToken;
    if (!idToken) throw new Error("No idToken");
    const { accessToken } = await GoogleSignin.getTokens();
    console.log(`API base url: ${API_BASE_URL}`);
    console.log(idToken);
    const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    });
    if (!response.ok) {
      Alert.alert("error logging in")
      return;
    }
    const data = await response.json();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Pressable style={styles.button} onPress={onLogin}>
        <Text>Login with Google</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    marginTop: 20,
    padding: 20,
    backgroundColor: "cyan",
  },
});

export default LoginScreen;
