import React, { useEffect, useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import "@/App.css";
import { Toaster } from "sonner";

import { AuthProvider } from "./lib/auth";
import { LanguageProvider } from "./lib/i18n";
import { api } from "./lib/api";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LiveNotifications from "./components/LiveNotifications";
import CheckoutModal from "./components/CheckoutModal";

import Home from "./pages/Home";
import StarPicker from "./pages/StarPicker";
import Marketplace from "./pages/Marketplace";
import Stories from "./pages/Stories";
import About from "./pages/About";
import Vision from "./pages/Vision";
import Dashboard from "./pages/Dashboard";
import AuthCallback from "./pages/AuthCallback";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";

function AppShell() {
  const location = useLocation();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [activeStar, setActiveStar] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/stats/overview").then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  const openClaim = useCallback((star) => {
    if (!star) {
      // Step 1: Try getting any legendary star (even if owned, just to open modal)
      api.get("/stars", { params: { tier: "legendary", limit: 5 } })
        .then(({ data }) => {
          if (data && data.length > 0) {
            // Prefer an available one if exists
            const available = data.find(s => !s.owner_id);
            setActiveStar(available || data[0]);
            setCheckoutOpen(true);
          } else {
            // Step 2: Ultimate fallback to any star in the database
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

  // Handle OAuth callback synchronously (before normal routing)
  if (location.hash && location.hash.includes("session_id=")) {
    return <AuthCallback />;
  }

  return (
    <>
      <Navbar onOpenClaim={() => openClaim()} />
      <Routes>
        <Route path="/" element={<Home onOpenClaim={() => openClaim()} stats={stats} />} />
        <Route path="/stars" element={<StarPicker onClaim={openClaim} />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/stories" element={<Stories />} />
        <Route path="/about" element={<About />} />
        <Route path="/vision" element={<Vision />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancel" element={<PaymentCancel />} />
      </Routes>
      <Footer />
      <LiveNotifications />
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
    <div className="App bg-sc-deep min-h-screen">
      <LanguageProvider>
        <BrowserRouter>
          <AuthProvider>
            <AppShell />
          </AuthProvider>
        </BrowserRouter>
      </LanguageProvider>
    </div>
  );
}
