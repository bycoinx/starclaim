import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Star, Globe, LogOut, User, Menu, X, QrCode, ChevronDown, Check } from "lucide-react";
import { useT, LANGUAGES } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import QRLoginModal from "./QRLoginModal";

export default function Navbar({ onOpenClaim }) {
  const { t, lang, setLang } = useT();
  const { user, login, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const navigate = useNavigate();
  const langRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langRef.current && !langRef.current.contains(event.target)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const links = [
    { to: "/", label: t("nav_home") },
    { to: "/stars", label: t("nav_pick") },
    { to: "/marketplace", label: t("nav_market") },
    { to: "/vision", label: "StarVault" },
    { to: "/cosmos", label: "Cosmos" },
    { to: "/stories", label: t("nav_stories") },
    { to: "/about", label: t("nav_about") },
  ];

  return (
    <header
      data-testid="navbar"
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-[#050A1A]/85 backdrop-blur-xl border-b border-white/5" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group" data-testid="logo-link">
          <Star className="w-6 h-6 text-sc-gold fill-sc-gold group-hover:rotate-12 transition-transform" strokeWidth={1.5} />
          <span className="font-display text-2xl tracking-widest">
            Star<span className="gold-gradient-text">Claim</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              data-testid={`nav-${l.to.replace("/", "") || "home"}`}
              className={({ isActive }) =>
                `text-[14px] tracking-wide transition-colors ${
                  isActive ? "text-sc-gold" : "text-sc-text/80 hover:text-sc-text"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* LANGUAGE SELECTOR */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="hidden md:flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-sc-text-muted hover:text-sc-gold transition-colors mr-2 uppercase"
            >
              <Globe className="w-3.5 h-3.5" /> {lang} <ChevronDown className={`w-3 h-3 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
            </button>

            {langOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 py-2 bg-sc-deep/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                 <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => {
                          setLang(l.code);
                          setLangOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2 text-[11px] font-bold tracking-wider uppercase transition-colors hover:bg-white/5 ${
                          lang === l.code ? "text-sc-gold" : "text-white/60"
                        }`}
                      >
                        <span>{l.name}</span>
                        {lang === l.code && <Check size={12} />}
                      </button>
                    ))}
                 </div>
              </div>
            )}
          </div>

          {user ? (
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => navigate("/dashboard")}
                data-testid="nav-dashboard"
                className="flex items-center gap-2 text-sm text-sc-text hover:text-sc-gold transition-colors"
              >
                {user.picture ? (
                  <img src={user.picture} alt="" className="w-7 h-7 rounded-full border border-sc-gold/40" />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span>{t("nav_dashboard")}</span>
              </button>
              <button
                onClick={logout}
                data-testid="nav-logout"
                className="text-sc-text-muted hover:text-sc-red transition-colors"
                title={t("nav_logout")}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={() => setShowQRModal(true)}
                className="p-2 text-sc-text/60 hover:text-sc-gold transition-colors"
                title="Quantum Login"
              >
                <QrCode size={18} />
              </button>
              <button
                onClick={login}
                data-testid="nav-login"
                className="text-sm text-sc-text/80 hover:text-sc-gold transition-colors"
              >
                {t("nav_login")}
              </button>
            </div>
          )}

          <button
            onClick={onOpenClaim}
            data-testid="nav-claim-cta"
            className="btn-gold text-sm ml-2"
          >
            <span className="inline-flex items-center gap-1.5">
              {t("nav_claim")} <Star className="w-3.5 h-3.5 fill-current" strokeWidth={1.5} />
            </span>
          </button>

          <button
            onClick={() => setOpen((o) => !o)}
            className="lg:hidden text-sc-text"
            data-testid="mobile-menu-toggle"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden bg-[#050A1A]/95 backdrop-blur-xl border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-4 text-left">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `text-sm font-bold tracking-widest uppercase ${isActive ? "text-sc-gold" : "text-sc-text/80"}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            
            <div className="h-[1px] bg-white/5 my-2" />
            
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLang(l.code);
                    setOpen(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-[10px] font-black tracking-tighter uppercase transition-all ${
                    lang === l.code 
                    ? "bg-sc-gold/20 border-sc-gold text-sc-gold" 
                    : "bg-white/5 border-white/10 text-white/40"
                  }`}
                >
                  {l.code}
                </button>
              ))}
            </div>

            <div className="h-[1px] bg-white/5 my-2" />

            {user ? (
              <>
                <button onClick={() => { navigate("/dashboard"); setOpen(false); }} className="text-sm text-left uppercase font-bold tracking-widest">
                  {t("nav_dashboard")}
                </button>
                <button onClick={logout} className="text-sm text-left text-sc-red uppercase font-bold tracking-widest">{t("nav_logout")}</button>
              </>
            ) : (
              <button onClick={login} className="text-sm text-left uppercase font-bold tracking-widest">{t("nav_login")}</button>
            )}
          </div>
        </div>
      )}
      <QRLoginModal isOpen={showQRModal} onClose={() => setShowQRModal(false)} />
    </header>
  );
}
