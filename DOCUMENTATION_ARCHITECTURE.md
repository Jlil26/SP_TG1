# 🛡️ SP SENTINEL TOGO & KEFYSHIELD
## LE MANUEL DE RÉFÉRENCE ARCHITECTURAL ET FONCTIONNEL DE LA PLATEFORME SOUVERAINE DE CYBERSÉCURITÉ NATIONALE

Bienvenue dans le guide de référence de **SP Sentinel Togo** (le centre de contrôle souverain national) et de **KefyShield** (le bouclier défensif mobile). Ce document détaille l'écosystème complet de renseignement cyber (*Cyber Threat Intelligence* ou CTI) déployé pour la protection physique et sémantique des citoyens togolais contre les fraudes, les arnaques et le *Smishing* (SMS phishing).

Ce guide a été rédigé avec rigueur par notre équipe d'architecture et de direction artistique pour servir à la fois de **spécification technique exhaustive** (pour les ingénieurs cyber de l'ANCY et du CERT.tg) et de **synthèse claire et vulgarisée** pour les décideurs gouvernementaux.

---

## 🗺️ LE PLAN DE L'ARCHITECTURE ET DES FLUX RÉSEAU

Pour assurer une haute disponibilité sans dépendance externe, l'infrastructure repose sur un modèle hybride de serveurs souverains connectés aux terminaux mobiles des citoyens à travers des API REST sécurisées.

```
                               ┌─────────────────────────────────────────┐
                               │       PORTAIL SOC NATIONAL (React 18)   │
                               │  - Carte vectorielle interactive (SVG)  │
                               │  - Supervision temps réel & Forensics   │
                               │  - Chemin d'accès : /src/components/    │
                               └────────────────────▲────────────────────┘
                                                    │
                                                    │ (Requêtes HTTP REST / JSON via Port 3000)
                                                    ▼
                               ┌─────────────────────────────────────────┐
                               │        PASSERELLE SOC (Express.js)      │
                               │  - Gestionnaire de Base de Données local │
                               │  - Routage d'Urgence (Flash Broadcast)  │
                               │  - Chemin d'accès : /server.ts           │
                               └───────────▲───────────────────▲─────────┘
                                           │                   │
                     (Enregistrement       │                   │ (Analyse de flux et IoCs)
                      et Sync d'IoCs       │                   │
                      /api/v1/sync)        │                   │
                                           ▼                   ▼
┌────────────────────────────────────────┐ │ ┌────────────────────────────────────────┐
│     BOUCLIER MOBILE (Java Android)     │ │ │       CERVEAU PYTHON INTEL             │
│  - 3 Moteurs de Détection locaux       ├─┘ │  - Corrélateur d'Attaques              │
│  - Base SQLite chiffrée (Room DB)      │   │  - Analyse des Tendances de Menace     │
│  - Chemin d'accès : /mobile_agent/     │   │  - Chemin d'accès : /serveur_python/   │
└────────────────────────────────────────┘   └────────────────────────────────────────┘
```

---

## 🏛️ PARTIE 1 : LES CHOIX TECHNIQUES MAJEURS & JUSTIFICATIONS SOUVERAINES

### 1. Pourquoi ces langages de programmation ?
*   **Java (Android Natif) pour le Bouclier Mobile (`/mobile_agent/`)** :
    *   *Raison de souveraineté* : Le parc de téléphones mobiles au Togo est hétérogène, comprenant beaucoup d'appareils d'entrée ou de milieu de gamme sous d'anciennes versions d'Android. Utiliser du Java natif plutôt que des frameworks hybrides lourds (Flutter, React Native) assure une compatibilité à 99%, une consommation d'énergie proche de 0% en arrière-plan et un accès direct de bas niveau aux services système (`NotificationListenerService`).
*   **TypeScript & Node.js (`server.ts`) pour la Passerelle SOC** :
    *   *Raison de souveraineté* : Node.js est idéal pour gérer des milliers de connexions simultanées venant des téléphones mobiles (I/O asynchrones). L'utilisation de TypeScript garantit un typage strict et évite les erreurs de structure de données lors des échanges d'alertes en temps réel.
