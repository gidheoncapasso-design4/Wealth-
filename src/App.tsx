import { authFetch } from "./lib/authFetch";
import { currentPeriod, isPaidInPeriod, setPaidInPeriod, transactionPeriod } from "./lib/accountingPeriod";
import React, { lazy, Suspense, useState, useEffect, useRef } from "react";
import { LayoutGrid, CreditCard, Bot, TrendingUp, Landmark, X, Plus, AlertCircle, Sparkles } from "lucide-react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { USER_PROFILE, INITIAL_TRANSACTIONS, CONNECTED_BANKS, INITIAL_RECURRING_EXPENSES } from "./data";
import { Transaction, ChatMessage, BankConnection, RecurringExpense, WhatsAppConfig } from "./types";
import Header from "./components/Header";
import DashboardView from "./components/DashboardView";
import LoginView from "./components/LoginView";
import { subscribeCloudAppData, saveCloudAppData, auth } from "./lib/firebase";
import { autoSanitizeTransactions, calculateDizimo } from "./lib/financeUtils";

const TransactionsView = lazy(() => import("./components/TransactionsView"));
const WealthAIView = lazy(() => import("./components/WealthAIView"));
const InvestmentsView = lazy(() => import("./components/InvestmentsView"));
const ConnectionsView = lazy(() => import("./components/ConnectionsView"));
const StatementImportModal = lazy(() => import("./components/StatementImportModal"));

const LOCAL_STORAGE_KEY = "wealth_app_data_v2";

// Helper to load cached state from local storage immediately on startup
const getInitialLocalData = () => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      let localLiquid = typeof parsed.liquidBalance === "number" ? parsed.liquidBalance : 0;
      let localInvested = typeof parsed.investedAmount === "number" ? parsed.investedAmount : 0;

      return {
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions : INITIAL_TRANSACTIONS,
        connections: Array.isArray(parsed.connections) ? parsed.connections : CONNECTED_BANKS,
        recurringExpenses: Array.isArray(parsed.recurringExpenses) ? parsed.recurringExpenses : INITIAL_RECURRING_EXPENSES,
        whatsappConfig: parsed.whatsappConfig || { phoneNumber: "", enabled: false, daysAhead: 1 },
        liquidBalance: localLiquid,
        investedAmount: localInvested,
      };
    }
  } catch (e) {
    console.warn("Error reading local storage:", e);
  }
  return {
    transactions: INITIAL_TRANSACTIONS,
    connections: CONNECTED_BANKS,
    recurringExpenses: INITIAL_RECURRING_EXPENSES,
    whatsappConfig: { phoneNumber: "", enabled: false, daysAhead: 1 },
    liquidBalance: 0,
    investedAmount: 0,
  };
};

