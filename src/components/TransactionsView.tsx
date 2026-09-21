import { isPaidInPeriod } from "../lib/accountingPeriod";
import { reminderDate } from "../lib/reminderDate";
import React, { useState, useEffect } from "react";
import { Search, Filter, Download, Plus, Paperclip, FileText, ShoppingBag, Utensils, CreditCard, Plane, ShieldAlert, Heart, Landmark, RefreshCw, X, Calendar, CheckCircle, Clock, Trash2, Check, UploadCloud, Sparkles, MessageSquare, Bell, Send, Edit3, Tag, Layers } from "lucide-react";
import { Transaction, RecurringExpense, WhatsAppConfig } from "../types";
import AlertsSettingsModal from "./AlertsSettingsModal";
import { authFetch } from "../lib/authFetch";
import { getTomorrowDayOfMonth } from "../lib/dateUtils";

interface TransactionsViewProps {
  transactions: Transaction[];
  onAddTransaction: (newTx: Omit<Transaction, "id" | "time" | "date" | "colorClass"> & { isRecurring?: boolean }) => void;
  onDeleteTransaction?: (id: string) => void;
  onRestoreTransaction?: (id: string) => void;
  onToggleTransactionType?: (id: string) => void;
  onUpdateTransactionCategory?: (id: string, newCategory: string) => void;
  onResetDemoData?: () => void;
  recurringExpenses: RecurringExpense[];
  onAddRecurringExpense: (newExpense: Omit<RecurringExpense, "id" | "paidThisMonth">) => void;
  onDeleteRecurringExpense: (id: string) => void;
  onTogglePaidRecurringExpense: (id: string) => void;
  onOpenImportModal?: () => void;
  whatsappConfig?: WhatsAppConfig;
  onUpdateWhatsappConfig?: (newConfig: WhatsAppConfig) => void;
}

