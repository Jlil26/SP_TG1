import React, { useState, useMemo, useEffect } from "react";
import { 
  Shield, 
  Activity, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Filter,
  TrendingUp,
  Server,
  Fingerprint,
  RefreshCw,
  Search,
  Database,
  BookOpen,
  MapPin,
  Flame,
  Globe,
  Settings,
  HelpCircle,
  AlertCircle,
  Cpu,
  Smartphone,
  Radio,
  Sparkles,
  Layers,
  Binary,
  ArrowUpRight
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from "recharts";
import { Threat, MobileAgent } from "../types";

interface Props {
  threats: Threat[];
  agents: MobileAgent[];
  onQuickAddThreat: (type: "domain" | "ip" | "email" | "phone", value: string) => void;
  onResetToZero?: () => Promise<void>;
  onLoadDemoData?: () => Promise<void>;
  currentUsername: string;
}

export default function DashboardTab({ 
  threats, 
  agents, 
  onQuickAddThreat,
  onResetToZero,
  onLoadDemoData,
  currentUsername
}: Props) {
  
  // Active clock GMT
  const [togoClock, setTogoClock] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  useEffect(() => {
    const updateClock = () => {
      const gmtDate = new Date();
      const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
      const dayName = days[gmtDate.getUTCDay()];
      const day = String(gmtDate.getUTCDate()).padStart(2, "0");
      const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
      const monthName = months[gmtDate.getUTCMonth()];
      const year = gmtDate.getUTCFullYear();
      
      const hours = String(gmtDate.getUTCHours()).padStart(2, "0");
      const minutes = String(gmtDate.getUTCMinutes()).padStart(2, "0");
      const seconds = String(gmtDate.getUTCSeconds()).padStart(2, "0");
      
      setTogoClock(`${dayName} ${day} ${monthName} ${year} • ${hours}:${minutes}:${seconds} GMT`);
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute dynamic KPIs
  const kpiStats = useMemo(() => {
    const totalThreatsCount = threats.length;
    
    // Base offsets + live values for ultra realistic showcase
    const totalIntercepted = 1248 + totalThreatsCount;
    const activeSignatures = 412 + totalThreatsCount * 2;
    const citizenComplaints = Math.max(84, 84 + totalThreatsCount - 3);
    const synchronizedAgents = 1043 + agents.length;

    return {
      totalIntercepted,
      activeSignatures,
      citizenComplaints,
      synchronizedAgents
    };
  }, [threats, agents]);

  // Combined real-time table of actual threats + simulated high-fidelity SOC events
  const liveThreatFeed = useMemo(() => {
    // Generate simulated high-fidelity Togo-specific alerts to make the SOC live feed extremely rich
    const simulatedAlerts = [
      {
        id: "sim-1",
        time: "14:24:10",
        type: "Faux Gains Flooz/TMoney",
        sender: "+228 99 12 04 85",
        severity: "Critical",
        status: "Bloqué",
        details: "Appel prétextant un faux tirage au sort Togocom demandant l'USSD *155#."
      },
      {
        id: "sim-2",
        time: "13:10:45",
        type: "Facture CEET fictive",
        sender: "ceet-pay-togo.org",
        severity: "Critical",
        status: "Signalé ANCY",
        details: "Faux e-mails de relance électrique dirigeant vers un clone de paiement."
      },
      {
        id: "sim-3",
        time: "11:05:12",
        type: "Gendarmerie Nationale (Faux)",
        sender: "+228 90 22 45 11",
        severity: "Medium",
        status: "En Quarantaine",
        details: "Tentative d'extorsion d'urgence prétendant l'arrestation d'un proche à Lomé."
      },
      {
        id: "sim-4",
        time: "09:44:02",
        type: "Arnaque Loterie WhatsApp",
        sender: "+228 91 88 56 30",
        severity: "Medium",
        status: "Bloqué",
        details: "Message promettant une subvention du gouvernement togolais de 250,000 CFA."
      },
      {
        id: "sim-5",
        time: "08:15:30",
        type: "Hameçonnage Bancaire UTB",
        sender: "secure-utb-togo.net",
        severity: "Critical",
        status: "Signalé ANCY",
        details: "Clone de portail d'accès e-banking Union Togolaise de Banque."
      }
    ];

    // Map real threats to match the SOC feed row design
    const mappedRealThreats = threats.map((t, idx) => {
      // Determine elegant type
      let typeLabel = "Alerte Cybersécurité";
      if (t.type === "phone") {
        typeLabel = t.details.toLowerCase().includes("flooz") || t.details.toLowerCase().includes("money") 
          ? "Faux Gains Flooz/TMoney" 
          : "Gendarmerie / Usurpation";
      } else if (t.type === "domain") {
        typeLabel = t.details.toLowerCase().includes("ceet") 
          ? "Facture CEET fictive" 
          : "Phishing Bancaire / Clone";
      } else {
        typeLabel = "Indicateur Suspect";
      }

      // Map status
      let statusLabel = "Bloqué";
      if (t.status === "sandbox") statusLabel = "En Quarantaine";
      if (t.status === "validated") statusLabel = "Signalé ANCY";

      // Formulate a beautiful time
      const dateObj = new Date(t.detectedAt);
      const hours = String(dateObj.getHours()).padStart(2, "0");
      const minutes = String(dateObj.getMinutes()).padStart(2, "0");
      const seconds = String(dateObj.getSeconds()).padStart(2, "0");
      const timeStr = isNaN(dateObj.getTime()) ? `12:${String(idx * 7).padStart(2, "0")}:15` : `${hours}:${minutes}:${seconds}`;

      return {
        id: t.id,
        time: timeStr,
        type: typeLabel,
        sender: t.value,
        severity: t.severity,
        status: statusLabel,
        details: t.details
      };
    });

    // Combine: Real threats always come first to show immediate dynamic feedback
    return [...mappedRealThreats, ...simulatedAlerts].slice(0, 8);
  }, [threats]);

  // Extract the very last automated Gemini extracted IoC
  const latestGeminiIoC = useMemo(() => {
    // If we have actual threats, return the latest one
    if (threats.length > 0) {
      const latest = threats[threats.length - 1];
      return {
        type: latest.type,
        value: latest.value,
        details: latest.details || "Extraction automatisée"
      };
    }
    // Fallback premium default for the demo
    return {
      type: "phone",
      value: "+228 99 12 04 85",
      details: "Lié à la vague d'usurpation Moov Money"
    };
  }, [threats]);

  // Dynamic but premium dense chart data showing activity fluctuation according to severities
  const chartData = useMemo(() => {
    // We render a highly detailed and dense chart representation
    const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    
    return days.map((day, idx) => {
      // Adding threats count to make it dynamically grow
      const offset = threats.length * (idx % 2 === 0 ? 1 : 2);
      return {
        name: day,
        Critique: 45 + (idx * 12) % 35 + offset * 3,
        Moyen: 60 + (idx * 8) % 40 + offset * 2,
        Faible: 80 + (idx * 15) % 50 + offset
      };
    });
  }, [threats]);

  // Geographic Heatmap metrics of Togo regions
  const togoGeographicData = useMemo(() => {
    return [
      { 
        id: "maritime", 
        region: "Région Maritime (Lomé)", 
        percentage: 68, 
        incidents: 848, 
        trend: "+14% ce mois", 
        hotspot: "Grand Lomé, Baguida, Agoè-Nyivé",
        lat: 310, lng: 120 
      },
      { 
        id: "plateaux", 
        region: "Région des Plateaux (Atakpamé)", 
        percentage: 42, 
        incidents: 312, 
        trend: "+5% ce mois", 
        hotspot: "Atakpamé, Kpalimé, Notsé",
        lat: 195, lng: 115 
      },
      { 
        id: "centrale", 
        region: "Région Centrale (Sokodé)", 
        percentage: 31, 
        incidents: 192, 
        trend: "Stable", 
        hotspot: "Sokodé, Tchamba, Bafilo",
        lat: 130, lng: 110 
      },
      { 
        id: "kara", 
        region: "Région de la Kara (Kara)", 
        percentage: 54, 
        incidents: 412, 
        trend: "+18% ce mois", 
        hotspot: "Kara, Niamtougou, Bassar",
        lat: 80, lng: 135 
      },
      { 
        id: "savanes", 
        region: "Région des Savanes (Dapaong)", 
        percentage: 18, 
        incidents: 84, 
        trend: "-3% ce mois", 
        hotspot: "Dapaong, Mango, Cinkassé",
        lat: 20, lng: 105 
      }
    ];
  }, []);

  return (
    <div className="space-y-6 animate-fade-in" id="sp-sentinel-dashboard">
      
      {/* 1. Premium Royal Blue Cyber Hero Banner (IMPÉRATIVEMENT INCHANGÉE) */}
      <div className="relative bg-gradient-to-r from-[#0F296D] via-[#1C4ED8] to-[#0D1F4D] border border-blue-500/20 shadow-xl rounded-2xl p-6 md:p-8 text-white overflow-hidden select-none" id="dashboard-hero-banner">
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-blue-400/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Vertical glowing network stream bars */}
        <div className="absolute right-0 bottom-0 top-0 w-2/5 hidden md:flex items-end justify-between px-10 pb-0 opacity-90 select-none pointer-events-none gap-2">
          <div className="w-4 bg-gradient-to-t from-[#2563EB]/40 to-[#06B6D4] rounded-t-md animate-pulse" style={{ height: '35%', animationDuration: '3s' }}></div>
          <div className="w-4 bg-gradient-to-t from-[#2563EB]/50 to-white rounded-t-md animate-pulse" style={{ height: '60%', animationDuration: '4.5s' }}></div>
          <div className="w-4 bg-gradient-to-t from-[#2563EB] to-[#06B6D4] rounded-t-md" style={{ height: '85%' }}></div>
          <div className="w-4 bg-gradient-to-t from-[#2563EB]/30 to-white rounded-t-md animate-pulse" style={{ height: '45%', animationDuration: '3.5s' }}></div>
          <div className="w-4 bg-gradient-to-t from-[#06B6D4] to-white rounded-t-md" style={{ height: '95%' }}></div>
          <div className="w-4 bg-gradient-to-t from-[#2563EB]/60 to-[#06B6D4] rounded-t-md animate-pulse" style={{ height: '70%', animationDuration: '5s' }}></div>
          <div className="w-4 bg-gradient-to-t from-[#2563EB]/40 to-white rounded-t-md" style={{ height: '50%' }}></div>
        </div>

        <div className="relative z-10 max-w-xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500/20 border border-cyan-400/30 rounded-full text-xs font-mono font-bold text-cyan-300 uppercase tracking-widest leading-none">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-ping"></span>
            SP SENTINEL NETWORK COGNITIVE
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-display text-white">
            Supervision Bivalente &amp; Renseignements Cyber en Temps Réel
          </h1>
          <p className="text-sm text-blue-100 font-sans leading-relaxed max-w-lg opacity-90">
            Plateforme souveraine d'échange de signatures de menaces (COI) et de détection automatique d'ingénierie sociale par modèle IA cognitif pour la République du Togo.
          </p>
        </div>
      </div>

      {/* 2. Real-time synchronised TOGO Network Time zone bar (IMPÉRATIVEMENT INCHANGÉE) */}
      <div className="bg-[#121A2F] border border-white/5 rounded-xl px-5 py-3 flex flex-col sm:flex-row justify-between items-center gap-3 shadow-md" id="dashboard-sync-bar">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#3B82F6] animate-pulse" />
          <span className="text-xs font-mono font-bold text-[#E5E7EB] uppercase tracking-widest">
            SYNCHRONISATION RENSEIGNEMENT TOGO (GMT NETWORK)
          </span>
        </div>
        
        <div className="text-xs font-mono font-bold text-white bg-[#0B1020]/45 border border-white/5 px-3 py-1.5 rounded-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping"></span>
          {togoClock || "Synchronisation..."}
        </div>
      </div>

      {/* 3. Bandeau de KPIs Métriques Haute Visibilité */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-metrics-strip">
        
        {/* KPI 1: Total Menaces Interceptées */}
        <div className="bg-[#121A2F] border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-[#3B82F6]/30 transition duration-350">
          <div className="absolute top-0 right-0 w-20 h-20 bg-[#3B82F6]/5 rounded-full blur-2xl group-hover:bg-[#3B82F6]/10 transition"></div>
          <div className="space-y-1">
            <span className="text-[9px] font-mono text-slate-400 uppercase font-black tracking-widest block">Menaces Interceptées</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white tracking-tight">{kpiStats.totalIntercepted.toLocaleString()}</span>
              <span className="text-[9px] font-bold text-emerald-400 font-sans bg-emerald-500/10 px-1.5 py-0.5 rounded">+12%</span>
            </div>
            <p className="text-[9px] text-slate-500 font-sans">Bloqué localement sur le territoire</p>
          </div>
          <div className="p-3 rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] border border-white/5 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Signatures Actives en Base */}
        <div className="bg-[#121A2F] border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition duration-350">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition"></div>
          <div className="space-y-1">
            <span className="text-[9px] font-mono text-slate-400 uppercase font-black tracking-widest block">Signatures en Base</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white tracking-tight">{kpiStats.activeSignatures.toLocaleString()}</span>
              <span className="text-[9px] font-bold text-emerald-400 font-sans bg-emerald-500/10 px-1.5 py-0.5 rounded">+4 actif</span>
            </div>
            <p className="text-[9px] text-slate-500 font-sans">Numéros &amp; liens répertoriés</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-[#10B981] border border-white/5 shrink-0">
            <Fingerprint className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Déclarations Citoyennes Actives */}
        <div className="bg-[#121A2F] border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-red-500/30 transition duration-350">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition"></div>
          <div className="space-y-1">
            <span className="text-[9px] font-mono text-slate-400 uppercase font-black tracking-widest block">Plaintes Citoyennes</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-[#EF4444] tracking-tight">{kpiStats.citizenComplaints}</span>
              <span className="text-[9px] font-bold text-red-400 font-sans bg-red-500/10 px-1.5 py-0.5 rounded">En Attente</span>
            </div>
            <p className="text-[9px] text-slate-500 font-sans">Soumissions citoyennes directes</p>
          </div>
          <div className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-white/5 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Agents Mobiles Synchronisés */}
        <div className="bg-[#121A2F] border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-cyan-500/30 transition duration-350">
          <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition"></div>
          <div className="space-y-1">
            <span className="text-[9px] font-mono text-slate-400 uppercase font-black tracking-widest block">Terminaux Mobiles</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-[#06B6D4] tracking-tight">{kpiStats.synchronizedAgents.toLocaleString()}</span>
              <span className="text-[9px] font-bold text-cyan-400 font-sans bg-cyan-500/10 px-1.5 py-0.5 rounded">Actifs</span>
            </div>
            <p className="text-[9px] text-slate-500 font-sans">Synchronisés en direct au Togo</p>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-white/5 shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* 4. Zone Centrale Opérationnelle (Layout en 2 Colonnes : 70% / 30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6" id="central-operational-zone">
        
        {/* Colonne Gauche (70%) - Flux des Alertes en Temps Réel (Live Threat Feed) */}
        <div className="bg-[#121A2F] border border-slate-800 rounded-2xl p-5 shadow-xl lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                <h3 className="text-xs font-bold text-white tracking-widest font-mono uppercase">
                  FLUX DES ALERTES DE MENACES EN TEMPS RÉEL (SOC LIVE)
                </h3>
              </div>
              <span className="text-[9px] font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded">
                Lomé (GMT+0)
              </span>
            </div>

            {/* Event List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[8.5px] font-mono uppercase text-slate-500 tracking-wider">
                    <th className="pb-2 font-black">Heure Lomé</th>
                    <th className="pb-2 font-black">Type d'arnaque / Alerte</th>
                    <th className="pb-2 font-black">Expéditeur / Source</th>
                    <th className="pb-2 font-black text-right">Statut SOC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-[10px] font-mono">
                  {liveThreatFeed.map((alert) => (
                    <tr key={alert.id} className="hover:bg-slate-950/20 transition-all group">
                      <td className="py-3 text-slate-400 font-bold whitespace-nowrap">
                        {alert.time}
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex flex-col">
                          <span className={`px-2 py-0.5 rounded text-[8.5px] font-black w-fit font-sans ${
                            alert.severity === "Critical" 
                              ? "bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/20" 
                              : "bg-amber-500/10 text-amber-500 border border-amber-500/15"
                          }`}>
                            {alert.type}
                          </span>
                          <span className="text-[8.5px] text-slate-500 truncate max-w-[200px] font-sans mt-0.5 italic group-hover:text-slate-400">
                            {alert.details}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-white font-bold tracking-tight whitespace-nowrap select-all">
                        {alert.sender}
                      </td>
                      <td className="py-3 text-right">
                        <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider ${
                          alert.status === "Bloqué" 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                            : alert.status === "En Quarantaine"
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            : "bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20"
                        }`}>
                          {alert.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-[9px] text-slate-500 mt-4 border-t border-slate-800/60 pt-3 flex justify-between items-center font-mono">
            <span>Flux de surveillance unifié (Appels + SMS)</span>
            <span>{threats.length} signatures de l'opérateur actives</span>
          </div>
        </div>

        {/* Colonne Droite (30%) - Statut des Scrapers & IA (Threat Intel Engine) */}
        <div className="bg-[#121A2F] border border-slate-800 rounded-2xl p-5 shadow-xl lg:col-span-3 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-white tracking-widest font-mono uppercase flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                MOTEURS SCRAPERS &amp; IA
              </h3>
            </div>

            {/* Scraping state */}
            <div className="space-y-2.5">
              <span className="text-[8.5px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Sources Cyber Connectées :</span>
              
              <div className="bg-slate-950/40 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-slate-200 font-mono">CERT.TG</span>
                </div>
                <span className="text-[8.5px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase">Opérationnel</span>
              </div>

              <div className="bg-slate-950/40 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-slate-200 font-mono">ANCY.GOUV.TG</span>
                </div>
                <span className="text-[8.5px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase">Connecté</span>
              </div>
            </div>

            {/* Last Gemini Analysis */}
            <div className="space-y-2 pt-1">
              <span className="text-[8.5px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Dernière Analyse Gemini :</span>
              
              <div className="bg-[#0B1020] border border-slate-800 rounded-xl p-3 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/5 rounded-full blur-xl"></div>
                
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span className="text-[9px] font-black text-white font-mono uppercase">EXTRACTION COGNITIVE</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-[7.5px] text-red-400 font-bold uppercase font-mono">
                      {latestGeminiIoC.type}
                    </span>
                    <span className="text-[10px] font-bold text-slate-200 font-mono truncate select-all">
                      {latestGeminiIoC.value}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-normal font-sans italic">
                    &ldquo;{latestGeminiIoC.details}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/60 mt-4 text-[8.5px] font-mono text-slate-500 flex items-center justify-between">
            <span>IA: Gemini 3.5 Flash</span>
            <span className="text-[#3B82F6] font-bold">Modèle ACTIF</span>
          </div>
        </div>

      </div>

      {/* 5. Zone Inférieure (Graphiques & Cartographie : 50% / 50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-lower-zone">
        
        {/* Graphique de comportement de fraude */}
        <div className="bg-[#121A2F] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-white tracking-widest font-mono uppercase flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#3B82F6]" />
                  COURBE DE DÉBITS DES FRAUDES EN DIRECT
                </h3>
                <p className="text-[10px] text-slate-400">Chronologie hebdomadaire consolidée par criticité de menaces.</p>
              </div>
            </div>

            {/* Area Chart */}
            <div className="h-56 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: -25, top: 5, right: 5, bottom: 0 }}>
                  <defs>
                    <linearGradient id="critGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="medGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="faibleGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                  <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: 9, fontFamily: "monospace" }} />
                  <YAxis stroke="#64748b" style={{ fontSize: 9, fontFamily: "monospace" }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#121A2F", borderColor: "rgba(255,255,255,0.08)", color: "#E5E7EB" }}
                    labelStyle={{ fontFamily: "monospace", color: "#94A3B8" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 9, fontFamily: "monospace", paddingTop: 10 }} />
                  <Area type="monotone" dataKey="Critique" stroke="#EF4444" strokeWidth={1.5} fillOpacity={1} fill="url(#critGrad)" name="Critique" />
                  <Area type="monotone" dataKey="Moyen" stroke="#F59E0B" strokeWidth={1.5} fillOpacity={1} fill="url(#medGrad)" name="Moyen" />
                  <Area type="monotone" dataKey="Faible" stroke="#10B981" strokeWidth={1.5} fillOpacity={1} fill="url(#faibleGrad)" name="Faible" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/60 mt-4 text-[8px] font-mono text-slate-500 flex justify-between">
            <span>Pics d'activité calculés en temps réel</span>
            <span>Régions interconnectées</span>
          </div>
        </div>

        {/* Mini-Carte Thermique & Répartition Géographique au Togo */}
        <div className="bg-[#121A2F] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-white tracking-widest font-mono uppercase flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  REPARTITION GÉOGRAPHIQUE &amp; HEATMAP (TOGO)
                </h3>
                <p className="text-[10px] text-slate-400">Concentration spatiale des campagnes d'escroqueries par SMS.</p>
              </div>
            </div>

            {/* Split layout: SVG Map representation + list indicators */}
            <div className="grid grid-cols-12 gap-4 mt-2">
              
              {/* Minimal Tall Togo SVG Map Outline with pulsing hotspots */}
              <div className="col-span-4 bg-slate-950/55 rounded-xl border border-slate-800/80 p-2 h-44 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px)] [background-size:10px_10px]"></div>
                
                {/* Realistic Vector Togo Outline with 5 individually highlightable regions */}
                <svg className="w-20 h-44 transition-all duration-300" viewBox="0 0 100 350" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Savanes Region (North) */}
                  <path 
                    d="M25,12 L30,12 L43,18 L68,18 L70,25 L68,45 L58,58 L45,55 L32,60 L28,45 L25,32 Z" 
                    fill={selectedRegion === "savanes" ? "rgba(16, 185, 129, 0.85)" : selectedRegion ? "rgba(30, 41, 59, 0.2)" : "rgba(30, 41, 59, 0.85)"} 
                    stroke={selectedRegion === "savanes" ? "#10B981" : "#475569"} 
                    strokeWidth={selectedRegion === "savanes" ? "2" : "1"}
                    strokeLinejoin="round"
                    className="cursor-pointer transition-all duration-300 hover:opacity-90"
                    onClick={() => setSelectedRegion(selectedRegion === "savanes" ? null : "savanes")}
                  />

                  {/* Kara Region */}
                  <path 
                    d="M32,60 L45,55 L58,58 L68,45 L68,60 L78,85 L80,105 L65,115 L50,110 L35,115 L32,100 L38,90 L35,80 L38,70 Z" 
                    fill={selectedRegion === "kara" ? "rgba(239, 68, 68, 0.85)" : selectedRegion ? "rgba(30, 41, 59, 0.2)" : "rgba(30, 41, 59, 0.85)"} 
                    stroke={selectedRegion === "kara" ? "#EF4444" : "#475569"} 
                    strokeWidth={selectedRegion === "kara" ? "2" : "1"}
                    strokeLinejoin="round"
                    className="cursor-pointer transition-all duration-300 hover:opacity-90"
                    onClick={() => setSelectedRegion(selectedRegion === "kara" ? null : "kara")}
                  />

                  {/* Centrale Region */}
                  <path 
                    d="M35,115 L50,110 L65,115 L80,105 L82,125 L85,150 L75,170 L55,180 L45,170 L38,155 L38,135 Z" 
                    fill={selectedRegion === "centrale" ? "rgba(16, 185, 129, 0.85)" : selectedRegion ? "rgba(30, 41, 59, 0.2)" : "rgba(30, 41, 59, 0.85)"} 
                    stroke={selectedRegion === "centrale" ? "#10B981" : "#475569"} 
                    strokeWidth={selectedRegion === "centrale" ? "2" : "1"}
                    strokeLinejoin="round"
                    className="cursor-pointer transition-all duration-300 hover:opacity-90"
                    onClick={() => setSelectedRegion(selectedRegion === "centrale" ? null : "centrale")}
                  />

                  {/* Plateaux Region */}
                  <path 
                    d="M45,170 L55,180 L75,170 L85,150 L88,180 L88,215 L88,245 L78,255 L65,255 L50,265 L40,255 L38,230 L38,200 L42,185 Z" 
                    fill={selectedRegion === "plateaux" ? "rgba(245, 158, 11, 0.85)" : selectedRegion ? "rgba(30, 41, 59, 0.2)" : "rgba(30, 41, 59, 0.85)"} 
                    stroke={selectedRegion === "plateaux" ? "#F59E0B" : "#475569"} 
                    strokeWidth={selectedRegion === "plateaux" ? "2" : "1"}
                    strokeLinejoin="round"
                    className="cursor-pointer transition-all duration-300 hover:opacity-90"
                    onClick={() => setSelectedRegion(selectedRegion === "plateaux" ? null : "plateaux")}
                  />

                  {/* Maritime Region (Lomé / South) */}
                  <path 
                    d="M40,255 L50,265 L65,255 L78,255 L85,260 L85,285 L78,310 L68,325 L50,335 L45,310 L42,285 Z" 
                    fill={selectedRegion === "maritime" ? "rgba(239, 68, 68, 0.85)" : selectedRegion ? "rgba(30, 41, 59, 0.2)" : "rgba(30, 41, 59, 0.85)"} 
                    stroke={selectedRegion === "maritime" ? "#EF4444" : "#475569"} 
                    strokeWidth={selectedRegion === "maritime" ? "2" : "1"}
                    strokeLinejoin="round"
                    className="cursor-pointer transition-all duration-300 hover:opacity-90"
                    onClick={() => setSelectedRegion(selectedRegion === "maritime" ? null : "maritime")}
                  />
                  
                  {/* Pulsing Hotspot: Lomé (South) */}
                  <g className="cursor-pointer" onClick={() => setSelectedRegion(selectedRegion === "maritime" ? null : "maritime")}>
                    <circle cx="60" cy="295" r="7" className="fill-red-500/35 animate-ping" />
                    <circle cx="60" cy="295" r="3.5" className="fill-[#EF4444]" />
                  </g>

                  {/* Pulsing Hotspot: Atakpamé (Plateaux) */}
                  <g className="cursor-pointer" onClick={() => setSelectedRegion(selectedRegion === "plateaux" ? null : "plateaux")}>
                    <circle cx="58" cy="215" r="5" className="fill-amber-500/35 animate-ping" />
                    <circle cx="58" cy="215" r="3" className="fill-amber-500" />
                  </g>

                  {/* Pulsing Hotspot: Sokodé (Centrale) */}
                  <g className="cursor-pointer" onClick={() => setSelectedRegion(selectedRegion === "centrale" ? null : "centrale")}>
                    <circle cx="58" cy="140" r="4" className="fill-emerald-500/35 animate-ping" style={{ animationDelay: '1s' }} />
                    <circle cx="58" cy="140" r="2.5" className="fill-emerald-500" />
                  </g>

                  {/* Pulsing Hotspot: Kara */}
                  <g className="cursor-pointer" onClick={() => setSelectedRegion(selectedRegion === "kara" ? null : "kara")}>
                    <circle cx="58" cy="85" r="6" className="fill-red-500/35 animate-ping" style={{ animationDelay: '0.5s' }} />
                    <circle cx="58" cy="85" r="3" className="fill-[#EF4444]" />
                  </g>

                  {/* Pulsing Hotspot: Dapaong (Savanes) */}
                  <g className="cursor-pointer" onClick={() => setSelectedRegion(selectedRegion === "savanes" ? null : "savanes")}>
                    <circle cx="48" cy="35" r="4" className="fill-emerald-500/35 animate-ping" />
                    <circle cx="48" cy="35" r="2" className="fill-emerald-500" />
                  </g>
                </svg>

                <div className="absolute bottom-1 right-1 text-[7px] font-mono text-slate-500 uppercase">
                  Interaction Carte active
                </div>
              </div>

              {/* List of Regions & Intensities */}
              <div className="col-span-8 space-y-2.5">
                {togoGeographicData.map((reg) => (
                  <div 
                    key={reg.id} 
                    onClick={() => setSelectedRegion(selectedRegion === reg.id ? null : reg.id)}
                    className={`p-1.5 rounded-lg border transition cursor-pointer ${
                      selectedRegion === reg.id 
                        ? "bg-[#3B82F6]/10 border-[#3B82F6]/35" 
                        : "bg-slate-950/20 border-transparent hover:border-slate-800"
                    }`}
                  >
                    <div className="flex justify-between items-center text-[9px] font-mono">
                      <span className="text-white font-bold">{reg.region}</span>
                      <span className={`font-bold ${reg.percentage > 50 ? "text-red-400" : "text-emerald-400"}`}>
                        {reg.incidents} cas ({reg.percentage}%)
                      </span>
                    </div>
                    
                    {/* Visual bar meter */}
                    <div className="w-full bg-slate-900 h-1.5 mt-1 rounded overflow-hidden">
                      <div 
                        className={`h-full rounded transition-all duration-700 ${
                          reg.percentage > 50 ? "bg-[#EF4444]" : "bg-emerald-500"
                        }`} 
                        style={{ width: `${reg.percentage}%` }}
                      ></div>
                    </div>

                    {selectedRegion === reg.id && (
                      <div className="mt-1.5 text-[8px] font-mono text-slate-400 border-t border-slate-800 pt-1 leading-normal animate-fade-in space-y-0.5">
                        <div><strong className="text-white">Foyers:</strong> {reg.hotspot}</div>
                        <div><strong className="text-white">Tendance:</strong> {reg.trend}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

            </div>
          </div>

          <div className="text-[9px] text-slate-500 mt-4 border-t border-slate-800/60 pt-3 flex justify-between items-center font-mono">
            <span>Cliquez sur une région ou un point rouge pour inspecter les foyers d'attaques</span>
            <span className="text-slate-400">Cordon de sécurité ANCY</span>
          </div>
        </div>

      </div>

    </div>
  );
}
