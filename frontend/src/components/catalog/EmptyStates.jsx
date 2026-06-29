import React from "react";
import { Telescope, WifiOff, AlertTriangle, Search, Compass } from "lucide-react";

export function NoResultsState({ onReset }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6 bg-[#070b20]/10 border border-white/5 rounded-2xl w-full">
      <div className="w-14 h-14 rounded-full bg-[#0d1530] flex items-center justify-center border border-white/10 mb-4 animate-bounce">
        <Search className="w-6 h-6 text-sc-gold" />
      </div>
      <h3 className="font-display text-lg text-white font-medium mb-2">Arama Sonucu Bulunamadı</h3>
      <p className="text-xs text-[#8fa0c4] max-w-sm mb-6 leading-relaxed">
        Kriterlerinize uygun hiçbir yıldız bulunamadı. Filtreleri temizlemeyi veya farklı bir arama terimi girmeyi deneyebilirsiniz.
      </p>
      {onReset && (
        <button
          onClick={onReset}
          className="px-5 py-2.5 rounded-lg bg-sc-gold hover:bg-sc-gold/90 text-[#050814] text-xs font-mono font-bold uppercase tracking-widest transition-all"
        >
          Aramayı Sıfırla
        </button>
      )}
    </div>
  );
}

export function OfflineState({ onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6 bg-[#070b20]/10 border border-white/5 rounded-2xl w-full">
      <div className="w-14 h-14 rounded-full bg-[#3b1c1c]/40 flex items-center justify-center border border-red-500/20 mb-4 animate-pulse">
        <WifiOff className="w-6 h-6 text-red-400" />
      </div>
      <h3 className="font-display text-lg text-white font-medium mb-2">Bağlantı Hatası</h3>
      <p className="text-xs text-[#8fa0c4] max-w-sm mb-6 leading-relaxed">
        Kozmik veri merkezine bağlanılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-5 py-2.5 rounded-lg border border-white/10 hover:border-white/20 text-white text-xs font-mono font-bold uppercase tracking-widest transition-all"
        >
          Yeniden Bağlan
        </button>
      )}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6 bg-[#070b20]/10 border border-white/5 rounded-2xl w-full">
      <div className="w-14 h-14 rounded-full bg-[#3b2b1c]/40 flex items-center justify-center border border-amber-500/20 mb-4">
        <AlertTriangle className="w-6 h-6 text-amber-400" />
      </div>
      <h3 className="font-display text-lg text-white font-medium mb-2">Veri Alınamadı</h3>
      <p className="text-xs text-[#8fa0c4] max-w-sm mb-6 leading-relaxed">
        {message || "Yıldız verileri yüklenirken beklenmedik bir hata oluştu. Lütfen daha sonra tekrar deneyin."}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-5 py-2.5 rounded-lg bg-[#0f1737] hover:bg-[#16214d] text-white text-xs font-mono font-bold uppercase tracking-widest transition-all"
        >
          Tekrar Dene
        </button>
      )}
    </div>
  );
}

export function SearchingState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 w-full">
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-full border border-sc-gold/20 border-t-sc-gold animate-spin" />
        <Telescope className="w-6 h-6 text-sc-gold absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <div className="text-xs tracking-[0.2em] text-sc-gold font-mono uppercase font-bold">Deep Space Taraması Yapılıyor...</div>
      <p className="text-[10px] text-[#8fa0c4]/60 font-mono mt-2">Katalog verileri çözümleniyor.</p>
    </div>
  );
}

export function WelcomeCatalogState({ onStart }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6 bg-[#070b20]/10 border border-white/5 rounded-2xl w-full">
      <div className="w-14 h-14 rounded-full bg-[#0d1530] flex items-center justify-center border border-white/10 mb-4">
        <Compass className="w-6 h-6 text-sc-gold" />
      </div>
      <h3 className="font-display text-lg text-white font-medium mb-2">Kozmik Kaşif Kataloğu</h3>
      <p className="text-xs text-[#8fa0c4] max-w-sm mb-6 leading-relaxed">
        Tüm evren parmaklarınızın ucunda. Arama kutusunu kullanarak veya soldaki gelişmiş filtreleri uygulayarak keşfetmeye başlayın.
      </p>
      {onStart && (
        <button
          onClick={onStart}
          className="px-5 py-2.5 rounded-lg bg-sc-gold hover:bg-sc-gold/90 text-[#050814] text-xs font-mono font-bold uppercase tracking-widest transition-all"
        >
          Kataloğu Listele
        </button>
      )}
    </div>
  );
}
