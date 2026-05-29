# GUIDE D'INSTALLATION ET DE DÉPLOIEMENT : KÉFYL SHIELD v1.2
*Système Intégré de Cyber-Sécurité Mobile (SOC National & Agent Intercepteur Heuristique)*

Ce document est le guide officiel pour installer, configurer, tester en temps réel et déployer la solution **Kéfyl Shield**. Il contient toutes les commandes pour héberger le tableau de bord localement, connecter votre smartphone physique et préparer le déploiement en production.

---

## 📋 1. EXPORTATION DU PROJET DEPUIS LE CLOUD

Pour récupérer le projet configuré sur votre machine :
1. Dans l'interface **Google AI Studio**, cliquez sur l'icône de paramètres/d'exportation (en haut à droite).
2. Choisissez l'une des deux méthodes :
   * **Télécharger le projet au format ZIP** (`Download as ZIP`) et décompressez-le dans un dossier de votre machine (ex: `C:\KefylShield`).
   * **Exporter vers GitHub** (`Export to GitHub/Push`) pour cloner le dépôt directement avec :
     ```bash
     git clone <URL_DE_VOTRE_DEPOT_GITHUB>
     cd kefyl-shield
     ```

---

## 🏗️ 2. COMPOSANTS DU CODE SOURCE

Le projet est modulaire et ne nécessite aucune modification de code supplémentaire pour fonctionner. Toutes les bases de données de simulation sont **embarquées et prêtes à l'emploi** :
* 📂 **`src/` et `server.ts` :** Interface Web de notre SOC Central et son serveur Node.js / Express proxy.
* 📂 **`server_central/` :** Moteur API haute performance développé sous **FastAPI (Python)** servant d'alternative pour simuler le SOC à Lomé.
* 📂 **`mobile_agent/` :** L'application Android native écrite en **Java**. Elle embarque un moteur de base de données persistante **Room SQLite**, un analyseur heuristique NLP anti-ingénierie sociale, et un intercepteur de notifications.

---

## 🖥️ 3. LANCEMENT DU SOC & DASHBOARD (VERSION NODE.JS EXTRÊMEMENT SIMPLE)

C'est la méthode recommandée pour tester instantanément. Le serveur Node.js gère à la fois l'interface de contrôle et l'API de synchronisation et de réception des rapports de l'Agent Mobile.

### Commandes à exécuter :
```bash
# 1. Allez dans le répertoire racine du projet
cd kefyl-shield

# 2. Installez les dépendances du Dashboard Web
npm install

# 3. Lancez le serveur Node.js en mode développement
npm run dev
```