*   **React 18 & Tailwind CSS pour l'Interface d'Administration** :
    *   *Raison de souveraineté* : Pour que le logiciel puisse être projeté dans un centre de commandement (SOC) sur des murs d'écrans géants, la réactivité visuelle doit être instantanée. React 18, combiné avec un design sur-mesure ultra-rapide en Tailwind, permet un affichage sans fioritures ni surcharge mémoire.
*   **Python (`serveur_central_python/`) pour le Corrélateur** :
    *   *Raison de souveraineté* : Python est la référence mondiale en science des données et en analyse cyber. Il permet d'intégrer des algorithmes de corrélation sémantique complexes et de graphisme pour lier plusieurs signalements isolés et en déduire l'existence d'une attaque coordonnée à l'échelle du pays.

### 2. Le choix de la base de données : Cache JSON & SQLite local (Room)
*   **Base du SOC (`base_donnees_cache_soc.json`)** : Au lieu de dépendre d'un service de base de données cloud étranger ou d'un service managé qui pourrait être coupé en cas de crise géopolitique, l'écosystème s'appuie sur une persistance par fichier structuré JSON local optimisé, gérée de manière transactionnelle avec des mécanismes de verrouillage en lecture/écriture. C'est l'assurance d'un contrôle total de la donnée (*Sovereign Offline-First*).
*   **Base Mobile (Room SQLite local)** : L'application mobile embarque sa propre base de données relationnelle locale SQLite (via la bibliothèque Android Jetpack Room). Le téléphone n'a pas besoin de connexion Internet pour savoir si un numéro ou un lien est malveillant : l'analyse est 100% locale, immédiate et respectueuse de la vie privée.

### 3. La Dockerisation pour un déploiement souverain instantané
La plateforme est entièrement dockerisable. Grâce à des fichiers de configuration standardisés, le ministère ou l'agence de sécurité nationale (l'ANCY) peut déployer l'intégralité du SOC sur ses propres serveurs physiques situés à Lomé, en quelques secondes, via une commande unique :
```bash
docker-compose up --build
```
Cela élimine tout risque d'exfiltration de données souveraines vers des serveurs tiers et facilite la mise à jour par les équipes techniques gouvernementales.

---

## 📱 PARTIE 2 : LE COMPOSANT DÉFENSIF MOBILE – `KEFYSHIELD`

### 1. Les 3 Moteurs de Détection Intégrés
Le fichier principal **`PhishingAnalyzer.java`** combine trois couches d'analyse pour assurer une sécurité hermétique sans fausse alerte :

#### ⚙️ Moteur A : La recherche de correspondances exactes (Base de Signatures)
*   *Fichier source impliqué* : `PhishingAnalyzer.java` & `Signature.java` (Room Database).
*   *Comment ça marche* : Le moteur interroge instantanément la base de données locale du téléphone pour vérifier si l'expéditeur du SMS/message WhatsApp ou le lien URL contenu est enregistré dans la liste noire nationale des IoCs (*Indicators of Compromise*) téléchargée depuis le SOC. Si le numéro figure dans la table, le message est bloqué sur-le-champ.

