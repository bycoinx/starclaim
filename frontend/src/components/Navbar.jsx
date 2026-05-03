import React, { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Star, Globe, LogOut, User, Menu, X } from "lucide-react";
import { useT } from "../lib/i18n";
import { useAuth } from "../lib/auth";

export default function Navbar({ onOpenClaim }) {
  const { t, lang, toggle } = useT();
  const { user, login, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { to: "/", label: t("nav_home") },
    { to: "/stars", label: t("nav_pick") },
    { to: "/vision", label: "StarVault" },
    { to: "/marketplace", label: t("nav_market") },
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
          <button
            onClick={toggle}
            data-testid="lang-toggle"
            className="hidden md:flex items-center gap-1.5 text-xs text-sc-text-muted hover:text-sc-gold transition-colors"
          >
            <Globe className="w-4 h-4" /> {lang}
          </button>

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
            <button
              onClick={login}
              data-testid="nav-login"
              className="hidden md:block text-sm text-sc-text/80 hover:text-sc-gold transition-colors"
            >
              {t("nav_login")}
            </button>
          )}

          <button
            onClick={onOpenClaim}
            data-testid="nav-claim-cta"
            className="btn-gold text-sm"
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
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-4">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `text-sm ${isActive ? "text-sc-gold" : "text-sc-text/80"}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <button onClick={toggle} className="text-xs text-sc-text-muted text-left">
              Dil / Language: {lang}
            </button>
            {user ? (
              <>
                <button onClick={() => { navigate("/dashboard"); setOpen(false); }} className="text-sm text-left">
                  {t("nav_dashboard")}
                </button>
                <button onClick={logout} className="text-sm text-left text-sc-red">{t("nav_logout")}</button>
              </>
            ) : (
              <button onClick={login} className="text-sm text-left">{t("nav_login")}</button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