* **Accès au Dashboard :** Ouvrez votre navigateur internet sur [http://localhost:3000](http://localhost:3000)
* **Adresse API pour l'Agent Mobile :** `http://<VOTRE_IP_LOCALE>:3000/`

---

## 🐍 4. LANCEMENT DU SOC CENTRAL (VERSION PYTHON FASTAPI ALTERNATIVE)

Si vous souhaitez simuler le SOC Central spécifiquement via l'API FastAPI Python (port `8000`) :

### Commandes sur Windows (cmd) :
```cmd
cd kefyl-shield\server_central
python -m venv venv
call venv\Scripts\activate
pip install fastapi uvicorn pydantic
python main.py
```

### Commandes sur macOS / Linux :
```bash
cd kefyl-shield/server_central
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn pydantic
python3 main.py
```

* **Accès aux APIs de Lomé :** [http://localhost:8000/docs](http://localhost:8000/docs) (Documentation Swagger interactive).
* **Adresse API pour l'Agent Mobile :** `http://<VOTRE_IP_LOCALE>:8000/`

---

## 📱 5. CONFIGURATION ET TEST SUR UN TÉLÉPHONE MOBILE PHYSIQUE

Pour que l'agent installé sur votre téléphone communique avec votre serveur, ils doivent être **sur le même réseau Wi-Fi**.

### Étape 5.1 : Récupérer votre adresse IP de machine locale
* **Sur Windows :** Ouvrez l'invite de commande et tapez :
  ```cmd
  ipconfig
  ```
  *Repérez la ligne "Adresse IPv4 de votre carte Wi-Fi" (ex: `192.168.1.15`).*
* **Sur macOS / Linux :** Ouvrez le terminal et tapez :
  ```bash
  ifconfig | grep "inet "
  ```

### Étape 5.2 : Importer le projet dans Android Studio
1. Ouvrez **Android Studio**.
2. Cliquez sur **File -> New -> Import Project...** et sélectionnez le dossier racine `mobile_agent` (contenant le fichier `build.gradle`).
3. Laissez Android Studio télécharger le SDK et synchroniser le projet Gradle.

### Étape 5.3 : Lancer l'application sur le téléphone de test
1. Activez le **Débogage USB** sur votre smartphone Android (dans les *Paramètres développeurs*).
2. Connectez le smartphone en USB à votre PC.
3. Dans Android Studio, sélectionnez votre téléphone dans la barre d'outils et cliquez sur le bouton vert **Run app** (ou `Shift + F10`).
4. **Configuration IP sur l'application :**
   * Une fois l'application lancée sur votre téléphone, saisissez l'IP de votre machine dans le champ "Configuration réseau du SOC" (ex: `192.168.1.15:3000` si vous utilisez le serveur Node, ou `192.168.1.15:8000` si vous utilisez FastAPI).
   * Cliquez sur **SAUVEGARDER L'IP SERVEUR**.
   * Cliquez sur **FORCER LA SYNCHRONISATION**. La base locale SQLite (Room) va se mettre à jour instantanément !

---

## 🧪 6. PROTOCOLE DE TEST EN DIRECT (VÉRIRIER LE FONCTIONNEMENT À ZÉRO)

Pour prouver que la détection en direct et les rapports fonctionnent parfaitement de bout en bout :

### Étape 6.1 : Vider les bases de données (Démarrage à Zéro)
1. Ouvrez le dashboard sur votre ordinateur ([http://localhost:3000](http://localhost:3000)).
2. Cliquez sur le bouton rouge **"Réinitialiser à Zéro"** situé en haut à droite.
3. Le dashboard est désormais complètement vide : 0 menaces actives, 0 agents en ligne. C'est l'état vierge idéal pour les tests en direct !

### Étape 6.2 : Déclencher les autorisations sur le smartphone
1. Sur l'Agent Mobile, cliquez sur le bouton rouge **"ACCORDER L'ACCÈS AUX NOTIFICATIONS"**.
2. Dans la liste Android qui s'ouvre, activez l'interrupteur pour **"Kefyl Cyber Interceptor"**.
3. Revenez sur l'application : l'en-tête passe au vert **"🟢 PROTECTION ACTIVE"**.

### Étape 6.3 : Simuler une attaque de Niveau Critique (Rouge - Signature)
Nous allons ajouter une signature d'IoC (un faux numéro suspect) pour voir l'interception automatique de signature :
1. Sur le Dashboard Web, cliquez sur le bouton **"Ajouter indicateur"** ou utilisez le formulaire de saisie dans l'onglet **Threat Intel**.
2. Ajoutez par exemple une menace de type `PHONE` avec la valeur `+22899120485` (ou tout numéro de votre choix).
3. Sur votre téléphone intelligent, ouvrez l'Agent et cliquez sur **FORCER LA SYNCHRONISATION** pour récupérer cette signature dans la base Room locale.
4. Pour simuler la réception d'un SMS de ce numéro :
   * Envoyez un SMS ou un message WhatsApp vers votre téléphone de test à partir d'un autre téléphone (contenant le message de votre choix).
   * **Verdict :** Le téléphone intercepte la notification, affiche une alerte système haute priorité **"🚨 KÉFYL : BLOCK ROUGE CRITIQUE"**, incrémente son compteur d'intrusions, et transmet la preuve forensique au Dashboard du SOC qui se met à jour en direct !

### Étape 6.4 : Simuler une attaque de Niveau Vigilance (Jaune - Analyse Psychologique NLP)
Cette fonctionnalité protège les utilisateurs contre les attaques d'ingénierie sociale provenant d'inconnus n'existant pas dans les signatures d'IoC :
1. Envoyez un message structuré à partir d'un **numéro inconnu (qui n'est pas dans votre répertoire téléphonique)** contenant des concepts d'ingénierie sociale (Usurpation d'autorité + Urgence).
   * **Exemple de message :** *« Service Client Togocom : Votre compte Tmoney va être suspendu immédiatement si vous n'envoyez pas votre code. »*
2. **Verdict :** 
   * L'agent identifie l'expéditeur comme inconnu, le passe instantanément en statut **`LISTENING`** dans SQLite.
   * L'analyseur heuristique détecte les leviers **"Usurpation d'une autorité institutionnelle ou commerciale"** et **"Urgence temporelle"**.
   * Le téléphone déclenche une alerte de niveau d'alerte intermédiaire : **"⚠️ KÉFYL : ALERTE VIGILANCE JAUNE"** (pas de perturbation agressive, mais une mise en garde explicite de manipulation psychologique).
   * Le rapport est envoyé en temps réel au SOC Central.

---

## 🚀 7. DÉPLOIEMENT EN PRODUCTION (HÉBERGEMENT CLOUD)

Pour déployer la solution de manière permanente afin que tous les smartphones du Togo puissent s'y connecter de n'importe où sans nécessiter d'IP Wi-Fi locale :

### Solution Cloud Recommandée : Render / Heroku / Railway

#### A. Publier votre dépôt sur GitHub
1. Créez un dépôt sur votre compte GitHub.
2. Initialisez git dans votre dossier de projet et synchronisez-le :
   ```bash
   git init
   git add .
   git commit -m "Déploiement Kéfyl Shield v1.2"
   git remote add origin <URL_DE_VOTRE_DEPOT_GITHUB>
   git branch -M main
   git push -u origin main
   ```

#### B. Héberger le serveur et le Dashboard sur Render
1. Connectez-vous sur [Render.com](https://render.com).
2. Cliquez sur **New -> Web Service** et connectez votre dépôt GitHub.
3. Configurez les propriétés de build suivantes :
   * **Environment :** `Node`
   * **Build Command :** `npm run build`
   * **Start Command :** `npm run start`
4. Ajoutez une variable d'environnement (si vous souhaitez ajouter un composant d'IA à votre backend) :
   * `GEMINI_API_KEY` = *Votre clé Google AI Studio*

Une fois déployé, Render vous fournira une URL publique sécurisée HTTPS (ex: `https://kefyl-soc.onrender.com`).

#### C. Mise en Production de l'Agent Mobile Android
Pour que l'Agent Mobile consomme l'URL publique Web par défaut au lieu d'une IP de test :
1. Dans Android Studio, ouvrez le fichier `/app/src/main/java/com/kefyl/shield/api/RetrofitClient.java`.
2. Remplacez l'URL locale par votre URL d'hébergement Web publique :
   ```java
   public static final String DEFAULT_BASE_URL = "https://kefyl-soc.onrender.com/api/v1/";
   ```
3. Compilez votre application en tant qu'APK signée finale (**Build -> Generate Signed Bundle / APK...**).
4. Diffusez l'APK aux utilisateurs pour un pare-feu connecté 24h/24 et 7j/7 !