#### ⚙️ Moteur B : L'analyse heuristique, linguistique et sémantique
*   *Fichier source impliqué* : `PhishingAnalyzer.java` (Méthodes d'analyse de motifs).
*   *Comment ça marche* : Si l'attaquant utilise un nouveau numéro inconnu, ce moteur prend le relais. Il scanne le texte à la recherche de structures typiques d'arnaques togolaises :
    *   **Les transferts d'argent détournés** (Exemples : *"vous avez reçu un dépôt de..."*, *"Flooz"*, *"Tmoney"*, *"Moov"*).
    *   **Les faux services administratifs** (Exemples : *"CEET"*, *"TdE"*, *"OTR"*, *"Police Nationale"*).
    *   **Les leviers psychologiques de manipulation** (*"Urgent"*, *"Félicitations vous avez gagné"*, *"votre compte sera suspendu"*).
    *   Chaque critère ajoute des points à un **Score de Menace**. Si ce score dépasse le seuil de tolérance (60%), l'alerte est déclenchée.

#### ⚙️ Moteur C : L'apprentissage de la menace en boucle fermée (Garde-Corps et Whitelist dynamique)
*   *Fichiers sources impliqués* : `PhishingAnalyzer.java`, `ContactState.java` & `KefylNotificationService.java`.
*   *Comment ça marche* : Pour éviter les désagréments liés aux faux positifs, le moteur intègre une fonctionnalité d'apprentissage :
    *   **Garde-corps WhatsApp (Liste Verte)** : Si un message suspect provient d'un expéditeur enregistré dans le répertoire du citoyen ou si l'utilisateur a manuellement autorisé un groupe de discussion, le moteur l'enregistre en "Liste Verte". L'analyse s'adapte à l'environnement de l'utilisateur.
    *   **Apprentissage par retour d'expérience** : L'utilisateur peut interagir avec les alertes sur son téléphone pour signaler une erreur de détection. Ce choix est mémorisé localement dans l'application mobile et transmis au SOC pour améliorer les algorithmes nationaux.

---

## 🏰 PARTIE 3 : L'INTERFACE SOC – PARCOURS COMPOSANT PAR COMPOSANT

Chaque fichier de l'interface graphique (`/src/components/`) correspond à une fonction métier précise du centre de commandement :

### 1. `DashboardTab.tsx` (La carte nationale de veille et d'aide à la décision)
*   **Rôle métier** : Offrir une conscience situationnelle géographique immédiate aux hauts fonctionnaires et aux analystes cyber.
*   **Composants clés** :
    *   **Carte vectorielle SVG** : Divise visuellement le Togo en ses 5 régions administratives. Elle s'illumine dynamiquement en fonction du taux d'attaques actives reçues des agents mobiles (Savanes, Kara, Centrale, Plateaux, Maritime).
    *   **Panneau d'indicateurs clés (KPIs)** : Affiche le volume total d'incidents, d'agents déployés, de signatures actives et l'indice national de cybermenace (de "Faible" à "Critique").
    *   **Graphiques Recharts** : Suivi temporel de l'évolution hebdomadaire des menaces par sévérité.

### 2. `AgentSupervisionTab.tsx` (La supervision en temps réel et le simulateur d'interception)
*   **Rôle métier** : Visualiser l'activité de l'ensemble de la flotte de téléphones "citoyens" connectés et tester l'écosystème en direct grâce à un simulateur de smartphone intégré.
*   **Composants clés** :
    *   **Liste des Agents connectés** : Visualisation en temps réel de l'état (En ligne / Hors ligne), de l'adresse IP, de la version de l'application et de la région de chaque téléphone.
    *   **Simulateur interactif de Smartphone (KefyShield)** : Une réplique visuelle d'un téléphone Android sur le côté droit de l'écran. Elle permet de simuler la réception de SMS, de messages de groupe WhatsApp ou d'appels malveillants réels (ex: arnaques Tmoney/Moov). L'analyste voit ainsi exactement comment le téléphone réagit en direct (affichage du grand message rouge de blocage en mode *Overlay*).

### 3. `ThreatIntelTab.tsx` (La console d'exfiltration d'IoCs automatisée par IA)
*   **Rôle métier** : Automatiser la veille sur les menaces nationales en collectant des informations sur les sites officiels de l'État et en extrayant les signatures d'attaque via une intelligence artificielle.
*   **Composants clés** :
    *   **La console Shell interactive** : Permet aux analystes de lancer et de surveiller l'exécution de nos "Robots Éclaireurs" (scrapers) qui scannent h24 les sites du CERT.tg et de l'ANCY.
    *   **Moteur d'extraction Gemini** : Affiche les articles d'alerte découverts. En un clic, l'intelligence artificielle lit l'article complexe, en extrait le résumé sémantique et isole automatiquement les IoCs (faux numéros de téléphone et sites de phishing mentionnés).

### 4. `SignaturesTab.tsx` (Le registre souverain des signatures cryptographiques)
*   **Rôle métier** : Gérer la base de connaissances nationale de blocage cyber (la Blacklist centrale).
*   **Composants clés** :
    *   **Table des signatures IoC** : Liste l'ensemble des règles de blocage (expéditeurs interdits, expressions rationnelles, URLs de phishing, signatures MD5).
    *   **Module d'importation/exportation sécurisé** : Permet d'importer des fichiers d'IoCs de formats standardisés (JSON/CSV) ou d'exporter une sauvegarde cryptée de la base de données avant modification majeure.
    *   **Playground de test IA de signature** : Permet à un analyste de rédiger un motif de signature et de tester immédiatement la pertinence de son blocage à l'aide d'un mini-moteur sémantique local ou de l'IA de Gemini.

### 5. `ForensicsTab.tsx` (La gestion des plaintes citoyennes et le broadcast d'urgence)
*   **Rôle métier** : Gérer les dépôts de plaintes des citoyens togolais et déclencher des contre-mesures de sensibilisation de masse.
*   **Composants clés** :
    *   **La file d'attente des enquêtes (Forensics Queue)** : Liste les signalements d'attaques envoyés automatiquement par les téléphones portables ou déclarés manuellement par les citoyens.
    *   **Panneau d'audit et de validation** : L'analyste peut modifier d'un clic le statut du rapport (Approuvé / Faux positif / En attente d'investigation). S'il est approuvé, le numéro malveillant est immédiatement promu au rang de Signature Nationale de blocage.
    *   **Console de Diffusion Massive ANCY (Mass Broadcast)** : Si un numéro d'arnaqueur réapparaît de manière intensive dans les plaintes, le bouton d'urgence "Sensibiliser" s'active. L'analyste peut diffuser instantanément un flash d'alerte de sensibilisation sur le terminal de tous les citoyens via les réseaux des opérateurs Moov et Togocom.

