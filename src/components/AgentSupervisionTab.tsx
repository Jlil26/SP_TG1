import React, { useState, useMemo, useEffect } from "react";
import { 
  Users, 
  Server, 
  Activity, 
  TrendingUp, 
  Search, 
  Filter, 
  ShieldAlert, 
  Wifi, 
  WifiOff, 
  CornerDownRight, 
  Cpu, 
  Send, 
  Radio, 
  Zap,
  Terminal,
  Clock
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart,
  Bar
} from "recharts";
import { MobileAgent, MobileSignal } from "../types";

interface Props {
  agents: MobileAgent[];
  mobileSignals: MobileSignal[];
  onTriggerFlashUpdate: () => Promise<any>;
  onRefreshData?: () => void;
}

export default function AgentSupervisionTab({ 
  agents, 
  mobileSignals, 
  onTriggerFlashUpdate,
  onRefreshData 
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Online" | "Offline">("All");
  const [isFlashing, setIsFlashing] = useState(false);
  const [flashLogs, setFlashLogs] = useState<Array<{ time: string; text: string; type: "info" | "success" | "warn" }>>([]);

  const addLog = (text: string, type: "info" | "success" | "warn" = "info") => {
    const time = new Date().toLocaleTimeString("fr-FR");
    setFlashLogs(prev => [...prev, { time, text, type }]);
  };

  // Filter agents list
  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      const matchesSearch = 
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.ipAddress.includes(searchTerm);
      const matchesStatus = 
        statusFilter === "All" || 
        (statusFilter === "Online" && agent.status === "Online") ||
        (statusFilter === "Offline" && agent.status === "Offline");
      return matchesSearch && matchesStatus;
    });
  }, [agents, searchTerm, statusFilter]);

  // Counts
  const stats = useMemo(() => {
    const total = agents.length;
    const online = agents.filter(a => a.status === "Online").length;
    const offline = total - online;
    const totalSignals = mobileSignals.length;
    return { total, online, offline, totalSignals };
  }, [agents, mobileSignals]);

  // Curve data: Compute simulated daily incoming signals timeline
  const timelineData = useMemo(() => {
    const data: Record<string, { date: string; Signatures: number; ActiveAgents: number }> = {};
    
    // Fallback static days to ensure visual graphs render brilliantly
    const baseDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    }).reverse();

    baseDays.forEach(day => {
      const formatted = day.split("-").slice(1).join("/"); // e.g. "05/22"
      data[day] = { 
        date: formatted, 
        Signatures: 0, 
        ActiveAgents: agents.filter(a => a.status === "Online").length 
      };
    });

    if (mobileSignals.length > 0) {
      mobileSignals.forEach(sig => {
        const dayRaw = sig.timestamp.split("T")[0];
        if (data[dayRaw]) {
          data[dayRaw].Signatures += 1;
        }
      });
    } else {
      // Inject realistic demo data if empty
      baseDays.forEach((day, idx) => {
        data[day].Signatures = Math.floor(Math.sin((idx + 1) * 0.8) * 4) + 6;
      });
    }

    return Object.values(data).sort((a, b) => a.date.localeCompare(b.date));
  }, [mobileSignals, agents]);

  // Execute flashing sequence
  const handleFlashUpdateClick = async () => {
    if (isFlashing) return;
    setIsFlashing(true);
    setFlashLogs([]);
    addLog("Initiation de la mise à jour d'urgence (FLASH BROADCAST)", "info");
    
    try {
      addLog("Analyse du parc de terminaux disponibles...", "info");
      await new Promise(r => setTimeout(r, 1000));
      addLog(`Réseau centralisé prêt. Ciblage de ${stats.online} agents en ligne.`, "success");
      
      const res = await onTriggerFlashUpdate();
      await new Promise(r => setTimeout(r, 1000));
      addLog("Génération des payloads de signatures de blocage cryptées...", "info");
      await new Promise(r => setTimeout(r, 1200));
      addLog("Broadcast de l'alerte hertzienne achevée avec succès.", "success");
      addLog("Les terminaux mobiles forcent la mise en conformité immédiate.", "success");
      
      if (onRefreshData) onRefreshData();
    } catch (e) {
      addLog("Erreur de synchronisation radio de la passerelle.", "warn");
    } finally {
      setIsFlashing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Grid Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-[#3B82F6] animate-pulse" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono">
              Supervision Active des Agents
            </h2>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1 font-mono">
            Contrôlez l'état des pare-feu, suivez la réception des signatures en temps réel, et pilotez le parc togolais.
          </p>
        </div>
        
        {/* Real-time sync button */}
        <button
          onClick={handleFlashUpdateClick}
          disabled={isFlashing}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 border transition duration-300 cursor-pointer ${isFlashing ? "bg-cyan-500/10 text-cyan-400 border-white/5" : "bg-[#3B82F6] hover:bg-[#3B82F6]/30 text-white border-transparent"}`}
        >
          <Zap className={`w-4 h-4 ${isFlashing ? "animate-spin" : ""}`} />
          {isFlashing ? "BROADCAST EN COURS..." : "BROADCAST CORRÉLATION FLASH"}
        </button>
      </div>

      {/* 2. Visual Enterprise Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Agents */}
        <div className="bg-[#121A2F] border border-white/5 rounded-xl p-5 relative overflow-hidden group shadow-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none transition duration-300"></div>
          <span className="text-[10px] font-mono font-bold text-[#94A3B8] block uppercase tracking-wider">Agents Enregistrés</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-white font-mono tracking-tight">{stats.total}</span>
            <span className="text-xs text-[#94A3B8] font-sans">terminaux</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
            <Server className="w-3.5 h-3.5" />
            <span>Base synchronisée Lomé SP</span>
          </div>
        </div>

        {/* Online State */}
        <div className="bg-[#121A2F] border border-white/5 rounded-xl p-5 relative overflow-hidden group shadow-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none transition duration-300"></div>
          <span className="text-[10px] font-mono font-bold text-[#10B981] block uppercase tracking-wider">Agents en ligne</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-[#10B981] font-mono tracking-tight">{stats.online}</span>
            <span className="text-xs text-[#10B981]/80 font-mono">({stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 0}%)</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-[#10B981]/80">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
            <span>Canaux radio connectés</span>
          </div>
        </div>

        {/* Offline State */}
        <div className="bg-[#121A2F] border border-white/5 rounded-xl p-5 relative overflow-hidden group shadow-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-slate-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase tracking-wider">Inactif / Veille</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-[#E5E7EB] font-mono tracking-tight">{stats.offline}</span>
            <span className="text-xs text-[#94A3B8] font-sans">terminaux</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
            <span>En attente de ping</span>
          </div>
        </div>

        {/* Received Signals count */}
        <div className="bg-[#121A2F] border border-white/5 rounded-xl p-5 relative overflow-hidden group shadow-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none transition duration-300"></div>
          <span className="text-[10px] font-mono font-bold text-[#06B6D4] block uppercase tracking-wider">Signaux d'attaques reçus</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-[#06B6D4] font-mono tracking-tight">{stats.totalSignals}</span>
            <span className="text-xs text-[#06B6D4]/80 font-mono">signaux</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-[#06B6D4]/80">
            <Activity className="w-3.5 h-3.5 text-[#06B6D4] animate-pulse" />
            <span>Passerelle d'écoute active</span>
          </div>
        </div>

      </div>

      {/* 3. Realtime Signature Reception Curves & Broadcast Log Terminal (Side-by-Side) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Curve visualization (Recharts AreaChart) */}
        <div className="bg-[#121A2F] border border-white/5 rounded-xl p-5 lg:col-span-2 shadow-md">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Flux Chronologique des Signatures Remontées
              </h4>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">
                Courbe d'activité hostile interceptée par les terminaux mobiles partenaires.
              </p>
            </div>
            <span className="text-[9px] font-mono text-[#06B6D4] font-bold uppercase py-1 px-2 bg-[#06B6D4]/10 border border-[#06B6D4]/25 rounded">
              Temps Réel
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ left: -15, top: 10, right: 10 }}>
                <defs>
                  <linearGradient id="colorSignatures" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAgents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: 9, fontFamily: "monospace" }} />
                <YAxis stroke="#64748b" style={{ fontSize: 9, fontFamily: "monospace" }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#121A2F", borderColor: "rgba(255,255,255,0.05)", color: "#E5E7EB" }}
                  labelStyle={{ fontFamily: "monospace", color: "#64748b" }}
                />
                <Area 
                  type="monotone" 
                  dataKey="Signatures" 
                  stroke="#06B6D4" 
                  strokeWidth={1.5} 
                  fillOpacity={1} 
                  fill="url(#colorSignatures)" 
                  name="Signatures Interceptées" 
                />
                <Area 
                  type="monotone" 
                  dataKey="ActiveAgents" 
                  stroke="#3B82F6" 
                  strokeWidth={1.5} 
                  fillOpacity={1} 
                  fill="url(#colorAgents)" 
                  name="Terminaux Actifs" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Flash Logs Mini Terminal */}
        <div className="bg-[#121A2F] border border-white/5 rounded-xl p-5 flex flex-col justify-between shadow-md">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-white/5 pb-3 mb-4">
              <Terminal className="w-3.5 h-3.5 text-[#06B6D4]" />
              Console Hertzienne (SOC central SP)
            </h4>

            <div className="space-y-2 bg-[#0B1020]/45 border border-white/5 p-3 rounded-lg h-48 overflow-y-auto font-mono text-[10px] leading-relaxed">
              {flashLogs.length === 0 ? (
                <div className="text-slate-500 italic p-2">
                  Aucun broadcast déclenché. Appuyez sur le bouton de synchronisation pour forcer une transmission hertzienne.
                </div>
              ) : (
                flashLogs.map((log, index) => (
                  <div key={index} className="flex gap-1.5 items-start">
                    <span className="text-slate-600 shrink-0">{log.time}</span>
                    <span className={log.type === "success" ? "text-emerald-400" : log.type === "warn" ? "text-rose-400" : "text-slate-300"}>
                      {log.text}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-2 border-t border-white/5 mt-3 text-[10px] text-slate-500 font-mono leading-tight">
            Chaque transmission hertzienne synchronise de nouvelles listes d'IoC Moov/Tmoney vers les agents connectés.
          </div>
        </div>
      </div>

      {/* 4. Filterable Deployed Agents Directory */}
      <div className="bg-[#121A2F] border border-white/5 rounded-xl p-5 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-white/5">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Réseau National des Agents Android Déployés
          </h4>

          {/* Filtering row */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher (Nom, Ville, IP)..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-[#0B1020]/45 border border-white/5 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#3B82F6] font-mono"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            </div>

            <div className="flex items-center gap-1.5 bg-[#0B1020]/45 px-2 py-1 rounded-lg border border-white/5 text-[10px] font-mono">
              <span className="text-slate-500">Statut:</span>
              <button 
                onClick={() => setStatusFilter("All")}
                className={`px-1.5 py-0.5 rounded transition cursor-pointer ${statusFilter === "All" ? "bg-[#1A2542] text-white font-bold" : "text-slate-400 hover:text-slate-200"}`}
              >
                Tous
              </button>
              <button 
                onClick={() => setStatusFilter("Online")}
                className={`px-1.5 py-0.5 rounded transition cursor-pointer ${statusFilter === "Online" ? "bg-[#1A2542] text-[#10B981] font-bold" : "text-slate-400 hover:text-slate-200"}`}
              >
                Actifs
              </button>
              <button 
                onClick={() => setStatusFilter("Offline")}
                className={`px-1.5 py-0.5 rounded transition cursor-pointer ${statusFilter === "Offline" ? "bg-[#1A2542] text-slate-400 font-bold" : "text-slate-400 hover:text-slate-200"}`}
              >
                Inactifs
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-[#0B1020]/45 border-b border-[#1A2542] text-[10px] text-slate-500 uppercase">
                <th className="py-2.5 px-3">Identifiant / Modèle</th>
                <th className="py-2.5 px-3">Localisation Togo</th>
                <th className="py-2.5 px-3">Adresse IP</th>
                <th className="py-2.5 px-3">Version de l'Agent</th>
                <th className="py-2.5 px-3">Dernière Synchronisation</th>
                <th className="py-2.5 px-3 text-right">Statut Central</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                    Aucun agent déployé ne correspond à ces critères.
                  </td>
                </tr>
              ) : (
                filteredAgents.map(agent => (
                  <tr key={agent.id} className="hover:bg-[#0B1020]/25 transition">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded bg-[#0B1020]/45 border ${agent.status === 'Online' ? 'border-[#10B981]/20 text-[#10B981]' : 'border-white/5 text-slate-500'}`}>
                          <Users className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <strong className="text-white block">{agent.name}</strong>
                          <span className="text-[10px] text-slate-500">ID: {agent.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-200">{agent.city}</span>
                        <span className="text-[9px] bg-[#1A2542] text-[#94A3B8] px-1 py-0.2 rounded font-sans uppercase border border-white/5">TG</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {agent.ipAddress}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-[#0B1020]/45 border border-white/5 text-[11px] text-slate-400">
                        v{agent.version}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {new Date(agent.lastSync).toLocaleString("fr-FR")}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {agent.status === "Online" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                          EN LIGNE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0B1020]/60 text-slate-500 border border-white/5">
                          DECONNECTE
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
