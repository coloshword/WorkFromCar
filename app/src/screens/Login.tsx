import { Pressable, StyleSheet, Text, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { onLogin } from "../api/auth";
import { useAccessToken } from "../context/AccessTokenContext";
import { sendEmail } from "../api/sendEmail";
import * as Keychain from "react-native-keychain";

const LoginScreen = ({}) => {
  const { authToken, setAuthToken } = useAccessToken();

  const handleLogin = async () => {
    const { accessToken, token } = await onLogin();
    if (accessToken) setAuthToken(accessToken);
    if (token) {
      await Keychain.setGenericPassword("jwt", token);
    }
  };

  const testSendEmail = async () => {
    if (!authToken) {
      Alert.alert("No auth token");
      return;
    }
    const res = await sendEmail({
      to: "aceliang2001@gmail.com",
      subject: "Hey this is John!",
      body: "This is a test email from react native. This is a demo",
      accessToken: authToken
    });
    Alert.alert(`send email status: ${res.statusText}`);
  }

  return (
    <SafeAreaView style={styles.container}>
      <Pressable style={styles.button} onPress={handleLogin}>
        <Text>Login with Google</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={testSendEmail}>
        <Text>Log value</Text>
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
