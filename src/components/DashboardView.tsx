import React, { useState } from "react";
import {
  TrendingUp,
  Plus,
  CreditCard,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Wallet,
  ArrowRight,
  History,
  PieChart,
  Landmark,
  Briefcase,
  Layers,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Edit3,
  X,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  CalendarClock,
  MessageCircle,
  ReceiptText,
} from "lucide-react";
import { USER_PROFILE, FINANCIAL_GOALS } from "../data";
import { RecurringExpense, Transaction, WhatsAppConfig } from "../types";

interface DashboardViewProps {
  onInvestClick: () => void;
  onGoalClick: (goalName: string) => void;
  netWorth: number;
  liquidBalance: number;
  investedAmount: number;
  transactions?: Transaction[];
  onSimulateFullMonth?: () => void;
  onNavigateToTransactions?: () => void;
  onUpdateBalances?: (newLiquid: number, newInvested: number) => void;
  recurringExpenses?: RecurringExpense[];
  whatsappConfig?: WhatsAppConfig;
  onNewIncome?: () => void;
  onNewExpense?: () => void;
}

export default function DashboardView({
  onInvestClick,
  onGoalClick,
  netWorth,
  liquidBalance,
  investedAmount,
  transactions = [],
  onSimulateFullMonth,
  onNavigateToTransactions,
  onUpdateBalances,
  recurringExpenses = [],
  whatsappConfig,
  onNewIncome,
  onNewExpense,
}: DashboardViewProps) {
  const [chartType, setChartType] = useState<"flow" | "wealth">("flow");

  // Edit Balances Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [inputLiquid, setInputLiquid] = useState(liquidBalance.toString());
  const [inputInvested, setInputInvested] = useState(investedAmount.toString());

  const handleOpenAdjustModal = () => {
    setInputLiquid(liquidBalance.toString());
    setInputInvested(investedAmount.toString());
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjustedBalances = (e: React.FormEvent) => {
    e.preventDefault();
    const lVal = parseFloat(inputLiquid) || 0;
    const iVal = parseFloat(inputInvested) || 0;
    if (onUpdateBalances) {
      onUpdateBalances(lVal, iVal);
    }
    setIsAdjustModalOpen(false);
  };

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const monthTokens = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const now = new Date();
  const [selectedPeriod, setSelectedPeriod] = useState({ month: now.getMonth(), year: now.getFullYear() });
  const changeMonth = (delta: number) => setSelectedPeriod((current) => {
    const date = new Date(current.year, current.month + delta, 1);
    return { month: date.getMonth(), year: date.getFullYear() };
  });
  const periodTransactions = transactions.filter((tx) => {
    if (tx.date === "Recorrente Mensal" || tx.isRecurring) return true;
    const monthIndex = monthTokens.findIndex((m) => tx.date.toLowerCase().includes(m));
    return monthIndex < 0 || monthIndex === selectedPeriod.month;
  });

  // Dynamic monthly financial stats based on the selected period
  const inflowTxs = periodTransactions.filter((tx) => tx.amount > 0);
  const outflowTxs = periodTransactions.filter((tx) => tx.amount < 0);

  const monthlyRevenues = inflowTxs.reduce((acc, tx) => acc + tx.amount, 0);
  const monthlyExpenses = outflowTxs.reduce((acc, tx) => acc + Math.abs(tx.amount), 0);
  const netCashFlow = monthlyRevenues - monthlyExpenses;

  const savingRate = monthlyRevenues > 0
    ? Math.max(0, Math.round((netCashFlow / monthlyRevenues) * 100))
    : 0;

  const expenseRatio = monthlyRevenues > 0
    ? Math.min(100, Math.round((monthlyExpenses / monthlyRevenues) * 100))
    : 0;

  // Format currency dynamically
  const formatBRL = (val: number) => {
    return val.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  // Group top income sources
  const topIncomes = [...inflowTxs]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);

  // Group top expense categories
  const expenseCategories = outflowTxs.reduce((acc, tx) => {
    const cat = tx.category || "Outros";
    const amt = Math.abs(tx.amount);
    acc[cat] = (acc[cat] || 0) + amt;
    return acc;
  }, {} as Record<string, number>);

  const topExpenseCategories = Object.entries(expenseCategories)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  const monthlyFlowData = [{ month: monthTokens[selectedPeriod.month].toUpperCase(), in: monthlyRevenues, out: monthlyExpenses }];

  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).getDate();
  const billsDueTomorrow = recurringExpenses.filter((item) => !item.paidThisMonth && item.dueDate === tomorrow);
  const dueTomorrowTotal = billsDueTomorrow.reduce((sum, item) => sum + item.amount, 0);
  const topExpense = topExpenseCategories[0];
  const deficit = Math.max(0, -netCashFlow);
  const lastAlertLabel = whatsappConfig?.lastAutoCheckDate
    ? new Date(`${whatsappConfig.lastAutoCheckDate}T12:00:00`).toLocaleDateString("pt-BR")
    : "ainda não registrado";
  const lastAlertSummary = whatsappConfig?.lastAutoCheckDate
    ? whatsappConfig.lastAutoCheckDueCount
      ? `${whatsappConfig.lastAutoCheckDueCount} conta(s) encontrada(s)${whatsappConfig.lastAutoCheckWhatsAppSent ? " e aviso enviado" : ""}.`
      : "Nenhuma conta vencia no dia seguinte."
    : "A rotina diária ainda não foi registrada.";

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-12">
      {/* Top Welcome & Actions Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#131313] border border-[#353534]/50 rounded-2xl p-4 md:p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/30">
              Gestão Financeira & Investimentos
            </span>
            <span className="text-xs text-[#8b90a0]">Casal Elo & Gidheon</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mt-1">
            Painel de Controle Financeiro
          </h1>
          <div className="mt-2 inline-flex items-center gap-1 rounded-xl bg-black/30 border border-white/10 p-1" aria-label="Selecionar mês analisado">
            <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-lg text-[#c1c6d7] hover:bg-white/10" aria-label="Mês anterior"><ChevronLeft size={15} /></button>
            <span className="min-w-32 text-center text-xs font-bold text-white">{monthNames[selectedPeriod.month]} {selectedPeriod.year}</span>
            <button onClick={() => changeMonth(1)} className="p-1.5 rounded-lg text-[#c1c6d7] hover:bg-white/10" aria-label="Próximo mês"><ChevronRightIcon size={15} /></button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleOpenAdjustModal}
            className="bg-white/5 border border-[#353534] text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-white/10 hover:border-[#adc6ff]/40 transition-all active:scale-95 shadow-lg text-xs cursor-pointer"
            title="Ajustar Saldo da Conta e Patrimônio Investido"
          >
            <Edit3 size={15} className="text-[#adc6ff]" />
            <span>Ajustar Saldos</span>
          </button>

          {onSimulateFullMonth && (
            <button
              type="button"
              onClick={onSimulateFullMonth}
              className="bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/30 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-[#4edea3]/20 hover:scale-[1.02] transition-all active:scale-95 shadow-lg shadow-[#4edea3]/10 cursor-pointer text-xs"
              title="Criar no extrato os pagamentos de todas as despesas fixas pendentes"
            >
              <Sparkles size={16} className="text-[#4edea3]" />
              <span>Quitar Custos Fixos</span>
            </button>
          )}

          <button
            onClick={onNewIncome || onNavigateToTransactions}
            className="bg-[#adc6ff] text-[#002e69] font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 hover:opacity-90 hover:scale-[1.02] transition-all active:scale-95 shadow-lg shadow-[#adc6ff]/20 cursor-pointer text-xs"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Nova Receita</span>
          </button>
          <button onClick={onNewExpense || onNavigateToTransactions} className="bg-rose-500/10 text-rose-300 border border-rose-500/30 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs"><ReceiptText size={15}/><span>Nova Despesa</span></button>
          <button onClick={onInvestClick} className="bg-[#adc6ff]/10 text-[#adc6ff] border border-[#adc6ff]/30 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs"><TrendingUp size={15}/><span>Novo Investimento</span></button>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <button onClick={onNavigateToTransactions} className="text-left bg-amber-500/10 border border-amber-400/30 rounded-2xl p-4 hover:bg-amber-500/15 transition-colors">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-sm"><CalendarClock size={18}/> Próximos vencimentos</div>
          <p className="mt-2 text-white font-extrabold text-lg">{billsDueTomorrow.length} conta(s) amanhã · {formatBRL(dueTomorrowTotal)}</p>
          <p className="text-xs text-[#c1c6d7] mt-1">{billsDueTomorrow.length ? billsDueTomorrow.map((b) => b.title).join(", ") : "Nenhuma conta vence amanhã"}</p>
        </button>
        <div className={`${deficit ? "bg-rose-500/10 border-rose-500/30" : "bg-[#4edea3]/10 border-[#4edea3]/30"} border rounded-2xl p-4`}>
          <div className="flex items-center gap-2 text-white font-bold text-sm"><AlertCircle size={18}/> Decisão do mês</div>
          <p className="mt-2 text-white font-extrabold text-lg">{deficit ? `Reduzir ${formatBRL(deficit)}` : `Sobra de ${formatBRL(netCashFlow)}`}</p>
          <p className="text-xs text-[#c1c6d7] mt-1">{topExpense ? `${topExpense[0]} é a maior categoria (${formatBRL(topExpense[1])}).` : "Cadastre despesas para receber recomendações."}</p>
        </div>
        <div className="bg-[#adc6ff]/10 border border-[#adc6ff]/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-[#adc6ff] font-bold text-sm"><MessageCircle size={18}/> Central de alertas</div>
          <p className="mt-2 text-white font-extrabold text-lg">WhatsApp {whatsappConfig?.enabled ? "ativo" : "inativo"}</p>
          <p className="text-xs text-[#c1c6d7] mt-1">Última rotina: {lastAlertLabel}. {lastAlertSummary}</p>
        </div>
      </section>

      {/* Primary KPI Cards: Cash Flow & Net Worth */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Receitas (Entradas) */}
        <div className="bg-[#131313] border border-[#00a572]/30 rounded-2xl p-5 relative overflow-hidden group hover:border-[#00a572]/60 transition-all shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-[#8b90a0] text-xs font-semibold uppercase tracking-wider">
              Total Entradas (Mês)
            </span>
            <div className="w-8 h-8 rounded-full bg-[#00a572]/20 border border-[#00a572]/40 flex items-center justify-center text-[#4edea3]">
              <ArrowDownLeft size={18} />
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#4edea3] mt-2 font-mono">
            {formatBRL(monthlyRevenues)}
          </h2>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#353534]/40 text-xs text-[#8b90a0]">
            <span>{inflowTxs.length} lançamento(s)</span>
            <span className="text-[#4edea3] font-semibold flex items-center gap-1">
              <CheckCircle2 size={12} /> {inflowTxs.filter(t => t.isRecurring || t.date === "Recorrente Mensal").length} Fixos
            </span>
          </div>
        </div>

        {/* Card 2: Total Despesas (Saídas) */}
        <div className="bg-[#131313] border border-rose-500/30 rounded-2xl p-5 relative overflow-hidden group hover:border-rose-500/60 transition-all shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-[#8b90a0] text-xs font-semibold uppercase tracking-wider">
              Total Saídas (Mês)
            </span>
            <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-rose-400 mt-2 font-mono">
            {formatBRL(monthlyExpenses)}
          </h2>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#353534]/40 text-xs text-[#8b90a0]">
            <span>Comprometido: <strong className="text-rose-400">{expenseRatio}%</strong></span>
            <span>{outflowTxs.length} item(s)</span>
          </div>
        </div>

        {/* Card 3: Sobra Líquida do Mês (Saldo do Fluxo) */}
        <div className={`bg-[#131313] border ${netCashFlow >= 0 ? "border-[#4edea3]/40" : "border-rose-500/40"} rounded-2xl p-5 relative overflow-hidden shadow-lg`}>
          <div className="flex justify-between items-start">
            <span className="text-[#8b90a0] text-xs font-semibold uppercase tracking-wider">
              Sobra do Mês (Resultado)
            </span>
            <div className={`w-8 h-8 rounded-full ${netCashFlow >= 0 ? "bg-[#4edea3]/20 text-[#4edea3]" : "bg-rose-500/20 text-rose-400"} flex items-center justify-center`}>
              <Wallet size={18} />
            </div>
          </div>
          <h2 className={`text-2xl md:text-3xl font-extrabold mt-2 font-mono ${netCashFlow >= 0 ? "text-[#4edea3]" : "text-rose-400"}`}>
            {netCashFlow >= 0 ? "+" : ""}{formatBRL(netCashFlow)}
          </h2>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#353534]/40 text-xs text-[#8b90a0]">
            <span>Taxa de Poupança:</span>
            <span className="font-extrabold text-white bg-white/10 px-2 py-0.5 rounded">{savingRate}% Livre</span>
          </div>
        </div>

        {/* Card 4: Patrimônio Total Acc. */}
        <div className="bg-[#131313] border border-[#adc6ff]/30 rounded-2xl p-5 relative overflow-hidden group hover:border-[#adc6ff]/60 transition-all shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-[#8b90a0] text-xs font-semibold uppercase tracking-wider">
              Patrimônio Acumulado
            </span>
            <button
              onClick={handleOpenAdjustModal}
              className="w-8 h-8 rounded-full bg-[#adc6ff]/20 border border-[#adc6ff]/40 flex items-center justify-center text-[#adc6ff] hover:bg-[#adc6ff] hover:text-[#001a41] transition-all cursor-pointer"
              title="Ajustar Saldos"
            >
              <Edit3 size={15} />
            </button>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-2 font-mono">
            {formatBRL(netWorth)}
          </h2>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#353534]/40 text-xs text-[#8b90a0]">
            <span>Saldo: <strong className="text-[#4edea3]">{formatBRL(liquidBalance)}</strong></span>
            <span>Investido: <strong className="text-[#adc6ff]">{formatBRL(investedAmount)}</strong></span>
          </div>
        </div>
      </section>

      {/* Cash Flow Health Thermometer Gauge */}
      <section className="bg-[#131313] border border-[#353534]/50 rounded-2xl p-6 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <PieChart size={18} className="text-[#4edea3]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Comprometimento da Renda Mensal (Saídas vs Entradas)
            </h3>
          </div>
          <span className="text-xs font-mono text-[#8b90a0]">
            Receita Usada: <strong className="text-white">{expenseRatio}%</strong> | Sobra Livre: <strong className="text-[#4edea3]">{savingRate}%</strong>
          </span>
        </div>

        {/* Visual Multi-Segment Progress Bar */}
        <div className="h-4 w-full bg-[#1c1b1b] rounded-full overflow-hidden flex p-0.5 border border-[#353534]/50">
          <div
            className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-l-full transition-all duration-500"
            style={{ width: `${Math.min(100, expenseRatio)}%` }}
            title={`Despesas: ${formatBRL(monthlyExpenses)} (${expenseRatio}%)`}
          ></div>
          <div
            className="h-full bg-[#4edea3] rounded-r-full transition-all duration-500"
            style={{ width: `${Math.max(0, 100 - expenseRatio)}%` }}
            title={`Sobra Líquida: ${formatBRL(netCashFlow)} (${savingRate}%)`}
          ></div>
        </div>

        <div className="flex justify-between items-center text-xs text-[#8b90a0] pt-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
            <span>Saídas / Gastos ({formatBRL(monthlyExpenses)})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#4edea3] inline-block"></span>
            <span>Sobra Líquida / Investimentos ({formatBRL(netCashFlow)})</span>
          </div>
        </div>
      </section>

      {/* Chart Section: Toggle between Fluxo (Entradas x Saídas) and Evolução Patrimonial */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#131313] border border-[#353534]/50 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {chartType === "flow" ? "Resultado do mês: Entradas vs Saídas" : "Posição patrimonial atual"}
              </h3>
              <p className="text-xs text-[#8b90a0]">
                {chartType === "flow" ? "Valores reais do período selecionado" : "Saldo disponível e investimentos cadastrados agora"}
              </p>
            </div>

            {/* Chart Type Toggle Tabs */}
            <div className="flex gap-1 bg-[#1c1b1b] p-1 rounded-xl border border-[#353534]/50 self-start">
              <button
                onClick={() => setChartType("flow")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  chartType === "flow"
                    ? "bg-[#00a572]/30 text-[#4edea3] border border-[#00a572]/50 font-extrabold"
                    : "text-[#8b90a0] hover:text-white"
                }`}
              >
                <Layers size={14} />
                <span>Entradas x Saídas</span>
              </button>
              <button
                onClick={() => setChartType("wealth")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  chartType === "wealth"
                    ? "bg-[#adc6ff]/20 text-[#adc6ff] border border-[#adc6ff]/40 font-extrabold"
                    : "text-[#8b90a0] hover:text-white"
                }`}
              >
                <TrendingUp size={14} />
                <span>Patrimônio</span>
              </button>
            </div>
          </div>

          {/* Render Flow Chart (Bars) vs Wealth Chart (Line) */}
          {chartType === "flow" ? (
            <div className="space-y-4">
              <div className="h-56 w-full flex items-end justify-between gap-2 pt-6 px-2">
                {monthlyFlowData.map((item, idx) => {
                  const maxVal = 25000;
                  const inHeight = Math.min(100, (item.in / maxVal) * 100);
                  const outHeight = Math.min(100, (item.out / maxVal) * 100);

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                      <div className="flex items-end justify-center gap-1.5 w-full h-full max-h-44">
                        {/* Green Bar: Inflow */}
                        <div
                          className="w-1/2 max-w-[20px] bg-[#4edea3] rounded-t-md transition-all group-hover:brightness-125"
                          style={{ height: `${inHeight}%` }}
                          title={`${item.month} Entradas: ${formatBRL(item.in)}`}
                        ></div>
                        {/* Rose Bar: Outflow */}
                        <div
                          className="w-1/2 max-w-[20px] bg-rose-500/80 rounded-t-md transition-all group-hover:brightness-125"
                          style={{ height: `${outHeight}%` }}
                          title={`${item.month} Saídas: ${formatBRL(item.out)}`}
                        ></div>
                      </div>
                      <span className="text-[11px] font-mono text-[#8b90a0] uppercase">{item.month}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-center items-center gap-6 pt-2 border-t border-[#353534]/30 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-[#4edea3]"></span>
                  <span className="text-[#8b90a0]">Entradas (Receitas)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-rose-500/80"></span>
                  <span className="text-[#8b90a0]">Saídas (Despesas)</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-4">
              <div className="rounded-xl border border-white/5 bg-[#1c1b1b] p-4">
                <p className="text-[10px] uppercase tracking-wider text-[#8b90a0]">Saldo em conta</p>
                <p className="mt-2 text-xl font-extrabold text-white">{formatBRL(liquidBalance)}</p>
              </div>
              <div className="rounded-xl border border-[#adc6ff]/20 bg-[#adc6ff]/5 p-4">
                <p className="text-[10px] uppercase tracking-wider text-[#adc6ff]">Investimentos</p>
                <p className="mt-2 text-xl font-extrabold text-white">{formatBRL(investedAmount)}</p>
              </div>
              <div className="rounded-xl border border-[#4edea3]/20 bg-[#4edea3]/5 p-4">
                <p className="text-[10px] uppercase tracking-wider text-[#4edea3]">Patrimônio total</p>
                <p className="mt-2 text-xl font-extrabold text-white">{formatBRL(netWorth)}</p>
              </div>
              <p className="sm:col-span-3 text-xs text-[#8b90a0] text-center pt-2">
                O histórico aparecerá quando o Wealth tiver registros patrimoniais de vários períodos.
              </p>
            </div>
          )}
        </div>

        {/* Investment Asset Allocation Card */}
        <div className="bg-[#131313] border border-[#353534]/50 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white tracking-tight">Carteira de Investimentos</h3>
              <button
                onClick={onInvestClick}
                className="text-xs text-[#adc6ff] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Detalhes</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="p-4 bg-[#1c1b1b] rounded-xl border border-[#353534]/40 space-y-1 mb-4">
              <p className="text-xs text-[#8b90a0] uppercase font-semibold">Total Investido</p>
              <p className="text-2xl font-bold text-white font-mono">{formatBRL(investedAmount)}</p>
              <p className={`text-[11px] ${investedAmount > 0 ? "text-[#4edea3]" : "text-[#8b90a0]"}`}>
                {investedAmount > 0
                  ? `Corresponde a ${netWorth > 0 ? ((investedAmount / netWorth) * 100).toFixed(1) : "0"}% do Patrimônio Líquido`
                  : "Nenhum investimento cadastrado"}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-[#8b90a0] font-semibold uppercase tracking-wider">Alocação por Classe</p>
              {investedAmount === 0 ? (
                <div className="p-4 rounded-xl bg-[#161616] border border-dashed border-[#353534]/60 text-center space-y-2.5">
                  <p className="text-xs text-[#8b90a0]">
                    Você ainda não cadastrou ativos de investimentos (CDB, Ações, FIIs, Tesouro, Cripto).
                  </p>
                  <button
                    type="button"
                    onClick={onInvestClick}
                    className="text-xs font-bold text-[#adc6ff] bg-[#adc6ff]/10 hover:bg-[#adc6ff]/20 border border-[#adc6ff]/30 px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                  >
                    <Plus size={13} />
                    <span>Cadastrar Primeiro Aporte</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-[#161616]">
                    <span className="flex items-center gap-2 text-white">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#adc6ff]"></span> Renda Fixa (CDB, Tesouro)
                    </span>
                    <span className="font-mono text-[#adc6ff] font-bold">100%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#353534]/30 flex justify-between items-center text-xs">
            <span className="text-[#8b90a0]">Saldo em Conta Imediato:</span>
            <span className="font-mono font-bold text-white">{formatBRL(liquidBalance)}</span>
          </div>
        </div>
      </section>

      {/* Origin Breakdown & Recent Activity */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Box 1: Sources of Income (De Onde Vem) */}
        <div className="bg-[#131313] border border-[#353534]/50 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#353534]/30">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Landmark size={18} className="text-[#4edea3]" />
              <span>Fontes de Receita (De Onde Vem)</span>
            </h3>
          </div>

          <div className="space-y-3">
            {topIncomes.length === 0 ? (
              <p className="text-xs text-[#8b90a0]">Nenhuma receita cadastrada neste mês.</p>
            ) : (
              topIncomes.map((inc) => (
                <div key={inc.id} className="flex justify-between items-center p-3 rounded-xl bg-[#1c1b1b] border border-[#353534]/40">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      {inc.title}
                      {(inc.isRecurring || inc.date === "Recorrente Mensal") && (
                        <span className="text-[9px] text-[#4edea3] bg-[#4edea3]/10 px-1.5 rounded">Fixo</span>
                      )}
                    </p>
                    <p className="text-[10px] text-[#8b90a0]">{inc.category}</p>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#4edea3]">
                    +{formatBRL(inc.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Box 2: Top Expense Categories (Para Onde Vai) */}
        <div className="bg-[#131313] border border-[#353534]/50 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#353534]/30">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard size={18} className="text-rose-400" />
                <span>Para Onde Vai (Maiores Saídas)</span>
              </h3>
              <span className="text-[10px] font-bold text-[#adc6ff] bg-[#adc6ff]/10 border border-[#adc6ff]/20 px-2 py-0.5 rounded-full">
                {Object.keys(expenseCategories).length} Categorias
              </span>
            </div>

            <div className="space-y-3">
              {topExpenseCategories.length === 0 ? (
                <p className="text-xs text-[#8b90a0]">Nenhuma despesa cadastrada neste mês.</p>
              ) : (
                topExpenseCategories.map(([catName, catTotal]) => {
                  const percent = monthlyExpenses > 0 ? Math.round((catTotal / monthlyExpenses) * 100) : 0;
                  return (
                    <div key={catName} className="p-3 rounded-xl bg-[#1c1b1b] border border-[#353534]/40 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white">{catName}</span>
                        <span className="font-mono font-bold text-rose-400">-{formatBRL(catTotal)} ({percent}%)</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#131313] rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full" style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {onNavigateToTransactions && (
            <button
              onClick={onNavigateToTransactions}
              className="text-xs text-[#adc6ff] hover:underline font-bold flex items-center justify-end gap-1 cursor-pointer pt-2 border-t border-[#353534]/20"
            >
              <span>Ver todas as {Object.keys(expenseCategories).length} categorias no extrato</span>
              <ChevronRight size={14} />
            </button>
          )}
        </div>

        {/* Box 3: Financial Goals & Quick Navigation */}
        <div className="bg-[#131313] border border-[#353534]/50 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-2 border-b border-[#353534]/30">
              <h3 className="text-base font-bold text-white tracking-tight">Metas Ativas</h3>
              <span className="text-xs font-mono text-[#adc6ff]">{FINANCIAL_GOALS.length} Metas</span>
            </div>

            <div className="space-y-3 mt-4">
              {FINANCIAL_GOALS.map((goal) => (
                <div
                  key={goal.id}
                  onClick={() => onGoalClick(goal.name)}
                  className="space-y-1.5 cursor-pointer group p-2 rounded-xl hover:bg-white/5 transition-all"
                >
                  <div className="flex justify-between text-xs">
                    <span className="text-white font-medium group-hover:text-[#adc6ff] transition-colors">{goal.name}</span>
                    <span className="font-mono text-[#8b90a0]">{goal.percentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-[#1c1b1b] rounded-full p-0.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${goal.colorClass === "bg-[#adc6ff]" ? "bg-[#adc6ff]" : "bg-[#ffb95f]"}`}
                      style={{ width: `${goal.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {onNavigateToTransactions && (
            <button
              onClick={onNavigateToTransactions}
              className="w-full bg-[#1c1b1b] hover:bg-[#252424] border border-[#353534] text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer mt-4"
            >
              <History size={16} className="text-[#4edea3]" />
              <span>Ver Extrato Completo & Lançamentos</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </section>

      {/* Adjust Balances Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#141414] border border-[#353534] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 text-left">
            <div className="flex justify-between items-center pb-3 border-b border-[#353534]/50">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Sliders size={20} className="text-[#adc6ff]" />
                <span>Ajustar Saldos e Patrimônio</span>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-[#8b90a0] hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[#8b90a0]">
              Ajuste o valor real disponível em conta e o valor acumulado em investimentos. Os dados serão salvos e sincronizados automaticamente na nuvem (Firestore).
            </p>

            <form onSubmit={handleSaveAdjustedBalances} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8b90a0] mb-1.5 uppercase tracking-wider">
                  Saldo em Conta Imediato (Líquido)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-xs text-[#8b90a0] font-mono">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={inputLiquid}
                    onChange={(e) => setInputLiquid(e.target.value)}
                    required
                    placeholder="ex: 35070.00"
                    className="w-full bg-[#1c1b1b] border border-[#353534] focus:border-[#4edea3] text-white font-mono text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8b90a0] mb-1.5 uppercase tracking-wider">
                  Patrimônio Total Investido
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-xs text-[#8b90a0] font-mono">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={inputInvested}
                    onChange={(e) => setInputInvested(e.target.value)}
                    required
                    placeholder="ex: 85000.00"
                    className="w-full bg-[#1c1b1b] border border-[#353534] focus:border-[#adc6ff] text-white font-mono text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#adc6ff]/5 border border-[#adc6ff]/20 rounded-xl text-xs text-[#adc6ff]">
                <strong>Novo Patrimônio Acumulado:</strong> R${" "}
                {((parseFloat(inputLiquid) || 0) + (parseFloat(inputInvested) || 0)).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="flex-1 bg-[#1c1b1b] hover:bg-[#252424] text-white text-xs font-bold py-3 rounded-xl border border-[#353534] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#adc6ff] hover:bg-white text-[#002e69] text-xs font-bold py-3 rounded-xl shadow-lg shadow-[#adc6ff]/10 cursor-pointer"
                >
                  Salvar Saldos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