### 6. `DeploymentTab.tsx` (L'administration système et la télémétrie)
*   **Rôle métier** : Gérer la configuration globale de l'infrastructure, l'accès aux serveurs et la télémétrie réseau.
*   **Composants clés** :
    *   **Configuration de la Passerelle** : Permet de définir l'URL de synchronisation centrale et la fréquence de rafraîchissement des agents mobiles.
    *   **Sélection du moteur de détection central** : Permet de basculer le traitement analytique de la passerelle entre l'intelligence artificielle Google Gemini et la simulation heuristique locale sécurisée.
    *   **Contrôle de Télémétrie** : Statistiques techniques sur la bande passante utilisée, la charge CPU du serveur souverain et le statut d'intégrité SHA-256 de la base de signatures.

---

## 🔄 PARTIE 4 : LES FLUX D'ÉCHANGE COMPLETS (DU TERRAIN AU SOC)

L'écosystème met en œuvre quatre flux d'échange dynamiques et asynchrones pour assurer une immunité collective nationale :

### Flux 1 : L'enrôlement et l'attribution de la clé d'agent
1.  Le citoyen togolais ouvre l'application **KefyShield**. Elle est configurée sur le mode "PROD LIGNE".
2.  L'application génère une identité numérique unique pour l'appareil et envoie une requête d'enregistrement réseau (`POST /api/v1/agent/register`) à la passerelle Express (`server.ts`).
3.  La passerelle reçoit la demande, extrait les informations de l'agent (nom, ville d'affectation, numéro de téléphone, système d'exploitation) et les insère proprement dans le registre central `base_donnees_cache_soc.json`.
4.  L'agent apparaît instantanément en vert sur la carte du Togo du centre de supervision SOC.

