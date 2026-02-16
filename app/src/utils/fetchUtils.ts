import * as Keychain from "react-native-keychain";
import { API_BASE_URL } from "./utils";

export async function authFetch(path: string, init: RequestInit = {}) {
  const token = await Keychain.getGenericPassword();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${API_BASE_URL}${path}`, { ...init, headers });
}
