import React, { useState, useEffect } from "react";
import QRCode from "qrcode.react";
import { v4 as uuidv4 } from "uuid";
import { X, Loader2, ShieldCheck, Zap } from "lucide-react";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";

export default function QRLoginModal({ isOpen, onClose }) {
  const [authSessionId] = useState(uuidv4());
  const [status, setStatus] = useState("initializing"); // initializing | waiting | success | error
  const { setUser, checkAuth } = useAuth();

  useEffect(() => {
    if (!isOpen) return;

    const wsUrl = `wss://starclaim-api.onrender.com/ws/auth/${authSessionId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setStatus("waiting");
    };

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "auth_success") {
        setStatus("success");
        // We need to set the session_token in cookie, but backend normally does this with Set-Cookie.
        // For local dev / cross-origin, we might need manual handling if Set-Cookie is blocked.
        // For now, assume backend handles it and we just refresh local state.
        setTimeout(async () => {
          await checkAuth();
          onClose();
        }, 1500);
      }
    };

    ws.onerror = () => setStatus("error");
    
    return () => ws.close();
  }, [isOpen, authSessionId, checkAuth, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-[#050b1a] border border-[#00ccff]/30 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,204,255,0.1)]">
        {/* Iron Man HUD Decorative Elements */}
        <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-[#00ccff]/50 rounded-tl-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-[#00ccff]/50 rounded-br-2xl pointer-events-none" />
        
        <div className="p-8 flex flex-col items-center">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          <h2 className="text-2xl font-black text-white tracking-widest mb-2">QUANTUM LOGIN</h2>
          <p className="text-[#00ccff] text-[10px] tracking-[4px] uppercase mb-8 opacity-70">Neural Handshake Protocol</p>

          <div className="relative p-4 bg-white rounded-xl mb-8 group">
            {status === "waiting" ? (
              <>
                <QRCode 
                  value={authSessionId} 
                  size={200} 
                  renderAs="svg"
                  includeMargin={true}
                  level="H"
                />
                <div className="absolute -inset-2 border border-[#00ccff]/20 rounded-2xl animate-pulse pointer-events-none" />
              </>
            ) : status === "success" ? (
              <div className="w-[200px] h-[200px] flex flex-col items-center justify-center bg-[#050b1a]">
                <ShieldCheck size={80} className="text-[#00ff88] animate-bounce" />
                <p className="text-[#00ff88] font-bold mt-4 tracking-widest">ENTANGLED</p>
              </div>
            ) : (
              <div className="w-[200px] h-[200px] flex items-center justify-center bg-[#050b1a]">
                <Loader2 size={40} className="text-[#00ccff] animate-spin" />
              </div>
            )}
          </div>

          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 text-white/80 text-sm">
              <Zap size={16} className="text-[#00ccff]" />
              <p>Scan with StarClaim Mobile App</p>
            </div>
            <p className="text-white/40 text-xs px-8">
              Open the StarClaim app on your mobile device, go to Neural Link, and scan this code to login instantly.
            </p>
          </div>

          <div className="mt-8 flex gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00ccff] animate-ping" />
            <div className="w-2 h-2 rounded-full bg-[#00ccff]/40" />
            <div className="w-2 h-2 rounded-full bg-[#00ccff]/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
