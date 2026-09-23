import React, { useState } from "react";
import { Landmark, Shield, RefreshCw, ChevronRight, Plus, X, Lock, ExternalLink, FileSpreadsheet, UploadCloud, AlertTriangle } from "lucide-react";
import { BankConnection } from "../types";

interface ConnectionsViewProps {
  connections: BankConnection[];
  onAddConnection: (bankName: string, logoUrl: string) => void;
  onOpenImportModal?: () => void;
}

export default function ConnectionsView({
  connections,
  onAddConnection,
  onOpenImportModal,
}: ConnectionsViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const availableBanks = [
    {
      name: "Banco do Brasil",
      logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuB3OkSuFSDT3n22pGxR0OIIvT1vv2qChqLBAEW3gRQS4kx1vjkKshOB9Y4xnPjSRaD818m846_cX-tGpWWpIqORDpsuUT_ZRIhVHGRsOEc2UQfF4vRmx6L3C1xTVti0TypkJZDF_gnVjo7DTcxMjMPX3VgAKctq3P3SPCln2c3GEWRyozPG4vLleoR66WpKgkHmyMyaEy1sMto48jSDjtObLYK4P3U37ltnqOTtq83F2jp8KqZmwFs7IA", // placeholder
      color: "bg-yellow-500",
    },
    {
      name: "Bradesco",
      logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuABwJqGSHi9wc3yYYTfMiPcXfiM7y2OyO_wx8UdDcJtOAAiR8pBd9zEzCdPAdsDX8kLCcQ8EdSykEl6BHPk1U5e7ARoAi3_zIbbSPByrTcw3U12HO1D2WjK5s7M4G-OFVcq8J02_qMun8-OBVjOFqts5gvipsGfCTg0yQ3_ylxq2sVs_gmQYdnkM_VwSxAKxZ5AFq_1eXgCe1uqo4LoNwJE8WgigBib2y0acQSKMik7fhHY3marrMkZzg", // placeholder
      color: "bg-red-600",
    },
    {
      name: "BTG Pactual",
      logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuBKDE2hHpMLYB49RTGATc48ZYGpBxdS2mt8AsroZKzczjW00Rbm07E6Qn3SGDEdXdYxwFXOdNMVDFSdLkB0ERO9lhw6bVpMbkhWf9agtmLY3YnbnclKsDOF_rVpmiT_ULRv7Bq9pXy2_FPqzs0rnHX1HxKjuYRy2QVfVSemL4PCm9jfsRZnLR-K-zT6LzKfioyaFVWvWPfEew4E_AwDN3Qlolsl-F_LvKbwNY8qd8ACC-1gSgdcTnmZ2Q", // placeholder
      color: "bg-blue-900",
    },
  ];

  const handleConnect = () => {
    if (!selectedBank) return;

    setIsSyncing(true);
    // Simulate secure handshakes
    setTimeout(() => {
      onAddConnection(
        selectedBank,
        selectedBank === "BTG Pactual"
          ? "https://lh3.googleusercontent.com/aida-public/AB6AXuBKDE2hHpMLYB49RTGATc48ZYGpBxdS2mt8AsroZKzczjW00Rbm07E6Qn3SGDEdXdYxwFXOdNMVDFSdLkB0ERO9lhw6bVpMbkhWf9agtmLY3YnbnclKsDOF_rVpmiT_ULRv7Bq9pXy2_FPqzs0rnHX1HxKjuYRy2QVfVSemL4PCm9jfsRZnLR-K-zT6LzKfioyaFVWvWPfEew4E_AwDN3Qlolsl-F_LvKbwNY8qd8ACC-1gSgdcTnmZ2Q"
          : selectedBank === "Banco do Brasil"
          ? "https://lh3.googleusercontent.com/aida-public/AB6AXuB3OkSuFSDT3n22pGxR0OIIvT1vv2qChqLBAEW3gRQS4kx1vjkKshOB9Y4xnPjSRaD818m846_cX-tGpWWpIqORDpsuUT_ZRIhVHGRsOEc2UQfF4vRmx6L3C1xTVti0TypkJZDF_gnVjo7DTcxMjMPX3VgAKctq3P3SPCln2c3GEWRyozPG4vLleoR66WpKgkHmyMyaEy1sMto48jSDjtObLYK4P3U37ltnqOTtq83F2jp8KqZmwFs7IA"
          : "https://lh3.googleusercontent.com/aida-public/AB6AXuABwJqGSHi9wc3yYYTfMiPcXfiM7y2OyO_wx8UdDcJtOAAiR8pBd9zEzCdPAdsDX8kLCcQ8EdSykEl6BHPk1U5e7ARoAi3_zIbbSPByrTcw3U12HO1D2WjK5s7M4G-OFVcq8J02_qMun8-OBVjOFqts5gvipsGfCTg0yQ3_ylxq2sVs_gmQYdnkM_VwSxAKxZ5AFq_1eXgCe1uqo4LoNwJE8WgigBib2y0acQSKMik7fhHY3marrMkZzg"
      );
      setIsSyncing(false);
      setSelectedBank(null);
      setIsModalOpen(false);
    }, 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Intro Description */}
      <header className="space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Instituições</h2>
        <p className="text-[#6b617c] text-sm">
          Gerencie e unifique todas as suas contas através do Open Finance com segurança de grau militar.
        </p>
      </header>

      {/* Demo disclaimer: this screen does not perform any real bank connection yet */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
        <AlertTriangle size={18} className="text-amber-700 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-amber-700">Tela de demonstração</p>
          <p className="text-[11px] text-amber-200/80 mt-0.5 leading-relaxed">
            A conexão com bancos abaixo é uma simulação (não usa Open Finance real e não lê dados de nenhum banco).
            Para lançar seus dados reais, use <strong>Importar Extrato</strong> ou cadastre a transação manualmente na aba Extrato.
          </p>
        </div>
      </div>

      {/* Connectivity Status Card */}
      <section className="glass-card rounded-2xl p-6 relative overflow-hidden hover:border-violet-200/60 transition-all">
        <div className="absolute top-0 right-0 p-4">
          <span className="flex items-center gap-2 px-3 py-1 bg-amber-500/15 border border-amber-500/30 rounded-full">
            <span className="text-[9px] font-bold text-amber-700 uppercase tracking-widest font-mono">Simulado</span>
          </span>
        </div>

        <div className="flex items-start gap-4 mb-6 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-[#7c3aed]/10 border border-[#7c3aed]/20 flex items-center justify-center text-[#7c3aed]">
            <RefreshCw size={22} className="animate-spin" style={{ animationDuration: "12s" }} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Sincronização (Demonstração)</h3>
            <p className="text-xs text-[#6b617c] font-mono mt-0.5">Open Finance v3.0 — nenhuma conexão real está ativa</p>
          </div>
        </div>

        {/* Grid of active data streams */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { name: "Extrato", status: "active" },
            { name: "Pix", status: "active" },
            { name: "TED", status: "active" },
            { name: "Cartão", status: "active" },
            { name: "Investimentos", status: "active" },
            { name: "Crypto", status: "coming_soon" },
          ].map((item, idx) => {
            const isComing = item.status === "coming_soon";
            return (
              <div
                key={idx}
                className={`bg-[#f8f6fc] border border-violet-200/60 rounded-xl p-3 flex flex-col gap-1 transition-all ${
                  isComing ? "opacity-40" : "hover:border-violet-200/60"
                }`}
              >
                <span className="text-[9px] font-bold text-[#6b617c] uppercase tracking-wider">{item.name}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-semibold ${isComing ? "text-[#6b617c] italic" : "text-amber-700"}`}>
                    {isComing ? "Em breve" : "Demonstração"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Automated Statement Importer Section */}
      {onOpenImportModal && (
        <section className="glass-card rounded-2xl p-6 border border-[#7c3aed]/20 bg-gradient-to-r from-[#7c3aed]/10 via-[#f8f6fc] to-[#f8f6fc] relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#7c3aed] text-white flex items-center justify-center shrink-0 shadow-lg shadow-[#7c3aed]/20">
                <UploadCloud size={24} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-slate-900">Importador Automatizado de Extrato</h4>
                  <span className="text-[9px] font-mono uppercase bg-[#15803d]/20 border border-[#15803d]/30 text-[#15803d] px-2 py-0.5 rounded-full font-bold">
                    IA & OCR
                  </span>
                </div>
                <p className="text-xs text-[#6b617c]">
                  Arraste faturas em PDF, arquivos OFX ou CSV do seu banco para ler, categorizar e lançar transações no seu fluxo de caixa em segundos.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenImportModal}
              className="px-5 py-3 bg-[#7c3aed] text-white rounded-xl font-bold text-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-lg shadow-[#7c3aed]/10 shrink-0 flex items-center justify-center gap-2"
            >
              <FileSpreadsheet size={16} />
              <span>Importar Arquivo / PDF</span>
            </button>
          </div>
        </section>
      )}

      {/* Connected Banks List */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h4 className="text-xs font-bold text-[#6b617c] uppercase tracking-widest">Bancos Conectados (Demonstração)</h4>
        </div>

        <div className="space-y-3">
          {connections.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 text-center text-[#6b617c] text-xs">
              Nenhuma instituição de demonstração adicionada ainda. Para dados reais, use Importar Extrato ou cadastre a transação manualmente na aba Extrato.
            </div>
          ) : (
            connections.map((bank) => (
              <div
                key={bank.id}
                className="glass-card rounded-2xl p-5 flex items-center justify-between border-violet-200/60 hover:border-violet-200/60 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center p-2.5 shadow-xl shadow-black/40 border border-violet-200/60 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                    <img className="w-full h-full object-contain" alt={bank.name} src={bank.logo} referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 group-hover:text-[#7c3aed] transition-colors">{bank.name}</h5>
                    <p className="text-xs text-[#6b617c] font-mono mt-0.5">{bank.lastSynced}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#15803d] shadow-[0_0_8px_rgba(78,222,163,0.4)] animate-pulse"></span>
                  <ChevronRight size={18} className="text-[#6b617c]" />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Primary Connect CTA */}
      <section className="space-y-4 pt-4">
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full h-14 bg-[#7c3aed] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-[#7c3aed]/10 cursor-pointer text-sm"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Conectar Novo Banco (Demonstração)</span>
        </button>
        <div className="flex items-center justify-center gap-1.5 text-[#6b617c] text-xs font-semibold">
          <Lock size={12} />
          <span>Nenhum dado bancário real é acessado nesta simulação.</span>
        </div>
      </section>

      {/* Connect Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#ffffff] border border-[#c4b5d6]/50 rounded-2xl shadow-2xl p-6 space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Landmark size={20} className="text-[#7c3aed]" />
                Conexão Open Finance (Demonstração)
              </h3>
              <button
                onClick={() => {
                  if (!isSyncing) setIsModalOpen(false);
                }}
                className="text-[#6b617c] hover:text-slate-900 p-1 rounded-full hover:bg-violet-50 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {isSyncing ? (
              <div className="py-8 flex flex-col items-center gap-4 text-center">
                <RefreshCw size={40} className="text-[#7c3aed] animate-spin" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900">Simulando conexão com {selectedBank}...</p>
                  <p className="text-xs text-[#6b617c]">Nenhum dado real está sendo transmitido</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-[#51465f] leading-relaxed">
                  Simulação: nenhuma conexão real é feita com o banco selecionado, e nenhum dado de saldo/fatura é importado de verdade. Use <strong>Importar Extrato</strong> na tela de Extrato para lançar dados reais.
                </p>

                <div className="space-y-2">
                  {availableBanks.map((bank, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedBank(bank.name)}
                      className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        selectedBank === bank.name
                          ? "bg-[#7c3aed]/10 border-[#7c3aed] text-slate-900"
                          : "bg-[#f8f6fc] border-[#c4b5d6]/40 text-[#51465f] hover:border-[#7c3aed]/30"
                      }`}
                    >
                      <span className="text-sm font-bold">{bank.name}</span>
                      <ExternalLink size={14} className="opacity-50" />
                    </button>
                  ))}
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 border border-[#c4b5d6]/60 text-[#51465f] hover:bg-violet-50 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConnect}
                    disabled={!selectedBank}
                    className="flex-1 py-3 bg-[#7c3aed] text-white hover:opacity-90 rounded-xl font-bold text-xs disabled:opacity-30 cursor-pointer"
                  >
                    Simular Conexão
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
