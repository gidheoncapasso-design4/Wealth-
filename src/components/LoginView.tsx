import React, { useState } from "react";
import { ShieldCheck, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  AuthError,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { USER_PROFILE } from "../data";

function translateAuthError(error: AuthError): string {
  switch (error.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "E-mail ou senha incorretos.";
    case "auth/too-many-requests":
      return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
    case "auth/invalid-email":
      return "Digite um e-mail válido.";
    case "auth/network-request-failed":
      return "Falha de conexão. Verifique sua internet.";
    default:
      return "Não foi possível entrar. Tente novamente em instantes.";
  }
}

export default function LoginView() {
  const [email, setEmail] = useState(USER_PROFILE.email || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResetMessage("");
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // No need to call any callback here: App.tsx listens to Firebase's
      // onAuthStateChanged and re-renders automatically once this resolves.
    } catch (err) {
      setError(translateAuthError(err as AuthError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setResetMessage("");
    if (!email.trim()) {
      setError("Digite seu e-mail acima para receber o link de redefinição de senha.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetMessage("Enviamos um link de redefinição de senha para o seu e-mail.");
    } catch (err) {
      setError(translateAuthError(err as AuthError));
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-between items-center px-6 py-12 text-[#e5e2e1] select-none animate-fade-in relative overflow-hidden">

      {/* Glow ambient background assets */}
      <div className="absolute top-1/4 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-[#4edea3]/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>

      {/* Brand logo & title */}
      <div className="flex flex-col items-center mt-8 space-y-3">
        <div className="w-16 h-16 rounded-3xl bg-[#adc6ff]/10 border border-[#adc6ff]/20 flex items-center justify-center text-[#adc6ff] shadow-lg shadow-[#adc6ff]/5 relative">
          <ShieldCheck size={32} strokeWidth={1.5} />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#4edea3] rounded-full"></span>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tighter text-white uppercase">Wealth</h1>
          <p className="text-[10px] font-bold text-[#8b90a0] uppercase tracking-[0.25em] mt-1">Sovereign Management</p>
        </div>
      </div>

      {/* Real Firebase Authentication form */}
      <div className="w-full max-w-sm flex flex-col items-center space-y-6">
        <form onSubmit={handleSubmit} className="w-full space-y-4 text-left">
          <div className="space-y-1">
            <label className="text-[10px] text-[#8b90a0] font-semibold uppercase tracking-wider pl-1">E-mail</label>
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="seuemail@gmail.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
                setResetMessage("");
              }}
              className="w-full bg-[#1c1b1b] border border-[#353534]/50 rounded-xl px-4 py-3 text-sm text-white focus:border-[#adc6ff] outline-none font-mono"
            />
          </div>

          <div className="space-y-1 relative">
            <label className="text-[10px] text-[#8b90a0] font-semibold uppercase tracking-wider pl-1">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                  setResetMessage("");
                }}
                className="w-full bg-[#1c1b1b] border border-[#353534]/50 rounded-xl pl-4 pr-10 py-3 text-sm text-white focus:border-[#adc6ff] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b90a0] hover:text-white p-0.5 cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {resetMessage && (
            <div className="flex items-start gap-2 p-3 bg-[#4edea3]/10 border border-[#4edea3]/20 rounded-xl text-xs text-[#4edea3]">
              <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
              <span>{resetMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#adc6ff] text-[#002e69] py-3.5 rounded-xl font-bold text-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-lg shadow-[#adc6ff]/5 mt-4 disabled:opacity-50"
          >
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>

          <button
            type="button"
            onClick={handleForgotPassword}
            className="w-full text-center text-[11px] text-[#8b90a0] hover:text-white transition-colors cursor-pointer pt-1"
          >
            Esqueci minha senha
          </button>
        </form>
      </div>

      {/* Safety message */}
      <div className="flex flex-col items-center space-y-4 max-w-xs text-center mt-8">
        <div className="flex items-center gap-1.5 text-xs text-[#8b90a0] font-semibold">
          <ShieldCheck size={14} className="text-[#4edea3]" />
          <span>Autenticado via Firebase Authentication</span>
        </div>
        <p className="text-[10px] text-[#8b90a0]/60 leading-normal">
          O acesso aos seus dados financeiros é restrito exclusivamente à sua conta.
        </p>
      </div>

    </div>
  );
}
