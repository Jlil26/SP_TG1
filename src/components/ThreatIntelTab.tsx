import React, { useState } from "react";
import { 
  Rss, 
  Cpu, 
  CheckCircle, 
  Sparkles, 
  Terminal, 
  FolderPlus, 
  AlertOctagon, 
  Trash2,
  Calendar,
  Filter,
  Clock
} from "lucide-react";
import { ScrapedArticle } from "../types";

interface Props {
  scrapedArticles: ScrapedArticle[];
  fetchingFeed: boolean;
  onRefreshFeeds: () => void;
  onAIAnalyzeArticle: (articleId: string) => Promise<any>;
  onAddIoCToDatabase: (type: string, value: string, severity: string, details: string) => void;
  onDeleteArticle?: (id: string) => void;
  totalDeletedCount?: number;
  onResetDeleted?: () => void;
}

export default function ThreatIntelTab({ 
  scrapedArticles, 
  fetchingFeed, 
  onRefreshFeeds, 
  onAIAnalyzeArticle,
  onAddIoCToDatabase,
  onDeleteArticle,
  totalDeletedCount = 0,
  onResetDeleted
}: Props) {
  
  // Loading state for scraping article actions
  const [processingArticles, setProcessingArticles] = useState<Record<string, boolean>>({});

  // Clean, proper date filtering state for intelligence feeds matching user request
  const [datePreset, setDatePreset] = useState<"all" | "48h" | "7d" | "30d" | "custom">("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const processArticle = async (id: string) => {
    setProcessingArticles(prev => ({ ...prev, [id]: true }));
    try {
      await onAIAnalyzeArticle(id);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingArticles(prev => ({ ...prev, [id]: false }));
    }
  };

  // Custom high-fidelity sifting logic for live exfiltrations
  const filteredArticles = scrapedArticles.filter(article => {
    const articleDate = new Date(article.date);
    const now = new Date();

    if (datePreset === "48h") {
      const diffMs = now.getTime() - articleDate.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      return diffHours <= 48;
    }
    if (datePreset === "7d") {
      const diffMs = now.getTime() - articleDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    }
    if (datePreset === "30d") {
      const diffMs = now.getTime() - articleDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays <= 30;
    }
    if (datePreset === "custom") {
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (articleDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (articleDate > end) return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6 leading-relaxed">
      
      {/* Scraping module (cert.tg, ancy.gouv.tg) */}
      <div className="space-y-6 animate-fade-in text-xs font-mono">
        <div className="bg-[#121A2F] border border-white/5 rounded-xl p-6 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Rss className="w-4.5 h-4.5 text-[#3B82F6]" />
                EXFILTRATION AUTOMATIQUE DE RENSEIGNEMENTS (CERT.TG &amp; ANCY)
              </h3>
              <p className="text-[11px] text-[#94A3B8] mt-1 font-sans">
                Automatisation d&apos;écoute et de scraping des flux ANCY et CERT.TG au Togo pour conversion directe en signatures de blocage.
              </p>
            </div>
          </div>

          {/* Clean and Tidy Date Interval Filter Toolbar */}
          <div className="mt-5 p-4 bg-[#0B1020]/45 rounded-xl border border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Left side: Date presets and Calendar custom inputs */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest flex items-center gap-1.5 mr-1">
                <Filter className="w-3.5 h-3.5 text-[#3B82F6]" />
                INTERVALLE :
              </span>
              
              <div className="flex bg-[#121A2F]/90 rounded-lg p-0.5 border border-white/5">
                {[
                  { value: "all", label: "Tout" },
                  { value: "48h", label: "48h" },
                  { value: "7d", label: "7j" },
                  { value: "30d", label: "30j" },
                  { value: "custom", label: "Perso 📅" }
                ].map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setDatePreset(preset.value as any)}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all duration-200 cursor-pointer ${
                      datePreset === preset.value 
                        ? "bg-[#3B82F6] text-white shadow-sm font-black" 
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Collapsible custom date bounds */}
              {datePreset === "custom" && (
                <div className="flex flex-wrap items-center gap-2 animate-fade-in">
                  <div className="flex items-center gap-2 bg-[#121A2F]/80 px-2.5 py-1.5 rounded-lg border border-white/5">
                    <span className="text-[9px] text-slate-500 uppercase">Du</span>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-transparent border-none text-white text-xs font-mono focus:outline-none w-28 [color-scheme:dark]"
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-[#121A2F]/80 px-2.5 py-1.5 rounded-lg border border-white/5">
                    <span className="text-[9px] text-slate-500 uppercase">Au</span>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-transparent border-none text-white text-xs font-mono focus:outline-none w-28 [color-scheme:dark]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right side: Scrapped articles tally and trigger scraper */}
            <div className="flex items-center justify-between lg:justify-end gap-4 w-full lg:w-auto mt-2 lg:mt-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-white/5">
              <div className="text-[10px] font-mono text-slate-400">
                Affiche <span className="text-white font-bold">{filteredArticles.length}</span> alertes exfiltrées
              </div>
              
              <button 
                onClick={onRefreshFeeds}
                disabled={fetchingFeed}
                className="px-4 py-2 bg-[#3B82F6] hover:bg-[#3B82F6]/90 active:bg-indigo-700 disabled:bg-[#121A2F] disabled:text-slate-500 text-white rounded-lg text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-2 shrink-0 transition cursor-pointer shadow-sm border border-white/5"
              >
                {fetchingFeed ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Exfiltration...
                  </>
                ) : (
                  <>
                    <Rss className="w-3.5 h-3.5" />
                    EXFILTRER EN DIRECT
                  </>
                )}
              </button>
            </div>

          </div>

          {totalDeletedCount > 0 && onResetDeleted && (
            <div className="mt-5 px-4 py-3 bg-red-500/10 border border-[#EF4444]/20 rounded-xl flex items-center justify-between text-xs text-slate-300">
              <span className="font-mono flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-[#EF4444]" />
                <span><strong>{totalDeletedCount}</strong> annonce{totalDeletedCount > 1 ? "s" : ""} exfiltrée{totalDeletedCount > 1 ? "s" : ""} masquée{totalDeletedCount > 1 ? "s" : ""} de l&apos;espace de travail actif.</span>
              </span>
              <button
                onClick={onResetDeleted}
                className="px-3 py-1.5 bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white rounded text-[10px] font-bold uppercase tracking-wider font-mono transition cursor-pointer"
              >
                Tout réafficher
              </button>
            </div>
          )}

          {/* List of articles */}
          <div className="mt-6 grid grid-cols-1 gap-6">
            {filteredArticles.length === 0 ? (
              <div className="text-center p-12 border border-dashed border-white/5 bg-[#0B1020]/20 rounded-xl">
                <Calendar className="w-7 h-7 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 uppercase tracking-wide text-[11px] font-mono">Aucune annonce trouvée pour cet intervalle</p>
                <p className="text-slate-600 text-[10px] mt-1 font-sans">Veuillez élargir ou réinitialiser votre sélection de dates.</p>
              </div>
            ) : (
              filteredArticles.map((article) => (
                <div key={article.id} className="bg-[#0B1020]/45 border border-white/5 rounded-xl overflow-hidden shadow-sm grid grid-cols-1 xl:grid-cols-12 hover:border-white/10 transition">
                
                {/* Left Column: Article basic */}
                <div className="p-5 xl:col-span-7 flex flex-col justify-between border-b xl:border-b-0 xl:border-r border-white/5">
                  <div>
                    <div className="flex items-center justify-between mb-3 gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-mono font-bold border ${article.source === "CERT.TG" ? "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/25" : "bg-teal-500/10 text-teal-400 border border-teal-500/20"}`}>
                          {article.source}
                        </span>
                        <span className="text-[10px] font-mono text-slate-550 uppercase">
                          {new Date(article.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                        </span>
                      </div>
                      
                      {onDeleteArticle && (
                        <button
                          onClick={() => {
                            if (confirm("Voulez-vous supprimer cette annonce de la liste ?")) {
                              onDeleteArticle(article.id);
                            }
                          }}
                          className="text-slate-500 hover:text-rose-500 transition-colors uppercase font-mono font-bold text-[9px] flex items-center gap-1.5 px-2 py-1 bg-red-500/5 hover:bg-red-500/10 rounded-md border border-white/5 cursor-pointer hover:border-rose-500/30"
                          title="Supprimer l'annonce"
                        >
                          <Trash2 className="w-3 h-3" />
                          Supprimer
                        </button>
                      )}
                    </div>
                    
                    <h4 className="text-xs font-bold text-white tracking-wider mb-2 font-mono uppercase">{article.title}</h4>
                    <p className="text-[11px] text-[#94A3B8] leading-relaxed font-sans">{article.snippet}</p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] font-mono">
                    <span className="text-slate-550 truncate max-w-xs">{article.sourceUrl}</span>
                    
                    {/* Processing status or trigger button */}
                    {article.processed ? (
                      <span className="text-[#10B981] font-mono font-bold flex items-center gap-1.5 shrink-0 bg-[#10B981]/15 px-2 py-1 rounded border border-[#10B981]/25 uppercase text-[9px]">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Classifié par l&apos;IA du SOC
                      </span>
                    ) : (
                      <button 
                        onClick={() => processArticle(article.id)}
                        disabled={processingArticles[article.id]}
                        className="px-3 py-1.5 bg-[#3B82F6]/10 hover:bg-[#3B82F6] text-[#3B82F6] hover:text-white border border-[#3B82F6]/25 font-mono text-[10px] font-bold uppercase rounded transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        {processingArticles[article.id] ? (
                          <>
                            <span className="w-3 h-3 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin"></span>
                            Traitement...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 text-[#06B6D4]" />
                            Analyser par l&apos;IA
                          </>
                        )}
                      </button>
                    )}

                  </div>
                </div>

                {/* Right Column: AI Extraction and action push to Database */}
                <div className="p-5 xl:col-span-5 bg-[#0B1020]/25 flex flex-col justify-between">
                  {article.processed && article.analysis ? (
                    <div className="space-y-4 h-full flex flex-col justify-between">
                      <div>
                        <p className="text-[9px] font-mono text-slate-500 uppercase font-bold flex items-center gap-1">
                          <Cpu className="w-3.5 h-3.5 text-[#3B82F6]" />
                          INTELLIGENCE COGNITIVE DE MENACE (IoC)
                        </p>
                        
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-[#0B1020]/70 p-2 rounded border border-white/5">
                            <span className="text-[9px] text-slate-500 font-mono block uppercase">Catégorie</span>
                            <span className="text-white font-mono font-bold text-[11px] block mt-0.5">{article.analysis.category}</span>
                          </div>
                          <div className="bg-[#0B1020]/70 p-2 rounded border border-white/5 border-dashed">
                            <span className="text-[9px] text-slate-500 font-mono block uppercase">Pertinence Togo</span>
                            <span className="text-[#94A3B8] font-sans text-[10px] line-clamp-2 block leading-snug">{article.analysis.togoRelevance}</span>
                          </div>
                        </div>

                        {/* Actionable signature indicators */}
                        <div className="mt-3">
                          <span className="text-[9px] text-slate-500 font-mono font-bold uppercase block mb-2">Signatures identifiées par l&apos;IA :</span>
                          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                            {article.analysis.detectedMaliciousIndicators.map((ioc, idx) => (
                              <div key={idx} className="bg-[#0B1020] border border-white/5 rounded p-2 flex items-center justify-between text-xs">
                                <div className="font-mono flex items-center gap-2 truncate">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold border ${ioc.type === "domain" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : ioc.type === "phone" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-[#121A2F] text-slate-400 border border-white/5"}`}>
                                    {ioc.type}
                                  </span>
                                  <span className="text-white truncate font-bold">{ioc.valeur}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className={`px-1 rounded text-[8px] uppercase font-bold ${ioc.severity === "Critical" ? "bg-[#EF4444]/15 text-[#EF4444]" : "bg-amber-500/10 text-amber-500"}`}>
                                    {ioc.severity}
                                  </span>
                                  <button 
                                    onClick={() => onAddIoCToDatabase(ioc.type, ioc.valeur, ioc.severity, `Extrait de ${article.source}: ${ioc.description}`)}
                                    className="px-1.5 py-0.5 bg-[#10B981] hover:bg-[#10B981]/90 text-white font-mono text-[8px] font-bold uppercase rounded flex items-center gap-1 transition cursor-pointer"
                                    title="Ajouter immédiatement à la base active"
                                  >
                                    <FolderPlus className="w-2.5 h-2.5" />
                                    PUSH
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <span className="text-[9px] font-mono text-[#10B981] uppercase font-bold block mt-3">Prêt pour la synchronisation immédiate avec l&apos;application mobile</span>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <Terminal className="w-7 h-7 text-slate-700 mb-2 animate-pulse" />
                      <span className="text-xs text-slate-500 font-mono uppercase">Attente de l&apos;analyse IA</span>
                      <p className="text-[10px] text-slate-600 font-mono mt-1 uppercase">Appuyez sur &quot;Analyser par l&apos;IA&quot; pour extraire les indicateurs de menace</p>
                    </div>
                  )}
                </div>

              </div>
            )))}
          </div>
        </div>
      </div>

    </div>
  );
}