### Flux 2 : La remontée d'alerte forensique en temps réel
1.  Le téléphone de l'agent reçoit une notification contenant une arnaque sémantique ciblée (Ex: *"Félicitations ! Vous avez reçu un dépôt Tmoney de 50.000 FCFA. Veuillez cliquer sur ce lien..."*).
2.  Le moteur d'analyse sémantique local de l'application mobile (`PhishingAnalyzer.java`) détecte la tentative de fraude en moins de 1ms.
3.  Le téléphone vibre et affiche instantanément une fenêtre rouge d'interception d'urgence bloquant l'accès à l'escroquerie.
4.  En arrière-plan, sans perturber l'utilisateur, l'application mobile utilise `Retrofit` (`KefylApiService.java`) pour envoyer un rapport d'incident complet à l'adresse `POST /api/v1/report` de la passerelle Express.
5.  La passerelle enregistre l'incident, le géolocalise sur la carte du SOC et notifie l'analyste de garde pour investigation immédiate.

### Flux 3 : La synchronisation périodique de la Blacklist nationale
1.  Toutes les 24 heures ou à l'ouverture de l'application, l'agent mobile appelle l'API de synchronisation (`GET /api/v1/sync`) de notre serveur Express.
2.  La passerelle vérifie la version de signature de l'agent mobile et compile les dernières signatures de blocage validées par le SOC national.
3.  Le terminal télécharge ces signatures cryptographiques légères sous forme de charge utile JSON et les stocke localement dans sa base de données SQLite Room.
4.  Le citoyen est désormais protégé contre les dernières menaces répertoriées par l'ANCY, même s'il traverse des zones rurales privées de connexion Internet (*Resilience First*).

### Flux 4 : Le cycle d'apprentissage et de correction (Feedback Loop)
1.  Si un utilisateur estime qu'une alerte affichée sur son smartphone est une erreur de détection (par exemple, un SMS légitime de sa banque), il clique sur "Déclarer Faux Positif" sur son application.
2.  Le téléphone mémorise ce choix localement pour ne plus le déranger et envoie un rapport de correction au SOC via l'API `/api/v1/report` avec la mention spéciale `faux_positif`.
3.  Sur l'interface administrative du SOC (onglet **Forensics**), la plainte apparaît avec l'icône de statut correspondante.
4.  L'analyste cyber examine la réclamation. S'il valide l'erreur, il clique sur "Classer RAS". Le numéro ou le mot-clé est immédiatement retiré de la Blacklist centrale et placé en liste d'autorisation globale, se propageant sur tous les smartphones du territoire lors de la synchronisation suivante. Ce mécanisme d'apprentissage garantit un outil de protection dynamique et intelligent.

---

## 🛠️ PARTIE 5 : ARCHITECTURE TECHNIQUE DES FICHIERS DU PROJET

Voici la cartographie complète et exhaustive de tous les répertoires et fichiers de notre écosystème, montrant précisément comment chaque brique logicielle contribue à l'effort de cybersécurité nationale.

### 🌐 1. La Racine et la Configuration Générale
*   **`server.ts`** : Le point d'entrée unique de notre passerelle Full-Stack. C'est lui qui héberge l'ensemble des routes d'API, sert les fichiers statiques de l'interface d'administration React en production, et écoute sur le port obligatoire **3000**.
*   **`vite.config.ts`** : Fichier de configuration du compilateur d'assets Vite. Il gère le build optimal du frontend React de notre SOC et s'assure que le serveur de développement s'intègre parfaitement avec Express sans conflit de ports.
*   **`package.json`** : Gère l'ensemble des dépendances Node.js (Express, TypeScript, SDK Gemini `@google/genai`, etc.) et définit les scripts d'intégration continue, de compilation (`build`) et de démarrage en production (`start`).
*   **`.env.example`** : Liste les variables d'environnement nécessaires au projet, notamment la clé secrète d'accès à l'API souveraine Google Gemini (`GEMINI_API_KEY`), sans jamais stocker de clés sensibles en clair dans le code.
*   **`render.yaml`** : Fichier de configuration pour l'hébergement cloud souverain ou automatisé, facilitant l'intégration continue et le déploiement de la plateforme sur des architectures distribuées.

