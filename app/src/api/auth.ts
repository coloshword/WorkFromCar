import {
  GoogleSignin,
} from '@react-native-google-signin/google-signin';

export async function signIn() {
  return await GoogleSignin.signIn();
}
