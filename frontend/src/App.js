import React, { Suspense, lazy, useEffect, useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import "@/App.css";
import { Toaster, toast } from "sonner";

import { AuthProvider } from "./lib/auth";
import { LanguageProvider } from "./lib/i18n";
import { api } from "./lib/api";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LiveNotifications from "./components/LiveNotifications";
import CheckoutModal from "./components/CheckoutModal";
import AegisTerminal from "./components/AegisTerminal";

import StarCanvas from "./components/StarCanvas";
import AegisHUD from "./components/AegisHUD/AegisHUD";
import ErrorBoundary from "./components/ui/ErrorBoundary";

const Home = lazy(() => import("./pages/Home"));
const StarPicker = lazy(() => import("./pages/StarPicker"));
const Cosmos = lazy(() => import("./pages/Cosmos"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const Stories = lazy(() => import("./pages/Stories"));
const About = lazy(() => import("./pages/About"));
const Vision = lazy(() => import("./pages/Vision"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCancel = lazy(() => import("./pages/PaymentCancel"));
const PublicStar = lazy(() => import("./pages/PublicStar"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

const VaultWithWallet = lazy(async () => {
  const [{ default: SolanaWalletProvider }, { default: Vault }] = await Promise.all([
    import("./lib/SolanaWalletProvider"),
    import("./pages/Vault"),
  ]);

  return {
    default: function VaultRoute() {
      return (
        <SolanaWalletProvider>
          <Vault />
        </SolanaWalletProvider>
      );
    },
  };
});

const DashboardWithWallet = lazy(async () => {
  const [{ default: SolanaWalletProvider }, { default: Dashboard }] = await Promise.all([
    import("./lib/SolanaWalletProvider"),
    import("./pages/Dashboard"),
  ]);

  return {
    default: function DashboardRoute() {
      return (
        <SolanaWalletProvider>
          <Dashboard />
        </SolanaWalletProvider>
      );
    },
  };
});

function PageLoading() {
  return (
    <div className="min-h-[60vh] bg-sc-deep flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 rounded-full border-2 border-sc-gold/30 border-t-sc-gold animate-spin" />
        <p className="text-[10px] uppercase tracking-[0.3em] text-sc-gold">StarClaim Loading</p>
      </div>
    </div>
  );
}

function AppShell() {
  const location = useLocation();
  const isCosmosRoute = location.pathname === "/cosmos";
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [activeStar, setActiveStar] = useState(null);
  const [stats, setStats] = useState(null);
  const [showHUD, setShowHUD] = useState(() => {
    const hasSeenHUD = sessionStorage.getItem("aegis_hud_seen");
    const forceHUD = new URLSearchParams(window.location.search).get("hud");
    if (forceHUD === "1") return true;
    if (hasSeenHUD) return false;
    // Temporarily disabled HUD by default to fix black screen issue
    return false; 
  });

  useEffect(() => {
    // Phase 5.3: Aegis Persistence (Wake-up Ping)
    // Minimizes Render.com cold-start delay for visitors
    api.get("/").catch(() => {});

    api.get("/stats/overview")
      .then(({ data }) => {
        if (data && typeof data === 'object') setStats(data);
      })
      .catch(() => {});
  }, []);

  const openClaim = useCallback((star) => {
    if (!star) {
      api.get("/stars", { params: { tier: "legendary", limit: 5 } })
        .then(({ data }) => {
          if (data && data.length > 0) {
            const available = data.find(s => !s.owner_id);
            setActiveStar(available || data[0]);
            setCheckoutOpen(true);
          } else {
            api.get("/stars", { params: { limit: 1 } })
              .then((res) => {
                if (res.data && res.data.length > 0) {
                   setActiveStar(res.data[0]);
                   setCheckoutOpen(true);
                } else {
                   toast.error("Yıldızlar şu an yüklenemedi.");
                }
              });
          }
        })
        .catch((err) => {
          console.error("Claim fetch error:", err);
          toast.error("Bağlantı hatası.");
        });
      return;
    }
    setActiveStar(star);
    setCheckoutOpen(true);
  }, []);

  if (location.hash && location.hash.includes("session_id=")) {
    return <AuthCallback />;
  }

  if (showHUD) {
    return (
      <ErrorBoundary fallback={
        <div className="flex flex-col items-center justify-center h-screen bg-sc-deep text-center p-6">
          <h2 className="text-sc-gold font-display text-2xl mb-4">Neural Link Calibration Failed</h2>
          <p className="text-sc-text-muted mb-8 max-w-md">The holographic HUD encountered a rendering error. You can still access the platform directly.</p>
          <button 
            onClick={() => setShowHUD(false)} 
            className="btn-gold"
          >
            Enter StarClaim Directly
          </button>
        </div>
      }>
        <AegisHUD 
          onComplete={() => {
            setShowHUD(false);
            sessionStorage.setItem("aegis_hud_seen", "true");
          }} 
        />
      </ErrorBoundary>
    );
  }

  return (
    <>
      {!isCosmosRoute && (
        <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
          <StarCanvas density={500} />
        </div>
      )}
      <Navbar onOpenClaim={() => openClaim()} />
      <Suspense fallback={<PageLoading />}>
        <div className="relative z-10">
          <Routes>
            <Route path="/" element={<Home onOpenClaim={() => openClaim()} stats={stats} />} />
            <Route path="/stars" element={<StarPicker onClaim={openClaim} />} />
            <Route path="/cosmos" element={<Cosmos onClaim={openClaim} />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/stories" element={<Stories />} />
            <Route path="/about" element={<About />} />
            <Route path="/vision" element={<Vision />} />
            <Route path="/vault" element={<VaultWithWallet />} />
            <Route path="/dashboard" element={<DashboardWithWallet />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/cancel" element={<PaymentCancel />} />
            <Route path="/star/:code" element={<PublicStar />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </div>
      </Suspense>
      {!isCosmosRoute && <Footer />}
      {!isCosmosRoute && <LiveNotifications />}
      <AegisTerminal />
      <CheckoutModal open={checkoutOpen} onOpenChange={setCheckoutOpen} star={activeStar} />
      <Toaster
        position="top-center"
        theme="dark"
        toastOptions={{
          style: { background: "#0F1F3D", color: "#F0F4FF", border: "1px solid rgba(201,168,76,0.3)" },
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <div className="App bg-black min-h-screen">
      <LanguageProvider>
        <BrowserRouter>
          <AuthProvider>
            <ErrorBoundary fallback={<div className="flex items-center justify-center h-screen text-sc-red font-display text-xl">Critical System Failure - Aegis Core Crash</div>}>
              <AppShell />
            </ErrorBoundary>
          </AuthProvider>
        </BrowserRouter>
      </LanguageProvider>
    </div>
  );
}