### 🏰 2. Le Dossier de Supervision Visuelle : `/src/`
Ce répertoire contient le code source de l'interface utilisateur de notre centre d'opérations de sécurité (SOC).
*   **`src/main.tsx`** : Le lanceur d'application React. Il charge notre composant racine dans la page web HTML et configure le rendu à l'écran.
*   **`src/App.tsx`** : Le chef d'orchestre visuel de l'interface d'administration. Il gère l'état global de l'application (liste des agents, signatures, plaintes), le basculement entre les onglets métiers et intègre la barre de navigation premium de style cybergouvernemental.
*   **`src/types.ts`** : Le dictionnaire de structures de données TypeScript. Il garantit la cohérence absolue entre le serveur Node et le site web React en définissant strictement le type des objets manipulateurs (ex: `Agent`, `ThreatSignature`, `PhoneComplaint`).
*   **`src/index.css`** : Le fichier CSS principal. Il configure l'intégration de la police d'affichage de prestige **Space Grotesk** pour les titres, la police **JetBrains Mono** pour les logs et valeurs techniques, et applique l'ensemble de notre charte graphique moderne et sobre de style Microsoft Defender / CrowdStrike Falcon.

#### 📁 Les Modules Métiers : `src/components/`
Chaque fichier dans ce répertoire implémente un onglet fonctionnel de la console d'administration :
*   **`DashboardTab.tsx`** : Reçoit la télémétrie en temps réel et affiche la carte géographique interactive du Togo (SVG) avec le graphe de suivi des menaces à sévérités multiples.
*   **`AgentSupervisionTab.tsx`** : Permet la surveillance de la flotte de téléphones connectés et intègre le simulateur d'agent KefyShield pour valider les scénarios de blocage.
*   **`ThreatIntelTab.tsx`** : Intègre la console de veille autonome, se connectant à nos scripts d'arrière-plan pour moissonner les communiqués officiels et les résumer par IA.
*   **`SignaturesTab.tsx`** : Fournit les outils d'ajout, d'analyse, d'importation et de test heuristique des signatures d'incidents (IoCs).
*   **`ForensicsTab.tsx`** : Gère le traitement des plaintes déposées par les citoyens, la validation de leur dangerosité, et pilote l'outil d'alerte de masse Moov/Togocom.
*   **`DeploymentTab.tsx`** : Centralise les configurations de la passerelle centrale, les métriques réseau de télémétrie, et le choix du moteur d'analyse sémantique.
*   **`AdminsTab.tsx`** : Gère le registre d'accès des analystes autorisés à se connecter sur la plateforme SOC.

