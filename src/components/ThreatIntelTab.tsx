import React, { useState } from "react";
import { 
  Rss, 
  Cpu, 
  CheckCircle, 
  Sparkles, 
  Terminal, 
  FolderPlus, 
  Send, 
  AlertOctagon, 
  Eye, 
  Settings,
  ShieldCheck,
  Globe,
  Smartphone,
  Copy,
  X,
  Trash2
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
  
  // Scraper Tab State
  const [intelSubTab, setIntelSubTab] = useState<"scraping" | "manual">("scraping");
  const [selectedModel, setSelectedModel] = useState<"gemini" | "claude" | "gpt" | "grok">("gemini");
  
  // Custom manual content text field
  const [suspectText, setSuspectText] = useState("");
  const [analyzingManual, setAnalyzingManual] = useState(false);
  const [manualResult, setManualResult] = useState<any | null>(null);

  // Loading state for scraping article actions
  const [processingArticles, setProcessingArticles] = useState<Record<string, boolean>>({});

  // Form states for manual submission
  const suspectSamples = [
    {
      title: "Phishing SMS Moov Africa",
      text: "Félicitations! Moov Africa vous offre un bonus de 250.000F CFA pour la fidélité de 5 ans. Pour recevoir l'argent composez immédiatement la syntaxe secu *155*4*1*500000# et entrez votre code PIN secrete pour valider l'enregistrement de la Banque Centrale de Lomé."
    },
    {
      title: "Portail Clone de la CEET",
      text: "Cher client, votre facture d'électricité n'849102-TG est impayée. Une coupure de courant générale interviendra sous 12h. Veuillez régulariser d'urgence via notre site sécurisé de facturation togolais: https://ceet-facturation-pay.cf/billing/?id=92. Ne partagez pas vos codes."
    },
    {
      title: "Arnaque de faux dépôts Yas / Moov Africa",
      text: "URGENT T-Money: Vous venez de recevoir un dépôt par erreur de +350.000F CFA depuis la succursale du Grand Marché de Lomé. Nous vous prions de renvoyer le même montant au numéro du superviseur financier +228 92 12 45 61 pour corriger les livres comptables."
    }
  ];

  const handleManualAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspectText || suspectText.trim().length === 0) return;

    setAnalyzingManual(true);
    setManualResult(null);

    try {
      const response = await fetch("/api/threats/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: suspectText })
      });
      const resData = await response.json();
      if (resData.success) {
        setManualResult(resData.analysis);
      } else {
        alert("Erreur lors de l'analyse IA : " + resData.error);
      }
    } catch (e) {
      console.error("Manual analysis failed", e);
    } finally {
      setAnalyzingManual(false);
    }
  };

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

  return (
    <div className="space-y-6 leading-relaxed">
      
      {/* Tab toggle buttons */}
      <div className="flex border-b border-white/5 w-full">
        <button 
          onClick={() => setIntelSubTab("scraping")}
          className={`flex-1 w-1/2 py-3.5 font-mono text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${intelSubTab === "scraping" ? "border-[#3B82F6] text-white bg-white/[0.02]" : "border-transparent text-[#94A3B8] hover:text-[#E5E7EB]"}`}
        >
          <Rss className="w-4 h-4 text-[#3B82F6]" />
          EXFILTRATION AUTOMATIQUE (CERT.TG &amp; ANCY)
        </button>
        <button 
          onClick={() => setIntelSubTab("manual")}
          className={`flex-1 w-1/2 py-3.5 font-mono text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${intelSubTab === "manual" ? "border-[#3B82F6] text-white bg-white/[0.02]" : "border-transparent text-[#94A3B8] hover:text-[#E5E7EB]"}`}
        >
          <Cpu className="w-4 h-4 text-[#06B6D4]" />
          SAISIE ET ANALYSE MANUELLE DE MESSAGES FRAUDULEUX
        </button>
      </div>

      {intelSubTab === "scraping" ? (
        // 1. Scraping module (cert.tg, ancy.gouv.tg)
        <div className="space-y-6 animate-fade-in">
          <div className="bg-[#121A2F] border border-white/5 rounded-xl p-6 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Rss className="w-4.5 h-4.5 text-[#3B82F6]" />
                  Note d&apos;Exfiltration de Renseignement Administratif (Togo Cyber threat-intel)
                </h3>
                <p className="text-[11px] text-[#94A3B8] mt-1 font-sans">Automatisation d&apos;écoute et scraping de flux CERT.TG d&apos;Anécho à Cinkassé pour conversion en signatures mobiles de blocage.</p>
              </div>

              <button 
                onClick={onRefreshFeeds}
                disabled={fetchingFeed}
                className="px-4 py-2 bg-[#3B82F6] hover:bg-[#3B82F6]/90 active:bg-indigo-700 disabled:bg-[#121A2F] disabled:text-slate-500 text-white rounded-lg text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-2 shrink-0 transition cursor-pointer shadow-sm"
              >
                {fetchingFeed ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Exfiltration...
                  </>
                ) : (
                  <>
                    <Rss className="w-3.5 h-3.5" />
                    FORCER EXFILTRATION CERT-TG
                  </>
                )}
              </button>
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
              {scrapedArticles.map((article) => (
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
                              <span className="text-[9px] text-slate-500 font-mono block uppercase">Relevance Togo</span>
                              <span className="text-[#94A3B8] font-sans text-[10px] line-clamp-2 block leading-snug">{article.analysis.togoRelevance}</span>
                            </div>
                          </div>

                          {/* Actionable signature indicators */}
                          <div className="mt-3">
                            <span className="text-[9px] text-slate-500 font-mono font-bold uppercase block mb-2">Signatures identifiées par l&apos;IA :</span>
                            <div className="space-y-2 max-h-24 overflow-y-auto pr-1">
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

                        <span className="text-[9px] font-mono text-[#10B981] uppercase font-bold block mt-3">Prêt pour la synchronisation immédiate avec Lomé HQ</span>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <Terminal className="w-7 h-7 text-slate-700 mb-2 animate-pulse" />
                        <span className="text-xs text-slate-500 font-mono uppercase">Attente de l&apos;analyse IA</span>
                        <p className="text-[10px] text-slate-600 font-mono mt-1 uppercase">Appuyez sur &quot;Analyser avec l&apos;IA&quot; pour extraire les indicateurs</p>
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // 2. Manual suspect input
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in text-xs">
          
          {/* Saisie (Left 5 Columns) */}
          <div className="bg-[#121A2F] border border-white/5 rounded-xl p-6 lg:col-span-5 space-y-4 shadow-md">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Cpu className="w-4.5 h-4.5 text-[#3B82F6]" />
                Soumettre un message suspect
              </h3>
              <p className="text-[11px] text-[#94A3B8] mt-1">Collez le corps d&apos;un SMS suspicieux ou mail frauduleux circulant au Togo. L&apos;IA extraira immédiatement les indicateurs forensiques pour la base.</p>
            </div>

            {/* Quick samples */}
            <div className="bg-[#0B1020]/60 p-3 rounded-lg border border-white/5">
              <span className="text-[9px] text-slate-500 font-mono tracking-widest block mb-2 uppercase font-bold">Échantillons types au Togo :</span>
              <div className="grid grid-cols-1 gap-2">
                {suspectSamples.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSuspectText(sample.text)}
                    className="text-left text-[11px] bg-[#121A2F] hover:bg-[#3B82F6]/10 p-2 rounded border border-white/5 text-[#94A3B8] hover:text-white transition block truncate font-mono cursor-pointer"
                  >
                    💡 {sample.title}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleManualAnalyze} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 block uppercase font-bold">MOTEUR COGNITIF INTÉGRÉ :</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as any)}
                  className="w-full bg-[#0B1020] border border-white/5 p-2.5 rounded-lg text-slate-300 focus:outline-none focus:border-[#3B82F6] font-mono text-xs cursor-pointer"
                >
                  <option value="gemini">✨ Gemini Flash Enterprise (Défaut SOC)</option>
                  <option value="claude">Anthropic Claude 3.5 Sonnet</option>
                  <option value="gpt">OpenAI ChatGPT-4o Pro</option>
                  <option value="grok">xAI Grok Ultra (Cyber-grounded)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 block font-bold uppercase">Corps du SMS / Message complet :</label>
                <textarea
                  value={suspectText}
                  onChange={(e) => setSuspectText(e.target.value)}
                  rows={5}
                  placeholder="Exemple: Félicitations Moov! Vous avez gagné 250.000F..."
                  className="w-full bg-[#0B1020] border border-white/5 p-4 rounded-xl text-xs font-mono text-slate-350 focus:outline-none focus:border-[#3B82F6] leading-relaxed"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={analyzingManual || suspectText.trim().length === 0}
                className="w-full py-3 bg-[#3B82F6] hover:bg-[#3B82F6]/90 active:bg-[#3B82F6]/75 font-mono text-xs font-bold uppercase rounded-xl text-white flex items-center justify-center gap-2 disabled:bg-[#121A2F] disabled:text-slate-650 transition cursor-pointer"
              >
                {analyzingManual ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Analyse en cours par l&apos;IA...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    PROCÉDER À L&apos;ANALYSE IA INSTANTANÉE
                  </>
                )}
              </button>
            </form>
          </div>

          {/* AI Result Cards (Right 7 columns) */}
          <div className="bg-[#121A2F] border border-white/5 rounded-xl p-6 lg:col-span-7 flex flex-col justify-between shadow-md">
            {analyzingManual ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4 min-h-[350px]">
                <Cpu className="w-10 h-10 text-[#06B6D4] animate-spin" />
                <div>
                  <h4 className="text-xs font-bold text-white font-mono tracking-wider uppercase">ACTIVATION COGNITIVE CYBER-FORENSIC</h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase">L&apos;Inférence active analyse l&apos;ingénierie sociale et extrait les adresses frauduleuses...</p>
                </div>
              </div>
            ) : manualResult ? (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  
                  {/* Title and Verdict badge */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/5 pb-3">
                    <div>
                      <h4 className="text-xs font-bold text-white tracking-wide font-mono uppercase leading-normal">{manualResult.summary}</h4>
                      <p className="text-[9px] text-slate-550 font-mono mt-0.5 uppercase">Moteur d&apos;inférence actif : <span className="text-[#3B82F6] font-bold">{selectedModel.toUpperCase()}</span></p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono border font-bold uppercase tracking-wide ${manualResult.isPhishing ? "bg-[#EF4444]/15 border-[#EF4444]/25 text-[#EF4444]" : "bg-[#10B981]/15 border-[#10B981]/25 text-[#10B981]"}`}>
                        {manualResult.isPhishing ? "MENACE SUSPECTE" : "ÉLÉMENT SAIN / CONFORME"}
                      </span>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono border font-bold uppercase ${manualResult.severity === "Critical" ? "bg-[#EF4444]/15 border-rose-700/60 text-[#EF4444]" : "bg-[#0B1020] border-white/5 text-slate-400"}`}>
                        PRIORITÉ: {manualResult.severity === "Critical" ? "CRITIQUE" : "NORMALE"}
                      </span>
                    </div>
                  </div>

                  {/* Confidence metrics and indicator Type */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-[#0B1020]/60 p-3 rounded-lg border border-white/5">
                      <span className="text-[9px] text-slate-500 font-mono block uppercase">Indice de Confiance IA</span>
                      <span className="text-xs font-bold text-white font-mono block mt-1">{(manualResult.confidence * 100).toFixed(0)}%</span>
                    </div>

                    <div className="bg-[#0B1020]/60 p-3 rounded-lg border border-white/5">
                      <span className="text-[9px] text-slate-500 font-mono block uppercase">Type de l&apos;IoC</span>
                      <span className="text-xs font-bold text-[#3B82F6] font-mono uppercase block mt-1">{manualResult.compromiseType}</span>
                    </div>

                    <div className="bg-[#0B1020]/60 p-3 rounded-lg border border-white/5">
                      <span className="text-[9px] text-slate-500 font-mono block uppercase">Juridiction Ciblée</span>
                      <span className="text-xs font-bold text-[#06B6D4] font-mono block mt-1 uppercase">République du Togo</span>
                    </div>
                  </div>

                  {/* Extracted Indicators list */}
                  <div>
                    <span className="text-[9px] font-mono text-slate-500 block mb-2 uppercase font-bold">INDICATEURS DE COMPROMISSION (IoC) EXTRAITS :</span>
                    <div className="flex flex-wrap gap-2">
                      {manualResult.threatIndicators && manualResult.threatIndicators.map((ioc: string, idx: number) => (
                        <div key={idx} className="bg-[#0B1020] border border-white/5 px-3 py-1.5 rounded-lg flex items-center justify-between text-xs font-mono text-slate-200">
                          <span className="mr-3 font-bold text-white">{ioc}</span>
                          <button
                            onClick={() => {
                              onAddIoCToDatabase(manualResult.compromiseType, ioc, manualResult.severity, "Message suspect d'analyse IA: " + manualResult.explanation.slice(0, 120));
                              alert(`Signature "${ioc}" poussée à la base active.`);
                            }}
                            className="bg-[#10B981]/15 hover:bg-[#10B981] border border-[#10B981]/25 px-1.5 py-0.5 text-[9px] text-[#10B981] hover:text-white rounded font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <FolderPlus className="w-3 h-3" />
                            PUSH BD
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Forensic Description */}
                  <div className="bg-[#3B82F6]/5 border border-[#3B82F6]/15 p-4 rounded-xl space-y-2">
                    <span className="text-[9px] text-[#3B82F6] font-mono font-bold block uppercase flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-[#3B82F6]" />
                      EXPLICATION ET STRATÉGIE DE FRAUDE DÉTECTÉE :
                    </span>
                    <p className="text-[11px] text-[#94A3B8] leading-relaxed font-sans">{manualResult.explanation}</p>
                  </div>

                </div>

                <div className="border-t border-white/5 pt-4 flex items-center justify-between text-[10px] font-mono text-slate-550 uppercase">
                  <span>Prêt pour inclusion dans le rapport judiciaire</span>
                  <span>SENTINEL Admin Portal SP</span>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 min-h-[350px]">
                <AlertOctagon className="w-10 h-10 text-slate-800 mb-3" />
                <h4 className="text-xs font-bold text-slate-500 font-mono uppercase tracking-widest">En attente de soumission</h4>
                <p className="text-xs text-slate-600 max-w-sm font-mono mt-1 uppercase">Collez ou cliquez sur un échantillon togolais à gauche, puis cliquez sur Analyser pour réveiller le moteur de classification.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
