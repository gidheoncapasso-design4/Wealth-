import { auth } from "./firebase";

export async function authFetch(url: string, options: RequestInit = {}) {
  if (!auth.currentUser) throw new Error("Entre na sua conta para enviar alertas.");
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${await auth.currentUser.getIdToken()}`);
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Falha no envio (HTTP ${response.status}).`);
  }
  return response;
}
