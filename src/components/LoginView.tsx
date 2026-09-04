import React, { useState } from "react";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { signInWithPopup, GoogleAuthProvider, type AuthError } from "firebase/auth";
import { auth } from "../lib/firebase";

const googleProvider = new GoogleAuthProvider();

function translateAuthError(error: AuthError): string {
  switch (error.code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return ""; // user just closed the popup, not a real error
    case "auth/popup-blocked":
      return "Seu navegador bloqueou a janela de login. Permita pop-ups para este site e tente novamente.";
    case "auth/network-request-failed":
      return "Falha de conexão. Verifique sua internet.";
    default:
      return "Não foi possível entrar. Tente novamente em instantes.";
  }
}

// Google G logo (brand mark, not available in lucide-react's generic icon set)
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.38z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.62l4 3.1C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}

export default function LoginView() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // No need to call any callback here: App.tsx listens to Firebase's
      // onAuthStateChanged and re-renders automatically once this resolves.
    } catch (err) {
      setError(translateAuthError(err as AuthError));
    } finally {
      setIsSubmitting(false);
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

      {/* Google Sign-In */}
      <div className="w-full max-w-sm flex flex-col items-center space-y-4">
        {error && (
          <div className="w-full flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
          className="w-full bg-white text-[#1f1f1f] py-3.5 rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <GoogleIcon />
          <span>{isSubmitting ? "Entrando..." : "Entrar com o Google"}</span>
        </button>
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
