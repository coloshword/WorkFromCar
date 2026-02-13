import { Pressable, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Alert } from "react-native";
import { signIn } from "../api/auth";

const LoginScreen = ({}) => {
  return (
    <SafeAreaView style={styles.container}>
      <Pressable style={styles.button} onPress={() => {
        signIn();
      }}>
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
