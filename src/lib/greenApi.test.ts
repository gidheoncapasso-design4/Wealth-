import { afterEach, describe, expect, it, vi } from "vitest";
import { greenApiUrl, sendGreenApiMessage } from "./greenApi";
const env = { WHATSAPP_GREENAPI_URL: "https://1103.api.green-api.com", WHATSAPP_GREENAPI_INSTANCE: "1234", WHATSAPP_GREENAPI_TOKEN: "test-token" };
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe("GREEN-API", () => {
  it("keeps credentials at the configured provider origin", () => {
    expect(greenApiUrl("sendMessage", env)).toBe("https://1103.api.green-api.com/waInstance1234/sendMessage/test-token");
    for (const base of ["http://api.green-api.com", "https://green-api.com.evil.example", "https://api.green-api.com/path", "https://user@api.green-api.com"]) {
      expect(() => greenApiUrl("sendMessage", { ...env, WHATSAPP_GREENAPI_URL: base })).toThrow();
    }
  });
  it("does not queue messages for a disconnected account", async () => {
    Object.entries(env).forEach(([k,v]) => vi.stubEnv(k,v));
    const mock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ stateInstance: "notAuthorized" }) });
    vi.stubGlobal("fetch", mock);
    await expect(sendGreenApiMessage("11999999999", "Test")).rejects.toThrow("desconectado");
    expect(mock).toHaveBeenCalledTimes(1);
  });
  it("requires an idMessage before reporting acceptance", async () => {
    Object.entries(env).forEach(([k,v]) => vi.stubEnv(k,v));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ stateInstance: "authorized" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) }));
    await expect(sendGreenApiMessage("11999999999", "Test")).rejects.toThrow("não confirmou");
  });
});