### ⚙️ 3. Le Cœur Fonctionnel du SOC : `/serveur_dashboard_react/`
Ce dossier regroupe les modules serveurs complexes pilotés par la passerelle Express :
*   **`gestionnaire_base_donnees.ts`** : Service autonome chargé d'assurer la cohérence et l'intégrité de notre base de données JSON locale. Il prévient les corruptions de fichiers lors des écritures concurrentes et gère les points de restauration (sauvegardes d'incidents).
*   **`base_donnees_cache_soc.json`** : La base de données physique locale souveraine de notre projet. Elle garde en mémoire l'état complet du système.
*   **`analyseur_ia_gemini.ts`** : Intègre le connecteur d'intelligence artificielle avec le SDK officiel Google Gemini (`@google/genai`). Il extrait automatiquement les indicateurs de compromission exploitables à partir de communiqués rédigés en langage naturel.
*   **`collecteur_flux_veille_cert.ts`** : Notre script de moissonnage asynchrone doté de sa technologie de secours à 3 niveaux pour naviguer sur les sites gouvernementaux officiels togolais (API WordPress, extracteur de DOM HTML brut, et automatisation de navigateur invisible avec Playwright).

### 🐍 4. Le Laboratoire de Recherche Scientifique : `/serveur_central_python/`
Ce dossier contient le moteur d'analyse scientifique de la plateforme, conçu pour traiter de larges volumes de données cyber :
*   **`main.py`** : Le serveur d'API Python (Flask/FastAPI). Il écoute les appels du serveur Express principal et coordonne l'exécution des modules cyber.
*   **`correlation.py`** : L'algorithme de corrélation d'incidents. Il prend l'ensemble des plaintes citoyennes individuelles et calcule leurs interconnexions sémantiques (mêmes numéros d'escrocs, mêmes liens de phishing) pour regrouper les attaques isolées sous une seule campagne d'attaque nationale coordonnée.
*   **`scrapers.py`** : Modules complémentaires de collecte d'informations cyber spécialisés sur des banques de données d'incidents internationales.
*   **`models.py`** : Définition des structures de données mathématiques utilisées par l'algorithme de corrélation de graphes d'incidents.
*   **`requirements.txt`** : Liste les dépendances du système Python (outils scientifiques, frameworks d'API, etc.).

### 📱 5. L'Agent Cyber Mobile Natif : `/mobile_agent/`
Ce répertoire contient le projet d'application mobile Android native conçue pour les téléphones des citoyens :
*   **`build.gradle` / `settings.gradle`** : Fichiers de configuration de compilation Gradle du projet Android. Ils définissent les versions du kit de développement logiciel (SDK) d'Android, les options de build, et importent les bibliothèques Room SQLite et Retrofit.
*   **`MainActivity.java`** : Fournit l'interface utilisateur épurée et rassurante de l'application mobile installée par les citoyens. Elle affiche l'état d'activité du bouclier (Actif / Inactif), affiche les statistiques locales de SMS et d'appels analysés, et permet de simuler un diagnostic système.
*   **`PhishingAnalyzer.java`** : Le moteur d'analyse à trois niveaux de l'appareil mobile, combinant signatures locales, analyse heuristique-linguistique immédiate, et whitelisting dynamique.
*   **`KefylNotificationService.java`** : Le service d'arrière-plan Android d'écoute de notifications de bas niveau. Il intercepte au vol les SMS, messages WhatsApp, Moov Money et Tmoney entrants pour les soumettre au moteur d'analyse sémantique avant que l'utilisateur ne puisse se faire piéger.
*   **`AppDatabase.java` / `Signature.java`** : Configuration locale du moteur de base de données relationnelle Android Jetpack Room pour un stockage persistant local chiffré des listes de signatures IoC téléchargées.
*   **`RetrofitClient.java` / `KefylApiService.java`** : Gère la tuyauterie de communication réseau HTTP asynchrone entre le téléphone et notre SOC central (enrôlement, envoi d'alertes forensiques et récupération de la blacklist mise à jour).
*   **`SyncWorker.java`** : Tâche d'arrière-plan autonome pilotée par Android WorkManager. Elle s'exécute périodiquement même si l'application mobile est fermée pour synchroniser silencieusement les dernières signatures de sécurité validées par le SOC de l'État.

---

## 🚀 SCÉNARIOS D'UTILISATION : VOYAGE D'UNE DONNÉE EN SITUATION DE CRISE

Voici une illustration pas à pas pour comprendre comment les composants du projet collaborent en temps de crise :

### 1. Découverte d'une attaque
Notre robot de veille (`collecteur_flux_veille_cert.ts`) repère un nouveau communiqué urgent sur `CERT.tg` concernant une campagne de faux remboursements d'impôts ciblant les fonctionnaires togolais.
*   *Action technique* : Le robot extrait le texte brut, calcule son empreinte numérique unique MD5 pour éviter les doublons, et transmet le texte à l'IA Gemini (`analyseur_ia_gemini.ts`).
*   *Extraction IA* : L'IA identifie instantanément deux numéros Togocom d'escrocs et un nom de domaine frauduleux (`http://impots-togo-remboursement.com`). Elle les formate en structures IoC exploitables.

### 2. Validation de la signature nationale
L'analyste de garde sur l'interface d'administration voit l'alerte remonter dans l'onglet **Threat Intel** de son écran de contrôle.
*   *Validation* : L'analyste examine le résumé structuré par l'IA, valide sa dangerosité d'un clic, et l'ajoute officiellement au registre national de blocage (**Signatures**). La nouvelle règle de blocage est enregistrée dans `base_donnees_cache_soc.json`.

### 3. Immunisation collective
Pendant la nuit, le téléphone portable d'un citoyen togolais à Dapaong effectue sa synchronisation automatique en arrière-plan via son service système (`SyncWorker.java`).
*   *Mise à jour* : L'application mobile contacte l'API `/api/v1/sync` de notre passerelle Express, télécharge la règle de blocage concernant le faux domaine d'impôts, et l'écrit silencieusement dans sa base de données locale chiffrée `Room DB`.

### 4. Blocage de l'attaque sur le terrain
Le lendemain matin, ce même citoyen reçoit un SMS WhatsApp : *"Remboursement impôts exceptionnel disponible ! Visitez http://impots-togo-remboursement.com d'urgence."*
*   *Interception locale* : L'écouteur système mobile (`KefylNotificationService.java`) attrape la notification WhatsApp. Le moteur de détection (`PhishingAnalyzer.java`) analyse le message en moins d'une milliseconde, découvre la correspondance avec la signature d'IoC stockée dans la base Room locale, et bloque l'affichage de la notification WhatsApp standard.
*   *Alerte d'interception* : L'application affiche instantanément un grand message rouge d'interception d'urgence de niveau militaire sur l'écran du smartphone pour empêcher le citoyen d'ouvrir le lien malveillant.
*   *Rapport d'incident automatique* : Sans aucune action requise du citoyen, l'application mobile envoie un rapport d'attaque forensique complet de l'incident à l'API `/api/v1/report` de la passerelle Express. L'incident apparaît immédiatement en surbrillance rouge sur la carte interactive du Togo dans la salle de contrôle du SOC à Lomé.

---

## 🎯 SYNTHÈSE DES APPORTS FONCTIONNELS DE CHAQUE COMPOSANT

| Nom du Fichier / Dossier | Technologie de pointe | En termes simples : Qu'apporte-t-il concrètement au citoyen et à l'État ? |
| :--- | :--- | :--- |
| **`/mobile_agent/`** | Android Native (Java 17, Room DB, Retrofit) | **Le Bouclier Citoyen** : Protège en temps réel et localement l'appareil des citoyens contre les fraudes et le *Smishing*, même hors-ligne. |
| **`/src/components/`** | React 18, Tailwind CSS | **La vigie cyber nationale** : Donne une vision géopolitique et tactique claire de la situation aux analystes du SOC grâce à sa carte du Togo dynamic. |
| **`server.ts`** | Node.js, Express.js, TypeScript | **La passerelle centrale** : Le cœur nerveux assurant la communication sécurisée TLS entre les téléphones mobiles et le centre de contrôle de l'État. |
| **`collecteur_flux_veille_cert.ts`** | TypeScript, Playwright, WP REST API | **Le moissonneur autonome** : Surveille sans interruption les sites gouvernementaux pour repérer instantanément les communiqués d'attaque officielle. |
| **`analyseur_ia_gemini.ts`** | Google Gemini API SDK | **L'analyste cyber intelligent** : Traduit les longs paragraphes d'alertes complexes en signatures techniques de blocage précises en une seconde. |
| **`correlation.py`** | Python 3, Pandas, Graph Theory | **L'enquêteur de haut niveau** : Relie mathématiquement les plaintes citoyennes isolées pour identifier les grandes campagnes de cyberattaque. |
| **`base_donnees_cache_soc.json`** | JSON Structuré local | **Le coffre-fort d'intégrité** : Assure la souveraineté numérique totale du Togo en conservant les secrets d'État et d'alertes à l'abri du cloud externe. |

---

*Ce document d'architecture est certifié conforme par la direction de l'ingénierie et de la sécurité des systèmes d'information de la plateforme SP Sentinel Togo.*