export default function App() {
  // Authentication State (real Firebase Auth session, not a local boolean)
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  // Screen Tabs
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "payments" | "smart_toy" | "monitoring" | "account_balance"
  >("dashboard");

  // Load cached initial states
  const initialLocal = getInitialLocalData();

  // App States
  const [transactions, setTransactions] = useState<Transaction[]>(initialLocal.transactions);
  const [connections, setConnections] = useState<BankConnection[]>(initialLocal.connections);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>(initialLocal.recurringExpenses);
  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppConfig>(initialLocal.whatsappConfig);
  
  // Balance calculations (reactive)
  const [liquidBalance, setLiquidBalance] = useState(initialLocal.liquidBalance);
  const [investedAmount, setInvestedAmount] = useState(initialLocal.investedAmount);
  const netWorth = liquidBalance + investedAmount;

  // Track if cloud data has been loaded or initialized
  const isCloudLoaded = useRef(false);
  const [maintenanceBusy, setMaintenanceBusy] = useState(false);
  const [resetBackupId, setResetBackupId] = useState<string | null>(null);

  // Subscribe to real-time Firestore database updates once the user is authenticated
  // (Firestore rules require an authenticated session, so subscribing earlier would
  // just fail with permission-denied).
  useEffect(() => {
    if (!authUser) return;

    const unsubscribe = subscribeCloudAppData((data) => {
      if (data) {
        if (Array.isArray(data.transactions)) setTransactions(data.transactions);
        setResetBackupId(data.resetBackupId || null);
        if (data.recurringExpenses && Array.isArray(data.recurringExpenses)) {
          setRecurringExpenses(data.recurringExpenses);
        }
        if (data.connections && Array.isArray(data.connections)) {
          setConnections(data.connections);
        }
        if (data.whatsappConfig && typeof data.whatsappConfig === "object") {
          setWhatsappConfig(data.whatsappConfig);
        }
        if (typeof data.liquidBalance === "number") {
          setLiquidBalance(data.liquidBalance);
        }

        if (typeof data.investedAmount === "number") {
          setInvestedAmount(data.investedAmount);
        }
      }
      isCloudLoaded.current = true;
    });

    return () => unsubscribe();
  }, [authUser]);

  // Save changes to both LocalStorage and Firestore cloud immediately
  useEffect(() => {
    if (!authUser || !isCloudLoaded.current || maintenanceBusy) return;

    const payload = {
      liquidBalance,
      investedAmount,
      transactions,
      recurringExpenses,
      connections,
      whatsappConfig,
      lastUpdated: new Date().toISOString(),
    };

    // Save synchronously to local storage
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn("Error saving local storage:", e);
    }

    // Debounce save to cloud Firestore
    const timer = setTimeout(() => {
      saveCloudAppData(payload);
    }, 400);

    return () => clearTimeout(timer);
  }, [maintenanceBusy, authUser, liquidBalance, investedAmount, transactions, recurringExpenses, connections, whatsappConfig]);


  // Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "model",
      text: "Olá, Gidheon! Sou o Gemini integrado diretamente ao seu sistema de gestão financeira. Tenho acesso completo às suas contas fixas, receitas e patrimônio. Pode conversar comigo livre e naturalmente sobre qualquer assunto — tirar dúvidas, planejar investimentos, simular gastos ou apenas trocar ideias sobre o orçamento da família!",
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiWarning, setApiWarning] = useState<string | null>(null);

  // Investment Dialog State
  const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);
  const [investAmountInput, setInvestAmountInput] = useState("");
  const [investError, setInvestError] = useState("");

  // Bank Statement Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Goal notification state
  const [goalAlert, setGoalAlert] = useState<string | null>(null);

  // Last statement import batch (enables "undo" instead of deleting one by one)
  const [lastImportBatch, setLastImportBatch] = useState<{ batchId: string; count: number } | null>(null);

  // Bottom Nav items helper
  const navItems = [
    { id: "dashboard", icon: <LayoutGrid size={24} />, label: "Início" },
    { id: "payments", icon: <CreditCard size={24} />, label: "Extrato" },
    { id: "smart_toy", icon: <Bot size={24} />, label: "Wealth AI" },
    { id: "monitoring", icon: <TrendingUp size={24} />, label: "Portfólio" },
    { id: "account_balance", icon: <Landmark size={24} />, label: "Contas" },
  ] as const;

  // Navigation handlers
  const handleTabChange = (tabId: typeof activeTab) => {
    setActiveTab(tabId);
  };

  // Add a new transaction (updates balance + net worth)
  const handleAddTransaction = (newTx: Omit<Transaction, "id" | "time" | "date" | "colorClass">) => {
    const timeNow = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const dayNow = newTx.isRecurring
      ? "Recorrente Mensal"
      : ("Hoje, " + new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "short" }));

    const tx: Transaction = {
      ...newTx,
      id: "tx-" + Date.now(),
      time: timeNow,
      date: dayNow,
      period: currentPeriod(),
      colorClass: newTx.amount < 0
        ? "text-rose-700 bg-rose-500/10 border-rose-500/20"
        : "text-[#15803d] bg-[#15803d]/10 border-[#15803d]/20",
    };

    setTransactions((prev) => [tx, ...prev]);

    // Apply financial adjustment
    if (newTx.category === "Investimento") {
      if (newTx.amount < 0) {
        setInvestedAmount((prev) => Math.max(0, prev - Math.abs(newTx.amount)));
      } else {
        setInvestedAmount((prev) => prev + newTx.amount);
      }
    } else {
      setLiquidBalance((prev) => prev + newTx.amount);
    }

    const formattedVal = Math.abs(newTx.amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    if (newTx.amount > 0) {
      setGoalAlert(`✅ Receita de ${formattedVal} (${newTx.title}) lançada com sucesso e salva na nuvem!`);
    } else {
      setGoalAlert(`✅ Despesa de ${formattedVal} (${newTx.title}) lançada com sucesso!`);
    }
  };

  const handleMaintenance = async (action: 'reset' | 'restore') => {
    if (maintenanceBusy) return;
    const message = action === 'reset'
      ? 'Criar backup e zerar lançamentos, saldos e pagamentos? Contas fixas, valores, vencimentos e WhatsApp serão preservados.'
      : 'Restaurar lançamentos, saldos e pagamentos do backup? Isso substituirá os registros atuais.';
    if (!window.confirm(message)) return;
    setMaintenanceBusy(true);
    try {
      const response = await authFetch('/api/data/' + action, { method: 'POST' });
      const result = await response.json();
      const data = result.profile;
      setTransactions(data.transactions || []);
      setRecurringExpenses(data.recurringExpenses || []);
      setLiquidBalance(data.liquidBalance || 0);
      setInvestedAmount(data.investedAmount || 0);
      setResetBackupId(data.resetBackupId || null);
      setLastImportBatch(null);
      setGoalAlert(action === 'reset' ? 'Limpeza concluída. Backup salvo; contas fixas e WhatsApp preservados.' : 'Backup restaurado.');
    } catch (error) {
      setGoalAlert(error instanceof Error ? error.message : 'Não foi possível concluir.');
    } finally { setMaintenanceBusy(false); }
  };

  // Restore initial demo data
  const handleResetDemoData = () => {
    setTransactions(INITIAL_TRANSACTIONS);
    setLiquidBalance(USER_PROFILE.liquidBalanceRaw);
  };

  // Batch import transactions from statement parser
  const handleBatchImportTransactions = async (
    imported: Array<{ title: string; category: string; amount: number; icon?: string; isRejected?: boolean; date?: string }>
  ) => {
    let balanceDelta = 0;
    const timeNow = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const dayNow = "Hoje, " + new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
    const batchId = `batch-${Date.now()}`;

    const newTxs: Transaction[] = imported.map((item, idx) => {
      if (!item.isRejected) {
        balanceDelta += item.amount;
      }
      return {
        id: `imp-${Date.now()}-${idx}`,
        title: item.title,
        category: item.category,
        amount: item.amount,
        time: timeNow,
        date: item.date || "Data não informada",
        ...(transactionPeriod({ date: item.date || "" }) ? { period: transactionPeriod({ date: item.date || "" })! } : {}),
        colorClass: item.isRejected
          ? "text-amber-700 bg-amber-500/10 border-amber-500/20"
          : item.amount < 0
          ? "text-rose-700 bg-rose-500/10 border-rose-500/20"
          : "text-[#15803d] bg-[#15803d]/10 border-[#15803d]/20",
        icon: item.icon || (item.amount > 0 ? "payments" : "shopping"),
        isRejected: !!item.isRejected,
        importBatchId: batchId,
      };
    });

    const updatedTxs = [...newTxs, ...transactions];
    const newLiquidBalance = liquidBalance + balanceDelta;

    setTransactions(updatedTxs);
    setLiquidBalance(newLiquidBalance);

    // Save directly and synchronously to local storage and Cloud Firestore
    const payload = {
      liquidBalance: newLiquidBalance,
      investedAmount,
      transactions: updatedTxs,
      recurringExpenses,
      connections,
      whatsappConfig,
      lastUpdated: new Date().toISOString(),
    };

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn("Error saving to local storage:", e);
    }

    const savedInCloud = await saveCloudAppData(payload);

    setLastImportBatch({ batchId, count: imported.length });

    if (savedInCloud) {
      setGoalAlert(`✅ ${imported.length} lançamentos gravados e confirmados no banco de dados na nuvem (Firestore)!`);
    } else {
      setGoalAlert(`💾 ${imported.length} lançamentos salvos localmente no dispositivo.`);
    }
  };

  // Undo an entire import batch at once (instead of deleting transactions one by one
  // if the AI categorization came out wrong). Recomputes the balance delta from the
  // transactions still present (rather than the value captured at import time), so
  // it stays correct even if some items from the batch were already deleted/restored
  // individually before the user clicks "Desfazer".
  const handleUndoImportBatch = () => {
    if (!lastImportBatch) return;
    const batchTxs = transactions.filter((t) => t.importBatchId === lastImportBatch.batchId);
    const remainingDelta = batchTxs.reduce((sum, t) => sum + (t.isRejected ? 0 : t.amount), 0);

    setTransactions((prev) => prev.filter((t) => t.importBatchId !== lastImportBatch.batchId));
    setLiquidBalance((prev) => prev - remainingDelta);
    setGoalAlert(`↩️ Importação de ${batchTxs.length} lançamentos desfeita.`);
    setLastImportBatch(null);
  };

  // Delete a transaction from flow
  const handleDeleteTransaction = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (tx) {
      if (!tx.isRejected) {
        setLiquidBalance((prev) => prev - tx.amount);
      }
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    }
  };

  // Restore a rejected transaction to active flow
  const handleRestoreTransaction = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (tx && tx.isRejected) {
      setLiquidBalance((prev) => prev + tx.amount);
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isRejected: false } : t))
      );
    }
  };

  // Toggle transaction sign (+ Entrada vs - Saída)
  const handleToggleTransactionType = (id: string) => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id === id) {
          const newAmount = -tx.amount;
          setLiquidBalance((cur) => cur + (newAmount - tx.amount));
          return {
            ...tx,
            amount: newAmount,
            colorClass: newAmount < 0
              ? "text-rose-700 bg-rose-500/10 border-rose-500/20"
              : "text-[#15803d] bg-[#15803d]/10 border-[#15803d]/20",
          };
        }
        return tx;
      })
    );
  };

  // Update transaction category
  const handleUpdateTransactionCategory = (id: string, newCategory: string) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, category: newCategory } : tx))
    );
  };

  // Add a new recurring expense
  const handleAddRecurringExpense = (newExpense: Omit<RecurringExpense, "id" | "paidThisMonth">) => {
    const expense: RecurringExpense = {
      ...newExpense,
      id: "rec-" + (recurringExpenses.length + 1),
      paidThisMonth: false,
    };
    setRecurringExpenses([...recurringExpenses, expense]);
  };

  // Delete an existing recurring expense
  const handleDeleteRecurringExpense = (id: string) => {
    setRecurringExpenses(recurringExpenses.filter((item) => item.id !== id));
  };

  // Toggle paid state of a recurring expense (integrates with Transactions flow)
  const handleTogglePaidRecurringExpense = (id: string) => {
    const legacy = recurringExpenses.find((item) => item.id === id && item.paidThisMonth && !item.paidPeriods);
    if (legacy) {
      const period = window.prompt("Em qual mês esse pagamento antigo foi feito? Use AAAA-MM. Isso apenas identifica o mês, sem alterar saldo ou extrato.");
      if (period === null) return;
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
        setGoalAlert("Informe o mês no formato AAAA-MM, por exemplo 2026-09.");
        return;
      }
      setRecurringExpenses((prev) => prev.map((item) => item.id === id ? setPaidInPeriod(item, period, true) : item));
      return;
    }
    setRecurringExpenses(
      recurringExpenses.map((item) => {
        if (item.id === id) {
          const updatedPaid = !isPaidInPeriod(item);
          
          // Auto-record transaction in cash flow when marked as paid
          if (updatedPaid) {
            handleAddTransaction({
              title: `Quitac. ${item.title}`,
              category: item.category,
              amount: -item.amount,
              icon: "payments",
            });
          } else {
            // Reverse transaction if unchecked
            handleAddTransaction({
              title: `Estorno ${item.title}`,
              category: item.category,
              amount: item.amount,
              icon: "payments",
            });
          }
          return setPaidInPeriod(item, currentPeriod(), updatedPaid);
        }
        return item;
      })
    );
  };

  // Pay only pending expenses without replacing existing history.
  const handleSimulateFullMonth = () => {
    if (recurringExpenses.some((item) => item.paidThisMonth && !item.paidPeriods)) {
      setGoalAlert('Confira o mês dos pagamentos antigos na lista de despesas antes de quitar em lote.');
      return;
    }
    if (!window.confirm("Isso criará no extrato os pagamentos de todas as despesas fixas pendentes e as marcará como pagas. Deseja continuar?")) return;
    const period = currentPeriod();
    const pending = recurringExpenses.filter((item) => !isPaidInPeriod(item, period));
    const paidTransactions: Transaction[] = pending.map((exp) => ({
      id: 'payment-' + exp.id + '-' + Date.now(),
      title: 'Quitac. ' + exp.title,
      category: exp.category,
      amount: -exp.amount,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      period,
      icon: 'payments',
      colorClass: 'text-rose-700 bg-rose-500/10 border-rose-500/20',
    }));
    setRecurringExpenses((prev) => prev.map((item) => setPaidInPeriod(item, period, true)));
    setTransactions((prev) => [...paidTransactions, ...prev]);
    const totalPaid = pending.reduce((total, item) => total + item.amount, 0);
    setLiquidBalance((prev) => prev - totalPaid);
    setGoalAlert(pending.length + ' despesas quitadas em ' + period + '. Total: ' + totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
  };

  // Direct manual update of account balances and investments
  const handleUpdateBalances = (newLiquid: number, newInvested: number) => {
    setLiquidBalance(newLiquid);
    setInvestedAmount(newInvested);
    saveCloudAppData({
      liquidBalance: newLiquid,
      investedAmount: newInvested,
      transactions,
      recurringExpenses,
      connections,
      whatsappConfig,
      lastUpdated: new Date().toISOString(),
    });
    setGoalAlert(`✅ Saldos atualizados com sucesso: Saldo em Conta R$ ${newLiquid.toLocaleString("pt-BR")} | Investido R$ ${newInvested.toLocaleString("pt-BR")}`);
  };

  // Add bank connection
  const handleAddConnection = (bankName: string, logoUrl: string) => {
    const newConn: BankConnection = {
      id: "conn-" + (connections.length + 1),
      name: bankName,
      logo: logoUrl,
      lastSynced: "Sincronizado agora",
      status: "active",
      items: [
        { name: "Extrato", status: "active" },
        { name: "Investimentos", status: "active" },
      ],
    };
    setConnections([...connections, newConn]);
  };

  // Perform Investment Deposit (transfers from liquid to invested)
  const handleInvestDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(investAmountInput);
    if (isNaN(amount) || amount <= 0) {
      setInvestError("Por favor, insira um valor válido.");
      return;
    }
    if (amount > liquidBalance) {
      setInvestError(`Saldo líquido insuficiente para esta operação (Máximo: ${liquidBalance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}).`);
      return;
    }

    // Process Transfer
    setLiquidBalance((prev) => prev - amount);
    setInvestedAmount((prev) => prev + amount);

    // Record internal transfer transaction
    handleAddTransaction({
      title: "Investimento Realizado",
      category: "Investimento",
      amount: amount,
      icon: "payments",
    });

    setInvestAmountInput("");
    setInvestError("");
    setIsInvestModalOpen(false);
  };

  // Click goal callback
  const handleGoalClick = (goalName: string) => {
    setGoalAlert(`Você está no caminho certo para concluir '${goalName}'! Adicione transações ou faça aportes mensais para acelerar.`);
    setTimeout(() => setGoalAlert(null), 5000);
  };

  // Communicate with the Express Gemini AI API
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: "chat-user-" + Date.now(),
      role: "user",
      text: text,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };

    setChatHistory((prev) => [...prev, userMsg]);
    setIsGenerating(true);
    setApiWarning(null);

    try {
      // Build simple history to feed server context
      const formattedHistory = chatHistory.map((h) => ({
        role: h.role,
        text: h.text,
      }));

      // Real user financial context
      const financialContext = {
        userName: USER_PROFILE.name || "Gidheon Capasso",
        liquidBalance,
        investedAmount,
        netWorth,
        transactionsCount: transactions.filter((t) => !t.isRejected).length,
        transactions: transactions
          .filter((t) => !t.isRejected)
          .map((t) => ({
            title: t.title,
            category: t.category,
            amount: t.amount,
            date: t.date,
          })),
        recurringExpenses: recurringExpenses.map((r) => ({
          title: r.title,
          category: r.category,
          amount: r.amount,
          dueDate: r.dueDate,
          paidThisMonth: isPaidInPeriod(r),
        })),
        totalFixedExpenses: recurringExpenses.reduce((acc, curr) => acc + curr.amount, 0),
      };

      const res = await fetch("/api/wealth-ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: formattedHistory,
          context: financialContext,
        }),
      });

      if (!res.ok) {
        throw new Error("Erro de comunicação com o servidor de IA.");
      }

      const data = await res.json();
      
      const botMsg: ChatMessage = {
        id: "chat-bot-" + Date.now(),
        role: "model",
        text: data.text,
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      };

      setChatHistory((prev) => [...prev, botMsg]);
      
      if (data.warning) {
        setApiWarning(data.warning);
      }
    } catch (err: any) {
      console.error(err);
      
      // Gentle offline simulation message with real user name
      const errorMsg: ChatMessage = {
        id: "chat-err-" + Date.now(),
        role: "model",
        text: `Olá ${USER_PROFILE.name.split(" ")[0]}! Tive um problema temporário de conexão com os servidores. Seus dados e contas fixas estão preservados. Tente enviar sua pergunta novamente em instantes.`,
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      };
      setChatHistory((prev) => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Avoid flashing the login screen while Firebase is still resolving the session
  if (!authChecked) {
    return <div className="min-h-screen bg-[#f7f5fb]" />;
  }

  if (!authUser) {
    return <LoginView />;
  }

  return (
    <div className="flex flex-col min-h-screen text-[#271d38] custom-scrollbar pb-32">
      {/* Top Header */}
      <Header
        title={activeTab === "smart_toy" ? "Wealth AI" : "Wealth"}
        onSparklesClick={() => {
          setActiveTab("smart_toy");
          handleSendMessage("Como posso otimizar meus investimentos hoje?");
        }}
        onLogoutClick={() => signOut(auth)}
      />

      {/* Goal alerts banner */}
      {goalAlert && (
        <div className="mx-6 mt-4 p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between text-left animate-fade-in z-40">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
            <Sparkles size={16} className="text-[#7c3aed]" />
            <span>{goalAlert}</span>
          </div>
          <button onClick={() => setGoalAlert(null)} className="text-[#6b617c] hover:text-slate-900 cursor-pointer p-0.5">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Undo last statement import batch */}
      {lastImportBatch && (
        <div className="mx-6 mt-4 p-3.5 bg-[#7c3aed]/10 border border-[#7c3aed]/20 rounded-xl flex items-center justify-between text-left animate-fade-in z-40">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
            <span>{lastImportBatch.count} lançamentos importados. Categorização saiu errada?</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleUndoImportBatch}
              className="text-xs font-bold text-[#7c3aed] hover:underline cursor-pointer"
            >
              Desfazer importação
            </button>
            <button onClick={() => setLastImportBatch(null)} className="text-[#6b617c] hover:text-slate-900 cursor-pointer p-0.5">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {activeTab === 'dashboard' && <div className="mx-6 mt-4 flex gap-4 text-xs">
        <button disabled={maintenanceBusy} onClick={() => handleMaintenance('reset')} className="text-amber-700 disabled:opacity-40">{maintenanceBusy ? 'Processando…' : 'Recomeçar com backup'}</button>
        {resetBackupId && <button disabled={maintenanceBusy} onClick={() => handleMaintenance('restore')} className="text-blue-700">Restaurar último backup</button>}
      </div>}
      {/* Main Content Render */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6 flex-1 w-full">
        {activeTab === "dashboard" && (
          <DashboardView
            onInvestClick={() => setIsInvestModalOpen(true)}
            onGoalClick={handleGoalClick}
            netWorth={netWorth}
            liquidBalance={liquidBalance}
            investedAmount={investedAmount}
            transactions={transactions}
            recurringExpenses={recurringExpenses}
            whatsappConfig={whatsappConfig}
            onSimulateFullMonth={handleSimulateFullMonth}
            onNavigateToTransactions={() => setActiveTab("payments")}
            onNewIncome={() => setActiveTab("payments")}
            onNewExpense={() => setActiveTab("payments")}
            onUpdateBalances={handleUpdateBalances}
          />
        )}
        
        <Suspense fallback={<div className="py-16 text-center text-sm text-[#6b617c]">Carregando…</div>}>
        {activeTab === "payments" && (
          <TransactionsView
            transactions={transactions}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onRestoreTransaction={handleRestoreTransaction}
            onToggleTransactionType={handleToggleTransactionType}
            onUpdateTransactionCategory={handleUpdateTransactionCategory}
            onResetDemoData={handleResetDemoData}
            recurringExpenses={recurringExpenses}
            onAddRecurringExpense={handleAddRecurringExpense}
            onDeleteRecurringExpense={handleDeleteRecurringExpense}
            onTogglePaidRecurringExpense={handleTogglePaidRecurringExpense}
            onOpenImportModal={() => setIsImportModalOpen(true)}
            whatsappConfig={whatsappConfig}
            onUpdateWhatsappConfig={(newCfg) => setWhatsappConfig(newCfg)}
          />
        )}
        
        {activeTab === "smart_toy" && (
          <WealthAIView
            chatHistory={chatHistory}
            onSendMessage={handleSendMessage}
            isGenerating={isGenerating}
            apiWarning={apiWarning}
          />
        )}
        
        {activeTab === "monitoring" && (
          <InvestmentsView
            netWorth={netWorth}
            investedAmount={investedAmount}
            onOpenInvestModal={() => setIsInvestModalOpen(true)}
          />
        )}
        
        {activeTab === "account_balance" && (
          <ConnectionsView
            connections={connections}
            onAddConnection={handleAddConnection}
            onOpenImportModal={() => setIsImportModalOpen(true)}
          />
        )}
        </Suspense>
      </main>

      {/* Statement Import Modal */}
      <Suspense fallback={null}>
        {isImportModalOpen && <StatementImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImportTransactions={handleBatchImportTransactions}
        />}
      </Suspense>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-6 pb-8 pt-4 bg-[#ffffff]/85 backdrop-blur-2xl border-t border-violet-200/60 shadow-[0px_-4px_40px_rgba(0,122,255,0.15)] rounded-t-2xl">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-full transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-[#7c3aed] text-white scale-110 shadow-lg shadow-[#7c3aed]/20"
                  : "text-[#6b617c] hover:text-slate-900 hover:bg-violet-50"
              }`}
              title={item.label}
            >
              {item.icon}
            </button>
          );
        })}
      </nav>

      {/* Floating Investment Dialog Modal */}
      {isInvestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#ffffff] border border-[#c4b5d6]/50 rounded-2xl shadow-2xl p-6 space-y-6 animate-fade-in text-left">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp size={20} className="text-[#7c3aed]" />
                Depositar em Investimentos
              </h3>
              <button
                onClick={() => {
                  setInvestAmountInput("");
                  setInvestError("");
                  setIsInvestModalOpen(false);
                }}
                className="text-[#6b617c] hover:text-slate-900 p-1 rounded-full hover:bg-violet-50 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleInvestDeposit} className="space-y-4">
              <p className="text-xs text-[#51465f] leading-relaxed">
                Transfira saldo de sua conta corrente líquida para sua carteira de investimentos global.
              </p>

              <div className="p-3 bg-[#f8f6fc] rounded-xl flex justify-between items-center text-xs text-[#6b617c] font-mono border border-violet-200/60">
                <span>Saldo Líquido Disponível:</span>
                <span className="font-bold text-slate-900">
                  {liquidBalance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#6b617c] font-semibold uppercase tracking-wider">Valor para Investir (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Ex: 5000.00"
                  value={investAmountInput}
                  onChange={(e) => setInvestAmountInput(e.target.value)}
                  className="w-full bg-[#f8f6fc] border border-[#c4b5d6]/50 rounded-xl px-4 py-3 text-sm text-slate-900 focus:border-[#7c3aed] outline-none font-mono"
                />
              </div>

              {investError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{investError}</span>
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setInvestAmountInput("");
                    setInvestError("");
                    setIsInvestModalOpen(false);
                  }}
                  className="flex-1 py-3 border border-[#c4b5d6]/60 text-[#51465f] hover:bg-violet-50 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#7c3aed] text-white hover:opacity-90 rounded-xl font-bold text-xs shadow-lg shadow-[#7c3aed]/10 cursor-pointer"
                >
                  Confirmar Aporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
