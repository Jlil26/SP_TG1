# SP SENTINEL : PROJET MAJEUR DE CYBERSÉCURITÉ NATIONAL (TOGO)
> **Guide de Présentation pour le Hackathon et l'Équipe**  
> *Rédigé à l'intention de l'équipe SP Sentinel pour le meet de ce soir.*

Ce document présente de bout en bout l'architecture, l'analyse stratégique, le fonctionnement technique poussé et la feuille de route du projet **SP Sentinel**. Conçu spécialement pour que votre équipe puisse le présenter ou s'y référer pour acquérir une maîtrise absolue de la solution, ce guide est directement téléchargeable depuis votre espace de travail.

---

## 1. VISION STRATÉGIQUE ET POSITIONNEMENT CYBER (LE PITCH)

### La Problématique identifiée au Togo
Au Togo, l'ingénierie sociale (SMS frauduleux, usurpations d'identité, faux gains Moov Flooz ou Togocom Tmoney, fausses alertes d'administrations publiques via WhatsApp) fait des ravages quotidiens. Contrairement aux pays occidentaux disposant de firewalls et de bases d'IoC (Indicateurs de Compromission) globales, le Togo souffre d'un manque de **solutions de défense locales, mobiles et actives en temps réel**.

### Nos Deux Cibles Principales

1. **La Population Générale (Grand Public)** :
   * **Le Constat** : Aucune protection n'existe au niveau individuel sur les smartphones. Les menaces arrivent principalement par WhatsApp et SMS.
   * **Notre Solution** : Un pare-feu mobile sous forme d'**Agent Android (Java)** léger, capable de bloquer et d'alerter l'utilisateur instantanément, même s'il n'a pas accès à internet.

2. **Les PME Régionales (Secteurs Financier, Comptabilité, Microfinance)** :
   * **Le Constat** : Les PME sont confrontées à du phishing d'emails ciblé (Spear-phishing). Leurs données sont ultra-confidentielles et ne doivent **sous aucun prétexte quitter le réseau local de l'entreprise**.
   * **Notre Solution (Déploiement Hybride)** : Un serveur de sécurité central installé **en local (LAN)** sur le réseau de la PME, qui filtre les emails et SMS, tandis qu'une base de signatures de réputation globale (Threat Feed) est synchronisée en ligne avec le SOC central SP Sentinel cloud.

---

## 2. CARTOGRAPHIE COMPLÈTE DU RÉPERTOIRE ACTUEL

Voici comment est organisé notre code aujourd'hui. Chaque élément a été structuré de manière modulaire :

| Dossier/Fichier | Rôle Global | Technologies Utilisées | Apport de l'élément dans le projet |
| :--- | :--- | :--- | :--- |
| `/mobile_agent/` | **L'Agent Client Mobile** | Java (Android Natif) | S'installe sur le téléphone du citoyen togoolais. Intercepte les notifications de messages suspects en tâche de fond et bloque les menaces localement. |
| `├── app/src/main/` | Code Android, Assets, Vues | Java / XML Android | Contient l'intelligence locale du client. |
| `├── .../shield/MainActivity.java` | Écran de gestion utilisateur | Java (Android UI) | Affiche le statut d'activité, le compteur de menaces bloquées et permet de configurer l'adresse IP du serveur de synchronisation. |
| `├── .../shield/service/` | Service d'interception SMS/WhatsApp | Java Class | Service d'arrière-plan analysant toutes les entrées de messages en live. |
| `├── .../shield/engine/` | Moteur d'Analyse | Java (NLP Heuristique) | Implémente l'analyse heuristique des leviers d'ingénierie sociale et les filtres d'expressions régulières. |
| `├── .../shield/data/` | Stockage local Android | SQLite via Room Database | Persiste localement les signatures de blocage téléchargées du serveur. Fonctionne sans connexion. |
| `/server_central/` | **Serveur Central d'Analyse** | Python 3 / FastAPI | Point d'ancrage central pour la remontée d'alertes des terminaux et le scrapping des données de veille nationale. |
| `├── main.py` | Point d'entrée des API | FastAPI (Python) | Expose les routes REST de synchronisation bivalente et de réception des rapports judiciaires. |
| `├── scrapers.py` | Collecteur de données de veille | BeautifulSoup / Requests | Scrape en continu les sites du **CERT.TG** et de l'**ANCY (ancy.gouv.tg)** pour extraire les failles et arnaques de source officielle togolaise. |
| `├── correlation.py` | Moteur Forensique Judiciaire | Algorithmes de tri Python | Regroupe les rapports anonymisés par similarité (même numéro de fraudeur, même URL suspecte) pour générer des campagnes d'enquêtes judiciaires exploitables. |
| `/src/` | **Dashboard d'Administration du SOC** | React / Vite / TypeScript | Interface utilisateur web destinée aux analystes cyber de l'ANCY ou du SOC Central pour piloter le parc d'agents mobiles. |
| `/server.ts` | Serveur de Post-Traitement & Mock | Express.js / TypeScript | Gère l'orchestration du dashboard et simule le comportement du SOC central de Lomé. |

