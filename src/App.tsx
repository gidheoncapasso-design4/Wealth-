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

  // Subscribe to real-time Firestore database updates once the user is authenticated
  // (Firestore rules require an authenticated session, so subscribing earlier would
  // just fail with permission-denied).
  useEffect(() => {
    if (!authUser) return;

    const unsubscribe = subscribeCloudAppData((data) => {
      if (data) {
        // If cloud has transactions, update state
        if (data.transactions && Array.isArray(data.transactions) && data.transactions.length > 0) {
          setTransactions(autoSanitizeTransactions(data.transactions));
        } else {
          // If cloud is empty but local storage has transactions, upload local data to cloud immediately
          try {
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (saved) {
              const parsed = JSON.parse(saved);
              if (parsed.transactions && parsed.transactions.length > 0) {
                saveCloudAppData(parsed);
              }
            }
          } catch (e) {}
        }

        if (data.recurringExpenses && Array.isArray(data.recurringExpenses) && data.recurringExpenses.length > 0) {
          setRecurringExpenses(data.recurringExpenses);
        }
        if (data.connections && Array.isArray(data.connections) && data.connections.length > 0) {
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
    if (!authUser) return;

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
  }, [authUser, liquidBalance, investedAmount, transactions, recurringExpenses, connections, whatsappConfig]);


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

  // Ensure recurring incomes & 10% Dízimo are present in transactions & recurring expenses
  useEffect(() => {
    setTransactions((prev) => autoSanitizeTransactions(prev));
  }, []);

  // Sync fixed costs (recurringExpenses) Dízimo whenever transactions change
  useEffect(() => {
    const totalInflow = transactions
      .filter((t) => t.amount > 0 && !t.title.toLowerCase().includes("dízimo") && !t.title.toLowerCase().includes("dizimo"))
      .reduce((sum, t) => sum + t.amount, 0);

    const dizimoVal = calculateDizimo(totalInflow);

    setRecurringExpenses((prev) => {
      let hasDizimo = false;
      const updated = prev.map((r) => {
        if (r.id === "rec-dizimo" || r.title.toLowerCase().includes("dízimo") || r.title.toLowerCase().includes("dizimo")) {
          hasDizimo = true;
          return {
            ...r,
            title: "Dízimo (10% das Receitas)",
            amount: dizimoVal,
            category: "Dízimo & Doações",
          };
        }
        return r;
      });

      if (!hasDizimo) {
        return [
          {
            id: "rec-dizimo",
            title: "Dízimo (10% das Receitas)",
            category: "Dízimo & Doações",
            amount: dizimoVal,
            dueDate: 10,
            paidThisMonth: false,
          },
          ...updated,
        ];
      }
      return updated;
    });
  }, [transactions]);

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
      colorClass: newTx.amount < 0
        ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
        : "text-[#4edea3] bg-[#4edea3]/10 border-[#4edea3]/20",
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

  // Restore initial demo data
  const handleResetDemoData = () => {
    setTransactions(INITIAL_TRANSACTIONS);
    setLiquidBalance(USER_PROFILE.liquidBalanceRaw);
  };

  // Batch import transactions from statement parser
  const handleBatchImportTransactions = async (
    imported: Array<{ title: string; category: string; amount: number; icon?: string; isRejected?: boolean }>
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
        date: dayNow,
        colorClass: item.isRejected
          ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
          : item.amount < 0
          ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
          : "text-[#4edea3] bg-[#4edea3]/10 border-[#4edea3]/20",
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
              ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
              : "text-[#4edea3] bg-[#4edea3]/10 border-[#4edea3]/20",
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
    setRecurringExpenses(
      recurringExpenses.map((item) => {
        if (item.id === id) {
          const updatedPaid = !item.paidThisMonth;
          
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
          return { ...item, paidThisMonth: updatedPaid };
        }
        return item;
      })
    );
  };

  // Full Month Simulation Handler (Simulates paying only the user's 18 real fixed costs)
  const handleSimulateFullMonth = () => {
    if (!window.confirm("Isso criará no extrato os pagamentos de todas as despesas fixas pendentes e as marcará como pagas. Deseja continuar?")) return;
    const simulatedTxs: Transaction[] = recurringExpenses.map((exp, idx) => ({
      id: `sim-rec-${idx}`,
      title: `Quitac. ${exp.title}`,
      category: exp.category,
      amount: -exp.amount,
      time: "09:00",
      date: `${exp.dueDate.toString().padStart(2, "0")}/Ago`,
      icon: "payments",
      colorClass: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    }));

    // Mark all recurring expenses as paid for the month
    setRecurringExpenses((prev) =>
      prev.map((item) => ({ ...item, paidThisMonth: true }))
    );

    // Replace transactions list with user's fixed costs
    setTransactions(simulatedTxs);

    // Calculate total paid and maintain positive cash balance
    const totalFixedPaid = recurringExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const totalRevenues = 23350.00;
    const baseAccountBalance = 35000.00;
    const newLiquidBalance = Math.max(5070.00, baseAccountBalance + (totalRevenues - totalFixedPaid));
    setLiquidBalance(newLiquidBalance);

    // Set user notification alert banner
    setGoalAlert(`Simulação Concluída! Todos os seus ${recurringExpenses.length} custos fixos reais (R$ ${totalFixedPaid.toLocaleString("pt-BR")},00) foram marcados como quitados no extrato.`);

    // Add automated audit message in Wealth AI
    const auditMsg: ChatMessage = {
      id: "chat-sim-" + Date.now(),
      role: "model",
      text: `📊 **Relatório de Fechamento dos Custos Fixos Reais**:\n\n• **Total de Custos Fixos Mês**: R$ ${totalFixedPaid.toLocaleString("pt-BR")},00 (${recurringExpenses.length} itens quitados)\n• **Receitas Mês**: R$ 23.350,00\n• **Sobra do Mês**: R$ ${(totalRevenues - totalFixedPaid).toLocaleString("pt-BR")},00\n• **Saldo Disponível**: R$ ${newLiquidBalance.toLocaleString("pt-BR")},00\n• **Principais Linhas**: Aluguel (R$ 4.500), Dízimo (R$ 2.335), Carro (R$ 3.000), Supermercado (R$ 2.000)\n• **Status**: 100% dos custos fixos quitados e vinculados ao extrato.`,
      timestamp: "18:00",
    };
    setChatHistory((prev) => [...prev, auditMsg]);
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
          paidThisMonth: r.paidThisMonth,
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
    return <div className="min-h-screen bg-black" />;
  }

  if (!authUser) {
    return <LoginView />;
  }

  return (
    <div className="flex flex-col min-h-screen text-[#e5e2e1] custom-scrollbar pb-32">
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
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <Sparkles size={16} className="text-[#adc6ff]" />
            <span>{goalAlert}</span>
          </div>
          <button onClick={() => setGoalAlert(null)} className="text-[#8b90a0] hover:text-white cursor-pointer p-0.5">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Undo last statement import batch */}
      {lastImportBatch && (
        <div className="mx-6 mt-4 p-3.5 bg-[#adc6ff]/10 border border-[#adc6ff]/20 rounded-xl flex items-center justify-between text-left animate-fade-in z-40">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <span>{lastImportBatch.count} lançamentos importados. Categorização saiu errada?</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleUndoImportBatch}
              className="text-xs font-bold text-[#adc6ff] hover:underline cursor-pointer"
            >
              Desfazer importação
            </button>
            <button onClick={() => setLastImportBatch(null)} className="text-[#8b90a0] hover:text-white cursor-pointer p-0.5">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Render */}
      <main className="max-w-7xl mx-auto px-6 pt-6 flex-1 w-full">
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
        
        <Suspense fallback={<div className="py-16 text-center text-sm text-[#8b90a0]">Carregando…</div>}>
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
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-6 pb-8 pt-4 bg-[#131313]/85 backdrop-blur-2xl border-t border-white/5 shadow-[0px_-4px_40px_rgba(0,122,255,0.15)] rounded-t-2xl">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-full transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-[#00a572] text-[#00311f] scale-110 shadow-lg shadow-[#00a572]/20"
                  : "text-[#8b90a0] hover:text-white hover:bg-white/5"
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
          <div className="w-full max-w-md bg-[#131313] border border-[#353534]/50 rounded-2xl shadow-2xl p-6 space-y-6 animate-fade-in text-left">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp size={20} className="text-[#adc6ff]" />
                Depositar em Investimentos
              </h3>
              <button
                onClick={() => {
                  setInvestAmountInput("");
                  setInvestError("");
                  setIsInvestModalOpen(false);
                }}
                className="text-[#8b90a0] hover:text-white p-1 rounded-full hover:bg-white/5 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleInvestDeposit} className="space-y-4">
              <p className="text-xs text-[#c1c6d7] leading-relaxed">
                Transfira saldo de sua conta corrente líquida para sua carteira de investimentos global.
              </p>

              <div className="p-3 bg-[#1c1b1b] rounded-xl flex justify-between items-center text-xs text-[#8b90a0] font-mono border border-white/[0.02]">
                <span>Saldo Líquido Disponível:</span>
                <span className="font-bold text-white">
                  {liquidBalance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#8b90a0] font-semibold uppercase tracking-wider">Valor para Investir (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Ex: 5000.00"
                  value={investAmountInput}
                  onChange={(e) => setInvestAmountInput(e.target.value)}
                  className="w-full bg-[#1c1b1b] border border-[#353534]/50 rounded-xl px-4 py-3 text-sm text-white focus:border-[#adc6ff] outline-none font-mono"
                />
              </div>

              {investError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5 text-xs text-rose-400">
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
                  className="flex-1 py-3 border border-[#353534]/60 text-[#c1c6d7] hover:bg-white/5 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#adc6ff] text-[#002e69] hover:opacity-90 rounded-xl font-bold text-xs shadow-lg shadow-[#adc6ff]/10 cursor-pointer"
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
