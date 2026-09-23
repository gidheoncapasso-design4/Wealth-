import React, { useState } from "react";
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Sparkles,
  X,
  FileSpreadsheet,
  ShieldCheck,
  Zap,
  Check,
  RefreshCw,
  Edit3,
  Trash2,
  ThumbsUp,
  AlertCircle,
  HelpCircle,
  CheckCheck,
  AlignLeft,
} from "lucide-react";

export interface ParsedItem {
  id: string;
  title: string;
  originalDescription: string;
  category: string;
  amount: number;
  date: string;
  confidence: "Alta" | "Média" | "Baixa";
  reasoning: string;
  selected: boolean;
  status: "pending" | "approved" | "rejected";
  isEditing?: boolean;
  sourceFile?: string;
}

interface StatementImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportTransactions: (
    imported: Array<{ title: string; category: string; amount: number; icon?: string; date?: string }>
  ) => void;
}

const CATEGORY_OPTIONS = [
  "Cartão de Crédito",
  "Alimentação",
  "Beleza",
  "Transporte",
  "Moradia",
  "Utilidades",
  "Filhos & Cuidados",
  "Serviços",
  "Tributos",
  "Seguros",
  "Entretenimento",
  "Shopping",
  "Saúde",
  "Salário",
  "Investimentos",
  "Outros",
];

const SAMPLE_STATEMENTS = {
  itau_pdf: `EXTRATO BANCÁRIO ITAÚ - MÊS VIGENTE
02/08/2026 - COMPRA DEBITO SUPERMERCADO MAMI - R$ 342,80 -
03/08/2026 - PIX RECEBIDO CONSULTORIA TECH - R$ 4.500,00 +
05/08/2026 - COMPRA CARTAO RESTAURANTE OUTBACK - R$ 210,50 -
08/08/2026 - DEBITO AUTOMATICO NETFLIX COM - R$ 55,90 -
10/08/2026 - PIX ENVIADO POSTO IPIRANGA - R$ 220,00 -
12/08/2026 - RENDIMENTO CDB DIARIO - R$ 184,30 +`,

  nubank_csv: `data,categoria,titulo,valor
2026-08-01,Alimentação,Restaurante Paris 6,-180.00
2026-08-03,Transporte,Uber *Viagem Tecnologica,-42.50
2026-08-05,Investimento,Aporte Tesouro Direto Selic,-2000.00
2026-08-07,Transferência,Pix Recebido de Maria Silva,850.00
2026-08-09,Saúde,Drogaria São Paulo,-115.90`,

  xp_ofx: `<OFX><BANKTRANSLIST>
<STMTTRN><TRNTYPE>CREDIT<DTPOSTED>20260802<TRNAMT>12500.00<MEMO>PAGTO SALARIO DEVEDOR TECH CORP
<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20260804<TRNAMT>-450.00<MEMO>ACADEMIA SMART FIT ANUAL
<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20260806<TRNAMT>-89.00<MEMO>SPOTIFY PREMIUM FAMILIA
</BANKTRANSLIST></OFX>`,
};

