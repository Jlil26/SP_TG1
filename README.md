# SOC PHISHING TG & SP_TG (Mon Garde du Corps)
> **Plateforme Nationale Intégrée de Cyberdéfense et Lutte Anti-Phishing (Togo)**  
> *Développé avec passion pour sécuriser nos concitoyens et PME locales.*

Ce dépôt contient le projet unifié **SOC PHISHING TG**, une solution souveraine et hybride conçue pour faire face au fléau des arnaques et de l'ingénierie sociale (SMS frauduleux, faux gains Moov Flooz ou Togocom Tmoney, usurpations d'identité administrative) au Togo. 

Le système s'articule autour de deux composants complémentaires :
1. **L'application mobile client (SP_TG)** : Un pare-feu léger en tâche de fond sur Android qui s'exécute localement et sans connexion obligatoire (hors-ligne par défaut) pour intercepter les notifications suspectes et guider l'utilisateur.
2. **Le Poste Central de Supervision (SOC PHISHING TG)** : Une console web pour les analystes de sécurité de l'ANCY ou du CERT.TG permettant de pousser des indicateurs de compromission (IoC) mis à jour, et de centraliser anonymement la télémétrie judiciaire pour détecter les campagnes d'attaques en temps réel.

---

## 🏗️ 1. Architecture et Cartographie des Repertoires

Pour faciliter l'analyse et l'évaluation du jury, la racine du projet est découpée en répertoires hautement sémantiques et spécialisés :

| Répertoire / Fichier | Rôle dans l'Architecture | Pile Technologique | Usage et Intérêt |
| :--- | :--- | :--- | :--- |
| **`/agent_mobile_android`** | Client Mobile local d'interception | Java (Android Natif) | S'installe sur le smartphone de l'utilisateur. Il écoute les notifications SMS/WhatsApp à l'aide d'un `NotificationListenerService` et utilise une base SQLite Room pour les signatures et une IA heuristique locale d'ingénierie sociale (offline). |
| **`/serveur_central_python`** | API centrale alternative de production | Python 3 / FastAPI | Expose les points de terminaison REST de synchronisation des IoC et de remontée d'alertes. Scrape de manière autonome les flux de veille cyber (CERT.TG et ANCY) et unifie l'analyse de corrélation criminelle. |
| **`/serveur_dashboard_react`** | Serveur de synchronisation & Back-office | Node.js / Express / TypeScript | Orchestre l'API de simulation en direct pour le Dashboard web d'administration de Lomé et distribue l'interface. |
| **`/src`** | Dashboard de Commandement (Frontend) | React / Vite / Tailwind CSS | Offre une interface utilisateur moderne et interactive pour visualiser les menaces, les alertes par région, gérer l'Intel Threat feed, et interagir avec l'appareil simulé. |
| **`server.ts`** | Serveur d'intégration et simulateur | Express / TypeScript | Point d'entrée principal réunissant l'API REST de télémétrie, la mise en cache de la base démonstrative (IoC) et l'interpréteur IA pour les analystes. |

---

## 🔒 2. Algorithmes de Détection et Modèle de Souveraineté

Pour protéger efficacement les cibles (grand public contre les arnaques de numéros inconnus, et employés de PME en réseau local fermé), nous appliquons plusieurs couches distinctes :

### A. L'Analyse Heuristique Locale (Offline-first)
Sur l'agent mobile, le module `/engine/PhishingAnalyzer.java` examine les messages reçus de numéros inconnus ou d'un groupe en inspectant la sémantique locale :
- **Urgence ou Peur** : Mots-clés créant un stress sémantique (*"Immédiat"*, *"Sous 24h"*, *"Compte bloqué"*).
- **Usurpation institutionnelle** : Clones ou usurpations de services (*"Togocom"*, *"Moov"*, *"Flooz"*, *"Tmoney"*, *"Gendarmerie"*).
- **Appât du gain** : Promesse de lots fictifs (*"Gagnant"*, *"Crédit offert"*, *"Transfert en attente"*).

### B. La Liste Verte Anti-Faux Positifs (Groupe de confiance)
Si l'utilisateur fait 100% confiance à des conversations de groupe spécifiques (ex: cercle familial ou professionnel partagé), il peut déclarer ce groupe en **"Liste Verte"**. 
- Les alertes de détection sémantique y sont automatiquement neutralisées pour éviter de déranger l'utilisateur avec de faux négatifs ou de fausses alertes agressives.
- Cependant, si une **signature criminelle absolue** (provenant du serveur central officiel en ligne) est diffusée sur ce groupe, le garde-corps outrepasse la liste verte locale et alerte impérativement l'utilisateur d'un réel danger.

---

## 🚀 3. Guide de Démarrage Rapide (En Local)

Pour exécuter et présenter la démonstration interactive complète de bout en bout :

### Étape 1 : Lancement du Dashboard du SOC
1. Ouvrez un terminal à la racine du projet décompressé.
2. Installez les paquets requis pour le backoffice :
   ```bash
   npm install
   ```
3. Démarrez le serveur interne Express et le proxy Vite :
   ```bash
   npm run dev
   ```
4. Accédez à l'application dans votre navigateur : **`http://localhost:3000`**

### Étape 2 : Lancement de l'API alternative en Django / FastAPI (Python)
Si vous souhaitez manipuler ou évaluer les scripts de scraping Python indépendamment de la maquette d'administration :
1. Déplacez-vous dans le répertoire du sous-serveur :
   ```bash
   cd serveur_central_python
   ```
2. Créez un environnement virtuel et installez les dépendances :
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # Ou venv\Scripts\activate sur Windows
   pip install -r requirements.txt
   ```
3. Exécutez l'API FastAPI locale :
   ```bash
   uvicorn main:app --reload --port 8000
   ```
4. Explorez la documentation des endpoints : [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🧪 4. Protocole de Certification & Test du Système

Le Dashboard embarque un simulateur interactif de smartphone à droite de l'écran. Vous pouvez l'utiliser directement pour simuler tout le trajet d'alerte :
1. **Écran d'Accueil du SOC** : Observez le globe d'analyse en temps réel centré sur le Togo.
2. **Simulateur Mobile** : Saisissez un numéro inconnu et envoyez un SMS frauduleux (par exemple : *"Félicitations, vous avez gagné 500.000 F Moov Flooz, appelez-nous vite"*).
3. **Réaction temps réel** : 
   - Une notification contextuelle s'affiche immédiatement sur le smartphone virtuel.
   - Cliquez dessus pour entrer dans la quarantaine et lire les **consignes impératives de sécurité** rédigées en langage clair et humanisé (*Données protégées, ne jamais rappeler, ne jamais ouvrir le lien suspect*).
   - Le journal de l'agent mobile remonte instantanément la télémétrie judiciaire de cyberdéfense, qui est captée par le SOC et se reporte sur la carte de Lomé et les graphiques de veille sectoriels du dashboard principal.
