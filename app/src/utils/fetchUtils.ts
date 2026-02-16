import * as Keychain from "react-native-keychain";
import { API_BASE_URL } from "./utils";

export async function authFetch(path: string, init: RequestInit = {}) {
  const credentials = await Keychain.getGenericPassword();
  const headers = new Headers(init.headers);
  if (credentials) headers.set("Authorization", `Bearer ${credentials.password}`);
  return fetch(`${API_BASE_URL}${path}`, { ...init, headers });
}
