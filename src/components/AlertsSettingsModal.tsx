import React, { useState, useEffect } from "react";
import { X, MessageSquare, Sparkles, Check, Send, Bell } from "lucide-react";
import { WhatsAppConfig } from "../types";

interface AlertsSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  whatsappConfig: WhatsAppConfig;
  onSave: (newConfig: WhatsAppConfig) => void;
}

export default function AlertsSettingsModal({
  isOpen,
  onClose,
  whatsappConfig,
  onSave,
}: AlertsSettingsModalProps) {
  const [whatsappPhone, setWhatsappPhone] = useState(whatsappConfig.phoneNumber || "");
  const [whatsappEnabled, setWhatsappEnabled] = useState(whatsappConfig.enabled ?? true);
  const [whatsappProvider, setWhatsappProvider] = useState<"manual" | "webhook" | "zapi" | "evolution">(whatsappConfig.provider || "manual");
  const [webhookUrl, setWebhookUrl] = useState(whatsappConfig.webhookUrl || "");
  const [zapiInstanceId, setZapiInstanceId] = useState(whatsappConfig.zapiInstanceId || "");
  const [zapiToken, setZapiToken] = useState(whatsappConfig.zapiToken || "");
  const [zapiClientToken, setZapiClientToken] = useState(whatsappConfig.zapiClientToken || "");
  const [evolutionEndpoint, setEvolutionEndpoint] = useState(whatsappConfig.evolutionEndpoint || "");
  const [evolutionInstance, setEvolutionInstance] = useState(whatsappConfig.evolutionInstance || "");
  const [evolutionApiKey, setEvolutionApiKey] = useState(whatsappConfig.evolutionApiKey || "");
  const [emailEnabled, setEmailEnabled] = useState(whatsappConfig.emailEnabled ?? false);
  const [notificationEmail, setNotificationEmail] = useState(whatsappConfig.notificationEmail || "");
  const [calendarEnabled, setCalendarEnabled] = useState(whatsappConfig.calendarEnabled ?? false);
  const [isTestingDirect, setIsTestingDirect] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [whatsappStatusMessage, setWhatsappStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (whatsappConfig) {
      setWhatsappPhone(whatsappConfig.phoneNumber || "");
      setWhatsappEnabled(whatsappConfig.enabled ?? true);
      if (whatsappConfig.provider) setWhatsappProvider(whatsappConfig.provider);
      if (whatsappConfig.webhookUrl) setWebhookUrl(whatsappConfig.webhookUrl);
      if (whatsappConfig.zapiInstanceId) setZapiInstanceId(whatsappConfig.zapiInstanceId);
      if (whatsappConfig.zapiToken) setZapiToken(whatsappConfig.zapiToken);
      if (whatsappConfig.zapiClientToken) setZapiClientToken(whatsappConfig.zapiClientToken);
      if (whatsappConfig.evolutionEndpoint) setEvolutionEndpoint(whatsappConfig.evolutionEndpoint);
      if (whatsappConfig.evolutionInstance) setEvolutionInstance(whatsappConfig.evolutionInstance);
      if (whatsappConfig.evolutionApiKey) setEvolutionApiKey(whatsappConfig.evolutionApiKey);
      setEmailEnabled(whatsappConfig.emailEnabled ?? false);
      if (whatsappConfig.notificationEmail) setNotificationEmail(whatsappConfig.notificationEmail);
      setCalendarEnabled(whatsappConfig.calendarEnabled ?? false);
    }
  }, [whatsappConfig]);

  if (!isOpen) return null;

  // Test Direct WhatsApp connection
  const handleTestDirectWhatsapp = async () => {
    setIsTestingDirect(true);
    setTestResult(null);
    const cleanPhone = (whatsappPhone || "5519982513836").replace(/\D/g, "");

    if (whatsappProvider === "manual") {
      const text = `📱 *Wealth Finance*: Conexão com seu WhatsApp configurada com sucesso! Você receberá avisos automáticos 1 dia antes do vencimento das suas contas.`;
      const url = `https://api.whatsapp.com/send?phone=${cleanPhone.startsWith("55") ? cleanPhone : "55" + cleanPhone}&text=${encodeURIComponent(text)}`;
      window.open(url, "_blank");
      setIsTestingDirect(false);
      return;
    }

    try {
      const res = await fetch("/api/whatsapp/test-direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: cleanPhone,
          whatsappConfig: {
            provider: whatsappProvider,
            webhookUrl,
            zapiInstanceId,
            zapiToken,
            zapiClientToken,
            evolutionEndpoint,
            evolutionInstance,
            evolutionApiKey,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: "✓ Mensagem de teste enviada diretamente com sucesso para o seu WhatsApp!",
        });
      } else {
        setTestResult({
          success: false,
          message: `❌ ${data.error || "Erro ao disparar mensagem. Verifique as credenciais digitadas."}`,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `❌ ${err.message || "Erro de conexão com o servidor."}`,
      });
    } finally {
      setIsTestingDirect(false);
    }
  };

  const handleSaveWhatsappConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      phoneNumber: whatsappPhone,
      enabled: whatsappEnabled,
      daysAhead: 1,
      provider: whatsappProvider,
      webhookUrl: webhookUrl.trim() || undefined,
      zapiInstanceId: zapiInstanceId.trim() || undefined,
      zapiToken: zapiToken.trim() || undefined,
      zapiClientToken: zapiClientToken.trim() || undefined,
      evolutionEndpoint: evolutionEndpoint.trim() || undefined,
      evolutionInstance: evolutionInstance.trim() || undefined,
      evolutionApiKey: evolutionApiKey.trim() || undefined,
      emailEnabled,
      notificationEmail: notificationEmail.trim() || undefined,
      calendarEnabled,
    });
    setWhatsappStatusMessage("Configurações do WhatsApp salvas na nuvem com sucesso!");
    setTimeout(() => {
      setWhatsappStatusMessage(null);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-xl bg-[#131313] border border-[#353534]/70 rounded-3xl shadow-2xl p-6 space-y-5 max-h-[92vh] overflow-y-auto custom-scrollbar animate-slide-up my-auto text-left">
        <div className="flex justify-between items-center pb-2 border-b border-[#353534]/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366]">
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Alertas de Vencimento</h3>
              <p className="text-[11px] text-[#8b90a0]">Receba aviso 1 dia antes das contas vencerem por WhatsApp, E-mail e Google Agenda</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8b90a0] hover:text-white p-1 rounded-full hover:bg-white/5 transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {whatsappStatusMessage && (
          <div className="p-3 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] text-xs font-semibold rounded-xl animate-fade-in">
            ✓ {whatsappStatusMessage}
          </div>
        )}

        {testResult && (
          <div
            className={`p-3 text-xs font-semibold rounded-xl border animate-fade-in ${
              testResult.success
                ? "bg-[#4edea3]/10 border-[#4edea3]/30 text-[#4edea3]"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            {testResult.message}
          </div>
        )}

        <form onSubmit={handleSaveWhatsappConfig} className="space-y-4">
          {/* Phone number & Switch */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs text-[#8b90a0] font-semibold uppercase tracking-wider">
                Seu WhatsApp (DDD + Número)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#8b90a0]">
                  +55
                </span>
                <input
                  type="text"
                  required
                  placeholder="19 98251-3836"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  className="w-full bg-[#1c1b1b] border border-[#353534]/50 rounded-xl pl-12 pr-4 py-2.5 text-sm text-white font-mono focus:border-[#25D366] outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#8b90a0] font-semibold uppercase tracking-wider">
                Status dos Avisos
              </label>
              <div className="h-[42px] px-3 bg-[#1c1b1b] border border-[#353534]/50 rounded-xl flex items-center justify-between">
                <span className="text-xs font-medium text-white">
                  {whatsappEnabled ? "Ativo" : "Pausado"}
                </span>
                <input
                  type="checkbox"
                  checked={whatsappEnabled}
                  onChange={(e) => setWhatsappEnabled(e.target.checked)}
                  className="w-4 h-4 accent-[#25D366] rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Automation Mode Selector */}
          <div className="space-y-2 pt-1 border-t border-[#353534]/30">
            <label className="text-xs text-[#8b90a0] font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={13} className="text-[#25D366]" />
              <span>Modo de Disparo do WhatsApp</span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setWhatsappProvider("manual")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  whatsappProvider === "manual"
                    ? "bg-[#25D366]/15 border-[#25D366] text-white"
                    : "bg-[#1c1b1b] border-[#353534]/50 text-[#8b90a0] hover:text-white"
                }`}
              >
                <p className="text-xs font-bold text-white flex items-center justify-between">
                  <span>1-Clique (WhatsApp Web/App)</span>
                  {whatsappProvider === "manual" && <Check size={14} className="text-[#25D366]" />}
                </p>
                <p className="text-[11px] text-[#8b90a0] mt-1">
                  Sem necessidade de API. Abre o WhatsApp com a mensagem pronta para enviar.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setWhatsappProvider("webhook")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  whatsappProvider === "webhook"
                    ? "bg-[#25D366]/15 border-[#25D366] text-white"
                    : "bg-[#1c1b1b] border-[#353534]/50 text-[#8b90a0] hover:text-white"
                }`}
              >
                <p className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Webhook (Make / n8n / Zapier)</span>
                  {whatsappProvider === "webhook" && <Check size={14} className="text-[#25D366]" />}
                </p>
                <p className="text-[11px] text-[#8b90a0] mt-1">
                  100% Automático e Gratuito. Dispara para sua URL de webhook sem você tocar no app.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setWhatsappProvider("zapi")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  whatsappProvider === "zapi"
                    ? "bg-[#25D366]/15 border-[#25D366] text-white"
                    : "bg-[#1c1b1b] border-[#353534]/50 text-[#8b90a0] hover:text-white"
                }`}
              >
                <p className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Z-API (Brasil)</span>
                  {whatsappProvider === "zapi" && <Check size={14} className="text-[#25D366]" />}
                </p>
                <p className="text-[11px] text-[#8b90a0] mt-1">
                  100% Automático. Conecte via QR Code do seu WhatsApp com sua instância Z-API.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setWhatsappProvider("evolution")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  whatsappProvider === "evolution"
                    ? "bg-[#25D366]/15 border-[#25D366] text-white"
                    : "bg-[#1c1b1b] border-[#353534]/50 text-[#8b90a0] hover:text-white"
                }`}
              >
                <p className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Evolution API</span>
                  {whatsappProvider === "evolution" && <Check size={14} className="text-[#25D366]" />}
                </p>
                <p className="text-[11px] text-[#8b90a0] mt-1">
                  100% Automático. Para instâncias Evolution API próprias ou hospedadas.
                </p>
              </button>
            </div>
          </div>

          {/* Webhook Configuration Fields */}
          {whatsappProvider === "webhook" && (
            <div className="p-4 bg-[#1c1b1b] rounded-2xl border border-[#353534]/50 space-y-3 animate-fade-in">
              <div className="space-y-1">
                <label className="text-xs font-bold text-white">URL do Webhook (Make.com, n8n ou Zapier)</label>
                <input
                  type="url"
                  placeholder="https://hook.eu1.make.com/sua-url-aqui"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full bg-[#131313] border border-[#353534]/60 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-[#25D366] outline-none"
                />
              </div>
              <p className="text-[11px] text-[#8b90a0] leading-relaxed">
                💡 <strong>Como funciona</strong>: Quando uma conta estiver a 1 dia do vencimento, o servidor envia um POST com <code className="text-[#4edea3] font-mono">&#123; phone, message &#125;</code> para essa URL, disparando automaticamente no seu WhatsApp!
              </p>
            </div>
          )}

          {/* Z-API Configuration Fields */}
          {whatsappProvider === "zapi" && (
            <div className="p-4 bg-[#1c1b1b] rounded-2xl border border-[#353534]/50 space-y-3 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-white">ID da Instância Z-API</label>
                  <input
                    type="text"
                    placeholder="Ex: 3B4C5D6E7F8G"
                    value={zapiInstanceId}
                    onChange={(e) => setZapiInstanceId(e.target.value)}
                    className="w-full bg-[#131313] border border-[#353534]/60 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-[#25D366] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-white">Token da Instância</label>
                  <input
                    type="password"
                    placeholder="Token de autenticação"
                    value={zapiToken}
                    onChange={(e) => setZapiToken(e.target.value)}
                    className="w-full bg-[#131313] border border-[#353534]/60 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-[#25D366] outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-white">Client Token (Opcional - Segurança Z-API)</label>
                <input
                  type="password"
                  placeholder="Client Token (se ativado na sua conta Z-API)"
                  value={zapiClientToken}
                  onChange={(e) => setZapiClientToken(e.target.value)}
                  className="w-full bg-[#131313] border border-[#353534]/60 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-[#25D366] outline-none"
                />
              </div>
              <p className="text-[11px] text-[#8b90a0]">
                💡 As mensagens são enviadas diretamente através da API da Z-API (<code className="text-[#25D366]">api.z-api.io</code>) para o seu celular.
              </p>
            </div>
          )}

          {/* Evolution API Configuration Fields */}
          {whatsappProvider === "evolution" && (
            <div className="p-4 bg-[#1c1b1b] rounded-2xl border border-[#353534]/50 space-y-3 animate-fade-in">
              <div className="space-y-1">
                <label className="text-xs font-bold text-white">Endpoint URL da Evolution API</label>
                <input
                  type="url"
                  placeholder="https://api.seudominio.com"
                  value={evolutionEndpoint}
                  onChange={(e) => setEvolutionEndpoint(e.target.value)}
                  className="w-full bg-[#131313] border border-[#353534]/60 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-[#25D366] outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-white">Nome da Instância</label>
                  <input
                    type="text"
                    placeholder="Ex: finance-instance"
                    value={evolutionInstance}
                    onChange={(e) => setEvolutionInstance(e.target.value)}
                    className="w-full bg-[#131313] border border-[#353534]/60 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-[#25D366] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-white">Chave de API (apikey)</label>
                  <input
                    type="password"
                    placeholder="Sua Global ou Instance API Key"
                    value={evolutionApiKey}
                    onChange={(e) => setEvolutionApiKey(e.target.value)}
                    className="w-full bg-[#131313] border border-[#353534]/60 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-[#25D366] outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Google Channels: E-mail (Gmail) & Google Agenda */}
          <div className="space-y-2 pt-1 border-t border-[#353534]/30">
            <label className="text-xs text-[#8b90a0] font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Bell size={13} className="text-[#adc6ff]" />
              <span>Canais Google (Enviados pelo Servidor Automaticamente)</span>
            </label>

            <div className="p-4 bg-[#1c1b1b] rounded-2xl border border-[#353534]/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">E-mail via Gmail</p>
                  <p className="text-[11px] text-[#8b90a0]">Manda um e-mail formatado 1 dia antes de cada vencimento</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailEnabled}
                  onChange={(e) => setEmailEnabled(e.target.checked)}
                  className="w-4 h-4 accent-[#adc6ff] rounded cursor-pointer shrink-0"
                />
              </div>
              {emailEnabled && (
                <input
                  type="email"
                  placeholder="seuemail@gmail.com"
                  value={notificationEmail}
                  onChange={(e) => setNotificationEmail(e.target.value)}
                  className="w-full bg-[#131313] border border-[#353534]/60 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-[#adc6ff] outline-none"
                />
              )}
            </div>

            <div className="p-4 bg-[#1c1b1b] rounded-2xl border border-[#353534]/50 space-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Sincronizar com Google Agenda</p>
                  <p className="text-[11px] text-[#8b90a0]">Cria um evento mensal recorrente para cada conta fixa, com lembrete/notificação 1 dia antes</p>
                </div>
                <input
                  type="checkbox"
                  checked={calendarEnabled}
                  onChange={(e) => setCalendarEnabled(e.target.checked)}
                  className="w-4 h-4 accent-[#adc6ff] rounded cursor-pointer shrink-0"
                />
              </div>
            </div>

            <p className="text-[11px] text-[#8b90a0] leading-relaxed">
              💡 Esses dois canais dependem de credenciais configuradas no servidor (Senha de App do Gmail e Conta de Serviço do Google Calendar) e de uma rotina diária automática — não exigem nenhum clique seu depois de ativados aqui.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={handleTestDirectWhatsapp}
              disabled={isTestingDirect}
              className="flex-1 py-3 px-4 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#25D366]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send size={14} className={isTestingDirect ? "animate-spin" : ""} />
              <span>{isTestingDirect ? "Enviando Teste..." : "Testar Conexão Agora"}</span>
            </button>

            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-[#25D366] text-black rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#25D366]/90 transition-all cursor-pointer shadow-lg shadow-[#25D366]/20"
            >
              Salvar Configurações na Nuvem
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
