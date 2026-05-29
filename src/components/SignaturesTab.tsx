import React, { useState, useMemo } from "react";
import { 
  Database, 
  Search, 
  Trash2, 
  Edit2, 
  Plus, 
  Check, 
  X, 
  AlertTriangle, 
  MapPin, 
  Filter, 
  FileText,
  Activity,
  User,
  AlertCircle
} from "lucide-react";
import { Threat } from "../types";

interface Props {
  threats: Threat[];
  onRefreshData: () => Promise<void>;
}

export default function SignaturesTab({ threats, onRefreshData }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [editingThreat, setEditingThreat] = useState<Threat | null>(null);

  // Non-blocking visual notifications state
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);

  const showFeedback = (type: "success" | "error" | "warning", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 8000);
  };

  // New Threat form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [newType, setNewType] = useState<"domain" | "ip" | "email" | "phone" | "text_pattern">("domain");
  const [newSeverity, setNewSeverity] = useState<"Low" | "Medium" | "Critical">("Medium");
  const [newLocation, setNewLocation] = useState("Lomé");
  const [newDetails, setNewDetails] = useState("");

  // Edit Threat states
  const [editValue, setEditValue] = useState("");
  const [editType, setEditType] = useState<"domain" | "ip" | "email" | "phone" | "text_pattern">("domain");
  const [editSeverity, setEditSeverity] = useState<"Low" | "Medium" | "Critical">("Medium");
  const [editLocation, setEditLocation] = useState("");
  const [editDetails, setEditDetails] = useState("");

  const filteredThreats = useMemo(() => {
    return threats.filter(t => {
      const matchSearch = 
        t.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.details || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = typeFilter === "all" || t.type === typeFilter;
      const matchSeverity = severityFilter === "all" || t.severity === severityFilter;
      return matchSearch && matchType && matchSeverity;
    });
  }, [threats, searchTerm, typeFilter, severityFilter]);

  const handleStartEdit = (threat: Threat) => {
    setEditingThreat(threat);
    setEditValue(threat.value);
    setEditType(threat.type);
    setEditSeverity(threat.severity);
    setEditLocation(threat.location);
    setEditDetails(threat.details || "");
  };

  const handleCancelEdit = () => {
    setEditingThreat(null);
  };

  const handleDeleteThreat = async (id: string, value: string) => {
    if (!window.confirm(`Voulez-vous définitivement supprimer la signature "${value}" de la base de données SOC ?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/threats/${id}`, {
        method: "DELETE"
      });
      const data = await response.json();
      if (data.success) {
        showFeedback("success", `La signature "${value}" a été supprimée définitivement.`);
        await onRefreshData();
      } else {
        showFeedback("error", "Erreur lors de la suppression : " + data.error);
      }
    } catch (err) {
      console.error(err);
      showFeedback("error", "Erreur de connexion lors de la suppression.");
    }
  };

  const handleUpdateThreat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingThreat) return;

    try {
      const response = await fetch(`/api/threats/${editingThreat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: editValue,
          type: editType,
          severity: editSeverity,
          location: editLocation,
          details: editDetails
        })
      });

      const data = await response.json();
      if (data.success) {
        setEditingThreat(null);
        showFeedback("success", "Signature mise à jour avec succès.");
        await onRefreshData();
      } else {
        showFeedback("error", "Erreur lors de la mise à jour : " + data.error);
      }
    } catch (err) {
      console.error(err);
      showFeedback("error", "Erreur réseau lors de l'enregistrement.");
    }
  };

  const handleAddThreatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanValue = newValue.trim();
    if (!cleanValue) {
      showFeedback("error", "Veuillez saisir une valeur pour la signature.");
      return;
    }

    const exists = threats.some(
      t => t.value.toLowerCase().trim() === cleanValue.toLowerCase()
    );
    if (exists) {
      showFeedback("warning", `La signature "${cleanValue}" est déjà enregistrée dans la base active du SOC.`);
      return;
    }

    try {
      const response = await fetch("/api/threats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: cleanValue,
          type: newType,
          severity: newSeverity,
          location: newLocation,
          details: newDetails,
          status: "active"
        })
      });

      const data = await response.json();
      if (data.success) {
        setNewValue("");
        setNewDetails("");
        setShowAddForm(false);
        showFeedback("success", `Nouvelle signature "${cleanValue}" ajoutée et synchronisée avec succès.`);
        await onRefreshData();
      } else {
        showFeedback("error", "Erreur lors de l'ajout : " + data.error);
      }
    } catch (err) {
      console.error(err);
      showFeedback("error", "Erreur de communication avec le serveur.");
    }
  };

  return (
    <div className="space-y-6 leading-relaxed">

      {/* Non-blocking feedback notification banner */}
      {feedback && (
        <div className={`p-4 rounded-xl border font-mono text-xs flex items-start gap-3 animate-fade-in ${
          feedback.type === "success" 
            ? "bg-[#10B981]/10 border-[#10B981]/25 text-[#10B981]" 
            : feedback.type === "warning"
            ? "bg-amber-500/10 border-amber-500/25 text-amber-500"
            : "bg-[#EF4444]/10 border-[#EF4444]/25 text-[#EF4444]"
        }`}>
          {feedback.type === "success" ? (
            <Check className="w-5 h-5 shrink-0 text-[#10B981]" />
          ) : feedback.type === "warning" ? (
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-[#EF4444]" />
          )}
          <div className="flex-1">
            <span className="font-extrabold uppercase block text-[10px] tracking-widest mb-0.5">
              {feedback.type === "success" ? "OPÉRATION CONFIRMÉE" : feedback.type === "warning" ? "CONTRÔLE / DOUBLON ÉVITÉ" : "REJET SYSTEME"}
            </span>
            <p className="text-[#94A3B8] leading-relaxed">{feedback.message}</p>
          </div>
          <button onClick={() => setFeedback(null)} className="text-[#94A3B8] hover:text-white transition p-0.5 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121A2F] border border-white/5 rounded-xl p-6 shadow-md">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Database className="w-4.5 h-4.5 text-[#3B82F6]" />
            Console d&apos;Administration et d&apos;Édition de la Base Active
          </h3>
          <p className="text-[11px] text-[#94A3B8] mt-1 font-sans">
            Recherchez, modifiez et invalidez les signatures de phishing et d&apos;ingénierie sociale déployées sur le territoire togolais.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white font-mono text-xs font-bold rounded-xl uppercase tracking-wider transition flex items-center gap-2 shrink-0 self-start md:self-auto cursor-pointer shadow-sm"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAddForm ? "Fermer le formulaire" : "Ajouter une Signature"}
        </button>
      </div>

      {/* Add Signature Panel Form */}
      {showAddForm && (
        <div className="bg-[#121A2F] border border-white/5 p-6 rounded-xl space-y-4 animate-fade-in shadow-md">
          <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
            Nouvel Enregistrement d&apos;Indice de Compromission (IoC)
          </h4>
          
          <form onSubmit={handleAddThreatSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 font-mono text-xs">
            <div className="md:col-span-4 space-y-1">
              <label className="text-slate-500 font-bold block uppercase text-[10px]">Valeur / Signature :</label>
              <input
                type="text"
                required
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Ex. +228 99 88 77 66 ou ceet-pay.xyz"
                className="w-full bg-[#0B1020] border border-white/5 focus:border-[#3B82F6] p-2.5 rounded-lg text-white outline-none"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-slate-500 font-bold block uppercase text-[10px]">Type d&apos;IoC :</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full bg-[#0B1020] border border-white/5 p-2.5 rounded-lg text-slate-300 outline-none cursor-pointer"
              >
                <option value="domain">Domaine URL</option>
                <option value="phone">Téléphone</option>
                <option value="ip">IP Server</option>
                <option value="email">Email</option>
                <option value="text_pattern">Message sémantique</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-slate-500 font-bold block uppercase text-[10px]">Niveau d&apos;Urgence :</label>
              <select
                value={newSeverity}
                onChange={(e) => setNewSeverity(e.target.value as any)}
                className="w-full bg-[#0B1020] border border-white/5 p-2.5 rounded-lg text-slate-300 outline-none cursor-pointer"
              >
                <option value="Low">Low (Faible)</option>
                <option value="Medium">Medium (Moyen)</option>
                <option value="Critical">Critical (Critique)</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-slate-500 font-bold block uppercase text-[10px]">Région / Localisation :</label>
              <select
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                className="w-full bg-[#0B1020] border border-white/5 p-2.5 rounded-lg text-slate-300 outline-none cursor-pointer"
              >
                <option value="Lomé">Lomé (Maritime)</option>
                <option value="Sokodé">Sokodé (Centrale)</option>
                <option value="Kara">Kara (Nord)</option>
                <option value="Atakpamé">Atakpamé (Plateaux)</option>
                <option value="Kpalimé">Kpalimé (Plateaux Ouest)</option>
                <option value="Cinkassé">Cinkassé (Savanes)</option>
                <option value="Aného">Aného (Est Littoral)</option>
              </select>
            </div>

            <div className="md:col-span-12 space-y-1 mt-2">
              <label className="text-slate-500 font-bold block uppercase text-[10px]">Description / Allégations :</label>
              <textarea
                value={newDetails}
                onChange={(e) => setNewDetails(e.target.value)}
                placeholder="Ex. Tentative d'imposture et usurpation du service d'électricité CEET pour extorquer de l'argent..."
                rows={2}
                className="w-full bg-[#0B1020] border border-white/5 p-2.5 rounded-lg text-white outline-none"
              />
            </div>

            <div className="md:col-span-12 flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-white/5 text-[#94A3B8] hover:text-white rounded-lg transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#10B981] hover:bg-[#10B981]/90 text-white font-bold rounded-lg transition cursor-pointer"
              >
                Sauvegarder et Déployer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Database Listing Panel */}
      <div className="bg-[#121A2F] border border-white/5 rounded-xl p-6 space-y-4 shadow-md">
        
        {/* Filter controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher par valeur, emplacement, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0B1020] border border-white/5 focus:border-[#3B82F6] pl-10 pr-4 py-2 rounded-xl text-xs font-mono text-slate-200 outline-none transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-[#0B1020] px-3 py-1.5 rounded-lg border border-white/5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-transparent text-xs font-mono text-slate-300 outline-none cursor-pointer"
              >
                <option value="all">Tous les types</option>
                <option value="domain">Domaines</option>
                <option value="phone">Téléphones</option>
                <option value="ip">IP Servers</option>
                <option value="email">E-mails</option>
                <option value="text_pattern">Textes sémantiques</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-[#0B1020] px-3 py-1.5 rounded-lg border border-white/5">
              <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-transparent text-xs font-mono text-slate-300 outline-none cursor-pointer"
              >
                <option value="all">Toutes les urgences</option>
                <option value="Critical">Critique 🔴</option>
                <option value="Medium">Moyen 🟡</option>
                <option value="Low">Faible ⚪</option>
              </select>
            </div>
          </div>
        </div>

        {/* Edit Threat Form Modal / Bar (Displays inline if a row is selected for modification) */}
        {editingThreat && (
          <div className="bg-amber-950/10 border border-amber-500/25 p-6 rounded-xl space-y-4 animate-fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-amber-500/15">
              <span className="text-xs font-bold text-amber-500 font-mono tracking-wider uppercase block flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Modification de Signature : &quot;{editingThreat.value}&quot;
              </span>
              <button onClick={handleCancelEdit} className="text-[#94A3B8] hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateThreat} className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-bold block uppercase text-[10px]">Valeur / Signature :</label>
                <input
                  type="text"
                  required
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full bg-[#0B1020] border border-white/5 p-2.5 rounded-lg text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold block uppercase text-[10px]">Type d&apos;IoC :</label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value as any)}
                  className="w-full bg-[#0B1020] border border-white/5 p-2.5 rounded-lg text-slate-300 outline-none cursor-pointer"
                >
                  <option value="domain">Domaine URL</option>
                  <option value="phone">Téléphone</option>
                  <option value="ip">IP Server</option>
                  <option value="email">Email</option>
                  <option value="text_pattern">Message sémantique</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold block uppercase text-[10px]">Urgence :</label>
                <select
                  value={editSeverity}
                  onChange={(e) => setEditSeverity(e.target.value as any)}
                  className="w-full bg-[#0B1020] border border-white/5 p-2.5 rounded-lg text-slate-300 outline-none cursor-pointer"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold block uppercase text-[10px]">Localisation :</label>
                <input
                  type="text"
                  required
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full bg-[#0B1020] border border-white/5 p-2.5 rounded-lg text-white outline-none"
                />
              </div>

              <div className="md:col-span-4 space-y-1">
                <label className="text-slate-400 font-bold block uppercase text-[10px]">Détails de l&apos;enquête :</label>
                <textarea
                  value={editDetails}
                  onChange={(e) => setEditDetails(e.target.value)}
                  rows={2}
                  className="w-full bg-[#0B1020] border border-white/5 p-2.5 rounded-lg text-white outline-none"
                />
              </div>

              <div className="md:col-span-4 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-white/5 text-[#94A3B8] hover:text-white rounded-lg transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition cursor-pointer"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Database Grid-Table representation */}
        <div className="overflow-x-auto border border-white/5 rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0B1020]/80 border-b border-white/5 text-[10px] font-mono text-slate-500 uppercase">
                <th className="py-3 px-4 font-bold">Signature Value</th>
                <th className="py-3 px-4 font-bold">Type</th>
                <th className="py-3 px-4 font-bold">Priorité</th>
                <th className="py-3 px-4 font-bold">Région / Ville</th>
                <th className="py-3 px-4 font-bold">Dossier / Preuves</th>
                <th className="py-3 px-4 font-bold">Actions d&apos;Équipe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-xs text-slate-300">
              {filteredThreats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    Aucune signature concordante enregistrée dans la base de données.
                  </td>
                </tr>
              ) : (
                filteredThreats.map((threat) => (
                  <tr key={threat.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4 font-bold text-white break-all">{threat.value}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#0B1020] text-slate-300 border border-white/5 uppercase font-medium">
                        {threat.type === "domain" ? "🌐 Domaine" :
                         threat.type === "phone" ? "📞 Téléphone" :
                         threat.type === "ip" ? "🖥️ IP server" :
                         threat.type === "email" ? "✉️ Email" : "📝 Motif"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        threat.severity === "Critical" ? "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/25" :
                        threat.severity === "Medium" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                        "bg-[#0B1020] text-slate-400 border border-white/5"
                      }`}>
                        {threat.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{threat.location}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] max-w-sm truncate" title={threat.details}>
                      {threat.details || "Vide."}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStartEdit(threat)}
                          className="p-1 px-2.5 rounded bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 transition flex items-center gap-1 font-bold text-[10px] uppercase font-mono cursor-pointer"
                          title="Modifier cette signature"
                        >
                          <Edit2 className="w-3" />
                          Éditer
                        </button>
                        <button
                          onClick={() => handleDeleteThreat(threat.id, threat.value)}
                          className="p-1 px-2.5 rounded bg-[#EF4444]/10 hover:bg-[#EF4444] text-[#EF4444] hover:text-white transition flex items-center gap-1 font-bold text-[10px] uppercase font-mono cursor-pointer"
                          title="Supprimer définitivement la signature"
                        >
                          <Trash2 className="w-3" />
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footing info count */}
        <div className="flex items-center justify-between text-[10px] text-slate-550 pt-2 font-mono uppercase">
          <span>Affichage de {filteredThreats.length} sur {threats.length} signatures nationales</span>
          <span>Secteurs du Togo protégés par synchronisation cellulaire</span>
        </div>
      </div>

    </div>
  );
}
