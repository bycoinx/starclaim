import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useT } from "../lib/i18n";
import { 
  ShieldCheck, 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  Activity, 
  Search, 
  Package, 
  Clock, 
  ExternalLink 
} from "lucide-react";
import { toast } from "sonner";
import "./Console.css";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const { lang } = useT();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // overview | orders | stars

  useEffect(() => {
    if (loading) return;
    if (!user?.is_admin) return;

    setFetching(true);
    Promise.all([
      api.get("/admin/stats"),
      api.get("/admin/orders")
    ]).then(([{ data: statsData }, { data: ordersData }]) => {
      setStats(statsData);
      setOrders(ordersData);
    }).catch(err => {
      console.error("Admin fetch error:", err);
      toast.error(lang === "TR" ? "Yönetim verileri yüklenemedi." : "Admin data could not be loaded.");
    }).finally(() => setFetching(false));
  }, [user, loading, lang]);

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-sc-deep flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-sc-gold/30 border-t-sc-gold animate-spin rounded-full" />
          <p className="text-[10px] uppercase tracking-[0.3em] text-sc-gold animate-pulse">Initializing Aegis Admin Console...</p>
        </div>
      </div>
    );
  }

  if (!user?.is_admin) {
    return (
      <div className="min-h-screen bg-sc-deep flex items-center justify-center pt-24">
        <div className="text-center p-10 glass rounded-2xl max-w-md border-red-500/30">
          <ShieldCheck size={48} className="mx-auto text-red-500 mb-6" />
          <h2 className="font-display text-2xl mb-4 uppercase tracking-tighter text-red-500">Access Denied</h2>
          <p className="text-sc-text-muted mb-8 italic font-accent">Administrative authorization is required to access this terminal.</p>
          <button onClick={() => window.location.href = "/"} className="btn-gold px-10">Return to Sector 0</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pt-32 pb-24 relative overflow-hidden dashboard-container">
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(201,168,76,0.05),transparent_50%)]" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-10 z-10">
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-[10px] tracking-[0.4em] uppercase text-sc-gold mb-2 font-bold">
              <ShieldCheck size={12} className="animate-pulse" />
              ADMIN_TERMINAL_V1 // AUTHORIZED_ACCESS
            </div>
            <h1 className="font-display text-4xl md:text-6xl tracking-tight">
              Aegis <span className="gold-gradient-text">Command</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="glass px-4 py-2 rounded-lg border-sc-gold/20">
              <div className="text-[8px] text-sc-gold/60 uppercase tracking-widest mb-1">System Status</div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-mono uppercase">Operational</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatBox icon={<Users size={20}/>} label="Total Explorers" value={stats?.users || 0} color="blue" />
          <StatBox icon={<ShoppingBag size={20}/>} label="Naming Orders" value={stats?.orders || 0} color="gold" />
          <StatBox icon={<TrendingUp size={20}/>} label="Gross Revenue" value={`$${stats?.revenue?.toLocaleString() || 0}`} color="green" />
          <StatBox icon={<Activity size={20}/>} label="Uptime" value="99.9%" color="cyan" />
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mb-8 border-b border-white/5 p-1 bg-white/[0.02] rounded-t-xl w-fit">
          <button 
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-3 rounded-lg text-xs font-bold tracking-widest uppercase transition-all flex items-center gap-2 ${activeTab === 'overview' ? 'bg-sc-gold text-sc-deep shadow-lg shadow-sc-gold/20' : 'text-sc-text-muted hover:text-sc-text hover:bg-white/5'}`}
          >
            <Activity size={14} /> Overview
          </button>
          <button 
            onClick={() => setActiveTab("orders")}
            className={`px-6 py-3 rounded-lg text-xs font-bold tracking-widest uppercase transition-all flex items-center gap-2 ${activeTab === 'orders' ? 'bg-sc-gold text-sc-deep shadow-lg shadow-sc-gold/20' : 'text-sc-text-muted hover:text-sc-text hover:bg-white/5'}`}
          >
            <Package size={14} /> Recent Orders
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid lg:grid-cols-3 gap-8"
            >
              <div className="lg:col-span-2 space-y-8">
                <div className="glass p-8 rounded-2xl border-white/5">
                  <h3 className="text-lg font-display mb-6 flex items-center gap-3">
                    <Activity size={18} className="text-sc-gold" /> System Telemetry
                  </h3>
                  <div className="h-64 flex items-center justify-center border border-white/5 rounded-xl bg-black/20">
                    <p className="text-sc-text-muted font-mono text-xs italic">Visualization module offline. Direct data feed active.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-8">
                <div className="glass p-8 rounded-2xl border-white/5">
                   <h3 className="text-lg font-display mb-6 flex items-center gap-3">
                    <Clock size={18} className="text-sc-gold" /> Recent Events
                  </h3>
                  <div className="space-y-4">
                    {orders.slice(0, 5).map(order => (
                      <div key={order.order_id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group">
                        <div className="w-8 h-8 rounded bg-sc-gold/10 flex items-center justify-center flex-shrink-0 text-sc-gold">
                           <ShoppingBag size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="text-xs font-bold truncate">Star Claimed: {order.star_code}</div>
                           <div className="text-[10px] text-sc-text-muted mt-1">{new Date(order.created_at).toLocaleString()}</div>
                        </div>
                        <ExternalLink size={12} className="text-sc-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "orders" && (
            <motion.div 
              key="orders"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass rounded-2xl border-white/5 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white/[0.03] border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-sc-gold font-bold">Order ID</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-sc-gold font-bold">Explorer</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-sc-gold font-bold">Star</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-sc-gold font-bold">Package</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-sc-gold font-bold">Amount</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-sc-gold font-bold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {orders.map(order => (
                      <tr key={order.order_id} className="hover:bg-white/[0.01] transition-colors group">
                        <td className="px-6 py-4 text-xs font-mono text-sc-text-muted group-hover:text-sc-gold transition-colors">{order.order_id}</td>
                        <td className="px-6 py-4">
                           <div className="text-xs font-bold">{order.user_id}</div>
                           <div className="text-[9px] text-sc-text-muted mt-0.5">{order.recipient_email || 'Direct Claim'}</div>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold">{order.star_code}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-tighter font-bold ${
                            order.package === 'legendary' ? 'bg-sc-gold/20 text-sc-gold' : 'bg-white/10 text-sc-text-muted'
                          }`}>
                            {order.package}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-green-400">${order.amount.toFixed(2)}</td>
                        <td className="px-6 py-4 text-[10px] text-sc-text-muted">{new Date(order.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-sc-text-muted italic">No mission records found in the archive.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value, color }) {
  const colors = {
    gold: "text-sc-gold bg-sc-gold/10 border-sc-gold/20",
    blue: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    green: "text-green-400 bg-green-400/10 border-green-400/20",
    cyan: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  };
  
  return (
    <div className="glass p-6 rounded-2xl border-white/5 hover:border-sc-gold/30 transition-all group">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${colors[color]}`}>
        {icon}
      </div>
      <div className="text-[10px] uppercase tracking-widest text-sc-text-muted mb-1 font-bold">{label}</div>
      <div className="text-2xl font-display group-hover:text-sc-gold transition-colors">{value}</div>
    </div>
  );
}
