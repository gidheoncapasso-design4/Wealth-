import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, TrendingUp, PiggyBank, Heart, Target, Scissors, Plus, AlertCircle, Layers, Lightbulb, Compass, X, Volume2, VolumeX, Mic, MicOff, Play, Square } from "lucide-react";
import { ChatMessage } from "../types";

interface WealthAIViewProps {
  chatHistory: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isGenerating: boolean;
  apiWarning: string | null;
}

export default function WealthAIView({
  chatHistory,
  onSendMessage,
  isGenerating,
  apiWarning,
}: WealthAIViewProps) {
  const [inputText, setInputText] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [isCustomTopicModalOpen, setIsCustomTopicModalOpen] = useState(false);
  const [customTopicTitle, setCustomTopicTitle] = useState("");
  const [customTopicDetails, setCustomTopicDetails] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const [autoVoiceResponse, setAutoVoiceResponse] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Stop speaking helper
  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setCurrentlySpeakingId(null);
  };

  // Text to Speech playback function
  const speakText = (text: string, messageId: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (currentlySpeakingId === messageId) {
      stopSpeaking();
      return;
    }

    stopSpeaking();

    // Clean markdown characters for pleasant speech
    const cleanText = text
      .replace(/[*#_~`>]/g, "")
      .replace(/\(R\$\s*[\d.,]+\)/gi, (match) => match.replace(/[()]/g, ""))
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "pt-BR";
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Pick a Portuguese voice if available
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find((v) => v.lang.startsWith("pt") || v.lang.includes("BR"));
    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    utterance.onend = () => {
      setCurrentlySpeakingId(null);
    };

    utterance.onerror = () => {
      setCurrentlySpeakingId(null);
    };

    setCurrentlySpeakingId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  // Auto-play voice when AI finishes responding if autoVoiceResponse is active
  const lastModelMsg = chatHistory[chatHistory.length - 1];
  const lastModelMsgIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      autoVoiceResponse &&
      !isGenerating &&
      lastModelMsg &&
      lastModelMsg.role === "model" &&
      lastModelMsg.id !== lastModelMsgIdRef.current &&
      chatHistory.length > 2
    ) {
      lastModelMsgIdRef.current = lastModelMsg.id;
      speakText(lastModelMsg.text, lastModelMsg.id);
    }
  }, [chatHistory, isGenerating, autoVoiceResponse]);

  // Speech Recognition (Microphone input)
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Reconhecimento de voz não suportado neste navegador. Tente no Chrome ou Edge.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "pt-BR";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech recognition error:", err);
      setIsListening(false);
    }
  };

  // Stop synthesis when component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Conversational Quick Prompts for Gemini
  const analysisThemes = [
    {
      id: "saude_geral",
      title: "Como estão minhas finanças?",
      icon: <TrendingUp size={15} className="text-[#15803d]" />,
      colorClass: "border-[#7c3aed]/40 bg-[#7c3aed]/10 text-[#15803d]",
      prompt: "Olá Gemini! Como está o panorama geral das finanças da minha família hoje? Pode me dar um resumo da nossa sobra mensal e do que precisamos ter atenção?",
    },
    {
      id: "investimentos",
      title: "Onde investir a sobra?",
      icon: <Compass size={15} className="text-[#7c3aed]" />,
      colorClass: "border-[#7c3aed]/40 bg-[#7c3aed]/10 text-[#7c3aed]",
      prompt: "Com a nossa receita de R$ 23.350 e os custos fixos, como você recomenda organizar os aportes e investimentos neste momento?",
    },
    {
      id: "dizimo_familia",
      title: "Dízimo & Família",
      icon: <Heart size={15} className="text-purple-700" />,
      colorClass: "border-purple-500/40 bg-purple-500/10 text-purple-700",
      prompt: "Vamos falar sobre o dízimo da família (R$ 2.335) e como manter nosso planejamento financeiro alinhado aos nossos propósitos e paz familiar?",
    },
    {
      id: "corte_custos",
      title: "Otimizar custos fixos",
      icon: <Scissors size={15} className="text-rose-700" />,
      colorClass: "border-rose-500/40 bg-rose-500/10 text-rose-700",
      prompt: "Dá uma olhada nas nossas 18 contas fixas cadastradas. Onde você acha que temos maior oportunidade de economia ou renegociação?",
    },
    {
      id: "reserva_metas",
      title: "Reserva de Emergência",
      icon: <Target size={15} className="text-[#b45309]" />,
      colorClass: "border-amber-500/40 bg-amber-500/10 text-[#b45309]",
      prompt: "Considerando nosso custo fixo mensal de R$ 18.280, de quanto deve ser a nossa Reserva de Emergência ideal e qual a estratégia para completá-la?",
    },
  ];

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isGenerating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating) return;
    
    onSendMessage(inputText);
    setInputText("");
  };

  const handleSelectTheme = (theme: typeof analysisThemes[0]) => {
    if (isGenerating) return;
    setSelectedTheme(theme.title);
    onSendMessage(theme.prompt);
  };

  const handleCustomTopicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTopicTitle.trim() || isGenerating) return;

    const fullPrompt = `${customTopicTitle.trim()}${
      customTopicDetails.trim() ? `. Detalhes: ${customTopicDetails.trim()}` : ""
    }`;

    setSelectedTheme(customTopicTitle.trim());
    onSendMessage(fullPrompt);
    setCustomTopicTitle("");
    setCustomTopicDetails("");
    setIsCustomTopicModalOpen(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[540px] max-h-[850px] animate-fade-in justify-between relative bg-[#ffffff]/80 backdrop-blur-xl border border-[#c4b5d6]/40 rounded-2xl p-4 md:p-6 shadow-2xl space-y-4">
      {/* Top Header & Themes Bar */}
      <div className="border-b border-[#c4b5d6]/50 pb-3 shrink-0 text-left">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-[#7c3aed]/20 to-[#15803d]/20 border border-[#7c3aed]/30 text-[#7c3aed]">
              <Sparkles size={18} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Google Gemini 3.7 Flash
                </h3>
                {apiWarning ? (
                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">
                    <span>Modo simulado</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] text-[#15803d] bg-[#15803d]/10 border border-[#15803d]/30 px-2 py-0.5 rounded-full font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#15803d] animate-ping"></span>
                    <span>Conectado em tempo real</span>
                  </span>
                )}
                {currentlySpeakingId && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-[#15803d] bg-[#15803d]/10 border border-[#15803d]/30 px-2 py-0.5 rounded-full animate-pulse">
                    <Volume2 size={11} />
                    <span>Lendo áudio...</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#6b617c] mt-0.5">
                Converse livremente com o Gemini sobre suas finanças, planos, dúvidas e investimentos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto-read voice toggle button */}
            <button
              type="button"
              onClick={() => {
                if (autoVoiceResponse) {
                  stopSpeaking();
                }
                setAutoVoiceResponse(!autoVoiceResponse);
              }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                autoVoiceResponse
                  ? "bg-[#15803d]/15 text-[#15803d] border-[#15803d]/40"
                  : "bg-violet-50 text-[#6b617c] border-[#c4b5d6] hover:text-slate-900"
              }`}
              title={autoVoiceResponse ? "Voz automática ligada" : "Voz automática desligada (Clique se desejar ouvir respostas automaticamente)"}
            >
              {autoVoiceResponse ? <Volume2 size={14} /> : <VolumeX size={14} />}
              <span>{autoVoiceResponse ? "Voz Automática: ON" : "Voz Automática: OFF"}</span>
            </button>

            <button
              onClick={() => setIsCustomTopicModalOpen(true)}
              className="bg-violet-50 hover:bg-violet-50 border border-[#c4b5d6] hover:border-[#7c3aed]/40 text-xs font-bold text-slate-900 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus size={14} className="text-[#7c3aed]" />
              <span>Perguntar Tópico</span>
            </button>
          </div>
        </div>

        {/* Horizontal Theme Badges / Quick questions */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {analysisThemes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleSelectTheme(theme)}
              disabled={isGenerating}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 disabled:opacity-50 hover:scale-[1.02] active:scale-95 ${
                selectedTheme === theme.title
                  ? "bg-white text-black border-white shadow-md font-bold"
                  : `${theme.colorClass} hover:opacity-90`
              }`}
            >
              {theme.icon}
              <span>{theme.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Top chat history scrollable area */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-5 custom-scrollbar" ref={scrollRef}>
        
        {/* Decorative Alert about API key if warning is present */}
        {apiWarning && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 text-left">
            <AlertCircle size={18} className="text-[#b45309] shrink-0 mt-0.5" />
            <p className="text-xs text-[#b45309] leading-relaxed">
              {apiWarning}
            </p>
          </div>
        )}

        {/* Dynamic chat history log */}
        {chatHistory.map((msg) => {
          const isAI = msg.role === "model";
          return (
            <div
              key={msg.id}
              className={`flex flex-col gap-1.5 max-w-[85%] text-left ${
                isAI ? "self-start" : "self-end ml-auto"
              }`}
            >
              {isAI && (
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={14} className="text-[#7c3aed]" />
                    <span className="text-[10px] font-bold text-[#7c3aed] uppercase tracking-wider">
                      Gemini 3.7 Flash
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => speakText(msg.text, msg.id)}
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                      currentlySpeakingId === msg.id
                        ? "bg-[#15803d]/20 text-[#15803d] border border-[#15803d]/40"
                        : "text-[#6b617c] hover:text-[#7c3aed] hover:bg-violet-50"
                    }`}
                    title={currentlySpeakingId === msg.id ? "Pausar leitura de voz" : "Ouvir esta resposta por voz"}
                  >
                    {currentlySpeakingId === msg.id ? (
                      <>
                        <Square size={10} className="fill-current" />
                        <span>Pausar Voz</span>
                      </>
                    ) : (
                      <>
                        <Volume2 size={12} />
                        <span>Ouvir Resposta</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              <div
                className={`p-4 rounded-2xl ${
                  isAI
                    ? "glass-card rounded-tl-none text-slate-900 border-violet-200/60"
                    : "bg-[#7c3aed] text-white rounded-tr-none font-medium shadow-md shadow-[#7c3aed]/5"
                } text-sm leading-relaxed`}
              >
                {/* Format paragraphs or list items nicely */}
                <div className="space-y-2 whitespace-pre-wrap">
                  {msg.text.split("\n").map((para, i) => {
                    // Check if bullet point
                    if (para.startsWith("- ") || para.startsWith("* ") || para.match(/^\d+\./)) {
                      return (
                        <p key={i} className="pl-2 font-light">
                          {para}
                        </p>
                      );
                    }
                    return <p key={i}>{para}</p>;
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {/* Insight Cards (visible at start of AI tab) */}
        {chatHistory.length <= 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="glass-card p-4 rounded-xl flex items-center gap-4 border-violet-200/60 text-left">
              <div className="bg-rose-500/10 p-3 rounded-lg text-rose-700">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#6b617c] uppercase tracking-wider">Fluxo de Caixa</p>
                <p className="text-xs font-bold text-slate-900 mt-1">Despesas cresceram 15% em lazer este mês</p>
              </div>
            </div>

            <div className="glass-card p-4 rounded-xl flex items-center gap-4 border-violet-200/60 text-left">
              <div className="bg-[#7c3aed]/10 p-3 rounded-lg text-[#15803d]">
                <PiggyBank size={20} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#6b617c] uppercase tracking-wider">Otimização</p>
                <p className="text-xs font-bold text-slate-900 mt-1">Potencial de economia de R$ 620 sugerido</p>
              </div>
            </div>
          </div>
        )}

        {/* Generating placeholder thinking animation */}
        {isGenerating && (
          <div className="flex flex-col gap-1.5 max-w-[85%] text-left self-start">
            <div className="flex items-center gap-2 mb-0.5">
              <Sparkles size={14} className="text-[#7c3aed] animate-spin" />
              <span className="text-[10px] font-bold text-[#7c3aed] uppercase tracking-wider">
                Gemini pensando...
              </span>
            </div>
            <div className="glass-card p-4 rounded-2xl rounded-tl-none border-violet-200/60 flex items-center gap-2">
              <div className="flex space-x-1.5">
                <span className="w-2 h-2 bg-[#7c3aed] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-2 h-2 bg-[#7c3aed] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-2 h-2 bg-[#7c3aed] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
              <span className="text-xs text-[#6b617c] ml-1 font-sans">Analisando contexto financeiro...</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Input Area with Microphone dictation and Text */}
      <form onSubmit={handleSubmit} className="border-t border-[#c4b5d6]/50 pt-3 bg-[#ffffff] rounded-xl p-2 shrink-0">
        <div className="flex items-center gap-2">
          {/* Microphone button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-3 rounded-xl border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
              isListening
                ? "bg-rose-500 text-slate-900 border-rose-400 animate-pulse ring-4 ring-rose-500/20"
                : "bg-[#f8f6fc] border-[#c4b5d6]/70 text-[#7c3aed] hover:border-[#7c3aed] hover:bg-violet-50"
            }`}
            title={isListening ? "Parar de ouvir microfone" : "Falar por microfone (Ditado por voz)"}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <div className="flex-1 relative group">
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
              <Sparkles size={18} className="text-[#7c3aed]" />
            </div>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isGenerating}
              placeholder={isListening ? "Ouvindo sua voz..." : "Digite sua dúvida ou fale pelo microfone..."}
              className="w-full bg-[#f8f6fc] border border-[#c4b5d6]/70 focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] text-slate-900 pl-11 pr-4 py-3 rounded-xl transition-all placeholder:text-[#6b617c]/60 outline-none text-xs md:text-sm disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={!inputText.trim() || isGenerating}
            className="px-5 py-3 rounded-xl bg-[#7c3aed] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#7c3aed]/10 hover:bg-violet-700 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 cursor-pointer shrink-0"
            aria-label="Enviar"
          >
            <span>Enviar</span>
            <Send size={15} strokeWidth={2.5} />
          </button>
        </div>
      </form>

      {/* Custom Topic Modal */}
      {isCustomTopicModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#ffffff] border border-[#c4b5d6] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 text-left">
            <div className="flex justify-between items-center pb-3 border-b border-[#c4b5d6]/50">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <Lightbulb size={20} className="text-[#7c3aed]" />
                <span>Analisar Novo Tema Personalizado</span>
              </div>
              <button
                onClick={() => setIsCustomTopicModalOpen(false)}
                className="text-[#6b617c] hover:text-slate-900 p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[#6b617c]">
              Informe o tema financeiro específico que deseja que a IA examine (ex: compra de imóvel, troca de carro, planejamento de viagem, planejamento tributário, etc.).
            </p>

            <form onSubmit={handleCustomTopicSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6b617c] mb-1.5 uppercase tracking-wider">
                  Título do Tema / Assunto
                </label>
                <input
                  type="text"
                  value={customTopicTitle}
                  onChange={(e) => setCustomTopicTitle(e.target.value)}
                  required
                  placeholder="ex: Comprar Imóvel no valor de R$ 400.000"
                  className="w-full bg-[#f8f6fc] border border-[#c4b5d6] focus:border-[#7c3aed] text-slate-900 text-xs px-4 py-2.5 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6b617c] mb-1.5 uppercase tracking-wider">
                  Detalhes Adicionais ou Pergunta Específica (Opcional)
                </label>
                <textarea
                  value={customTopicDetails}
                  onChange={(e) => setCustomTopicDetails(e.target.value)}
                  rows={3}
                  placeholder="ex: Gostaria de saber quanto preciso poupar por mês e se devo tirar dos investimentos atuais para dar a entrada."
                  className="w-full bg-[#f8f6fc] border border-[#c4b5d6] focus:border-[#7c3aed] text-slate-900 text-xs p-3 rounded-xl outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomTopicModalOpen(false)}
                  className="flex-1 bg-[#f8f6fc] hover:bg-[#f1edf8] text-slate-900 text-xs font-bold py-3 rounded-xl border border-[#c4b5d6] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!customTopicTitle.trim()}
                  className="flex-1 bg-[#7c3aed] hover:bg-violet-700 text-white text-xs font-bold py-3 rounded-xl shadow-lg shadow-[#7c3aed]/10 disabled:opacity-50 cursor-pointer"
                >
                  Gerar Análise do Tema
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