---

## 3. ZOOM TECHNIQUE I : LE COMPOSANT D'IA ET LES ENDPOINTS D'API
C'est le point clé qui fera de votre projet le vainqueur du Hackathon. Les jurés adorent les architectures intelligentes mais économes.

```
                           +----------------------------------------+
                           |       CENTRAL SERVER (Python/FastAPI)   |
                           |   - Scrape sources : CERT.TG & ANCY    |
                           |   - Centralized Gemini AI Model        |
                           +-------------------+--------------------+
                                               ^
                                               | [API REST via Sync (Retrofit)]
                                               | - Téléchargement des signatures de blocage
                                               v
+----------------------------------------------+----------------------------------+
|                  MOBILE AGENT (Android - Java) - LOCAL FIREWALL                 |
|                                                                                 |
|  +---------------------------+     Match?     +------------------------------+  |
|  | Intercept Sms & WhatsApp  | -------------> | Local Database (Room SQL)    |  |
|  +---------------------------+                +--------------+---------------+  |
|                                                              | Non-Match        |
|                                                              v                  |
|                                               +------------------------------+  |
|                                               | Local Heuristic Psych Engine |  |
|                                               | (Sovereignty & Offline Mode) |  |
|                                               +------------------------------+  |
+---------------------------------------------------------------------------------+
```

### Comment l'IA Intervient-elle ?
Dans notre système, l'IA intervient à **deux niveaux complémentaires** pour garantir une détection sans faille sans épuiser la batterie du smartphone :

