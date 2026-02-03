// utils for backend fetching 
import { API_BASE } from "../env";
import * as SecureStore from "expo-secure-store";
import { ACCESS_TOKEN_KEY } from "../config";

export async function authFetch(path: string, init: RequestInit = {}) {
  const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${API_BASE}${path}`, { ...init, headers });
}