export default function TransactionsView({
  transactions,
  onAddTransaction,
  onDeleteTransaction,
  onRestoreTransaction,
  onToggleTransactionType,
  onUpdateTransactionCategory,
  onResetDemoData,
  recurringExpenses,
  onAddRecurringExpense,
  onDeleteRecurringExpense,
  onTogglePaidRecurringExpense,
  onOpenImportModal,
  whatsappConfig = { phoneNumber: "5519982513836", enabled: true, daysAhead: 1 },
  onUpdateWhatsappConfig,
}: TransactionsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"All" | "ThisMonth" | "Inflow" | "Unidentified" | "Rejected">("All");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [showAllCategories, setShowAllCategories] = useState<boolean>(true);
  const [editingTxCategory, setEditingTxCategory] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // View mode state (history/extrto vs fixed expenses)
  const [viewMode, setViewMode] = useState<"history" | "fixed">("history");

  // WhatsApp/Google alerts modal visibility (its own settings/state live in AlertsSettingsModal)
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
  const [isAutoDispatching, setIsAutoDispatching] = useState(false);

  // New recurring expense states
  const [recTitle, setRecTitle] = useState("");
  const [recCategory, setRecCategory] = useState("Utilidades");
  const [recAmount, setRecAmount] = useState("");
  const [recDueDate, setRecDueDate] = useState("10");
  const [isAddRecOpen, setIsAddRecOpen] = useState(false);

  // Add transaction form fields
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("Receita / Salário");
  const [formAmount, setFormAmount] = useState("");
  const [formType, setFormType] = useState<"inflow" | "outflow">("inflow");
  const [formIsRecurring, setFormIsRecurring] = useState(false);
  const [formNote, setFormNote] = useState(false);
  const [formAttachment, setFormAttachment] = useState(false);

  const rejectedCount = transactions.filter((tx) => tx.isRejected).length;
  const unidentifiedCount = transactions.filter((tx) => !tx.isRejected && tx.category === "Não Identificado").length;

  // Group transactions by date
  const filteredTxs = transactions.filter((tx) => {
    // Search filter
    const matchesSearch =
      tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Selected category filter
    if (selectedCategoryFilter && tx.category !== selectedCategoryFilter) {
      return false;
    }

    if (activeFilter === "Rejected") {
      return tx.isRejected === true;
    }

    // Hide rejected transactions from all other tabs
    if (tx.isRejected) return false;

    if (activeFilter === "ThisMonth") {
      return tx.date.includes("Hoje") || tx.date.includes("Ontem");
    }
    if (activeFilter === "Inflow") {
      return tx.amount > 0;
    }
    if (activeFilter === "Unidentified") {
      return tx.category === "Não Identificado";
    }
    return true;
  });

  // Helper to render icons
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "shopping_bag":
        return <ShoppingBag size={20} />;
      case "restaurant":
        return <Utensils size={20} />;
      case "payments":
        return <CreditCard size={20} />;
      case "flight":
        return <Plane size={20} />;
      case "stethoscope":
      case "heart":
        return <Heart size={20} />;
      case "account_balance":
        return <Landmark size={20} />;
      case "sparkles":
        return <Sparkles size={20} />;
      default:
        return <Landmark size={20} />;
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formAmount) return;

    const numericAmount = parseFloat(formAmount);
    if (isNaN(numericAmount)) return;

    onAddTransaction({
      title: formTitle,
      category: formCategory,
      amount: formType === "outflow" ? -Math.abs(numericAmount) : Math.abs(numericAmount),
      icon: getIconByCategory(formCategory),
      hasNote: formNote,
      hasAttachment: formAttachment,
      isRecurring: formIsRecurring,
    });

    // Reset and close
    setFormTitle("");
    setFormAmount("");
    setFormIsRecurring(false);
    setFormNote(false);
    setFormAttachment(false);
    setIsAddOpen(false);
  };

  const getIconByCategory = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes("dízimo") || cat.includes("dizimo") || cat.includes("doações") || cat.includes("doacao")) return "heart";
    if (cat.includes("beleza") || cat.includes("salão") || cat.includes("unha") || cat.includes("barbea") || cat.includes("estétic")) return "sparkles";
    if (cat.includes("comida") || cat.includes("restaurante")) return "restaurant";
    if (cat.includes("compras") || cat.includes("eletrônicos") || cat.includes("loja")) return "shopping_bag";
    if (cat.includes("viagem") || cat.includes("voo")) return "flight";
    if (cat.includes("saúde") || cat.includes("médico")) return "stethoscope";
    if (cat.includes("dividendo") || cat.includes("banco")) return "account_balance";
    return "payments";
  };

  const handleRecSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recTitle || !recAmount || !recDueDate) return;

    const numericAmount = parseFloat(recAmount);
    const numericDueDate = parseInt(recDueDate);
    if (isNaN(numericAmount) || isNaN(numericDueDate)) return;

    onAddRecurringExpense({
      title: recTitle,
      category: recCategory,
      amount: numericAmount,
      dueDate: numericDueDate,
    });

    // Reset and close
    setRecTitle("");
    setRecAmount("");
    setRecDueDate("10");
    setIsAddRecOpen(false);
  };

  // Current date calculations for 1-day before WhatsApp reminders
  const tomorrowDayOfMonth = reminderDate().tomorrowDay;

  // Bills due tomorrow or in 1 day that are unpaid
  const billsDueTomorrow = recurringExpenses.filter(
    (item) => !isPaidInPeriod(item, reminderDate().tomorrowPeriod) && item.dueDate === tomorrowDayOfMonth
  );

  // Send WhatsApp reminder for a single bill (uses the saved whatsappConfig, not
  // an unsaved draft, so it always matches what was actually configured)
  const handleSendWhatsappReminder = async (expense: RecurringExpense) => {
    const cleanPhone = (whatsappConfig.phoneNumber || "5519982513836").replace(/\D/g, "");
    const formattedAmount = expense.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    try {
      const res = await authFetch("/api/whatsapp/send-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: cleanPhone,
          title: expense.title,
          amount: expense.amount,
          dueDate: expense.dueDate,
          daysAhead: 1,
          whatsappConfig,
        }),
      });

      const data = await res.json();
      if (data.directSent) {
        alert(`✓ Lembrete de "${expense.title}" enviado automaticamente para o seu WhatsApp (${cleanPhone})!`);
        return;
      }

      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, "_blank");
      }
    } catch (err) {
      // Fallback direct WhatsApp API link
      const text = `🔔 *Lembrete Wealth*\n\nOlá! ⚠️ Sua conta *${expense.title}* (${formattedAmount}) vence amanhã (dia ${expense.dueDate}).\n\n👉 Marque como pago no seu app: ${window.location.origin}`;
      const url = `https://api.whatsapp.com/send?phone=${cleanPhone.startsWith("55") ? cleanPhone : "55" + cleanPhone}&text=${encodeURIComponent(text)}`;
      window.open(url, "_blank");
    }
  };

  // Dispatch all reminders due tomorrow (uses the saved whatsappConfig)
  const handleAutoDispatchDueTomorrow = async () => {
    setIsAutoDispatching(true);
    try {
      const res = await authFetch("/api/whatsapp/auto-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recurringExpenses, whatsappConfig }),
      });
      const data = await res.json();
      if (data.directSent) {
        alert(`✓ Sucesso! ${data.message || `Lembrete das contas vencendo amanhã enviado diretamente para o seu WhatsApp!`}`);
      } else if (data.whatsappUrl) {
        window.open(data.whatsappUrl, "_blank");
      } else {
        alert(data.message || "Nenhuma conta pendente para amanhã.");
      }
    } catch (err: any) {
      alert("Erro ao disparar alertas: " + err.message);
    } finally {
      setIsAutoDispatching(false);
    }
  };

  const totalFixedAmount = recurringExpenses.reduce((sum, item) => sum + item.amount, 0);
  const paidFixedAmount = recurringExpenses
    .filter((item) => isPaidInPeriod(item))
    .reduce((sum, item) => sum + item.amount, 0);
  const pendingFixedAmount = totalFixedAmount - paidFixedAmount;
  const totalCount = recurringExpenses.length;
  const paidCount = recurringExpenses.filter((item) => isPaidInPeriod(item)).length;
  const paidPercentage = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = ["Data", "Titulo", "Categoria", "Valor_BRL", "Horario"];
    const rows = transactions.map((tx) => [
      `"${tx.date}"`,
      `"${tx.title.replace(/"/g, '""')}"`,
      `"${tx.category}"`,
      tx.amount.toFixed(2),
      `"${tx.time || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `extrato_financeiro_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculations for Category Expenses Breakdown
  const categoryTotals: { [key: string]: number } = {};
  let totalExpensesSum = 0;

  transactions.forEach((tx) => {
    if (tx.amount < 0 && !tx.isRejected) {
      const absVal = Math.abs(tx.amount);
      const cat = tx.category || "Outros";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + absVal;
      totalExpensesSum += absVal;
    }
  });

  const allCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const top5Categories = allCategories.slice(0, 5);
  const remainingCategories = allCategories.slice(5);
  const remainingSum = remainingCategories.reduce((sum, [, amt]) => sum + amt, 0);

  const displayedCategories = showAllCategories ? allCategories : top5Categories;

  // Group by date text
  const groupedTransactions: { [key: string]: Transaction[] } = {};
  filteredTxs.forEach((tx) => {
    if (!groupedTransactions[tx.date]) {
      groupedTransactions[tx.date] = [];
    }
    groupedTransactions[tx.date].push(tx);
  });

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Header & Sub-navigation Toggle */}
      <section>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">
                {viewMode === "history" ? "Transações" : "Despesas Fixas"}
              </h2>
              <p className="text-[#8b90a0] text-sm">
                {viewMode === "history"
                  ? "Acompanhamento de movimentações em tempo real"
                  : "Controle de despesas recorrentes e compromissos mensais"}
              </p>
            </div>
            
            {/* View Mode Dual Selector */}
            <div className="grid grid-cols-2 bg-[#1c1b1b] p-1 rounded-xl border border-[#353534]/50 w-full md:w-80">
              <button
                type="button"
                onClick={() => setViewMode("history")}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  viewMode === "history"
                    ? "bg-[#adc6ff] text-[#002e69]"
                    : "text-[#8b90a0] hover:text-[#c1c6d7]"
                }`}
              >
                <RefreshCw size={13} />
                Fluxo de Caixa
              </button>
              <button
                type="button"
                onClick={() => setViewMode("fixed")}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  viewMode === "fixed"
                    ? "bg-[#adc6ff] text-[#002e69]"
                    : "text-[#8b90a0] hover:text-[#c1c6d7]"
                }`}
              >
                <Calendar size={13} />
                Despesas Fixas
              </button>
            </div>
          </div>

          {/* Regular Transactions Header Controls (Only visible in history mode) */}
          {viewMode === "history" && (
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b90a0]" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar por descrição ou categoria..."
                  className="w-full bg-[#1c1b1b]/50 border-b-2 border-[#353534]/50 focus:border-[#adc6ff] focus:ring-0 text-white py-4 pl-12 pr-4 transition-all duration-300 rounded-t-xl placeholder:text-[#8b90a0]/60 outline-none text-sm"
                />
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
                <button
                  onClick={() => setActiveFilter("All")}
                  className={`whitespace-nowrap px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activeFilter === "All"
                      ? "bg-[#adc6ff] text-[#002e69]"
                      : "bg-[#201f1f] text-[#c1c6d7] hover:bg-[#2a2a2a]"
                  }`}
                >
                  Tudo
                </button>
                <button
                  onClick={() => setActiveFilter("ThisMonth")}
                  className={`whitespace-nowrap px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activeFilter === "ThisMonth"
                      ? "bg-[#adc6ff] text-[#002e69]"
                      : "bg-[#201f1f] text-[#c1c6d7] hover:bg-[#2a2a2a]"
                  }`}
                >
                  Este Mês
                </button>
                <button
                  onClick={() => setActiveFilter("Inflow")}
                  className={`whitespace-nowrap px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activeFilter === "Inflow"
                      ? "bg-[#adc6ff] text-[#002e69]"
                      : "bg-[#201f1f] text-[#c1c6d7] hover:bg-[#2a2a2a]"
                  }`}
                >
                  Entradas
                </button>
                <button
                  onClick={() => setActiveFilter("Unidentified")}
                  className={`whitespace-nowrap px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeFilter === "Unidentified"
                      ? "bg-amber-400 text-black"
                      : "bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20"
                  }`}
                >
                  <span>❓ Não Identificadas</span>
                  {unidentifiedCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/30 font-extrabold">
                      {unidentifiedCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveFilter("Rejected")}
                  className={`whitespace-nowrap px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeFilter === "Rejected"
                      ? "bg-rose-500 text-white"
                      : "bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20"
                  }`}
                >
                  <span>🚫 Rejeitadas</span>
                  {rejectedCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/40 font-extrabold">
                      {rejectedCount}
                    </span>
                  )}
                </button>

                {onOpenImportModal && (
                  <button
                    onClick={onOpenImportModal}
                    className="whitespace-nowrap px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer bg-[#adc6ff]/15 border border-[#adc6ff]/30 text-[#adc6ff] hover:bg-[#adc6ff]/25 flex items-center gap-1.5"
                    title="Importar PDF, OFX ou CSV"
                  >
                    <UploadCloud size={14} />
                    <span>Importar Extrato</span>
                  </button>
                )}

                <button
                  onClick={handleExportCSV}
                  className="whitespace-nowrap px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer bg-white/5 border border-white/10 text-[#c1c6d7] hover:bg-white/10 hover:text-white flex items-center gap-1.5"
                  title="Baixar extrato completo em CSV"
                >
                  <Download size={14} />
                  <span>Exportar CSV</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* History View Mode Content */}
      {viewMode === "history" && (
        <section className="space-y-8 pb-12">
          {/* Category Expenses Breakdown Summary Card */}
          {allCategories.length > 0 && (
            <div className="glass-card rounded-2xl p-5 border border-[#353534]/40 bg-[#191818]/80 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter size={16} className="text-[#adc6ff]" />
                  <h3 className="text-sm font-bold text-white">Distribuição de Saídas por Categoria (Mês)</h3>
                  <span className="text-[10px] font-bold text-[#adc6ff] bg-[#adc6ff]/10 border border-[#adc6ff]/20 px-2.5 py-0.5 rounded-full">
                    {allCategories.length} {allCategories.length === 1 ? "categoria identificada" : "categorias identificadas"}
                  </span>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="font-mono text-xs text-[#8b90a0]">
                    Total: {totalExpensesSum.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>

                  {allCategories.length > 5 && (
                    <button
                      type="button"
                      onClick={() => setShowAllCategories(!showAllCategories)}
                      className="text-xs font-bold text-[#adc6ff] bg-[#adc6ff]/10 hover:bg-[#adc6ff]/20 border border-[#adc6ff]/30 px-3 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Layers size={13} />
                      <span>{showAllCategories ? "Mostrar Top 5" : `Ver Todas (${allCategories.length})`}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Selected category active filter notification */}
              {selectedCategoryFilter && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#adc6ff]/10 border border-[#adc6ff]/30 text-xs animate-fade-in">
                  <span className="text-white font-medium flex items-center gap-2">
                    <Tag size={14} className="text-[#adc6ff]" />
                    <span>Filtrando por categoria:</span>
                    <strong className="text-[#adc6ff] font-bold text-sm">{selectedCategoryFilter}</strong>
                    <span className="text-[#8b90a0] font-mono">
                      ({(categoryTotals[selectedCategoryFilter] || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })})
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryFilter(null)}
                    className="text-xs text-rose-400 hover:text-white font-bold bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1 rounded-lg border border-rose-500/30 transition-all cursor-pointer"
                  >
                    Limpar Filtro ✕
                  </button>
                </div>
              )}

              {/* Grid of category cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pt-1">
                {displayedCategories.map(([cat, amount]) => {
                  const pct = totalExpensesSum > 0 ? Math.round((amount / totalExpensesSum) * 100) : 0;
                  const isSelected = selectedCategoryFilter === cat;

                  return (
                    <div
                      key={cat}
                      onClick={() => setSelectedCategoryFilter(isSelected ? null : cat)}
                      className={`p-3.5 border rounded-xl space-y-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 ${
                        isSelected
                          ? "bg-[#adc6ff]/15 border-[#adc6ff] shadow-lg shadow-[#adc6ff]/10 ring-1 ring-[#adc6ff]"
                          : "bg-[#131313] border-[#353534]/40 hover:border-[#adc6ff]/40"
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-white truncate font-bold">{cat}</span>
                        <span className="text-[#adc6ff] font-mono">{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#262525] rounded-full overflow-hidden">
                        <div className="h-full bg-[#adc6ff] rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-[#8b90a0] font-mono">
                        <span>{amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                        <span className="text-[9px] text-[#adc6ff] font-bold underline">
                          {isSelected ? "Selecionado" : "Filtrar"}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Remaining categories tile when collapsed */}
                {!showAllCategories && remainingCategories.length > 0 && (
                  <div
                    onClick={() => setShowAllCategories(true)}
                    className="p-3.5 bg-[#131313] border border-dashed border-[#adc6ff]/40 hover:border-[#adc6ff] rounded-xl space-y-2 cursor-pointer transition-all hover:scale-[1.02]"
                  >
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-[#adc6ff] font-bold truncate">+ {remainingCategories.length} Outras Categorias</span>
                      <span className="text-[#adc6ff] font-mono">
                        {totalExpensesSum > 0 ? Math.round((remainingSum / totalExpensesSum) * 100) : 0}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[#262525] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#adc6ff]/60 rounded-full"
                        style={{
                          width: `${totalExpensesSum > 0 ? Math.round((remainingSum / totalExpensesSum) * 100) : 0}%`,
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-[#adc6ff] font-mono font-bold">
                      <span>{remainingSum.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                      <span className="underline">Ver Todas</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {Object.keys(groupedTransactions).length === 0 ? (
            <div className="text-center py-12 glass-card rounded-2xl p-8 border border-[#353534]/30 space-y-4">
              <ShieldAlert size={44} className="mx-auto text-[#adc6ff]/60" />
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-base font-bold text-white">Nenhuma movimentação para exibir</h4>
                <p className="text-xs text-[#c1c6d7]">
                  {activeFilter === "Rejected"
                    ? "Nenhum lançamento foi rejeitado no momento."
                    : activeFilter === "Unidentified"
                    ? "Excelente! Não há transações com categoria 'Não Identificado'."
                    : "Você não possui lançamentos ativos nesta visualização."}
                </p>
              </div>

              {/* Notice if items exist in rejected tab */}
              {activeFilter !== "Rejected" && rejectedCount > 0 && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                  <span>Você possui <strong>{rejectedCount}</strong> {rejectedCount === 1 ? "item rejeitado" : "itens rejeitados"} no extrato.</span>
                  <button
                    onClick={() => setActiveFilter("Rejected")}
                    className="font-bold underline text-white hover:text-rose-200 cursor-pointer ml-1"
                  >
                    Ver Rejeitadas
                  </button>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {onOpenImportModal && (
                  <button
                    onClick={onOpenImportModal}
                    className="px-5 py-2.5 rounded-xl bg-[#adc6ff] text-[#002e69] font-bold text-xs hover:bg-white transition-all cursor-pointer flex items-center gap-2 shadow-lg"
                  >
                    <UploadCloud size={16} />
                    <span>Importar Extrato Bancário</span>
                  </button>
                )}

                {onResetDemoData && (
                  <button
                    onClick={onResetDemoData}
                    className="px-4 py-2.5 rounded-xl bg-[#252524] text-[#c1c6d7] hover:text-white font-medium text-xs border border-[#353534] hover:bg-[#353534] transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw size={14} />
                    <span>Carregar Dados de Exemplo</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            Object.keys(groupedTransactions).map((dateKey) => (
              <div key={dateKey} className="space-y-3">
                <h3 className="text-xs font-bold text-[#8b90a0] uppercase tracking-wider pl-2">{dateKey}</h3>
                <div className="space-y-[1px] rounded-2xl overflow-hidden border border-[#353534]/15 shadow-xl">
                  {groupedTransactions[dateKey].map((tx) => {
                    const isNegative = tx.amount < 0;
                    return (
                      <div
                        key={tx.id}
                        className="glass-card flex items-center justify-between p-4 group cursor-pointer hover:bg-white/[0.02] transition-colors border-0"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${tx.colorClass}`}>
                            {getIcon(tx.icon)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-white tracking-tight group-hover:text-[#adc6ff] transition-colors">
                              {tx.title}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="relative">
                                {editingTxCategory === tx.id ? (
                                  <select
                                    value={tx.category}
                                    onChange={(e) => {
                                      if (onUpdateTransactionCategory) {
                                        onUpdateTransactionCategory(tx.id, e.target.value);
                                      }
                                      setEditingTxCategory(null);
                                    }}
                                    onBlur={() => setEditingTxCategory(null)}
                                    autoFocus
                                    className="text-[10px] bg-[#1a1919] text-white border border-[#adc6ff] rounded px-2 py-0.5 outline-none font-medium cursor-pointer"
                                  >
                                    {[
                                      "Cartão de Crédito",
                                      "Alimentação",
                                      "Moradia",
                                      "Dízimo & Doações",
                                      "Transporte",
                                      "Shopping",
                                      "Serviços",
                                      "Veículo",
                                      "Educação",
                                      "Tributos",
                                      "Seguros",
                                      "Beleza",
                                      "Saúde",
                                      "Entretenimento",
                                      "Utilidades",
                                      "Serviços Domésticos",
                                      "Receita / Salário",
                                      "Não Identificado",
                                      "Outros",
                                    ].map((opt) => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingTxCategory(tx.id);
                                    }}
                                    className="text-[10px] px-2 py-0.5 rounded-md bg-[#1c1b1b] text-[#c1c6d7] font-medium hover:bg-[#adc6ff]/20 hover:text-[#adc6ff] border border-transparent hover:border-[#adc6ff]/30 transition-all cursor-pointer flex items-center gap-1"
                                    title="Clique para alterar a categoria deste lançamento"
                                  >
                                    <span>{tx.category}</span>
                                    <Edit3 size={10} className="text-[#8b90a0]" />
                                  </button>
                                )}
                              </div>
                              {(tx.isRecurring || tx.date === "Recorrente Mensal") && (
                                <span className="text-[9px] font-bold text-[#4edea3] bg-[#4edea3]/10 border border-[#4edea3]/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                                  🔄 Fixo Mensal
                                </span>
                              )}
                              {tx.installment && (
                                <span className="text-[9px] uppercase font-bold text-[#ffb95f] px-1.5 border border-[#ffb95f]/30 rounded">
                                  {tx.installment}
                                </span>
                              )}
                              <div className="flex gap-1">
                                {tx.hasAttachment && (
                                  <Paperclip size={12} className="text-[#8b90a0]" title="Anexo" />
                                )}
                                {tx.hasNote && (
                                  <FileText size={12} className="text-[#8b90a0]" title="Nota" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className={`font-mono text-sm font-bold ${isNegative ? "text-rose-400" : "text-[#4edea3]"}`}>
                              {isNegative ? "- " : "+ "}{Math.abs(tx.amount).toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </p>
                            <span className="text-[11px] text-[#8b90a0] block">{tx.time}</span>
                          </div>

                          {/* Quick Actions: Restore if rejected, or Toggle sign / Delete if active */}
                          <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                            {tx.isRejected ? (
                              <>
                                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded">
                                  🚫 Rejeitada
                                </span>
                                {onRestoreTransaction && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onRestoreTransaction(tx.id);
                                    }}
                                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/40 hover:bg-[#4edea3]/30 transition-colors cursor-pointer flex items-center gap-1"
                                    title="Aprovar e mover para o fluxo de caixa ativo"
                                  >
                                    <Check size={12} />
                                    <span>Aprovar</span>
                                  </button>
                                )}
                              </>
                            ) : (
                              onToggleTransactionType && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleTransactionType(tx.id);
                                  }}
                                  className={`text-[10px] font-bold px-2 py-1 rounded border transition-colors cursor-pointer ${
                                    isNegative
                                      ? "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
                                      : "bg-[#4edea3]/10 text-[#4edea3] border-[#4edea3]/30 hover:bg-[#4edea3]/20"
                                  }`}
                                  title={isNegative ? "Alternar para Entrada (+)" : "Alternar para Saída (-)"}
                                >
                                  {isNegative ? "Saída (-)" : "Entrada (+)"}
                                </button>
                              )
                            )}

                            {onDeleteTransaction && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteTransaction(tx.id);
                                }}
                                className="p-1.5 text-[#8b90a0] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Excluir lançamento definitivamente"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {/* Fixed/Recurring Expenses View Mode Content */}
      {viewMode === "fixed" && (
        <div className="space-y-6 animate-fade-in pb-12">
          {/* WhatsApp Notification Alert Banner */}
          <div className="glass-card p-4.5 rounded-2xl border border-[#25D366]/30 bg-[#25D366]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#25D366]/20 border border-[#25D366]/40 flex items-center justify-center text-[#25D366] shrink-0">
                <MessageSquare size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-white">Lembretes WhatsApp (1 Dia Antes)</h4>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#25D366]/20 text-[#25D366] uppercase tracking-wider font-mono">
                    {(!whatsappConfig.provider || whatsappConfig.provider === "manual") ? "Modo 1-Clique" : "100% Automático"}
                  </span>
                  {whatsappConfig.provider && whatsappConfig.provider !== "manual" && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/10 text-white/80 uppercase tracking-wider font-mono">
                      Via {whatsappConfig.provider.toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#c1c6d7] mt-0.5">
                  Número: <strong className="text-white font-mono">{whatsappConfig.phoneNumber || "Não informado"}</strong>
                  {billsDueTomorrow.length > 0 ? (
                    <span className="text-[#25D366] font-bold ml-2 animate-pulse">
                      • ⚠️ {billsDueTomorrow.length} conta(s) vence(m) amanhã!
                    </span>
                  ) : (
                    <span className="text-[#8b90a0] ml-2">
                      • Nenhuma conta vencendo amanhã.
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
              {billsDueTomorrow.length > 0 && (
                <button
                  type="button"
                  onClick={handleAutoDispatchDueTomorrow}
                  disabled={isAutoDispatching}
                  className="px-3.5 py-2 bg-[#4edea3]/20 hover:bg-[#4edea3]/30 border border-[#4edea3]/40 text-[#4edea3] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  title="Disparar aviso das contas de amanhã para o seu WhatsApp agora"
                >
                  <Send size={13} className={isAutoDispatching ? "animate-spin" : ""} />
                  <span>{isAutoDispatching ? "Enviando..." : `Disparar Alerta (${billsDueTomorrow.length})`}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsWhatsappModalOpen(true)}
                className="px-4 py-2 bg-[#25D366] text-black font-bold text-xs rounded-xl flex items-center gap-2 hover:bg-[#25D366]/90 transition-all cursor-pointer shadow-lg shadow-[#25D366]/20"
              >
                <Bell size={14} />
                Configurar WhatsApp
              </button>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-5 border border-[#353534]/15 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-[#8b90a0] tracking-wider">Compromisso Mensal</span>
              <p className="text-2xl font-bold text-white mt-1 font-mono">
                {totalFixedAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
              <span className="text-[10px] text-[#8b90a0] mt-1">{totalCount} despesas cadastradas</span>
            </div>

            <div className="glass-card p-5 border border-[#353534]/15 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-[#4edea3] tracking-wider">Total Pago</span>
              <p className="text-2xl font-bold text-[#4edea3] mt-1 font-mono">
                {paidFixedAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
              <span className="text-[10px] text-[#8b90a0] mt-1">{paidCount} de {totalCount} liquidadas</span>
            </div>

            <div className="glass-card p-5 border border-[#353534]/15 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">A Pagar / Pendente</span>
              <p className="text-2xl font-bold text-amber-400 mt-1 font-mono">
                {pendingFixedAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                <span className="text-[10px] text-[#8b90a0]">Próximos vencimentos</span>
              </div>
            </div>
          </div>

          {/* Progress Bar of Settlements */}
          <div className="glass-card p-4 border border-[#353534]/15 rounded-2xl space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#8b90a0] font-medium">Progresso de Quitação Mensal</span>
              <span className="text-white font-bold">{paidPercentage}% concluído</span>
            </div>
            <div className="w-full bg-[#1c1b1b] h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#adc6ff] to-[#4edea3] h-full transition-all duration-500 ease-out"
                style={{ width: `${paidPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* List Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-bold text-[#8b90a0] uppercase tracking-wider">Listagem de Compromissos</h3>
              <p className="text-[10px] text-[#8b90a0] italic">Dia de vencimento estimado</p>
            </div>

            {recurringExpenses.length === 0 ? (
              <div className="text-center py-12 glass-card rounded-2xl p-6 border border-[#353534]/15">
                <Calendar size={40} className="mx-auto text-[#8b90a0]/30 mb-3" />
                <p className="text-[#8b90a0] text-sm">Nenhuma despesa fixa cadastrada.</p>
                <button
                  type="button"
                  onClick={() => setIsAddRecOpen(true)}
                  className="mt-3 text-xs font-bold text-[#adc6ff] hover:underline cursor-pointer"
                >
                  Adicionar primeira despesa
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {recurringExpenses.map((expense) => {
                  const isDueTomorrow = !isPaidInPeriod(expense, reminderDate().tomorrowPeriod) && expense.dueDate === tomorrowDayOfMonth;

                  return (
                    <div
                      key={expense.id}
                      className={`glass-card flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all gap-4 ${
                        isDueTomorrow
                          ? "border-[#25D366]/60 bg-[#25D366]/5 shadow-lg shadow-[#25D366]/10"
                          : "border-[#353534]/15 hover:border-[#adc6ff]/20"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${
                          isDueTomorrow
                            ? "bg-[#25D366]/20 text-[#25D366] border-[#25D366]/40"
                            : "bg-[#1c1b1b]/80 text-[#adc6ff] border-[#353534]/30"
                        }`}>
                          {isDueTomorrow ? <Bell size={18} className="animate-bounce" /> : <Calendar size={18} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-white tracking-tight">{expense.title}</p>
                            {isDueTomorrow && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#25D366] text-black font-bold tracking-wider uppercase flex items-center gap-1">
                                ⚠️ Vence Amanhã!
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#1c1b1b] text-[#c1c6d7]/70 font-medium">
                              {expense.category}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#2d2112]/40 border border-[#ffb95f]/15 text-[#ffb95f] font-mono flex items-center gap-1">
                              <Clock size={10} />
                              Vence dia {expense.dueDate}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#353534]/15">
                        <div className="text-left sm:text-right">
                          <p className="font-mono text-sm font-bold text-white">
                            {expense.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </p>
                          <span className={`text-[10px] font-semibold ${isPaidInPeriod(expense) ? "text-[#4edea3]" : "text-amber-400"}`}>
                            {isPaidInPeriod(expense) ? "Pago este mês" : expense.paidThisMonth && !expense.paidPeriods ? "Pagamento antigo sem mês — conferir" : "Pendente"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {!isPaidInPeriod(expense) && (
                            <button
                              type="button"
                              onClick={() => handleSendWhatsappReminder(expense)}
                              className="p-2 rounded-xl border border-[#25D366]/40 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                              title="Enviar Lembrete WhatsApp"
                            >
                              <MessageSquare size={16} />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onTogglePaidRecurringExpense(expense.id)}
                            className={`p-2 rounded-xl border transition-all cursor-pointer ${
                              isPaidInPeriod(expense)
                                ? "bg-[#4edea3]/10 border-[#4edea3]/20 text-[#4edea3] hover:bg-[#4edea3]/20"
                                : "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
                            }`}
                            title={expense.paidThisMonth && !expense.paidPeriods ? "Identificar mês do pagamento antigo (sem alterar saldo)" : isPaidInPeriod(expense) ? "Marcar como pendente" : "Marcar como pago (grava extrato)"}
                          >
                            {isPaidInPeriod(expense) ? <Check size={16} /> : <Clock size={16} />}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => onDeleteRecurringExpense(expense.id)}
                            className="p-2 rounded-xl border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/40 transition-all cursor-pointer"
                            title="Excluir despesa recorrente"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}


      {/* Floating Action Button (Adapts to Active Tab Mode) */}
      <button
        type="button"
        onClick={() => {
          if (viewMode === "history") {
            setIsAddOpen(true);
          } else {
            setIsAddRecOpen(true);
          }
        }}
        className="fixed bottom-28 right-6 w-14 h-14 rounded-full bg-[#adc6ff] text-[#002e69] flex items-center justify-center shadow-xl shadow-[#adc6ff]/20 hover:scale-105 active:scale-95 transition-all z-40 cursor-pointer"
        aria-label={viewMode === "history" ? "Nova Transação" : "Nova Despesa Fixa"}
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      {/* MODAL 1: Add Transaction (History Mode) */}
      {isAddOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-lg bg-[#131313] border border-[#353534]/70 rounded-3xl shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar animate-slide-up my-auto">
            <div className="flex justify-between items-center pb-2 border-b border-[#353534]/30">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Landmark size={20} className="text-[#4edea3]" />
                Adicionar Transação
              </h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-[#8b90a0] hover:text-white p-1 rounded-full hover:bg-white/5 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs text-[#8b90a0] font-semibold uppercase tracking-wider">Descrição</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Salário, Ajuda de Custo, Supermercado"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-[#1c1b1b] border border-[#353534]/50 rounded-xl px-4 py-3 text-sm text-white focus:border-[#adc6ff] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-[#8b90a0] font-semibold uppercase tracking-wider">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="3150.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full bg-[#1c1b1b] border border-[#353534]/50 rounded-xl px-4 py-3 text-sm text-white focus:border-[#adc6ff] outline-none font-mono"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs text-[#8b90a0] font-semibold uppercase tracking-wider">Tipo de Lançamento</label>
                  <div className="grid grid-cols-2 bg-[#1c1b1b] p-1 rounded-xl border border-[#353534]/50">
                    <button
                      type="button"
                      onClick={() => setFormType("outflow")}
                      className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        formType === "outflow" ? "bg-rose-500/20 text-rose-400 font-extrabold shadow-sm" : "text-[#8b90a0] hover:text-white"
                      }`}
                    >
                      Despesa (-)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormType("inflow")}
                      className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        formType === "inflow" ? "bg-[#00a572]/30 text-[#4edea3] font-extrabold shadow-sm" : "text-[#8b90a0] hover:text-white"
                      }`}
                    >
                      Receita (+)
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#8b90a0] font-semibold uppercase tracking-wider">Frequência da Movimentação</label>
                <div className="grid grid-cols-2 bg-[#1c1b1b] p-1 rounded-xl border border-[#353534]/50">
                  <button
                    type="button"
                    onClick={() => setFormIsRecurring(false)}
                    className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      !formIsRecurring ? "bg-[#adc6ff]/20 text-[#adc6ff] font-extrabold shadow-sm" : "text-[#8b90a0] hover:text-white"
                    }`}
                  >
                    <span>📌 Único / Pontual</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormIsRecurring(true)}
                    className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      formIsRecurring ? "bg-[#4edea3]/20 text-[#4edea3] font-extrabold shadow-sm" : "text-[#8b90a0] hover:text-white"
                    }`}
                  >
                    <span>🔄 Fixo (Recorrente Mensal)</span>
                  </button>
                </div>
                <p className="text-[11px] text-[#8b90a0] pt-0.5">
                  {formIsRecurring
                    ? "✨ Marque como Fixo para entradas/saídas que acontecem todos os meses (ex: Salário, Mentoria, Aluguel)."
                    : "📌 Marque como Pontual para compras ou recebimentos únicos referentes apenas a este mês."}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#8b90a0] font-semibold uppercase tracking-wider">Categoria</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-[#1c1b1b] border border-[#353534]/50 rounded-xl px-4 py-3 text-sm text-white focus:border-[#adc6ff] outline-none cursor-pointer"
                >
                  <option value="Receita / Salário">Receita / Salário / Ajuda de Custo</option>
                  <option value="Dízimo & Doações">Dízimo & Doações (10%)</option>
                  <option value="Cartão de Crédito">Cartão de Crédito / Fatura</option>
                  <option value="Beleza">Beleza (Salão, Unha, Barbearia, Estética)</option>
                  <option value="Eletrônicos">Eletrônicos</option>
                  <option value="Restaurante">Restaurante / Alimentação</option>
                  <option value="Investimento">Aportes / Investimento</option>
                  <option value="Viagem">Viagem / Lazer</option>
                  <option value="Saúde">Saúde</option>
                  <option value="Dividendos">Proventos / Dividendos</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div className="flex gap-6 py-2 border-y border-[#353534]/30">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#c1c6d7]">
                  <input
                    type="checkbox"
                    checked={formNote}
                    onChange={(e) => setFormNote(e.target.checked)}
                    className="rounded border-[#353534] bg-[#1c1b1b] text-[#adc6ff] focus:ring-0 cursor-pointer"
                  />
                  <span>Adicionar Nota Fiscal</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#c1c6d7]">
                  <input
                    type="checkbox"
                    checked={formAttachment}
                    onChange={(e) => setFormAttachment(e.target.checked)}
                    className="rounded border-[#353534] bg-[#1c1b1b] text-[#adc6ff] focus:ring-0 cursor-pointer"
                  />
                  <span>Anexar Comprovante</span>
                </label>
              </div>

              <button
                type="submit"
                className={`w-full py-3.5 rounded-xl font-bold active:scale-[0.98] transition-all cursor-pointer text-sm shadow-lg ${
                  formType === "inflow"
                    ? "bg-[#4edea3] text-[#003822] hover:bg-[#4edea3]/90 shadow-[#4edea3]/20"
                    : "bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/20"
                }`}
              >
                Confirmar e Gravar {formType === "inflow" ? "Receita (+)" : "Despesa (-)"} {formIsRecurring ? "(Fixa Mensal)" : "(Pontual)"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Recurring Expense (Fixed Mode) */}
      {isAddRecOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-lg bg-[#131313] border border-[#353534]/70 rounded-3xl shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar animate-slide-up my-auto">
            <div className="flex justify-between items-center pb-2">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar size={20} className="text-[#adc6ff]" />
                Nova Despesa Fixa Recorrente
              </h3>
              <button
                type="button"
                onClick={() => setIsAddRecOpen(false)}
                className="text-[#8b90a0] hover:text-white p-1 rounded-full hover:bg-white/5 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecSubmit} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs text-[#8b90a0] font-semibold uppercase tracking-wider">Descrição / Nome do Compromisso</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Aluguel do Escritório, Seguro Saúde, Internet"
                  value={recTitle}
                  onChange={(e) => setRecTitle(e.target.value)}
                  className="w-full bg-[#1c1b1b] border border-[#353534]/50 rounded-xl px-4 py-3 text-sm text-white focus:border-[#adc6ff] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-[#8b90a0] font-semibold uppercase tracking-wider">Valor Mensal (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="1500.00"
                    value={recAmount}
                    onChange={(e) => setRecAmount(e.target.value)}
                    className="w-full bg-[#1c1b1b] border border-[#353534]/50 rounded-xl px-4 py-3 text-sm text-white focus:border-[#adc6ff] outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#8b90a0] font-semibold uppercase tracking-wider">Dia de Vencimento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    placeholder="10"
                    value={recDueDate}
                    onChange={(e) => setRecDueDate(e.target.value)}
                    className="w-full bg-[#1c1b1b] border border-[#353534]/50 rounded-xl px-4 py-3 text-sm text-white focus:border-[#adc6ff] outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#8b90a0] font-semibold uppercase tracking-wider">Categoria da Despesa</label>
                <select
                  value={recCategory}
                  onChange={(e) => setRecCategory(e.target.value)}
                  className="w-full bg-[#1c1b1b] border border-[#353534]/50 rounded-xl px-4 py-3 text-sm text-white focus:border-[#adc6ff] outline-none cursor-pointer"
                >
                  <option value="Cartão de Crédito">Cartão de Crédito / Fatura</option>
                  <option value="Beleza & Estética">Beleza & Estética (Salão, Unha, Barbearia)</option>
                  <option value="Moradia / Escolar">Moradia / Escolar</option>
                  <option value="Serviços & Softwares">Serviços & Softwares</option>
                  <option value="Saúde & Seguro">Saúde & Seguro</option>
                  <option value="Utilidades">Utilidades (Internet, Luz, Água)</option>
                  <option value="Investimentos & Consultoria">Investimentos & Consultoria</option>
                  <option value="Outros">Outros compromissos</option>
                </select>
              </div>

              <div className="p-3 bg-[#adc6ff]/5 border border-[#adc6ff]/10 rounded-xl">
                <p className="text-[11px] text-[#adc6ff]/80 leading-normal">
                  💡 <strong>Dica de Gestão:</strong> Ao final do ciclo mensal, despesas recorrentes ajudam o Wealth AI a estimar sua taxa de poupança (Saving Rate) e projetar seus objetivos financeiros futuros de forma automatizada.
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-[#adc6ff] text-[#002e69] py-3.5 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer text-sm shadow-lg shadow-[#adc6ff]/10"
              >
                Cadastrar Despesa Fixa
              </button>
            </form>
          </div>
        </div>
      )}

      <AlertsSettingsModal
        isOpen={isWhatsappModalOpen}
        onClose={() => setIsWhatsappModalOpen(false)}
        whatsappConfig={whatsappConfig}
        onSave={(newConfig) => onUpdateWhatsappConfig?.(newConfig)}
      />
    </div>
  );
}