export default function StatementImportModal({
  isOpen,
  onClose,
  onImportTransactions,
}: StatementImportModalProps) {
  const [step, setStep] = useState<"upload" | "review" | "success">("upload");
  const [inputTab, setInputTab] = useState<"file" | "paste">("file");
  const [pastedText, setPastedText] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [processingWarning, setProcessingWarning] = useState<string>("");

  if (!isOpen) return null;

  // Helper to ensure invoice payments/card purchases default to negative (saída) unless explicitly a refund/inflow
  const sanitizeParsedItemAmount = (rawAmount: number, title: string, originalDesc: string): number => {
    const combined = (title + " " + originalDesc).toLowerCase();
    const isInvoiceOrPayment =
      combined.includes("pagamento") ||
      combined.includes("fatura") ||
      combined.includes("cartão") ||
      combined.includes("cartao") ||
      combined.includes("débito automático") ||
      combined.includes("debito automatico") ||
      combined.includes("compra") ||
      combined.includes("pix enviado") ||
      combined.includes("tarifa") ||
      combined.includes("transferência enviada");

    const isRefundOrInflow =
      combined.includes("estorno") ||
      combined.includes("devolução") ||
      combined.includes("devolucao") ||
      combined.includes("pix recebido") ||
      combined.includes("salário") ||
      combined.includes("salario") ||
      combined.includes("depósito") ||
      combined.includes("rendimento");

    if (isInvoiceOrPayment && !isRefundOrInflow && rawAmount > 0) {
      return -Math.abs(rawAmount);
    }
    return rawAmount;
  };

  const handleToggleItemSign = (id: string) => {
    setParsedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, amount: -item.amount } : item))
    );
  };

  // Process statement with Gemini API
  const handleParseStatement = async (text: string, fileData?: string, mimeType?: string, name: string = "Extrato_Bancario") => {
    setIsProcessing(true);
    setFileName(name);
    setProcessingWarning("");

    try {
      const response = await fetch("/api/statement/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statementText: text,
          fileData,
          mimeType,
        }),
      });

      const json = await response.json();

      if (json.warning) {
        setProcessingWarning(json.warning);
      }

      if (json.data && Array.isArray(json.data.items) && json.data.items.length > 0) {
        const mappedItems: ParsedItem[] = json.data.items.map((item: any, index: number) => {
          const rawAmt = typeof item.amount === "number" ? item.amount : parseFloat(item.amount) || -100;
          const cleanAmt = sanitizeParsedItemAmount(rawAmt, item.title || "", item.originalDescription || "");
          return {
            id: `item-${index}-${Date.now()}`,
            title: item.title || "Lançamento",
            originalDescription: item.originalDescription || item.title || "",
            category: CATEGORY_OPTIONS.includes(item.category) ? item.category : "Outros",
            amount: cleanAmt,
            date: item.date || "Data não informada",
            confidence: item.confidence === "Alta" || item.confidence === "Média" || item.confidence === "Baixa" ? item.confidence : "Alta",
            reasoning: item.reasoning || "Categorizado automaticamente pela IA",
            selected: true,
            status: "pending",
          };
        });

        setParsedItems(mappedItems);
        setStep("review");
      } else {
        throw new Error("Não foram encontrados lançamentos no texto ou arquivo fornecido.");
      }
    } catch (err: any) {
      alert(`Erro na leitura com IA: ${err.message || "Tente novamente."}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (files.length === 1) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (file.type.startsWith("image/") || file.type === "application/pdf") {
          const base64Data = result.split(",")[1];
          handleParseStatement("", base64Data, file.type, file.name);
        } else {
          handleParseStatement(result, undefined, undefined, file.name);
        }
      };

      if (file.type.startsWith("image/") || file.type === "application/pdf") {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    } else {
      handleMultipleFilesUpload(files);
    }
  };

  const handleMultipleFilesUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setIsProcessing(true);
    setProcessingWarning("");
    setFileName(`${fileArray.length} extratos selecionados (${fileArray.map((f) => f.name).join(", ")})`);

    const combinedItems: ParsedItem[] = [];
    let warningMsg = "";

    for (let fIdx = 0; fIdx < fileArray.length; fIdx++) {
      const file = fileArray[fIdx];
      try {
        const fileContent = await new Promise<{ text?: string; base64Data?: string; mimeType?: string }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result as string;
            if (file.type.startsWith("image/") || file.type === "application/pdf") {
              const base64Data = result.split(",")[1];
              resolve({ base64Data, mimeType: file.type });
            } else {
              resolve({ text: result });
            }
          };
          reader.onerror = (err) => reject(err);

          if (file.type.startsWith("image/") || file.type === "application/pdf") {
            reader.readAsDataURL(file);
          } else {
            reader.readAsText(file);
          }
        });

        const response = await fetch("/api/statement/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            statementText: fileContent.text || "",
            fileData: fileContent.base64Data,
            mimeType: fileContent.mimeType,
          }),
        });

        const json = await response.json();
        if (json.warning && !warningMsg) {
          warningMsg = json.warning;
        }

        if (json.data && Array.isArray(json.data.items) && json.data.items.length > 0) {
          const itemsFromFile: ParsedItem[] = json.data.items.map((item: any, itemIdx: number) => {
            const rawAmt = typeof item.amount === "number" ? item.amount : parseFloat(item.amount) || -100;
            const cleanAmt = sanitizeParsedItemAmount(rawAmt, item.title || "", item.originalDescription || "");
            return {
              id: `item-${fIdx}-${itemIdx}-${Date.now()}`,
              title: item.title || "Lançamento",
              originalDescription: item.originalDescription || item.title || "",
              category: CATEGORY_OPTIONS.includes(item.category) ? item.category : "Outros",
              amount: cleanAmt,
              date: item.date || "Data não informada",
              confidence: item.confidence === "Alta" || item.confidence === "Média" || item.confidence === "Baixa" ? item.confidence : "Alta",
              reasoning: item.reasoning || "Categorizado automaticamente pela IA",
              selected: true,
              status: "pending",
              sourceFile: file.name,
            };
          });

          combinedItems.push(...itemsFromFile);
        }
      } catch (err: any) {
        console.error(`Erro ao analisar ${file.name}:`, err);
      }
    }

    if (warningMsg) setProcessingWarning(warningMsg);

    if (combinedItems.length > 0) {
      setParsedItems(combinedItems);
      setStep("review");
    } else {
      alert("Não foi possível extrair lançamentos dos arquivos fornecidos. Verifique o formato e tente novamente.");
    }

    setIsProcessing(false);
  };

  const handleSampleClick = (key: keyof typeof SAMPLE_STATEMENTS, label: string) => {
    const sample = SAMPLE_STATEMENTS[key];
    handleParseStatement(sample, undefined, undefined, label);
  };

  const handlePastedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedText.trim()) return;
    handleParseStatement(pastedText, undefined, undefined, "Texto_Copiado.txt");
  };

  const toggleSelectAll = () => {
    const allSelected = parsedItems.every((item) => item.selected);
    setParsedItems(parsedItems.map((item) => ({ ...item, selected: !allSelected })));
  };

  const toggleItemSelect = (id: string) => {
    setParsedItems(
      parsedItems.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleCategoryChange = (id: string, newCategory: string) => {
    setParsedItems(
      parsedItems.map((item) =>
        item.id === id
          ? {
              ...item,
              category: newCategory,
              reasoning: `Categoria ajustada manualmente pelo usuário para '${newCategory}'`,
            }
          : item
      )
    );
  };

  const handleItemStatusChange = (id: string, status: "approved" | "rejected" | "pending") => {
    setParsedItems(
      parsedItems.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  const handleUpdateItemField = (id: string, field: "title" | "amount", value: any) => {
    setParsedItems(
      parsedItems.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const toggleItemEdit = (id: string) => {
    setParsedItems(
      parsedItems.map((item) => (item.id === id ? { ...item, isEditing: !item.isEditing } : item))
    );
  };

  const handleApproveSelected = () => {
    setParsedItems(
      parsedItems.map((item) => (item.selected ? { ...item, status: "approved" } : item))
    );
  };

  const handleRejectSelected = () => {
    setParsedItems(
      parsedItems.map((item) => (item.selected ? { ...item, status: "rejected" } : item))
    );
  };

  const handleConfirmImport = () => {
    // Approved or selected items
    const approvedItems = parsedItems.filter(
      (i) => i.status === "approved" || (i.status === "pending" && i.selected)
    );

    // Rejected items
    const rejectedItems = parsedItems.filter(
      (i) => i.status === "rejected" || (i.status === "pending" && !i.selected)
    );

    if (approvedItems.length === 0 && rejectedItems.length === 0) {
      alert("Nenhum lançamento encontrado para guardar.");
      return;
    }

    const allToImport = [
      ...approvedItems.map((item) => ({
        title: item.title,
        category: item.category,
        date: item.date,
        amount: item.amount,
        icon: item.amount > 0 ? "payments" : "shopping_bag",
        isRejected: false,
      })),
      ...rejectedItems.map((item) => ({
        title: item.title,
        category: item.category,
        date: item.date,
        amount: item.amount,
        icon: item.amount > 0 ? "payments" : "shopping_bag",
        isRejected: true,
      })),
    ];

    onImportTransactions(allToImport);

    setStep("success");
    setTimeout(() => {
      onClose();
      setStep("upload");
      setParsedItems([]);
      setPastedText("");
    }, 1800);
  };

  const pendingCount = parsedItems.filter((i) => i.status === "pending").length;
  const approvedCount = parsedItems.filter((i) => i.status === "approved" || (i.status === "pending" && i.selected)).length;
  const rejectedCount = parsedItems.filter((i) => i.status === "rejected").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-3xl bg-[#ffffff] border border-[#c4b5d6]/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#c4b5d6]/40 bg-[#f8f6fc]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7c3aed]/10 border border-[#7c3aed]/20 flex items-center justify-center text-[#7c3aed]">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                Leitor & Categorizador de Extrato com IA
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#15803d]/10 border border-[#15803d]/20 text-[#15803d]">
                  Gemini 3.6
                </span>
              </h3>
              <p className="text-xs text-[#6b617c]">
                A IA lê, categoriza e envia os lançamentos para o seu Campo de Aprovação
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#6b617c] hover:text-slate-900 p-2 rounded-full hover:bg-violet-50 transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          {step === "upload" && !isProcessing && (
            <div className="space-y-6">
              {/* Input Method Tabs */}
              <div className="grid grid-cols-2 bg-[#f8f6fc] p-1 rounded-2xl border border-[#c4b5d6]/50">
                <button
                  type="button"
                  onClick={() => setInputTab("file")}
                  className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    inputTab === "file"
                      ? "bg-[#7c3aed] text-white shadow-md"
                      : "text-[#6b617c] hover:text-slate-900"
                  }`}
                >
                  <UploadCloud size={16} />
                  Enviar Arquivo / Foto
                </button>
                <button
                  type="button"
                  onClick={() => setInputTab("paste")}
                  className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    inputTab === "paste"
                      ? "bg-[#7c3aed] text-white shadow-md"
                      : "text-[#6b617c] hover:text-slate-900"
                  }`}
                >
                  <AlignLeft size={16} />
                  Colar Texto do Extrato
                </button>
              </div>

              {inputTab === "file" ? (
                /* File Upload Drop Zone */
                <div className="relative border-2 border-dashed border-[#c4b5d6] hover:border-[#7c3aed]/50 rounded-2xl p-8 text-center bg-[#ffffff]/40 hover:bg-[#ffffff]/80 transition-all group cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept=".ofx,.csv,.pdf,.txt,image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#7c3aed]/10 border border-[#7c3aed]/20 flex items-center justify-center text-[#7c3aed] group-hover:scale-110 transition-all">
                      <UploadCloud size={28} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Arraste 1 ou múltiplos extratos aqui ou <span className="text-[#7c3aed]">clique para escolher arquivos</span>
                      </p>
                      <p className="text-xs text-[#6b617c] mt-1">
                        Selecione vários arquivos de uma vez (Ex: <span className="font-mono text-slate-900">3 extratos em .PDF/.OFX/.CSV</span>). A IA lerá todos em lote!
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Text Area Paste Zone */
                <form onSubmit={handlePastedSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#6b617c] uppercase tracking-wider">
                      Cole o texto das notificações ou extrato do app bancário:
                    </label>
                    <textarea
                      rows={6}
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder="Exemplo:&#10;02/08 Compra no Supermercado Mami R$ 342,80&#10;03/08 Pix Recebido de Consultoria Tech R$ 4.500,00&#10;05/08 Uber Viagem R$ 42,50&#10;08/08 Netflix R$ 55,90"
                      className="w-full bg-[#ffffff] border border-[#c4b5d6] rounded-2xl p-4 text-xs font-mono text-slate-900 focus:border-[#7c3aed] outline-none leading-relaxed placeholder:text-[#6b617c]/50"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={!pastedText.trim()}
                    className="w-full bg-[#7c3aed] text-white py-3.5 rounded-xl font-bold text-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-lg shadow-[#7c3aed]/10 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Sparkles size={16} />
                    Analisar & Categorizar com IA
                  </button>
                </form>
              )}

              {/* Sample files 1-click test */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-[#6b617c] uppercase tracking-wider">
                    Ou teste agora com um extrato real de amostra
                  </p>
                  <span className="text-[10px] text-[#7c3aed] font-medium flex items-center gap-1">
                    <Zap size={12} /> Auto-Leitura
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSampleClick("itau_pdf", "Extrato_Itau_Agosto.pdf")}
                    className="p-3 bg-[#f8f6fc] border border-[#c4b5d6]/50 rounded-xl text-left hover:border-[#7c3aed]/40 hover:bg-[#f1edf8] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-[#7c3aed]">Extrato Itaú</span>
                      <FileText size={14} className="text-[#6b617c]" />
                    </div>
                    <p className="text-[10px] text-[#6b617c] mt-1">Simulação de Extrato Itaú</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSampleClick("nubank_csv", "Nubank_Agosto.csv")}
                    className="p-3 bg-[#f8f6fc] border border-[#c4b5d6]/50 rounded-xl text-left hover:border-[#7c3aed]/40 hover:bg-[#f1edf8] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-[#7c3aed]">Extrato Nubank</span>
                      <FileSpreadsheet size={14} className="text-[#6b617c]" />
                    </div>
                    <p className="text-[10px] text-[#6b617c] mt-1">Exportação CSV NuBank</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSampleClick("xp_ofx", "XP_Investimentos.ofx")}
                    className="p-3 bg-[#f8f6fc] border border-[#c4b5d6]/50 rounded-xl text-left hover:border-[#7c3aed]/40 hover:bg-[#f1edf8] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-[#7c3aed]">Extrato XP / OFX</span>
                      <Zap size={14} className="text-[#6b617c]" />
                    </div>
                    <p className="text-[10px] text-[#6b617c] mt-1">Padrão OFX Unificado</p>
                  </button>
                </div>
              </div>

              {/* Security Banner */}
              <div className="p-4 bg-[#f8f6fc]/80 border border-[#c4b5d6]/40 rounded-2xl flex items-center gap-3">
                <ShieldCheck size={20} className="text-[#15803d] shrink-0" />
                <p className="text-[11px] text-[#6b617c] leading-snug">
                  Seus dados bancários são lidos com segurança no servidor via Gemini AI. O sistema só registra as transações que você aprovar explicitamente.
                </p>
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="py-16 text-center space-y-4">
              <RefreshCw size={40} className="mx-auto text-[#7c3aed] animate-spin" />
              <div>
                <h4 className="text-base font-bold text-slate-900">Gemini IA Analisando Extrato...</h4>
                <p className="text-xs text-[#6b617c] mt-1">Extraindo datas, valores e gerando sugestões de categorização inteligente.</p>
              </div>
            </div>
          )}

          {/* STEP 2: APPROVAL QUEUE (CAMPO DE APROVAÇÃO DO USUÁRIO) */}
          {step === "review" && !isProcessing && (
            <div className="space-y-4">
              {processingWarning && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-xs text-amber-700">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{processingWarning}</span>
                </div>
              )}

              {/* Approval Header Controls */}
              <div className="p-4 bg-[#f8f6fc] rounded-2xl border border-[#c4b5d6]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-[#7c3aed]" />
                    <h4 className="text-sm font-bold text-slate-900">Campo de Aprovação da IA</h4>
                    <span className="text-[10px] bg-[#7c3aed]/10 text-[#7c3aed] font-mono px-2 py-0.5 rounded-md border border-[#7c3aed]/20">
                      {parsedItems.length} identificados
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6b617c] mt-0.5">
                    Confira a categoria sugerida pela IA. Clique para alterar qualquer campo antes de aprovar.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={handleApproveSelected}
                    className="px-3 py-1.5 rounded-lg bg-[#15803d]/15 border border-[#15803d]/30 text-[#15803d] text-xs font-bold hover:bg-[#15803d]/25 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <CheckCheck size={14} /> Aprovar Selecionados
                  </button>
                  <button
                    type="button"
                    onClick={handleRejectSelected}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-700 text-xs font-bold hover:bg-rose-500/25 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 size={14} /> Rejeitar
                  </button>
                </div>
              </div>

              {/* Select All Toggle */}
              <div className="flex items-center justify-between px-2 text-xs text-[#6b617c]">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="hover:text-slate-900 font-medium cursor-pointer flex items-center gap-1.5"
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                      parsedItems.every((i) => i.selected)
                        ? "bg-[#7c3aed] border-[#7c3aed] text-white"
                        : "border-[#c4b5d6]"
                    }`}
                  >
                    {parsedItems.every((i) => i.selected) && <Check size={10} strokeWidth={3} />}
                  </div>
                  <span>{parsedItems.every((i) => i.selected) ? "Desmarcar todos" : "Selecionar todos"}</span>
                </button>

                <div className="flex gap-3 text-[11px] font-mono">
                  <span className="text-[#15803d]">Aprovados: {approvedCount}</span>
                  <span className="text-rose-700">Rejeitados: {rejectedCount}</span>
                </div>
              </div>

              {/* Transactions List with Editable Categories & Approval buttons */}
              <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
                {parsedItems.map((item) => {
                  const isExpense = item.amount < 0;
                  const isApproved = item.status === "approved";
                  const isRejected = item.status === "rejected";

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        isApproved
                          ? "bg-[#ecfdf5] border-[#15803d]/40 shadow-sm"
                          : isRejected
                          ? "bg-[#fff1f2]/60 border-rose-500/30 opacity-60"
                          : item.selected
                          ? "bg-[#f8f6fc] border-[#7c3aed]/40 shadow-sm"
                          : "bg-[#ffffff] border-[#c4b5d6]/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          {/* Checkbox */}
                          <button
                            type="button"
                            onClick={() => toggleItemSelect(item.id)}
                            className={`w-5 h-5 mt-0.5 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                              item.selected
                                ? "bg-[#7c3aed] border-[#7c3aed] text-white"
                                : "border-[#c4b5d6]"
                            }`}
                          >
                            {item.selected && <Check size={12} strokeWidth={3} />}
                          </button>

                          {/* Editable or Display Title */}
                          <div className="flex-1 space-y-1">
                            {item.isEditing ? (
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) => handleUpdateItemField(item.id, "title", e.target.value)}
                                className="w-full bg-[#ffffff] border border-[#7c3aed]/50 rounded-lg px-2 py-1 text-xs text-slate-900 outline-none"
                              />
                            ) : (
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-slate-900 tracking-tight">{item.title}</p>
                                <button
                                  type="button"
                                  onClick={() => toggleItemEdit(item.id)}
                                  className="text-[#6b617c] hover:text-[#7c3aed] cursor-pointer"
                                  title="Editar título e valor"
                                >
                                  <Edit3 size={12} />
                                </button>
                              </div>
                            )}

                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-[10px] text-[#6b617c] font-mono truncate" title={item.originalDescription}>
                                Extrato: {item.originalDescription}
                              </p>
                              {item.sourceFile && (
                                <span className="text-[9px] px-2 py-0.5 rounded bg-[#c4b5d6]/60 text-[#7c3aed] border border-[#c4b5d6] font-mono shrink-0">
                                  📄 {item.sourceFile}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Amount & Date & Sign Toggle */}
                        <div className="text-right shrink-0 flex flex-col items-end gap-1">
                          {item.isEditing ? (
                            <input
                              type="number"
                              step="0.01"
                              value={item.amount}
                              onChange={(e) => handleUpdateItemField(item.id, "amount", parseFloat(e.target.value) || 0)}
                              className="w-24 bg-[#ffffff] border border-[#7c3aed]/50 rounded-lg px-2 py-1 text-xs font-mono text-slate-900 text-right outline-none"
                            />
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleToggleItemSign(item.id)}
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                                  isExpense
                                    ? "bg-rose-500/10 text-rose-700 border-rose-500/30 hover:bg-rose-500/20"
                                    : "bg-[#15803d]/10 text-[#15803d] border-[#15803d]/30 hover:bg-[#15803d]/20"
                                }`}
                                title="Clique para alternar entre Entrada (+) e Saída (-)"
                              >
                                {isExpense ? "Saída (-)" : "Entrada (+)"}
                              </button>
                              <p
                                className={`font-mono text-xs font-bold ${
                                  isExpense ? "text-rose-700" : "text-[#15803d]"
                                }`}
                              >
                                {isExpense ? "- " : "+ "}
                                {Math.abs(item.amount).toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </p>
                            </div>
                          )}
                          <span className="text-[10px] text-[#6b617c] font-mono block">{item.date}</span>
                        </div>
                      </div>

                      {/* AI Classification Row & User Category Dropdown */}
                      <div className="pt-2 border-t border-[#c4b5d6]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold text-[#6b617c] uppercase tracking-wider">
                            Categoria IA:
                          </span>
                          
                          {/* Category Selector so user can approve or change */}
                          <select
                            value={item.category}
                            onChange={(e) => handleCategoryChange(item.id, e.target.value)}
                            className="bg-[#f1edf8] text-slate-900 border border-[#c4b5d6] rounded-lg px-2.5 py-1 text-xs font-medium focus:border-[#7c3aed] outline-none cursor-pointer"
                          >
                            {CATEGORY_OPTIONS.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>

                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#7c3aed]/10 text-[#7c3aed] border border-[#7c3aed]/20 font-mono">
                            Confiança: {item.confidence}
                          </span>
                        </div>

                        {/* Status Buttons for Individual Item */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {isApproved ? (
                            <span className="text-[11px] font-bold text-[#15803d] bg-[#15803d]/10 border border-[#15803d]/30 px-3 py-1 rounded-lg flex items-center gap-1">
                              <Check size={12} /> Aprovado
                            </span>
                          ) : isRejected ? (
                            <span className="text-[11px] font-bold text-rose-700 bg-rose-500/10 border border-rose-500/30 px-3 py-1 rounded-lg flex items-center gap-1">
                              <X size={12} /> Rejeitado
                            </span>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleItemStatusChange(item.id, "approved")}
                                className="px-3 py-1 rounded-lg bg-[#15803d]/15 border border-[#15803d]/30 text-[#15803d] text-xs font-bold hover:bg-[#15803d]/30 transition-all cursor-pointer flex items-center gap-1"
                              >
                                <ThumbsUp size={12} /> Aprovar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleItemStatusChange(item.id, "rejected")}
                                className="px-3 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-700 text-xs font-bold hover:bg-rose-500/30 transition-all cursor-pointer flex items-center gap-1"
                              >
                                <X size={12} /> Rejeitar
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* AI Reasoning Box */}
                      {item.reasoning && (
                        <div className="p-2 bg-[#ffffff] rounded-xl border border-[#c4b5d6]/40 text-[10px] text-[#7c3aed]/90 flex items-start gap-1.5 leading-snug">
                          <HelpCircle size={12} className="shrink-0 mt-0.5 text-[#7c3aed]" />
                          <span>
                            <strong>Motivo da IA:</strong> {item.reasoning}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Confirm & Import Bar */}
              <div className="pt-3 border-t border-[#c4b5d6]/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep("upload")}
                  className="text-xs text-[#6b617c] hover:text-slate-900 cursor-pointer"
                >
                  ← Ler outro extrato
                </button>

                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="w-full sm:w-auto bg-[#7c3aed] text-white px-6 py-3.5 rounded-xl font-bold text-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-lg shadow-[#7c3aed]/10 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  Confirmar & Gravar {approvedCount} Transações no Extrato
                </button>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="py-12 text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-[#15803d]/10 border border-[#15803d]/30 flex items-center justify-center text-[#15803d] mx-auto">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">Extrato Aprovado e Salvo com Sucesso!</h4>
                <p className="text-xs text-[#6b617c] mt-1">
                  Os lançamentos categorizados e aprovados foram integrados ao seu fluxo de caixa e extrato oficial.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
