import React from "react";
import { Bell, Search, Sparkles, LogOut } from "lucide-react";
import { USER_PROFILE } from "../data";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showSearch?: boolean;
  onSearchClick?: () => void;
  onNotificationClick?: () => void;
  onSparklesClick?: () => void;
  onLogoutClick?: () => void;
}

export default function Header({
  title,
  showSearch = true,
  onSearchClick,
  onNotificationClick,
  onSparklesClick,
  onLogoutClick,
}: HeaderProps) {
  return (
    <header className="bg-[#ffffff]/80 backdrop-blur-xl sticky top-0 z-50 border-b border-[#c4b5d6]/10 flex justify-between items-center w-full px-6 py-4">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full overflow-hidden border border-[#7c3aed]/20">
          <img
            className="w-full h-full object-cover"
            alt={USER_PROFILE.name}
            src={USER_PROFILE.avatar}
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-sans text-xl font-bold text-slate-900 tracking-tight">{title}</span>
            <span className="text-[10px] bg-[#15803d]/10 text-[#15803d] border border-[#15803d]/20 font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#15803d] animate-pulse"></span>
              Nuvem Online
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-5">
        {showSearch && (
          <button
            onClick={onSearchClick}
            className="text-[#51465f] hover:text-slate-900 transition-colors active:scale-95 cursor-pointer"
            aria-label="Pesquisar"
          >
            <Search size={22} strokeWidth={2} />
          </button>
        )}
        <button
          onClick={onNotificationClick}
          className="text-[#51465f] hover:text-slate-900 transition-colors active:scale-95 relative cursor-pointer"
          aria-label="Notificações"
        >
          <Bell size={22} strokeWidth={2} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-[#7c3aed] rounded-full animate-ping"></span>
          <span className="absolute top-0 right-0 w-2 h-2 bg-[#7c3aed] rounded-full"></span>
        </button>
        {onSparklesClick && (
          <button
            onClick={onSparklesClick}
            className="text-[#7c3aed] hover:text-slate-900 transition-colors active:scale-95 cursor-pointer"
            aria-label="Ação Especial"
          >
            <Sparkles size={22} className="animate-pulse" />
          </button>
        )}
        {onLogoutClick && (
          <button
            onClick={onLogoutClick}
            className="text-rose-700/80 hover:text-rose-700 transition-colors active:scale-95 cursor-pointer"
            aria-label="Sair"
            title="Bloquear Aplicativo"
          >
            <LogOut size={20} strokeWidth={2} />
          </button>
        )}
      </div>
    </header>
  );
}
