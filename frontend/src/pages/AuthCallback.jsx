import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Loader2, Star } from "lucide-react";

export default function AuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const processedRef = React.useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const hash = location.hash || window.location.hash;
    const match = hash.match(/session_id=([^&]+)/);
    const sessionId = match ? decodeURIComponent(match[1]) : null;

    if (!sessionId) {
      navigate("/");
      return;
    }

    (async () => {
      try {
        const { data } = await api.post("/auth/session", { session_id: sessionId });
        setUser(data);
        // Clean URL fragment
        window.history.replaceState({}, document.title, "/dashboard");
        navigate("/dashboard", { state: { user: data }, replace: true });
      } catch (e) {
        navigate("/", { replace: true });
      }
    })();
  }, [location.hash, navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-sc-deep">
      <div className="text-center">
        <Star className="w-10 h-10 text-sc-gold fill-sc-gold mx-auto mb-4 animate-pulse" />
        <div className="flex items-center justify-center gap-2 text-sc-text-muted">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="font-accent italic">Gökyüzü seninle konuşuyor...</span>
        </div>
      </div>
    </div>
  );
}
