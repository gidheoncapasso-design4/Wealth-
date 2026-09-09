// Server only: never import this module from a browser component.
export function greenApiUrl(method: string, env = process.env): string {
  const { WHATSAPP_GREENAPI_URL: base, WHATSAPP_GREENAPI_INSTANCE: instance,
    WHATSAPP_GREENAPI_TOKEN: token } = env;
  if (!base || !instance || !token) throw new Error("Configure as três variáveis WHATSAPP_GREENAPI no Render.");
  const url = new URL(base);
  if (url.protocol !== "https:" || !/^(?:[a-z0-9-]+\.)*(?:green-api\.com|greenapi\.com)$/.test(url.hostname)
      || url.username || url.password || url.port || url.search || url.hash || !/^\/?$/.test(url.pathname)) {
    throw new Error("A URL da GREEN-API deve ser a origem HTTPS fornecida pelo provedor.");
  }
  if (!/^\d+$/.test(instance)) throw new Error("Instância GREEN-API inválida.");
  return `${url.origin}/waInstance${instance}/${method}/${encodeURIComponent(token)}`;
}

export async function greenApiRequest(method: string, body?: unknown) {
  const url = greenApiUrl(method);
  let response: Response;
  try {
    response = await fetch(url, {
      method: body === undefined ? "GET" : "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(20000), redirect: "error",
    });
  } catch {
    throw new Error("Falha de conexão com a GREEN-API. Confira a instância antes de tentar novamente.");
  }
  if (!response.ok) throw new Error(`GREEN-API respondeu HTTP ${response.status}.`);
  return response.json();
}

export async function sendGreenApiMessage(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  const number = digits.startsWith("55") ? digits : `55${digits}`;
  if (!/^55\d{10,11}$/.test(number)) throw new Error("Informe um número brasileiro com DDD.");
  const state = await greenApiRequest("getStateInstance");
  if (state.stateInstance !== "authorized") throw new Error("WhatsApp desconectado. Vincule a instância na GREEN-API.");
  const data = await greenApiRequest("sendMessage", { chatId: `${number}@c.us`, message });
  if (!data.idMessage) throw new Error("A GREEN-API não confirmou o recebimento da solicitação.");
  return { success: true, provider: "greenapi", data: { idMessage: data.idMessage } };
}
