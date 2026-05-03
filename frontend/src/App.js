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
    console.log("openClaim called with:", star);
    if (!star) {
      console.log("No star provided, fetching random legendary...");
      api.get("/stars", { params: { available: true, tier: "legendary", sort: "price_desc", limit: 20 } })
        .then(({ data }) => {
          console.log("Legendary fetch response:", data);
          if (data && data.length > 0) {
            const picked = data[Math.floor(Math.random() * Math.min(5, data.length))];
            console.log("Picked star:", picked);
            setActiveStar(picked);
            setCheckoutOpen(true);
          } else {
            console.log("No available legendary stars, falling back to any available...");
            api.get("/stars", { params: { available: true, limit: 10 } })
              .then((res) => {
                console.log("Fallback fetch response:", res.data);
                if (res.data && res.data.length > 0) {
                   setActiveStar(res.data[0]);
                   setCheckoutOpen(true);
                } else {
                   toast.error("Şu an müsait yıldız bulunamadı. Lütfen daha sonra tekrar deneyin.");
                }
              });
          }
        })
        .catch((err) => {
          console.error("Critical: openClaim fetch failed:", err);
          toast.error("Yıldız verileri sunucudan alınamadı.");
        });
      return;
    }
    console.log("Setting provided star and opening modal");
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
