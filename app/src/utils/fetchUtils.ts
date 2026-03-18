import * as Keychain from "react-native-keychain";
import { API_BASE_URL } from "./utils";

const DEFAULT_TIMEOUT_MS = 15_000;

export async function authFetch(
  path: string,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const credentials = await Keychain.getGenericPassword();
  const headers = new Headers(init.headers);
  if (credentials) headers.set("Authorization", `Bearer ${credentials.password}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });
    return response;
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out. Please check your connection.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
