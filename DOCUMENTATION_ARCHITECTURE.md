# 🛡️ DOCUMENTATION ARCHITECTURALE COMPLÈTE & SIMPLIFIÉE
## SP Sentinel Togo / KefyShield - L'Écosystème National de Renseignement Cyber (Cyber Threat Intelligence)

Bienvenue dans le manuel d'architecture de notre écosystème de cybersécurité nationale pour le Togo. 

Ce document explique le rôle de **chaque répertoire, chaque fichier, et comment tous les composants collaborent** (du portail web à l'application installée sur le téléphone des citoyens). Il conserve tous les **termes techniques réels** indispensables aux professionnels de la tech, tout en les expliquant avec des mots simples pour que n'importe qui puisse en comprendre l'enjeu en 5 minutes !

---

## 🗺️ Le Grand Plan des Échanges de Données (Flux Réseau)

Pour protéger le territoire togolais, nos composants s'échangent des informations en continu à travers des "tuyaux de communication" (les **APIs REST**).

```
                                  ┌───────────────────────────┐
                                  │   PORTAIL SOC (React)     │ (Interface d'administration
                                  │      Dossier /src/        │  avec carte interactive SVG)
                                  └─────────────▲─────────────┘
                                                │ (Requêtes HTTP REST / JSON)
                                                ▼
                                  ┌───────────────────────────┐
                                  │  PASSERELLE (Express)     │ (Le chef d'orchestre sur le port 3000)
                                  │      Fichier server.ts    │
                                  └──────┬──────────────▲─────┘
                                         │              │
                   (Synchronisation /    │              │ (Rapports de Phishing /api/v1/report)
                    Mise à jour d'IoCs   │              │
                    depuis /api/v1/sync) │              │
                                         ▼              │
┌───────────────────────────┐     ┌───────────────────────────┐     ┌───────────────────────────┐
│     ROBOTS ÉCLAIREURS     │     │    AGENT MOBILE (Java)    │     │      CERVEAU PYTHON       │
│  collecteur_flux_veille   │     │    Dossier /mobile_agent/ │     │  /serveur_central_python/ │
│  (Scraping CERT.tg/ANCY)  │     │ (Pare-feu passif Android) │     │  (Corrélation d'attaques) │
└───────────────────────────┘     └───────────────────────────┘     └───────────────────────────┘
```

---

## 1. Description Détaillée des Composants

### 📱 A. L'Unité de Protection Defensive Mobile : Le dossier `/mobile_agent/`
Il s'agit d'une application Android native codée en **Java**. Son but est d'agir comme un bouclier invisible (pare-feu passif) sur le téléphone des citoyens pour bloquer les tentatives de phishing et d'arnaques sémantiques (comme les faux transferts Moov Money ou Tmoney, ou l'usurpation d'identité d'autorités nationales).

*   **`KefylNotificationService.java` (L'Écouteur du Système - *NotificationListenerService*)** :
    *   *Le terme technique* : C'est un service d'arrière-plan de bas niveau d'Android.
    *   *En termes simples* : Pour respecter strictement la vie privée, l'application ne va pas fouiller dans tes fichiers. Elle écoute seulement les notifications entrantes (SMS, WhatsApp, WhatsApp Business, Telegram). Dès qu'un message arrive, elle l'attrape au vol pour l'analyser.
*   **`PhishingAnalyzer.java` (Le Détecteur Heuristique et Linguistique)** :
    *   *Le terme technique* : C'est un moteur d'analyse sémantique local (traitement du langage naturel simplifié).
    *   *En termes simples* : Il scanne le texte du message à la recherche d'appâts classiques (mots urgents comme *"restriction de compte"*, *"gagner à la loterie"*, ou demandes d'envoi d'argent Flooz / Tmoney). L'analyse prend moins d'une milliseconde et se fait directement sur le processeur du smartphone, ce qui permet de réagir avant même que l'utilisateur n'ouvre son application de messagerie.
*   **La Base de Données `Room DB` (Le SQLite Local)** :
    *   *Le terme technique* : C'est une base de données relationnelle locale et légère intégrée à Android.
    *   *En termes simples* : Elle stocke la liste noire locale (la "Blacklist" des numéros d'arnaqueurs connus et de liens frauduleux). Elle est autonome : pas besoin de connexion internet pour que le téléphone sache instantanément si un expéditeur est un pirate connu !
*   **La Persistance au Déverrouillage (`SharedPreferences`)** :
    *   *Le terme technique* : Stockage persistant clé-valeur d'Android.
    *   *En termes simples* : Si ton écran est éteint quand tu reçois un SMS malveillant, l'application stocke temporairement l'alerte. Dès que tu déverrouilles ton écran (événement système `ACTION_USER_PRESENT`), elle affiche un grand message rouge d'alerte (`#150404`) en premier plan (**System Overlay**) pour t'empêcher de cliquer par accident !
*   **Le Client de Communication `Retrofit` (`KefylApiService.java`)** :
    *   *Le terme technique* : Client HTTP pour requêtes réseau asynchrones.
    *   *En termes simples* : C'est le téléphone qui parle au serveur central. Il utilise deux boutons magiques :
        *   **"TEST LOCAL"** (qui pointe vers `10.0.2.2:3000` pour les tests sur émulateur).
        *   **"PROD LIGNE"** (qui se connecte directement au serveur de supervision en ligne).

---

### 🏰 B. La Salle de Contrôle Visuelle (Le Frontend) : Le dossier `/src/`
C'est l'interface web (le "SOC Dashboard") utilisée par les analystes de sécurité de l'État togolais pour surveiller la situation. Développée en **React 18** et stylisée avec **Tailwind CSS**.

*   **`App.tsx` (L'Écran de Contrôle Central)** :
    *   *En termes simples* : C'est la page racine qui contient les différents onglets de notre logiciel. Elle synchronise les informations reçues du serveur (les agents actifs, les signalements de phishing en cours, l'état de l'intelligence artificielle) et les affiche proprement.
*   **`components/DashboardTab.tsx` (La Carte Interactive Nationale du Togo)** :
    *   *Le terme technique* : C'est une carte vectorielle dynamique au format **SVG**.
    *   *En termes simples* : Elle dessine les 5 régions du Togo (Savanes, Kara, Centrale, Plateaux, Maritime). En cliquant sur une région, la carte s'illumine et filtre automatiquement les statistiques d'incidents de cette zone. Si beaucoup de signalements arrivent de Kara, la région devient visuellement critique en un clin d'œil !
*   **`components/ThreatIntelTab.tsx` (La Console de Veille en direct)** :
    *   *En termes simples* : Elle intègre une console de commande (un simulateur de terminal de cybersécurité) qui affiche en direct les logs de nos robots qui naviguent sur le web. C'est ici que l'analyste clique sur "Exfiltrer" ou "Analyser par l'IA".
*   **`types.ts` (Les Règles de Codage Partagées)** :
    *   *En termes simples* : Un dictionnaire TypeScript qui définit précisément la forme de chaque donnée (qu'est-ce qu'un "Agent", un "Signalement", un "IoC" ou un "Incident de sécurité"). Cela évite toute confusion entre la partie visuelle et le serveur.

---

### ⚙️ C. Le Coeur Opérationnel (Le Backend Node) : `/serveur_dashboard_react/` & racine
Le serveur principal, propulsé par **Express.js** et écrit en **TypeScript**, s'occupe de la logique d'arrière-plan, de l'accès aux fichiers locaux et de la connexion avec l'IA.

*   **`server.ts` (L'Hôte d'Entrée Principal)** :
    *   *En termes simples* : C'est le portier du projet. Il s'allume sur le port obligatoire **3000** et gère toutes les adresses d'accès (APIs) pour recevoir les messages des téléphones et du site web. Il distribue les PDFs de sécurité téléchargés via l'adresse `/api/pdfs/`.
*   **`collecteur_flux_veille_cert.ts` (Les Robots Éclaireurs - *Le Scraper à 3 Niveaux*)** :
    *   *Le terme technique* : Un script de moissonnage asynchrone (Scraper).
    *   *Son rôle* : Aller automatiquement sur les sites du `CERT.tg` et de l'`ANCY.gouv.tg` pour ramener les communiqués officiels sur les nouvelles attaques.
    *   *Ses 3 techniques de secours (Fallbacks)* :
        1. **Niveau 1 (API WordPress JSON)** : Il essaie de demander gentiment les données structurées directement au site.
        2. **Niveau 2 (HTML Dom Parser)** : Si le site a coupé son traducteur, le robot lit la page web ligne par ligne à la recherche des alertes.
        3. **Niveau 3 (Playwright Headless Simulation)** : Si le site utilise des protections complexes pour bloquer les robots, notre script fait semblant d'être un vrai humain en lançant un navigateur invisible en arrière-plan.
    *   *La Déduplication sémantique par Hash MD5* : Pour ne pas stocker 10 fois le même article de sécurité, le robot calcule une empreinte numérique unique pour chaque texte. Si l'empreinte existe déjà, l'article est ignoré !
*   **`analyseur_ia_gemini.ts` (Le Détective Intelligent - *Gemini SDK*)** :
    *   *En termes simples* : Ce script envoie le texte brut d'un article de sécurité au modèle d'intelligence artificielle **Gemini de Google** (grâce au SDK `@google/genai`). L'IA lit l'article en 1 seconde et en extrait proprement les **IoC (Indicateurs de compromission)** : les faux numéros Moov/Togocom des escrocs, ou les adresses des faux sites internet.
*   **`gestionnaire_base_donnees.ts` & `base_donnees_cache_soc.json` (Le Coffre-Fort Local - *Offline-First*)** :
    *   *En termes simples* : C'est notre grand livre de comptes physique enregistré au format JSON sur le disque dur du serveur. Si internet se coupe, toutes nos données de sécurité sont conservées localement et restent lisibles.

---

### 🐍 D. Le Laboratoire Scientifique : Le dossier `/serveur_central_python/`
C'est un sous-serveur écrit en **Python** (le langage favori des ingénieurs cyber et de l'intelligence artificielle), spécialisé dans la corrélation sémantique et mathématique de données.

*   **`correlation.py` (L'Algorithme d'Interconnexion)** :
    *   *Le terme technique* : Corrélateur d'événements sémantiques.
    *   *En termes simples* : Si un citoyen à Lomé signale un SMS frauduleux, et qu'un autre citoyen à Dapaong en signale un autre, cet algorithme va regarder les adresses IP et les numéros Tmoney impliqués. S'il y a des points communs, il va relier ces alertes isolées et signaler au SOC qu'une seule et unique **campagne d'attaque cyber d'envergure** cible le Togo !

---

## 2. Scénarios réels de Communication (Comment ils travaillent ensemble)

### Scénario 1 : L'enrôlement d'un nouvel Agent Mobile
1.  Un citoyen togolais installe et lance l'application mobile **KefyShield**.
2.  L'application envoie une requête HTTP POST contenant le nom choisi de l'agent, sa ville et son téléphone à l'adresse API du serveur : `/api/v1/agent/register`.
3.  Le serveur d'Express (`server.ts`) valide la demande, enregistre l'appareil dans notre base `base_donnees_cache_soc.json` et lui attribue un identifiant unique. L'agent apparaît instantanément sur la carte interactive du Togo dans l'onglet d'administration !

### Scénario 2 : Capture d'un SMS de phishing sur le terrain
1.  L'agent mobile reçoit un SMS d'arnaque ciblant Moov Money.
2.  Le composant `KefylNotificationService` intercepte la notification, et `PhishingAnalyzer` valide qu'il s'agit d'une menace de niveau critique. Le téléphone vibre fort et affiche l'alerte d'urgence en rouge sur l'écran.
3.  L'application envoie automatiquement un **Rapport Forensique** (une déclaration technique de menace) au serveur principal Express via l'API REST : `/api/v1/report`.
4.  L'Express (`server.ts`) intercepte le rapport, met à jour la base de données locale JSON, et transmet les indices à l'algorithme Python (`correlation.py`) pour recalculer l'indice de risque régional.

### Scénario 3 : Partage des signatures de sécurité (Mise à jour de la Blacklist)
1.  Le scraper automatique découvre une nouvelle alerte officielle d'hameçonnage de la CEET (Électricité du Togo) sur CERT.tg et l'analyse via l'IA de Gemini.
2.  L'analyste du SOC valide l'analyse et clique sur **"PUSH"** (Ajouter aux signatures globales).
3.  Périodiquement, toutes les applications mobiles installées au Togo contactent le serveur Express à l'adresse d'API `/api/v1/sync`.
4.  Elles téléchargent la nouvelle signature (le faux site internet ou le numéro de l'arnaqueur) et l'enregistrent dans leur base locale `Room DB`. Le citoyen est maintenant protégé contre ce nouveau piège, même s'il n'a plus de connexion internet !

---

## 3. Synthèse des Apports de chaque pièce au Projet

| Nom du Fichier / Dossier | Technologie | Pourquoi il est indispensable au projet ? |
| :--- | :--- | :--- |
| **`/mobile_agent/`** | Android (Java) | C'est notre bouclier de proximité. Il agit directement sur l'appareil des citoyens pour bloquer les fraudes et signaler les menaces en temps réel. |
| **`/src/`** | React 18, Tailwind | C'est le centre de contrôle visuel. Il offre aux analystes du SOC une vue d'ensemble géographique instantanée grâce à sa carte interactive du Togo. |
| **`collecteur_flux_veille_cert.ts`** | TypeScript (Node) | Il automatise complètement la collecte d'informations officielles d'alertes h24 sans nécessiter de travail humain manuel. |
| **`analyseur_ia_gemini.ts`** | Google Gemini API | Il traduit en 1 seconde des longs paragraphes d'alertes complexes en une liste d'adresses et de numéros frauduleux précis. |
| **`correlation.py`** | Python | Il analyse "l'image globale" de la cybermenace nationale en liant les attaques isolées reçues des téléphones mobiles. |
| **`base_donnees_cache_soc.json`** | JSON Physique | Il garantit la souveraineté numérique du Togo en conservant un historique local complet des alertes, totalement indépendant du cloud externe. |
