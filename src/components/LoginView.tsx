import React, { useState } from "react";
import { ShieldCheck, Eye, EyeOff, Bot, Sparkles, Fingerprint } from "lucide-react";
import { USER_PROFILE } from "../data";

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [loginMethod, setLoginMethod] = useState<"pin" | "password">("pin");
  
  // PIN state
  const [pin, setPin] = useState<string[]>([]);
  const [pinError, setPinError] = useState(false);
  
  // Password state
  const [email, setEmail] = useState(USER_PROFILE.email);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const correctPin = "7867";
  const correctPassword = "admin";

  const handlePinClick = (num: string) => {
    if (pin.length >= 4) return;
    setPinError(false);
    
    const newPin = [...pin, num];
    setPin(newPin);

    // Auto-verify when 4 digits are completed
    if (newPin.length === 4) {
      const pinStr = newPin.join("");
      if (pinStr === correctPin) {
        setTimeout(() => {
          onLoginSuccess();
        }, 300);
      } else {
        setTimeout(() => {
          setPinError(true);
          setPin([]); // Clear PIN on error
        }, 400);
      }
    }
  };

  const handleBackspace = () => {
    if (pin.length === 0) return;
    setPin(pin.slice(0, -1));
    setPinError(false);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === correctPassword) {
      onLoginSuccess();
    } else {
      setPasswordError("Senha incorreta. Use 'admin' para testar.");
    }
  };

  const handleBiometricClick = () => {
    // Elegant immediate login with FaceID simulation
    onLoginSuccess();
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

      {/* Switch between PIN & Password */}
      <div className="w-full max-w-sm flex flex-col items-center space-y-8">
        
        {/* Method selector */}
        <div className="grid grid-cols-2 bg-[#1c1b1b] p-1 rounded-full border border-[#353534]/50 w-64">
          <button
            onClick={() => {
              setLoginMethod("pin");
              setPin([]);
              setPinError(false);
            }}
            className={`py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
              loginMethod === "pin" ? "bg-[#adc6ff] text-[#002e69]" : "text-[#8b90a0]"
            }`}
          >
            Código PIN
          </button>
          <button
            onClick={() => {
              setLoginMethod("password");
              setPasswordError("");
            }}
            className={`py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
              loginMethod === "password" ? "bg-[#adc6ff] text-[#002e69]" : "text-[#8b90a0]"
            }`}
          >
            Senha
          </button>
        </div>

        {/* PIN Screen */}
        {loginMethod === "pin" && (
          <div className="w-full space-y-8 flex flex-col items-center">
            <div className="text-center space-y-2">
              <p className="text-xs text-[#8b90a0] font-semibold tracking-wider">Digite seu PIN de Acesso</p>
              
              {/* Dots representation */}
              <div className="flex justify-center gap-4 py-4">
                {[0, 1, 2, 3].map((dotIdx) => {
                  const filled = pin.length > dotIdx;
                  return (
                    <div
                      key={dotIdx}
                      className={`w-4.5 h-4.5 rounded-full border-2 transition-all duration-200 ${
                        pinError
                          ? "bg-rose-500 border-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-shake"
                          : filled
                          ? "bg-[#4edea3] border-[#4edea3] shadow-[0_0_12px_rgba(78,222,163,0.4)]"
                          : "border-[#353534] bg-[#0c0c0c]"
                      }`}
                    ></div>
                  );
                })}
              </div>

              {pinError ? (
                <p className="text-xs text-rose-400 font-medium">PIN incorreto. Dica: Use '7867'</p>
              ) : (
                <p className="text-[10px] text-[#8b90a0] italic">Dica de teste: 7867</p>
              )}
            </div>

            {/* Custom PIN Num-pad */}
            <div className="grid grid-cols-3 gap-y-4 gap-x-8 max-w-xs mx-auto">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  onClick={() => handlePinClick(num)}
                  className="w-16 h-16 rounded-full border border-[#353534]/40 bg-[#0c0c0c]/80 flex items-center justify-center font-mono text-xl font-bold text-white hover:bg-[#adc6ff]/10 hover:border-[#adc6ff]/20 active:scale-90 transition-all cursor-pointer"
                >
                  {num}
                </button>
              ))}
              
              {/* Biometrics option button */}
              <button
                onClick={handleBiometricClick}
                className="w-16 h-16 rounded-full bg-[#1c1b1b]/30 flex items-center justify-center text-[#adc6ff] hover:bg-[#adc6ff]/10 active:scale-95 transition-all cursor-pointer border border-[#353534]/15"
                title="FaceID / Digital"
              >
                <Fingerprint size={24} />
              </button>

              <button
                onClick={() => handlePinClick("0")}
                className="w-16 h-16 rounded-full border border-[#353534]/40 bg-[#0c0c0c]/80 flex items-center justify-center font-mono text-xl font-bold text-white hover:bg-[#adc6ff]/10 hover:border-[#adc6ff]/20 active:scale-90 transition-all cursor-pointer"
              >
                0
              </button>

              <button
                onClick={handleBackspace}
                className="w-16 h-16 rounded-full bg-[#1c1b1b]/30 flex items-center justify-center text-[#8b90a0] hover:text-white hover:bg-[#1c1b1b] active:scale-90 transition-all cursor-pointer border border-[#353534]/15"
              >
                ←
              </button>
            </div>
          </div>
        )}

        {/* Password Screen */}
        {loginMethod === "password" && (
          <form onSubmit={handlePasswordSubmit} className="w-full space-y-4 text-left max-w-xs">
            <div className="space-y-1">
              <label className="text-[10px] text-[#8b90a0] font-semibold uppercase tracking-wider pl-1">E-mail Corporativo</label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full bg-[#1c1b1b] border border-[#353534]/50 rounded-xl px-4 py-3 text-sm text-[#8b90a0] cursor-not-allowed outline-none font-mono"
              />
            </div>

            <div className="space-y-1 relative">
              <label className="text-[10px] text-[#8b90a0] font-semibold uppercase tracking-wider pl-1">Senha de Acesso</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Ex: admin"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError("");
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

            {passwordError && (
              <p className="text-xs text-rose-400 font-medium pl-1">{passwordError}</p>
            )}

            <p className="text-[10px] text-[#8b90a0] text-center pt-2">Dica de teste: Use a senha <strong className="text-white font-mono">admin</strong></p>

            <button
              type="submit"
              className="w-full bg-[#adc6ff] text-[#002e69] py-3.5 rounded-xl font-bold text-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-lg shadow-[#adc6ff]/5 mt-4"
            >
              Autenticar Carteira
            </button>
          </form>
        )}

      </div>

      {/* Safety message & biometric fallback */}
      <div className="flex flex-col items-center space-y-4 max-w-xs text-center mt-8">
        <div className="flex items-center gap-1.5 text-xs text-[#8b90a0] font-semibold">
          <ShieldCheck size={14} className="text-[#4edea3]" />
          <span>Autenticação Unificada TLS 1.3</span>
        </div>
        <p className="text-[10px] text-[#8b90a0]/60 leading-normal">
          Seu acesso é protegido por chaves criptográficas em hardware e de acordo com a conformidade LGPD / ISO 27001.
        </p>
      </div>
      
    </div>
  );
}
