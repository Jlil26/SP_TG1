import React, { useState } from "react";
import { 
  Terminal, 
  Search, 
  Plus, 
  CheckCircle2, 
  AlertOctagon, 
  HelpCircle,
  FileBadge,
  ShieldCheck,
  MapPin,
  Flame,
  X,
  Globe,
  Lock,
  LockOpen,
  AlertTriangle,
  Lightbulb,
  Cpu,
  Brain
} from "lucide-react";
import { Threat } from "../types";

interface Props {
  threats: Threat[];
  onAddSandboxThreat: (threatData: {
    type: "domain" | "ip" | "email" | "phone";
    value: string;
    severity: "Low" | "Medium" | "Critical";
    location: string;
    details: string;
    addImmediate: boolean;
  }) => Promise<any>;
}

export default function SandboxTab({ threats, onAddSandboxThreat }: Props) {
  // Navigation internal to Sandbox
  const [sandboxSubTab, setSandboxSubTab] = useState<"registry" | "ai_link">("registry");

  // Sub-Tab 1: Registry Query
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<{
    exists: boolean;
    match: Threat | null;
    message: string;
  } | null>(null);

  // Sub-Tab 2: Deep AI Link Scanner
  const [targetUrl, setTargetUrl] = useState("");
  const [analyzingUrl, setAnalyzingUrl] = useState(false);
  const [urlAnalysisResult, setUrlAnalysisResult] = useState<any | null>(null);

  // Confirmation/Manual additions configuration
  const [ioCType, setIoCType] = useState<"domain" | "ip" | "email" | "phone">("domain");
  const [severity, setSeverity] = useState<"Low" | "Medium" | "Critical">("Medium");
  const [location, setLocation] = useState("Lomé");
  const [details, setDetails] = useState("");

  const handleRegistryQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch("/api/sandbox/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: searchQuery })
      });
      const data = await response.json();
      if (data.success) {
        setSearchResult({
          exists: data.exists,
          match: data.match,
          message: data.message
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeepUrlScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl.trim()) return;

    setAnalyzingUrl(true);
    setUrlAnalysisResult(null);

    try {
      const response = await fetch("/api/sandbox/analyze-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl })
      });
      const data = await response.json();
      if (data.success) {
        setUrlAnalysisResult(data.analysis);
      } else {
        alert("Erreur lors de l'analyse : " + data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzingUrl(false);
    }
  };

  const handleConfirmFraud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const response = await onAddSandboxThreat({
        type: ioCType,
        value: searchQuery,
        severity,
        location,
        details: details || "Déclaré et scellé depuis le Sandbox d'administration.",
        addImmediate: true
      });

      if (response.success) {
        setSearchResult({
          exists: true,
          match: response.match,
          message: response.message
        });
        alert(`Indicateur "${searchQuery}" déclaré frauduleux.`);
        setDetails("");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLockScannedUrlAsThreat = async () => {
    if (!urlAnalysisResult) return;

    try {
      const response = await onAddSandboxThreat({
        type: "domain",
        value: urlAnalysisResult.url.replace(/https?:\/\//i, "").split("/")[0],
        severity: urlAnalysisResult.riskRating === "Dangerous" ? "Critical" : "Medium",
        location: "Lomé",
        details: `Scellé via l'analyseur de liens IA : Impersonation de ${urlAnalysisResult.entityImpersonated}. Catégorie: ${urlAnalysisResult.scamCategory}.`,
        addImmediate: true
      });

      if (response.success) {
        alert(`Domaine ${urlAnalysisResult.url} bloqué et scellé avec succès !`);
        setSearchQuery(urlAnalysisResult.url);
        onAddSandboxThreat({ type: "domain", value: urlAnalysisResult.url, severity: "Critical", location: "Lomé", details: "", addImmediate: true });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const clearRegistrySearch = () => {
    setSearchQuery("");
    setSearchResult(null);
  };

  const clearUrlScan = () => {
    setTargetUrl("");
    setUrlAnalysisResult(null);
  };

  return (
    <div className="space-y-6 leading-relaxed">
      
      {/* Tab Selectors */}
      <div className="flex border-b border-white/5 w-full">
        <button 
          onClick={() => setSandboxSubTab("registry")}
          className={`flex-1 w-1/2 py-3 font-mono text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${sandboxSubTab === "registry" ? "border-[#3B82F6] text-white bg-white/[0.02]" : "border-transparent text-[#94A3B8] hover:text-[#E5E7EB]"}`}
        >
          <Search className="w-4 h-4 text-[#3B82F6]" />
          INTERROGER LE REGISTRE CENTRAL
        </button>
        <button 
          onClick={() => setSandboxSubTab("ai_link")}
          className={`flex-1 w-1/2 py-3 font-mono text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${sandboxSubTab === "ai_link" ? "border-[#3B82F6] text-white bg-white/[0.02]" : "border-transparent text-[#94A3B8] hover:text-[#E5E7EB]"}`}
        >
          <Cpu className="w-4 h-4 text-[#06B6D4] animate-pulse" />
          ANALYSEUR DE LIENS PAR IA (SANDBOX CYBER-INTELLIGENCE)
        </button>
      </div>

      {/* Mode d'emploi simple et intuitif */}
      <div className="bg-[#121A2F] border border-white/5 rounded-xl p-4 flex items-start gap-3 text-xs font-mono shadow-sm">
        <Lightbulb className="w-4.5 h-4.5 text-[#06B6D4] shrink-0 mt-0.5 animate-pulse" />
        <div>
          <span className="font-bold text-white uppercase block text-[10px] tracking-wide">GUIDE RAPIDE DU BAC À SABLE DE DIAGNOSTICS</span>
          <p className="mt-1 text-[#94A3B8]">
            Saisissez un indicateur suspect ci-dessous pour <strong className="text-[#E5E7EB]">Interroger le Registre Central</strong> des menaces actives. Si l&apos;élément n&apos;est pas repertorié, vous pourrez l&apos;ajouter d&apos;urgence en un clic pour une synchronisation réseau immédiate.
          </p>
        </div>
      </div>

      {sandboxSubTab === "registry" ? (
        // MODULE 1: Central Registry Queries & Direct Locking
        <div className="space-y-6 animate-fade-in">
          
          {/* Diagnostic Search Input - Streamlined 100% Container */}
          <div className="w-full">
            <div className="bg-[#121A2F] border border-white/5 rounded-xl p-6 space-y-4 shadow-md">
              <div>
                <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <Search className="w-4.5 h-4.5 text-[#3B82F6]" />
                  Bac à sable - Validation d&apos;Adresses Suspectes
                </h3>
                <p className="text-[11px] text-[#94A3B8] mt-1 font-sans">Saisissez une adresse IP suspecte, un numéro de téléphone, un domaine frauduleux ou un e-mail pour interroger le registre national central de cyber-fraude.</p>
              </div>

              <form onSubmit={handleRegistryQuery} className="relative mt-2 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Saisissez l'élément suspect (ex: toggotelecom-tmoney.com, +22899120485...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0B1020] border border-white/5 focus:border-[#3B82F6] text-xs font-mono text-[#E5E7EB] pl-10 pr-10 py-3 rounded-lg focus:outline-none"
                  />
                  {searchQuery && (
                    <button 
                      type="button" 
                      onClick={clearRegistrySearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-550 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!searchQuery.trim()}
                  className="py-3 px-6 bg-[#3B82F6] hover:bg-[#3B82F6]/90 disabled:bg-[#121A2F] disabled:text-slate-650 font-mono text-xs font-bold text-white rounded-lg transition shrink-0 uppercase tracking-wider cursor-pointer"
                >
                  VÉRIFIER
                </button>
              </form>

              {/* Result display */}
              {searchResult && (
                <div className="mt-4 animate-fade-in text-xs">
                  {searchResult.exists && searchResult.match ? (
                    <div className="p-5 bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-xl space-y-4">
                      <div className="flex items-start gap-3">
                        <AlertOctagon className="w-5.5 h-5.5 text-[#EF4444] shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-[#EF4444] uppercase tracking-wider font-mono">FRAUDE ENREGISTRÉE &bull; SIGNAL DE SÉCURITÉ CONNU</h4>
                          <p className="text-[11px] text-[#94A3B8] leading-relaxed font-sans mt-2">
                            {searchResult.message}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] font-mono mt-4 pt-3 border-t border-white/5">
                        <div>
                          <span className="text-slate-500 uppercase block">Valeur bloquée</span>
                          <span className="text-white font-bold break-all">{searchResult.match.value}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 uppercase block">Sévérité</span>
                          <span className="text-[#EF4444] font-bold uppercase">{searchResult.match.severity}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 uppercase block">Identifié à</span>
                          <span className="text-slate-300 font-bold">{searchResult.match.location || "Lomé"}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 uppercase block">Statut Actuel</span>
                          <span className="text-[#3B82F6] uppercase font-bold">{searchResult.match.status}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 bg-[#0B1020]/45 border border-white/5 rounded-xl space-y-4">
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="w-5.5 h-5.5 text-[#10B981] shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-[#10B981] uppercase tracking-wider font-mono">INDICE DE MENACE ABSENT (NON ENREGISTRÉ)</h4>
                          <p className="text-[11px] text-[#94A3B8] font-sans mt-1 leading-relaxed">
                            L&apos;élément suspect <strong className="text-white font-mono">&quot;{searchQuery}&quot;</strong> n&apos;apparaît pas encore dans le registre national central de cyber-fraude pour le moment.
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <p className="text-[10px] text-slate-500 leading-normal max-w-2xl font-mono uppercase">
                          💡 CONSEIL DE SYNC : Si vous confirmez que cet indicateur est dangereux, importez-le d&apos;urgence en un clic pour déployer le blocage actif réseau.
                        </p>

                        <button
                          onClick={async () => {
                            let estimatedType: "domain" | "ip" | "email" | "phone" = "domain";
                            const val = searchQuery.toLowerCase().trim();
                            if (val.includes("@")) estimatedType = "email";
                            else if (/^[+0-9\s()#-]+$/.test(val)) estimatedType = "phone";
                            else if (/^[0-9.]+$/.test(val)) estimatedType = "ip";

                            const response = await onAddSandboxThreat({
                              type: estimatedType,
                              value: searchQuery.trim(),
                              severity: "Critical",
                              location: "Lomé",
                              details: "Insertion d'urgence effectuée suite à une vérification négative sur le Sandbox central.",
                              addImmediate: true
                            });

                            if (response.success) {
                              setSearchResult({
                                exists: true,
                                match: response.match || {
                                  id: "temp",
                                  value: searchQuery.trim(),
                                  type: estimatedType,
                                  severity: "Critical",
                                  location: "Lomé",
                                  details: "Insertion d'urgence suite à une recherche négative sur le Sandbox central.",
                                  status: "active"
                                },
                                message: `L'élément "${searchQuery}" a été immédiatement injecté d'urgence dans la base active.`
                              });
                            }
                          }}
                          className="py-2.5 px-5 bg-[#EF4444] hover:bg-[#EF4444]/90 hover:shadow-lg hover:shadow-[#EF4444]/10 active:bg-rose-700 text-white font-mono text-xs font-bold rounded-lg uppercase transition-all flex items-center gap-2 shrink-0 self-end sm:self-auto cursor-pointer"
                        >
                          <Flame className="w-3.5 h-3.5 text-white animate-pulse" />
                          Insérer d&apos;urgence dans la base
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!searchResult && (
                <div className="p-8 bg-[#0B1020]/40 border border-white/5 rounded-xl border-dashed flex flex-col items-center justify-center text-center text-slate-600 space-y-2">
                  <Terminal className="w-7 h-7 text-[#94A3B8]/20 mb-1" />
                  <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400">Console Diagnostics Sandbox SP</span>
                  <p className="text-[11px] max-w-md font-mono text-slate-500 uppercase">Prêt pour requêtes d&apos;analyse de menaces nationales. Saisissez une adresse suspecte pour auditer son statut de blocage sur le réseau mobile.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // MODULE 2: Deep AI Link/URL Simulator and Threat Intelligence Sandbox
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in text-xs">
          
          {/* Saisie URL Form (Left 4 Columns) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#121A2F] border border-white/5 rounded-xl p-6 space-y-4 shadow-md">
              <div className="flex items-start gap-3">
                <Brain className="w-8 h-8 text-[#3B82F6] shrink-0" />
                <div>
                  <h3 className="text-xs font-bold text-white tracking-wider font-mono uppercase">
                    SAISIE STATION D&apos;OBSERVATION DE LIEN
                  </h3>
                  <p className="text-[11px] text-[#94A3B8] mt-1">Saisissez l&apos;adresse URL d&apos;un portail suspect pour exécuter un micro-audit par l&apos;IA du SOC PHISHING TG.</p>
                </div>
              </div>

              <form onSubmit={handleDeepUrlScan} className="space-y-4 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-500 block uppercase">Adresse URL / Lien à Inspecter :</label>
                  <input
                    type="text"
                    required
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="Ex: http://ceet-facturation-tmoney.net"
                    className="w-full bg-[#0B1020] border border-white/5 focus:border-[#3B82F6] p-3 rounded-lg text-xs font-mono text-[#E5E7EB] focus:outline-none"
                  />
                </div>

                <div className="text-[10px] space-y-2 text-[#94A3B8] font-mono bg-[#0B1020]/60 p-3 border border-white/5 rounded">
                  <p className="font-bold text-slate-300 uppercase block text-[9px] tracking-wider">&bull; Critères d&apos;analyse :</p>
                  <p>- Typosquattage CEET / OTR / Opérateurs</p>
                  <p>- Certificat SSL / HTTP non sécurisé</p>
                  <p>- Vecteurs de grooming / Incitations physiques</p>
                  <p>- Tentative de phishing de carte mobile / T-Money</p>
                </div>

                <button
                  type="submit"
                  disabled={analyzingUrl || !targetUrl.trim()}
                  className="w-full py-3 bg-[#3B82F6] hover:bg-[#3B82F6]/90 disabled:bg-[#121A2F] disabled:text-slate-550 font-mono text-xs font-bold text-white rounded-xl uppercase transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {analyzingUrl ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                      DIAGNOSTIC IA EN COURS...
                    </>
                  ) : (
                    <>
                      <Cpu className="w-4 h-4 text-cyan-200" />
                      LANCER DIAGNOSTIC IA LIEN
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Verification Audit Display Panel (Right 8 Columns) */}
          <div className="lg:col-span-8">
            {urlAnalysisResult ? (
              <div className="bg-[#121A2F] border border-white/5 rounded-xl p-6 space-y-6 animate-fade-in relative overflow-hidden shadow-md">
                {/* Visual header severity state */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  urlAnalysisResult.riskRating === "Dangerous" ? "bg-[#EF4444]" :
                  urlAnalysisResult.riskRating === "Suspicious" ? "bg-amber-400" : "bg-[#10B981]"
                }`}></div>

                {/* Main Identity and Rating */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[9px] font-mono text-[#3B82F6] tracking-widest block uppercase font-bold">DOSSIER DE CYBER INTEL</span>
                    <h3 className="text-xs font-bold text-white font-mono break-all mt-1">{urlAnalysisResult.url}</h3>
                  </div>

                  <span className={`px-3 py-1.5 rounded-lg border font-mono text-[10px] font-bold shrink-0 text-center ${
                    urlAnalysisResult.riskRating === "Dangerous" ? "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/25 animate-pulse" :
                    urlAnalysisResult.riskRating === "Suspicious" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                    "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/25"
                  }`}>
                    {urlAnalysisResult.riskRating === "Dangerous" ? "🚨 RISQUE CRITIQUE" :
                     urlAnalysisResult.riskRating === "Suspicious" ? "⚠️ SUSPECT DIRECT" : "🟢 CONFIANCE VALIDÉE"}
                  </span>
                </div>

                {/* Secondary breakdown details table */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Summary information card */}
                  <div className="bg-[#0B1020]/60 border border-white/5 p-4 rounded-xl space-y-3">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block font-bold">CONCORDANCE ET ENQUÊTE</span>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 font-mono block text-[10px] uppercase">Cible usurpée :</span>
                        <span className="text-white font-mono font-bold block mt-0.5">{urlAnalysisResult.entityImpersonated}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-mono block text-[10px] uppercase">Catégorie :</span>
                        <span className="text-[#3B82F6] font-mono block mt-0.5">{urlAnalysisResult.scamCategory}</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-300 font-sans leading-relaxed pt-2 border-t border-white/5">
                      <span className="font-bold block text-slate-400 font-mono text-[9px] uppercase mb-1">Résumé diagnostique :</span>
                      {urlAnalysisResult.explanation}
                    </div>
                  </div>

                  {/* Technical security checkpoints */}
                  <div className="bg-[#0B1020]/60 border border-white/5 p-4 rounded-xl space-y-3 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block font-bold">ANALYSE TECHNIQUE DU CONTEXTE</span>
                      
                      <div className="space-y-2 mt-3 text-xs font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Certificat SSL sécurisé :</span>
                          {urlAnalysisResult.technicalDetails.missingSSLSimilarity ? (
                            <span className="text-[#EF4444] flex items-center gap-1 font-bold">
                              <LockOpen className="w-3.5 h-3.5" /> NON (HTTP)
                            </span>
                          ) : (
                            <span className="text-[#10B981] flex items-center gap-1 font-bold">
                              <Lock className="w-3.5 h-3.5" /> OUI (SSL)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Extension suspecte (TLD) :</span>
                          {urlAnalysisResult.technicalDetails.suspiciousTLD ? (
                            <span className="text-[#EF4444] font-bold">OUI (.xyz, .tk, .cf...)</span>
                          ) : (
                            <span className="text-slate-400 font-bold">NON</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Âge de domaine officiel :</span>
                          {urlAnalysisResult.technicalDetails.domainAgeSecured ? (
                            <span className="text-[#10B981] font-bold">VÉRIFIÉ</span>
                          ) : (
                            <span className="text-[#EF4444] font-bold">NON RECONNU</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* AI Recommendation section */}
                    <div className="bg-[#121A2F] p-3 border border-white/5 rounded-lg text-[11px] leading-relaxed mt-2 text-slate-300">
                      <span className="font-bold text-[#3B82F6] font-mono block uppercase text-[9px] flex items-center gap-1">
                        <Lightbulb className="w-3.5 h-3.5 text-[#06B6D4]" /> Recommandation SOC AI :
                      </span>
                      <p className="mt-1">{urlAnalysisResult.recommendation}</p>
                    </div>
                  </div>

                </div>

                {/* Actions Panel */}
                {urlAnalysisResult.isPhishing && (
                  <div className="bg-[#EF4444]/5 border border-[#EF4444]/25 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <h4 className="font-bold text-[#EF4444] font-mono uppercase">Vecteur d&apos;attaque identifié !</h4>
                        <p className="text-slate-300 leading-normal font-sans">Voulez-vous pousser cet indice dans la liste de blocage globale des agents mobiles ?</p>
                      </div>
                    </div>

                    <button
                      onClick={handleLockScannedUrlAsThreat}
                      className="py-2.5 px-4 bg-[#EF4444] hover:bg-[#EF4444]/90 text-white font-mono text-xs font-bold rounded-lg uppercase tracking-wide transition flex items-center gap-2 shrink-0 self-end md:self-auto cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-white" />
                      BLOQUER ET CONGÉLER LE LIEN
                    </button>
                  </div>
                )}
                
                {/* Back to clean sandbox button */}
                <div className="flex justify-end pr-1">
                  <button 
                    onClick={clearUrlScan}
                    className="text-[10px] font-mono text-slate-500 hover:text-slate-300 transition cursor-pointer"
                  >
                    Réinitialiser le Sandbox URL
                  </button>
                </div>

              </div>
            ) : (
              <div className="h-full bg-[#121A2F] border border-white/5 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center text-slate-600 min-h-[350px]">
                <Globe className="w-10 h-10 text-slate-800 mb-2 animate-pulse" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#94A3B8]/40">Console de Deep Forensic URL</span>
                <p className="text-xs text-slate-500 mt-2 max-w-sm">Insérez une adresse internet à gauche et lancez le diagnostic. L&apos;IA du SOC PHISHING TG effectuera un scan en sandbox sémantique et signalera l&apos;identité et l&apos;imposture.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
