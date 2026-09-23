import React, { useState } from "react";
import { TrendingUp, RefreshCw, Award, Info, ChevronRight, Coins, DollarSign, Activity, Percent, Plus, ShieldCheck } from "lucide-react";
import { ASSET_ALLOCATIONS, PERFORMANCE_ITEMS } from "../data";

interface InvestmentsViewProps {
  netWorth: number;
  investedAmount: number;
  onOpenInvestModal?: () => void;
}

export default function InvestmentsView({
  netWorth,
  investedAmount,
  onOpenInvestModal,
}: InvestmentsViewProps) {
  const [hoveredDividendMonth, setHoveredDividendMonth] = useState<string | null>(null);

  // Format currency dynamically
  const formatBRL = (val: number) => {
    return val.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Portfolio Total Hero */}
      <section className="relative group">
        <div className="absolute -inset-4 bg-blue-500/5 blur-3xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
        <div className="relative flex flex-col md:flex-row items-center md:items-start justify-between text-center md:text-left gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#6b617c] mb-2">Patrimônio de Investimentos</p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-2">
              {formatBRL(investedAmount)}
            </h2>
            <div className="flex items-center gap-2 px-3 py-1 bg-violet-50 border border-violet-200/60 rounded-full w-fit mx-auto md:mx-0">
              <TrendingUp size={14} className={investedAmount > 0 ? "text-[#15803d]" : "text-[#6b617c]"} />
              <span className="font-mono text-xs font-semibold text-[#6b617c]">
                {investedAmount > 0 ? "+12.4% acumulado" : "Nenhum ativo cadastrado"}
              </span>
            </div>
          </div>

          {onOpenInvestModal && (
            <button
              onClick={onOpenInvestModal}
              className="px-4 py-2.5 bg-[#7c3aed] text-white rounded-xl font-bold text-xs flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-[#7c3aed]/10 cursor-pointer"
            >
              <Plus size={16} />
              <span>Cadastrar Investimento</span>
            </button>
          )}
        </div>
      </section>

      {/* Bento Grid Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Rentabilidade Graph */}
        <div className="md:col-span-8 glass-card rounded-2xl p-6 flex flex-col h-[400px]">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
            <h3 className="text-lg font-bold text-slate-900">Histórico de Rentabilidade</h3>
            {investedAmount > 0 && (
              <div className="flex gap-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#7c3aed]"></span>
                  <span className="text-[10px] font-bold text-[#6b617c] uppercase tracking-wider">Você</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#b45309]"></span>
                  <span className="text-[10px] font-bold text-[#6b617c] uppercase tracking-wider">CDI</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#15803d]"></span>
                  <span className="text-[10px] font-bold text-[#6b617c] uppercase tracking-wider">IBOV</span>
                </div>
              </div>
            )}
          </div>
          
          {investedAmount === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#c4b5d6]/50 rounded-xl space-y-3">
              <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center text-[#6b617c]">
                <TrendingUp size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-900">Nenhum investimento registrado</p>
              <p className="text-xs text-[#6b617c] max-w-sm">
                O gráfico de rentabilidade e comparação com benchmarks (CDI / IBOV) será traçado automaticamente quando você cadastrar seus ativos reais.
              </p>
              {onOpenInvestModal && (
                <button
                  onClick={onOpenInvestModal}
                  className="mt-2 text-xs text-[#7c3aed] font-bold hover:underline"
                >
                  + Inserir valor investido
                </button>
              )}
            </div>
          ) : (
            <div className="flex-grow relative mt-4">
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 800 200">
                <defs>
                  <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="rgba(173, 198, 255, 0.2)" />
                    <stop offset="100%" stopColor="rgba(173, 198, 255, 0)" />
                  </linearGradient>
                </defs>
                <line stroke="rgba(255,255,255,0.03)" strokeWidth={1} x1="0" x2="800" y1="50" y2="50"></line>
                <line stroke="rgba(255,255,255,0.03)" strokeWidth={1} x1="0" x2="800" y1="100" y2="100"></line>
                <line stroke="rgba(255,255,255,0.03)" strokeWidth={1} x1="0" x2="800" y1="150" y2="150"></line>
                
                <path
                  className="chart-glow transition-all duration-1000"
                  d="M0,160 Q100,150 200,110 T400,90 T600,60 T800,40"
                  fill="none"
                  stroke="#7c3aed"
                  strokeLinecap="round"
                  strokeWidth={4.5}
                ></path>
                
                <path
                  d="M0,160 Q100,150 200,110 T400,90 T600,60 T800,40 V200 H0 Z"
                  fill="url(#chartGradient)"
                ></path>
              </svg>
            </div>
          )}
        </div>

        {/* Asset Allocation */}
        <div className="md:col-span-4 glass-card rounded-2xl p-6 flex flex-col justify-between hover:border-violet-200/60 transition-all">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-6">Alocação de Ativos</h3>
            <div className="space-y-4">
              {investedAmount === 0 || ASSET_ALLOCATIONS.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#ffffff] border border-dashed border-[#c4b5d6]/50 text-center space-y-2">
                  <p className="text-xs text-[#6b617c]">Nenhum ativo alocado na carteira.</p>
                  <p className="text-[11px] text-[#6b617c]">
                    Suas classes (Renda Fixa, Ações, FIIs, Cripto) aparecerão aqui conforme você cadastrar.
                  </p>
                </div>
              ) : (
                ASSET_ALLOCATIONS.map((alloc, i) => (
                  <div key={i} className="group">
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-xs font-semibold text-slate-900">{alloc.name}</span>
                      <span className="font-mono text-xs text-[#7c3aed] font-bold">{alloc.percentage}%</span>
                    </div>
                    <div className="flex gap-1 h-2">
                      <div className={`${alloc.colorClass} rounded-l-full`} style={{ width: `${alloc.percentage}%` }}></div>
                      <div className="bg-[#c4b5d6]/40 flex-grow rounded-r-full"></div>
                    </div>
                    <span className="text-[10px] text-[#6b617c] font-mono block mt-1">{alloc.amount}</span>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {onOpenInvestModal && (
            <button
              onClick={onOpenInvestModal}
              className="mt-6 py-2.5 w-full border border-[#c4b5d6]/50 rounded-xl text-xs font-semibold text-slate-900 hover:bg-violet-50 hover:border-violet-200/60 transition-all cursor-pointer"
            >
              + Adicionar Ativo / Aporte
            </button>
          )}
        </div>

        {/* Dividendos Section */}
        <div className="md:col-span-6 glass-card rounded-2xl p-6 min-h-[260px] flex flex-col justify-between hover:border-violet-200/60 transition-all">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-slate-900">Histórico de Proventos</h3>
            <div className="text-right">
              <p className="text-[10px] font-semibold text-[#6b617c] uppercase tracking-wider">Média Mensal</p>
              <p className="text-xl font-bold text-slate-900 font-mono">
                {investedAmount > 0 ? "R$ 0,00" : "R$ 0,00"}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center p-6 border border-dashed border-[#c4b5d6]/40 rounded-xl text-center space-y-2 my-auto">
            <Coins size={22} className="text-[#6b617c]" />
            <p className="text-xs text-[#6b617c]">
              {investedAmount > 0
                ? "Aguardando primeiro pagamento de dividendos/juros dos seus ativos."
                : "Cadastre investimentos em FIIs ou Ações para acompanhar dividendos e juros sobre capital."}
            </p>
          </div>
        </div>

        {/* Projections AI Section */}
        <div className="md:col-span-6 glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between hover:border-violet-200/60 transition-all">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Activity size={18} className="text-[#7c3aed]" />
              Projeções AI
            </h3>
            <p className="text-xs text-[#6b617c] mb-4">
              A inteligência simula seu crescimento patrimonial e independência financeira com base na sua sobra de caixa real.
            </p>
            
            <div className="p-4 bg-[#ffffff] rounded-xl border border-[#c4b5d6]/40 space-y-2">
              <div className="flex items-center gap-3">
                <ShieldCheck size={18} className="text-[#15803d]" />
                <p className="text-xs text-slate-900 font-semibold">Pronto para iniciar sua carteira</p>
              </div>
              <p className="text-xs text-[#6b617c] leading-relaxed">
                Suas receitas mensais somam R$ 23.350,00. Conforme você destinar parcelas da sobra para investimentos, o Wealth AI calculará a evolução para Renda Passiva.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