1. **L'IA Heuristique d'Ingénierie Sociale (Sur l'Agent Mobile - Hors-connexion)** :
   Plutôt que d'envoyer chaque message sur un serveur d'IA distant dans le Cloud (ce qui grillerait le forfait internet des togolais et poserait de graves problèmes de vie privée), **l'Agent mobile intègre une IA heuristique locale et hors connexion** (`PhishingAnalyzer.java`).
   Elle cherche dans les messages la présence de trois leviers psychologiques fondamentaux utilisés par les pirates (basée sur une configuration sémantique adaptée au langage local) :
   * **L'Appât du gain ou de récompense** (Ex : *"Gagnez"*, *"Flooz gratuit"*, *"Félicitations vous avez remporté"*, *"Tmoney crédit"*).
   * **L'Urgence pressante ou menace** (Ex : *"Immédiatement"*, *"Suspendu sous 24h"*, *"Bloqué"*, *"Action requise"*).
   * **L'Usurpation d'Autorité** (Ex : *"Gendarmerie"*, *"Service client Moov"*, *"Direction togotelecom"*, *"Conseiller BTCI / UTB"*).

2. **L'IA de Synthèse Générative (Côté Serveur - Centralisé)** :
   Lorsqu'un article ou une alerte est scrapée automatiquement depuis **CERT.TG** par notre script Python Python (`scrapers.py`), un modèle d'IA générative (comme **Gemini via l'API @google/genai**) traite la plainte ou l'article pour en **extraire de manière structurée des indicateurs techniques exploitables (IoC)** (numéros de téléphone des escrocs, sites web malveillants clones de tmoney). Ces indicateurs sont convertis en signatures bivalentes JSON légères, prêtes à être déployées sur tous les terminaux mobiles togolais lors de la prochaine synchronisation.

---

## 4. ZOOM TECHNIQUE II : LES PROTOCOLES DE COMMUNICATION
Pour vos collaborateurs et le jury du hackathon, il est fondamental de pouvoir expliquer comment le mobile et le serveur discutent entre eux.

La communication se fait via deux standards de l'industrie : le **protocole HTTP avec l'architecture API REST**, et l'échange de documents au format **JSON**.

### Les Deux Canaux Principaux de Communication

#### Canal A : La Synchronisation Périodique (Server -> Mobile)
L'Agent Mobile veut récupérer la liste noire des numéros et des sites suspects tenus à jour par le central de Lomé.
* **Technologie Mobile** : On utilise la libraire **Retrofit** (en Java) couplée à un gestionnaire de tâches d'arrière-plan Android appelé **WorkManager**.
* **Fréquence** : Toutes les 2 semaines ou sur demande (forçage manuel d'urgence "Flash Update").
* **Processus** : L'agent envoie une requête `GET http://serveur-central:3000/api/v1/sync`. Le serveur répond en envoyant un flux de données structuré en JSON contenant la base de signatures :
```json
{
  "success": true,
  "sync_timestamp": "2026-05-26T19:00:00Z",
  "signatures_count": 3,
  "data": [
    {
      "id": 1,
      "pattern": "+22899120485",
      "type": "PHONE",
      "severity": "Critical",
      "details": "Numéro suspect signalant de fausses transactions Moov Flooz"
    },
    {
      "id": 2,
      "pattern": "togotelecom-tmoney.com",
      "type": "URL",
      "severity": "Critical",
      "details": "Site clone imitant le portail officiel de connexion."
    }
  ]
}
```
L'agent mobile parse ce JSON et l'injecte dans son **SQLite (Room)** local.

#### Canal B : La Télémétrie Judiciaire de Sécurité (Mobile -> Server)
Dès qu'un utilisateur reçoit un SMS et que l'Agent Mobile le détecte et le bloque, d'où provient l'enquête ? Pour aider les parquets togolais à traquer les réseaux structurés, le téléphone mobile remonte le méfait de manière totalement **anonymisée** (zero exfiltration de données privées).
* **Processus** : L'agent envoie une requête `POST http://serveur-central:3000/api/v1/report` contenant le corps de l'attaque :
```json
{
  "device_id": "AGENT-TG-E3D2",
  "sender_phone": "+22899120485",
  "evidence_text": "Alerte, recevez 500.000F de compensation Flooz en allant sur togotelecom-tmoney.com !",
  "location": "Lomé",
  "meta_data": {
    "detection_reason": "CRITICAL_SIGNATURE_MATCH",
    "gmt_time": 177991204481
  }
}
```
Le serveur reçoit cette alerte suspecte et la stocke. Ensuite, l'algorithme forensique `run_forensic_correlation()` regroupe tous les terminaux ayant remonté une fraude initiée par le même numéro de téléphone (`+22899120485`) ou le même domaine suspect. Il identifie ainsi instantanément une **campagne d'attaques active à l'échelle du pays**, prête à faire l'objet d'une enquête officielle de la gendarmerie.

---

## 5. RECONCEPTION ARCHITECTURALE PROPOSÉE (PYTHON SERVER + JAVA MOBILE)

C'est là que réside votre vision pour l'implémentation future : **simplifier la pile technologique pour votre équipe lors du hackathon** en se concentrant sur vos forces : **le Python pour le serveur** et **le Java pour le mobile Android**.

### Pourquoi cette combinaison Java/Python est le choix optimal ?
1. **Zéro friction de compétences** : Votre équipe maîtrise déjà concrètement le Python et le Java. Exit Node.js/TypeScript côté serveur ou Kotlin sur mobile, cela évite l'éparpillement linguistique.
2. **Puissance statistique de Python** : Idéal pour l'analyse forensique, le scrapping web (BeautifulSoup/requests) et la manipulation facile des librairies d'Intelligence Artificielle de Google (Gemini SDK).
3. **Optimisation système avec Java** : La gestion d'arrière-plan sous Android par le `NotificationListenerService` et la persistance locale cryptée SQLite/Room s'effectuent de façon optimale et sans latence mémoire en Java.

---

### Modèle de Déploiement Hybride pour les PME Togolaises
Afin de répondre au problème spécifique des PME, l'architecture cible est la suivante :

```
                        +---------------------------------------+
                        |           SOC CENTRAL CLOUD           |
                        |      (Filtres Gobaux de Réputation)   |
                        +-------------------+-------------------+
                                            |
                                            | [Mise à jour de la base globale]
                                            v
+-------------------------------------------+-----------------------------------+
|               RÉSEAU INTERNE SÉCURISÉ DE LA PME (Réseau LAN)                 |
|                                                                               |
|   +--------------------------+  Flux Local  +-----------------------------+   |
|   |   Postes de Travail /    | ------------> | SERVEUR PASSERELLE LOCAL   |   |
|   |    Emails & SMS Client   |               | (FastAPI - Traitement LAN)  |   |
|   +--------------------------+               +-----------------------------+   |
|                                                                               |
|   *Avantage* : Aucune donnée personnelle d'emails ne sort sur Internet.       |
|   L'analyse de cybersécurité reste 100% au sein du périmètre de l'entreprise. |
+-------------------------------------------------------------------------------+
```

* **Le Serveur Passerelle Local (FastAPI)** : Déployé localement au sein du réseau informatique de la PME. Il intercepte les requêtes de messages internes, les courriels, et analyse les tentatives d'ingénierie sociale directement en local en conservant la souveraineté complète des données de la PME.
* **Le SOC Central en Ligne (FastAPI Cloud)** : Un serveur distant géré par Kéfyl qui héberge et distribue uniquement les signatures des menaces de réputation globale (sans aucune donnée privée). Il met périodiquement à jour la base locale de la PME.

---

### Structure Cible du Projet Unifié (FastAPI + Java Android)

Lors de la transition définitive, voici la structure idéale et épurée que nous allons concevoir :

```
/kefyl-shield-project
│
├── /kefyl_fastapi_server/         # 100% Python - Serveur Central & Passerelle Locale
│   ├── main.py                    # API de routage (FastAPI), authentification, synchro
│   ├── config.py                  # Variables d'environnement locales (.env, clés d'API)
│   ├── /scrapers/                 # Module de scraping des menaces togolaise
│   │   ├── cert_scraper.py
│   │   └── ancy_scraper.py
│   ├── /ai_module/                # Scripts de classification d'IA avec Gemini API
│   │   └── threat_extractor.py
│   ├── /forensics/                # Moteur judiciaire de regroupement de corrélations
│   │   └── correlation_engine.py
│   └── requirements.txt           # fastapi, uvicorn, requests, beautifulsoup4, google-genai
│
└── /kefyl_java_android_agent/     # 100% Java - Application native Android
    ├── /app/src/main/
    │   ├── /java/com/kefyl/shield/
    │   │   ├── MainActivity.java  # Interface utilisateur de contrôle locale
    │   │   ├── /api/              # Retrofit & OkHttp (Appels aux API REST du serveur)
    │   │   │   ├── RetrofitClient.java
    │   │   │   └── KefylApiService.java
    │   │   ├── /data/             # Persistance locale (SQLite / Room Database)
    │   │   │   ├── AppDatabase.java
    │   │   │   └── SignatureDao.java
    │   │   ├── /service/          # Service d'écoute d'arrière-plan sans connexion
    │   │   │   └── KefylNotificationService.java
    │   │   └── /engine/           # Diagnostic heuristique psychologique (Anti-phishing)
    │   │       └── PhishingAnalyzer.java
    │   └── /res/layout/           # Écrans graphiques en XML Android
    │       └── activity_main.xml
    └── build.gradle               # Dépendances (Room Database, WorkManager, Retrofit)
```

### Synthèse Finale des Arguments pour Votre Présentation Ce Soir
Pendant votre meeting, mettez en avant ces 3 arguments imparables :
1. **L'autonomie locale par design** : Notre agent bloque les attaques instantanément grâce au moteur d'analyse hors ligne intégré en SQLite/Java, préservant ainsi la connexion internet de l'utilisateur.
2. **Le respect de la vie privée (Zéro Fuite)** : L'anonymisation intégrale et l'alternative d'une passerelle locale FastAPI pour les PME garantissent que les emails confidentiels restent au sein de l'entreprise.
3. **Le choix pragmatique de l'équipe** : Construire l'intégralité du produit cyber uniquement sur deux géants éprouvés du développement (FastAPI/Python pour le serveur, et Android/Java pour le terminal mobile) élimine la surcharge d'apprentissage pour se concentrer sur l'efficacité sémantique et la pertinence forensique.

Bonne chance pour votre meeting d'équipe de ce soir ! Vous disposez désormais d'un plan d'action d'une clarté professionnelle absolue pour remporter ce Hackaton !
