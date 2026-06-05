package com.kefyl.shield;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.provider.Settings;
import android.text.TextUtils;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.work.OneTimeWorkRequest;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkInfo;
import androidx.work.WorkManager;

import com.kefyl.shield.api.RetrofitClient;
import com.kefyl.shield.data.AppDatabase;
import com.kefyl.shield.worker.SyncWorker;

import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class MainActivity extends AppCompatActivity {

    private static final String CHANNEL_ID = "kefyl_phishing_alert";

    private TextView tvStatusHeader;
    private TextView tvBlockedCount;
    private TextView tvSignaturesCount;
    private TextView tvLastUpdate;
    private TextView tvPermissionWarning;
    private View tvPermissionWarningLayout;
    
    private Button btnSyncNow;
    private Button btnEnablePermission;

    private AppDatabase db;
    private StatsReceiver statsReceiver;
    private boolean isActivityInForeground = false;

    // Connectivity receiver for automatic synchronization when internet returns
    private final BroadcastReceiver networkReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (isNetworkAvailable()) {
                triggerBackgroundSync();
            }
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        db = AppDatabase.getDatabase(this);

        // Créer le canal de notification immédiatement au démarrage
        createNotificationChannel();

        // Initialisation des éléments d'UI
        tvStatusHeader = findViewById(R.id.tvStatusHeader);
        tvBlockedCount = findViewById(R.id.tvBlockedCount);
        tvSignaturesCount = findViewById(R.id.tvSignaturesCount);
        tvLastUpdate = findViewById(R.id.tvLastUpdate);
        tvPermissionWarning = findViewById(R.id.tvPermissionWarning);
        tvPermissionWarningLayout = findViewById(R.id.tvPermissionWarningLayout);

        btnSyncNow = findViewById(R.id.btnSyncNow);
        btnEnablePermission = findViewById(R.id.btnEnablePermission);

        // Actionneur pour les paramètres d'URL cachés (icône engrenage)
        android.widget.ImageButton btnOpenSettings = findViewById(R.id.btnOpenSettings);
        if (btnOpenSettings != null) {
            btnOpenSettings.setOnClickListener(v -> showSettingsDialog());
        }

        // Forcer la synchronisation manuelle instantanée via WorkManager
        btnSyncNow.setOnClickListener(v -> {
            btnSyncNow.setEnabled(false);
            btnSyncNow.setText("Vérification en cours...");
            
            OneTimeWorkRequest syncRequest = new OneTimeWorkRequest.Builder(SyncWorker.class).build();
            WorkManager.getInstance(MainActivity.this).enqueue(syncRequest);

            WorkManager.getInstance(MainActivity.this)
                    .getWorkInfoByIdLiveData(syncRequest.getId())
                    .observe(MainActivity.this, workInfo -> {
                        if (workInfo != null && workInfo.getState().isFinished()) {
                            btnSyncNow.setEnabled(true);
                            refreshUiStats();
                            Toast.makeText(MainActivity.this, "Base de sécurité mise à jour !", Toast.LENGTH_SHORT).show();
                        }
                    });
        });

        // Ouvrir ou gérer les options d'accréditation de sécurité de l'Android
        btnEnablePermission.setOnClickListener(v -> requestOrOpenNotificationSettings());

        // Rendre toute la zone de warning rouge cliquable pour une plus grande réceptivité au clic
        if (tvPermissionWarningLayout != null) {
            tvPermissionWarningLayout.setOnClickListener(v -> requestOrOpenNotificationSettings());
        }

        // Rendre aussi la zone "rouge" ou verte du statut en entête cliquable
        if (tvStatusHeader != null) {
            tvStatusHeader.setOnClickListener(v -> requestOrOpenNotificationSettings());
        }

        // Demande de la permission de notifications au démarrage (Android 13+ / API 33+)
        if (android.os.Build.VERSION.SDK_INT >= 33) {
            if (androidx.core.content.ContextCompat.checkSelfPermission(this, "android.permission.POST_NOTIFICATIONS") 
                    != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                androidx.core.app.ActivityCompat.requestPermissions(this,
                        new String[]{"android.permission.POST_NOTIFICATIONS"}, 101);
            }
        }

        // Programmer la synchronisation périodique toutes les 2 semaines
        schedulePeriodicSync();

        // Écouteur de broadcast pour mettre à jour l'UI quand un événement survient (blocage, sync ou nouvelle menace)
        statsReceiver = new StatsReceiver();
        IntentFilter eventFilter = new IntentFilter();
        eventFilter.addAction("com.kefyl.shield.UPDATE_STATS");
        eventFilter.addAction("com.kefyl.shield.NEW_THREAT");
        
        if (android.os.Build.VERSION.SDK_INT >= 33) {
            registerReceiver(statsReceiver, eventFilter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(statsReceiver, eventFilter);
        }

        // Enregistrer l'écouteur de connectivité pour le sync automatique
        IntentFilter connectivityFilter = new IntentFilter(android.net.ConnectivityManager.CONNECTIVITY_ACTION);
        registerReceiver(networkReceiver, connectivityFilter);

        // Vérifier si démarré avec un signal d'alerte de menace immédiat
        checkIntentForThreat(getIntent());

        // Vérifier si l'agent est déjà enregistré
        SharedPreferences sPrefs = getSharedPreferences("kefyl_prefs", MODE_PRIVATE);
        String savedName = sPrefs.getString("agent_registered_name", "");
        if (savedName.isEmpty()) {
            showRegistrationFormDialog();
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        checkIntentForThreat(intent);
    }

    private void checkIntentForThreat(Intent intent) {
        if (intent != null && intent.getBooleanExtra("show_threat_dialog", false)) {
            String sender = intent.getStringExtra("sender");
            String text = intent.getStringExtra("message_text");
            String type = intent.getStringExtra("threat_type");
            String details = intent.getStringExtra("details");
            String extraLevers = intent.getStringExtra("extra_levers");
            
            // Consomme l'intent
            intent.putExtra("show_threat_dialog", false);
            
            // Mettre en cache dans les préférences partagées pour affichage sûr et propre sous onResume
            SharedPreferences prefs = getSharedPreferences("kefyl_prefs", MODE_PRIVATE);
            prefs.edit()
                .putBoolean("has_pending_threat", true)
                .putString("pending_threat_sender", sender)
                .putString("pending_threat_text", text)
                .putString("pending_threat_type", type)
                .putString("pending_threat_details", details)
                .putString("pending_threat_extra_levers", extraLevers)
                .apply();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        isActivityInForeground = false;
    }

    @Override
    protected void onResume() {
        super.onResume();
        isActivityInForeground = true;
        refreshUiStats();
        checkNotificationPermission();

        // En cas de retour en ligne, rafraîchir silencieusement
        if (isNetworkAvailable()) {
            triggerBackgroundSync();
        }

        // Vérifier si une alerte de cybermenace est en attente après déverrouillage ou retour au premier plan
        SharedPreferences prefs = getSharedPreferences("kefyl_prefs", MODE_PRIVATE);
        if (prefs.getBoolean("has_pending_threat", false)) {
            String sender = prefs.getString("pending_threat_sender", "");
            String text = prefs.getString("pending_threat_text", "");
            String type = prefs.getString("pending_threat_type", "");
            String details = prefs.getString("pending_threat_details", "");
            String extraLevers = prefs.getString("pending_threat_extra_levers", "");

            // Consommer
            prefs.edit()
                .putBoolean("has_pending_threat", false)
                .remove("pending_threat_sender")
                .remove("pending_threat_text")
                .remove("pending_threat_type")
                .remove("pending_threat_details")
                .remove("pending_threat_extra_levers")
                .apply();

            showThreatAlert(sender, text, type, details, extraLevers);
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (statsReceiver != null) {
            try {
                unregisterReceiver(statsReceiver);
            } catch (Exception ignored) {}
        }
        try {
            unregisterReceiver(networkReceiver);
        } catch (Exception ignored) {}
    }

    private void refreshUiStats() {
        SharedPreferences prefs = getSharedPreferences("kefyl_prefs", MODE_PRIVATE);
        
        // 1. Lire le nombre de menaces interceptées localement
        int blockedCount = prefs.getInt("blocked_threats_count", 0);
        tvBlockedCount.setText(String.valueOf(blockedCount));

        // 2. Lire l'état et la date de dernière mise à jour
        String lastUpdate = prefs.getString("last_update_timestamp", "Jamais");
        if ("Jamais".equals(lastUpdate) || lastUpdate.isEmpty()) {
            tvLastUpdate.setText("Dernier contrôle de sécurité effectué : Jamais");
        } else {
            tvLastUpdate.setText("Dernière mise à jour : " + lastUpdate);
        }

        // 3. Compter le nombre d'indicateurs d'attaques actifs en SQLite (Room)
        Executors.newSingleThreadExecutor().execute(() -> {
            int count = db.signatureDao().getCount();
            runOnUiThread(() -> {
                tvSignaturesCount.setText(String.valueOf(count));
                if (count == 0) {
                    btnSyncNow.setText("🔴 SÉCURITÉ INACTIVE\n(Touchez ici pour activer la protection)");
                    btnSyncNow.setBackgroundTintList(android.content.res.ColorStateList.valueOf(0xFFEF4444));
                } else {
                    btnSyncNow.setText("🟢 PROTECTION ACTIVÉE ET SÛRE\n(Appuyez pour vérifier à nouveau)");
                    btnSyncNow.setBackgroundTintList(android.content.res.ColorStateList.valueOf(0xFF10B981));
                }
            });
        });
    }

    private void checkNotificationPermission() {
        String enabledListeners = Settings.Secure.getString(getContentResolver(), "enabled_notification_listeners");
        boolean isListenerGranted = enabledListeners != null && enabledListeners.contains(getPackageName());

        boolean isPostNotificationGranted = true;
        if (android.os.Build.VERSION.SDK_INT >= 33) {
            isPostNotificationGranted = androidx.core.content.ContextCompat.checkSelfPermission(this, 
                    "android.permission.POST_NOTIFICATIONS") == android.content.pm.PackageManager.PERMISSION_GRANTED;
        }

        boolean canDrawOverlays = true;
        if (android.os.Build.VERSION.SDK_INT >= 23) {
            canDrawOverlays = android.provider.Settings.canDrawOverlays(this);
        }

        if (isListenerGranted && isPostNotificationGranted) {
            if (!canDrawOverlays) {
                tvStatusHeader.setText("🟡 SP SENTINEL ACTIF (Écrans Restreints)");
                tvStatusHeader.setTextColor(getResources().getColor(android.R.color.holo_orange_dark));
                if (tvPermissionWarningLayout != null) {
                    tvPermissionWarningLayout.setVisibility(View.VISIBLE);
                }
                tvPermissionWarning.setVisibility(View.VISIBLE);
                btnEnablePermission.setVisibility(View.VISIBLE);
                
                StringBuilder warningText = new StringBuilder();
                warningText.append("💡 PROTECTION COMPLETE ACTIVE : L'interception et la sécurité fonctionnent !\n\n")
                        .append("Cependant, Android bloque l'ouverture automatique de fenêtres de sécurité en arrière-plan.\n")
                        .append("Pour faire surgir INSTANTANÉMENT la fenêtre rouge en plein écran sans devoir toucher la notification, autorisez 'Afficher sur d'autres applications'.\n\n")
                        .append("👉 Touchez ici pour ouvrir l'assistant d'activation (ÉTAPE 3).");
                tvPermissionWarning.setText(warningText.toString());
            } else {
                tvStatusHeader.setText("🟢 SP SENTINEL ACTIF");
                tvStatusHeader.setTextColor(getResources().getColor(android.R.color.holo_green_dark));
                if (tvPermissionWarningLayout != null) {
                    tvPermissionWarningLayout.setVisibility(View.GONE);
                }
                tvPermissionWarning.setVisibility(View.GONE);
                btnEnablePermission.setVisibility(View.GONE);
            }
        } else {
            tvStatusHeader.setText("🔴 EN ATTENTE DE PERMISSIONS");
            tvStatusHeader.setTextColor(getResources().getColor(android.R.color.holo_red_dark));
            if (tvPermissionWarningLayout != null) {
                tvPermissionWarningLayout.setVisibility(View.VISIBLE);
            }
            tvPermissionWarning.setVisibility(View.VISIBLE);
            btnEnablePermission.setVisibility(View.VISIBLE);
            
            StringBuilder warningText = new StringBuilder();
            if (!isListenerGranted && !isPostNotificationGranted) {
                warningText.append("ATTENTION : L'agent a besoin de l'accès aux notifications (Service) ET de l'autorisation d'affichage des notifications.\n\n");
            } else if (!isListenerGranted) {
                warningText.append("ATTENTION : L'agent ne peut pas intercepter les attaques WhatsApp ou SMS tant que l'accès aux notifications (Service) n'est pas autorisé.\n\n");
            } else {
                warningText.append("ATTENTION : L'affichage des alertes de blocage est désactivé. Veuillez autoriser les Notifications pour cette application.\n\n");
            }
            
            warningText.append("🛡️ SI LES BOUTONS SONT GRISÉS / BLOQUÉS (Android 13+) :\n")
                    .append("1. Allez dans les Paramètres de votre téléphone -> Applications -> SP_TG mobile (ou laissez votre doigt appuyé sur l'icône de l'application sur l'écran d'accueil et choisissez 'Infos sur l'application').\n")
                    .append("2. Cliquez sur les trois petits points (⋮) en haut à droite de l'écran d'infos.\n")
                    .append("3. Choisissez 'Autoriser les paramètres restreints' (ou 'Allow restricted settings') et confirmez.\n")
                    .append("4. Revenez ici, vous pourrez désormais activer pleinement toutes les autorisations !");
            
            tvPermissionWarning.setText(warningText.toString());
        }
    }

    private void requestOrOpenNotificationSettings() {
        showActivationAssistantDialog();
    }

    private void showActivationAssistantDialog() {
        final android.app.Dialog dialog = new android.app.Dialog(this);
        dialog.requestWindowFeature(android.view.Window.FEATURE_NO_TITLE);

        android.widget.LinearLayout root = new android.widget.LinearLayout(this);
        root.setOrientation(android.widget.LinearLayout.VERTICAL);
        root.setPadding(dpToPx(20), dpToPx(20), dpToPx(20), dpToPx(20));

        android.graphics.drawable.GradientDrawable background = new android.graphics.drawable.GradientDrawable();
        background.setColor(android.graphics.Color.parseColor("#121824")); // Deep professional background matching SOC
        background.setCornerRadius((float) dpToPx(12));
        background.setStroke(dpToPx(1), android.graphics.Color.parseColor("#1F2937"));
        root.setBackground(background);

        // Header warning layout
        android.widget.LinearLayout header = new android.widget.LinearLayout(this);
        header.setOrientation(android.widget.LinearLayout.HORIZONTAL);
        header.setGravity(android.view.Gravity.CENTER_VERTICAL);
        header.setPadding(dpToPx(12), dpToPx(8), dpToPx(12), dpToPx(8));

        android.graphics.drawable.GradientDrawable headerBg = new android.graphics.drawable.GradientDrawable();
        headerBg.setColor(android.graphics.Color.parseColor("#1E1B4B")); // Dark blue indigo accent
        headerBg.setCornerRadius((float) dpToPx(6));
        header.setBackground(headerBg);

        android.widget.ImageView alertIcon = new android.widget.ImageView(this);
        alertIcon.setImageResource(android.R.drawable.ic_dialog_info);
        alertIcon.setColorFilter(android.graphics.Color.parseColor("#818CF8"));

        android.widget.TextView titleTv = new android.widget.TextView(this);
        titleTv.setText("🔑 ASSISTANT D'ACTIVATION SP SENTINEL");
        titleTv.setTextSize(13);
        titleTv.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        titleTv.setTextColor(android.graphics.Color.parseColor("#818CF8"));
        titleTv.setPadding(dpToPx(8), 0, 0, 0);

        header.addView(alertIcon, new android.widget.LinearLayout.LayoutParams(dpToPx(20), dpToPx(20)));
        header.addView(titleTv);
        root.addView(header);

        // Explanations text
        android.widget.TextView explainTv = new android.widget.TextView(this);
        explainTv.setText("Pour bloquer les cyber-fraudes, Android requiert d'activer notre service de surveillance. Cependant, parce que l'application est installée directement (via APK), Android 13+ bloque parfois cette activation avec le message :\n\n⚠️ \"Paramètre restreint : pour votre sécurité, ce paramètre est indisponible...\"");
        explainTv.setTextColor(android.graphics.Color.parseColor("#E2E8F0"));
        explainTv.setTextSize(12);
        explainTv.setPadding(0, dpToPx(14), 0, dpToPx(10));
        root.addView(explainTv);

        android.widget.TextView subexplainTv = new android.widget.TextView(this);
        subexplainTv.setText("Pas de panique ! Suivez ces 2 étapes simples pour débloquer et sécuriser votre appareil :");
        subexplainTv.setTextColor(android.graphics.Color.parseColor("#94A3B8"));
        subexplainTv.setTextSize(11);
        subexplainTv.setTypeface(android.graphics.Typeface.DEFAULT, android.graphics.Typeface.BOLD);
        subexplainTv.setPadding(0, 0, 0, dpToPx(12));
        root.addView(subexplainTv);

        // --- STEP 1 CONTAINER ---
        android.widget.LinearLayout step1Box = new android.widget.LinearLayout(this);
        step1Box.setOrientation(android.widget.LinearLayout.VERTICAL);
        step1Box.setPadding(dpToPx(10), dpToPx(10), dpToPx(10), dpToPx(10));
        android.graphics.drawable.GradientDrawable step1Bg = new android.graphics.drawable.GradientDrawable();
        step1Bg.setColor(android.graphics.Color.parseColor("#1E293B"));
        step1Bg.setCornerRadius((float) dpToPx(6));
        step1Box.setBackground(step1Bg);

        android.widget.TextView step1Title = new android.widget.TextView(this);
        step1Title.setText("ÉTAPE 1 : Déverrouiller les restrictions d'Android");
        step1Title.setTextColor(android.graphics.Color.parseColor("#F59E0B")); // Amber
        step1Title.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        step1Title.setTextSize(11);
        step1Box.addView(step1Title);

        android.widget.TextView step1Desc = new android.widget.TextView(this);
        step1Desc.setText("Cliquez sur le bouton ci-dessous :\n\n1. En haut à droite, cliquez sur les 3 petits points (⋮).\n2. Sélectionnez « Autoriser les paramètres restreints ».\n3. Confirmez avec votre schéma / empreinte digitale.");
        step1Desc.setTextColor(android.graphics.Color.parseColor("#CBD5E1"));
        step1Desc.setTextSize(10);
        step1Desc.setPadding(0, dpToPx(4), 0, dpToPx(8));
        step1Box.addView(step1Desc);

        android.widget.Button btnStep1 = new android.widget.Button(this);
        btnStep1.setText("👉 1. OUVRIR LES INFOS DE L'APPLICATION 👈");
        android.graphics.drawable.GradientDrawable b1Bg = new android.graphics.drawable.GradientDrawable();
        b1Bg.setColor(android.graphics.Color.parseColor("#F59E0B"));
        b1Bg.setCornerRadius((float) dpToPx(4));
        btnStep1.setBackground(b1Bg);
        btnStep1.setTextColor(android.graphics.Color.BLACK);
        btnStep1.setTextSize(10);
        btnStep1.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        btnStep1.setLayoutParams(new android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.MATCH_PARENT, dpToPx(38)
        ));
        btnStep1.setOnClickListener(v -> {
            try {
                Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(android.net.Uri.parse("package:" + getPackageName()));
                startActivity(intent);
                Toast.makeText(this, "Cliquez sur les 3 points (⋮) en haut à droite puis 'Autoriser les paramètres restreints'", Toast.LENGTH_LONG).show();
            } catch (Exception e) {
                Toast.makeText(this, "Erreur lors de l'ouverture des infos de l'application.", Toast.LENGTH_SHORT).show();
            }
        });
        step1Box.addView(btnStep1);
        root.addView(step1Box);

        // Divider
        android.view.View divider = new android.view.View(this);
        android.widget.LinearLayout.LayoutParams divLp = new android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.MATCH_PARENT, dpToPx(1)
        );
        divLp.setMargins(0, dpToPx(12), 0, dpToPx(12));
        divider.setLayoutParams(divLp);
        divider.setBackgroundColor(android.graphics.Color.parseColor("#1F2937"));
        root.addView(divider);

        // --- STEP 2 CONTAINER ---
        android.widget.LinearLayout step2Box = new android.widget.LinearLayout(this);
        step2Box.setOrientation(android.widget.LinearLayout.VERTICAL);
        step2Box.setPadding(dpToPx(10), dpToPx(10), dpToPx(10), dpToPx(10));
        android.graphics.drawable.GradientDrawable step2Bg = new android.graphics.drawable.GradientDrawable();
        step2Bg.setColor(android.graphics.Color.parseColor("#0F172A"));
        step2Bg.setCornerRadius((float) dpToPx(6));
        step2Box.setBackground(step2Bg);

        android.widget.TextView step2Title = new android.widget.TextView(this);
        step2Title.setText("ÉTAPE 2 : Activer l'écouteur de sécurité");
        step2Title.setTextColor(android.graphics.Color.parseColor("#10B981")); // Emerald Green
        step2Title.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        step2Title.setTextSize(11);
        step2Box.addView(step2Title);

        android.widget.TextView step2Desc = new android.widget.TextView(this);
        step2Desc.setText("Une fois déverrouillé, cliquez sur le bouton ci-dessous :\n\n1. Cherchez « SP_TG Détecteur de Fraude » dans la liste.\n2. Activez le switch pour démarrer l'interception.");
        step2Desc.setTextColor(android.graphics.Color.parseColor("#CBD5E1"));
        step2Desc.setTextSize(10);
        step2Desc.setPadding(0, dpToPx(4), 0, dpToPx(8));
        step2Box.addView(step2Desc);

        android.widget.Button btnStep2 = new android.widget.Button(this);
        btnStep2.setText("👉 2. ACTIVER LE SERVICE SP_TG SENTINEL 👈");
        android.graphics.drawable.GradientDrawable b2Bg = new android.graphics.drawable.GradientDrawable();
        b2Bg.setColor(android.graphics.Color.parseColor("#10B981"));
        b2Bg.setCornerRadius((float) dpToPx(4));
        btnStep2.setBackground(b2Bg);
        btnStep2.setTextColor(android.graphics.Color.WHITE);
        btnStep2.setTextSize(10);
        btnStep2.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        btnStep2.setLayoutParams(new android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.MATCH_PARENT, dpToPx(38)
        ));
        btnStep2.setOnClickListener(v -> {
            try {
                // Ensure notification standard permission is there as well, but listeners is priority
                Intent intent = new Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS");
                startActivity(intent);
                Toast.makeText(this, "Activez le switch pour 'SP_TG Détecteur de Fraude'", Toast.LENGTH_LONG).show();
            } catch (Exception e) {
                Toast.makeText(this, "Erreur d'ouverture des autorisations système.", Toast.LENGTH_SHORT).show();
            }
        });
        step2Box.addView(btnStep2);
        root.addView(step2Box);

        // Divider 2
        android.view.View divider2 = new android.view.View(this);
        android.widget.LinearLayout.LayoutParams div2Lp = new android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.MATCH_PARENT, dpToPx(1)
        );
        div2Lp.setMargins(0, dpToPx(12), 0, dpToPx(12));
        divider2.setLayoutParams(div2Lp);
        divider2.setBackgroundColor(android.graphics.Color.parseColor("#1F2937"));
        root.addView(divider2);

        // --- STEP 3 CONTAINER ---
        android.widget.LinearLayout step3Box = new android.widget.LinearLayout(this);
        step3Box.setOrientation(android.widget.LinearLayout.VERTICAL);
        step3Box.setPadding(dpToPx(10), dpToPx(10), dpToPx(10), dpToPx(10));
        android.graphics.drawable.GradientDrawable step3Bg = new android.graphics.drawable.GradientDrawable();
        step3Bg.setColor(android.graphics.Color.parseColor("#1E1B4B")); // Dark indigo purple
        step3Bg.setCornerRadius((float) dpToPx(6));
        step3Box.setBackground(step3Bg);

        android.widget.TextView step3Title = new android.widget.TextView(this);
        step3Title.setText("ÉTAPE 3 : SURGISSEMENT INSTANTANÉ (Plein Écran automatique)");
        step3Title.setTextColor(android.graphics.Color.parseColor("#818CF8")); // Indigo accent
        step3Title.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        step3Title.setTextSize(11);
        step3Box.addView(step3Title);

        android.widget.TextView step3Desc = new android.widget.TextView(this);
        step3Desc.setText("Pour bloquer instantanément les arnaques et faire surgir librement l'écran rouge d'alerte, Android impose d'autoriser l'affichage par-dessus les autres applications.\n\n1. Cliquez sur le bouton ci-dessous.\n2. Cherchez « SP_TG Détecteur de Fraude ».\n3. Activez l'option d'autorisation.");
        step3Desc.setTextColor(android.graphics.Color.parseColor("#CBD5E1"));
        step3Desc.setTextSize(10);
        step3Desc.setPadding(0, dpToPx(4), 0, dpToPx(8));
        step3Box.addView(step3Desc);

        android.widget.Button btnStep3 = new android.widget.Button(this);
        btnStep3.setText("👉 3. AUTORISER LE SURGISSEMENT PLEIN ÉCRAN 👈");
        android.graphics.drawable.GradientDrawable b3Bg = new android.graphics.drawable.GradientDrawable();
        b3Bg.setColor(android.graphics.Color.parseColor("#4F46E5")); // Indigo color
        b3Bg.setCornerRadius((float) dpToPx(4));
        btnStep3.setBackground(b3Bg);
        btnStep3.setTextColor(android.graphics.Color.WHITE);
        btnStep3.setTextSize(10);
        btnStep3.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        btnStep3.setLayoutParams(new android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.MATCH_PARENT, dpToPx(38)
        ));
        btnStep3.setOnClickListener(v -> {
            try {
                if (android.os.Build.VERSION.SDK_INT >= 23) {
                    Intent intent = new Intent(android.provider.Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                            android.net.Uri.parse("package:" + getPackageName()));
                    startActivity(intent);
                    Toast.makeText(this, "Activez l'autorisation pour 'SP_TG Détecteur de Fraude' dans la liste", Toast.LENGTH_LONG).show();
                } else {
                    Toast.makeText(this, "Non requis sur votre version d'Android.", Toast.LENGTH_SHORT).show();
                }
            } catch (Exception e) {
                Toast.makeText(this, "Erreur d'ouverture des autorisations système.", Toast.LENGTH_SHORT).show();
            }
        });
        step3Box.addView(btnStep3);
        root.addView(step3Box);

        // --- OK / CLOSE BUTTON ---
        android.widget.Button closeBtn = new android.widget.Button(this);
        closeBtn.setText("RETOUR À L'ÉCRAN PRINCIPAL");
        android.graphics.drawable.GradientDrawable btnBg = new android.graphics.drawable.GradientDrawable();
        btnBg.setColor(android.graphics.Color.parseColor("#4F46E5")); // Indigo
        btnBg.setCornerRadius((float) dpToPx(6));
        closeBtn.setBackground(btnBg);
        closeBtn.setTextColor(android.graphics.Color.WHITE);
        closeBtn.setTextSize(11);
        closeBtn.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);

        android.widget.LinearLayout.LayoutParams lp = new android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.MATCH_PARENT, dpToPx(44)
        );
        lp.setMargins(0, dpToPx(16), 0, 0);
        closeBtn.setLayoutParams(lp);
        closeBtn.setOnClickListener(v -> dialog.dismiss());
        root.addView(closeBtn);

        dialog.setContentView(root);

        if (dialog.getWindow() != null) {
            dialog.getWindow().setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(android.graphics.Color.TRANSPARENT));
            dialog.getWindow().setLayout(
                    android.view.ViewGroup.LayoutParams.MATCH_PARENT,
                    android.view.ViewGroup.LayoutParams.WRAP_CONTENT
            );
        }

        dialog.show();
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == 101) {
            if (grantResults.length > 0 && grantResults[0] == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                Toast.makeText(this, "Autorisation d'affichage accordée !", Toast.LENGTH_SHORT).show();
                // Enchaîner automatiquement vers l'étape de l'écouteur de notifications si nécessaire
                String enabledListeners = Settings.Secure.getString(getContentResolver(), "enabled_notification_listeners");
                boolean isListenerGranted = enabledListeners != null && enabledListeners.contains(getPackageName());
                if (!isListenerGranted) {
                    new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
                        Intent intent = new Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS");
                        startActivity(intent);
                        Toast.makeText(MainActivity.this, "Étape 2/2 : Activez maintenant l'accès au service de sécurité", Toast.LENGTH_LONG).show();
                    }, 800);
                }
            } else {
                Toast.makeText(this, "L'affichage des alertes nécessite l'autorisation de notification standard.", Toast.LENGTH_LONG).show();
            }
        }
    }

    private void schedulePeriodicSync() {
        PeriodicWorkRequest periodicSyncRequest = new PeriodicWorkRequest.Builder(
                SyncWorker.class,
                14, TimeUnit.DAYS // Synchronisation par défaut toutes les 2 semaines
        ).build();

        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
                "KefylPeriodicSync",
                androidx.work.ExistingPeriodicWorkPolicy.KEEP,
                periodicSyncRequest
        );
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Alertes de Phishing Kéfyl",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Notifications critiques émises par le pare-feu mobile Kéfyl.");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private class StatsReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (intent != null && "com.kefyl.shield.NEW_THREAT".equals(intent.getAction())) {
                String sender = intent.getStringExtra("sender");
                String text = intent.getStringExtra("message_text");
                String type = intent.getStringExtra("threat_type");
                String details = intent.getStringExtra("details");
                String extraLevers = intent.getStringExtra("extra_levers");
                
                if (isActivityInForeground) {
                    showThreatAlert(sender, text, type, details, extraLevers);
                } else {
                    // Mettre en cache dans les préférences s'il est au second plan pour y accéder lors du retour
                    SharedPreferences prefs = getSharedPreferences("kefyl_prefs", MODE_PRIVATE);
                    prefs.edit()
                        .putBoolean("has_pending_threat", true)
                        .putString("pending_threat_sender", sender)
                        .putString("pending_threat_text", text)
                        .putString("pending_threat_type", type)
                        .putString("pending_threat_details", details)
                        .putString("pending_threat_extra_levers", extraLevers)
                        .apply();
                }
            }
            refreshUiStats();
        }
    }

    private void showThreatAlert(String sender, String text, String type, String details, String extraLevers) {
        // Supprimer toutes les notifications associées à cette menace puisque la fenêtre d'alerte est ouverte devant l'utilisateur
        try {
            android.app.NotificationManager notificationManager = (android.app.NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (notificationManager != null) {
                notificationManager.cancel(1001);
                notificationManager.cancel(1002);
            }
        } catch (Exception e) {
            android.util.Log.w("MainActivity", "Impossible d'annuler les notifications système de menace", e);
        }

        final android.app.Dialog dialog = new android.app.Dialog(this);
        dialog.requestWindowFeature(android.view.Window.FEATURE_NO_TITLE);
        
        // Root vertical layout with deep background matching SOC design
        android.widget.LinearLayout root = new android.widget.LinearLayout(this);
        root.setOrientation(android.widget.LinearLayout.VERTICAL);
        root.setPadding(dpToPx(20), dpToPx(20), dpToPx(20), dpToPx(20));
        
        android.graphics.drawable.GradientDrawable background = new android.graphics.drawable.GradientDrawable();
        background.setColor(android.graphics.Color.parseColor("#121824")); // Deep professional background
        background.setCornerRadius((float) dpToPx(12));
        background.setStroke(dpToPx(1), android.graphics.Color.parseColor("#1F2937"));
        root.setBackground(background);

        // Determine which Rule matches in accordance with the specified guidelines
        String titleText = "";
        String msgContent = "";
        String actionText = "";
        String headerColor = "#2D1616"; // default dark red
        String textColor = "#F87171"; // default red-400

        boolean isKnownContact = false;
        String cleanSender = sender != null ? sender.trim() : "";
        if (cleanSender.matches(".*[a-zA-Z]+.*")) {
            isKnownContact = true;
        }

        boolean isSenderPhoneBlocklisted = cleanSender.contains("99120485") 
            || cleanSender.contains("99 12 04 85")
            || (details != null && details.toLowerCase().contains("phone_blocklist"))
            || (extraLevers != null && extraLevers.toLowerCase().contains("phone_blocklist"));

        if (isSenderPhoneBlocklisted) {
            titleText = "🚨 EXPÉDITEUR TRAQUÉ D'OFFICE";
            msgContent = "Le numéro \"" + sender + "\" est signalé comme un numéro traqué par les forces de l'ordre pour tentative de fraude, cybercriminalité, redistribution de messages d'escroquerie.";
            actionText = "Action : Bloquez définitivement cet expéditeur et effacez ce message.";
            headerColor = "#2D1616";
            textColor = "#F87171";
        } else if (isKnownContact && "CRITICAL".equals(type)) {
            titleText = "⚠️ COMPROMISSION COMPLÉMENTAIRE";
            
            String textLower = text != null ? text.toLowerCase() : "";
            boolean containsUrl = textLower.contains("http") || textLower.contains("ceet") || textLower.contains("ancy") || textLower.contains(".com") || textLower.contains(".net") || textLower.contains(".org") || textLower.contains(".tg");
            boolean containsInnerPhone = text != null && text.replaceAll("[^0-9]", "").length() >= 6;
            
            if (containsUrl) {
                msgContent = "\"" + sender + "\" vient de vous envoyer un lien qui a été signalé comme une fraude par les forces de l'ordre.";
            } else if (containsInnerPhone) {
                msgContent = "\"" + sender + "\" vient de vous envoyer un texte contenant un numéro signalé comme une fraude par les forces de l'ordre.";
            } else {
                msgContent = "\"" + sender + "\" vient de vous envoyer un message qui a été signalé comme une fraude par les forces de l'ordre.";
            }
            actionText = "Action : Votre proche n'est pas coupable. Il a pu être piraté ou a partagé ce message sans le savoir. Appelez-le directement pour l'avertir.";
            headerColor = "#1E1B4B"; // dark indigo
            textColor = "#818CF8"; // light indigo
        } else if ("CRITICAL".equals(type)) {
            titleText = "🚨 ARNAQUE CONFIRMÉE - SOC";
            msgContent = "Numéro : \"" + sender + "\" (Non connu de votre répertoire) vous a envoyé un message qui a été détecté comme une tentative très populaire d'escroquerie, d'arnaque qui a été détectée par les forces de l'ordre.";
            actionText = "Action : Message hautement dangereux. Supprimez-le immédiatement.";
            headerColor = "#2D1616";
            textColor = "#F87171";
        } else {
            titleText = "⚠️ ALERTE VIGILANCE SÉMANTIQUE";
            msgContent = "Numéro : \"" + sender + "\" (Non connu de votre répertoire) vous a envoyé un message qui ressemble à une tentative de fraude.";
            actionText = "Action : Prudence recommandée. Ne répondez pas et ne cliquez sur aucun lien.";
            headerColor = "#2D2216"; // dark amber
            textColor = "#FBBF24"; // amber
        }

        // Header warning layout
        android.widget.LinearLayout header = new android.widget.LinearLayout(this);
        header.setOrientation(android.widget.LinearLayout.HORIZONTAL);
        header.setGravity(android.view.Gravity.CENTER_VERTICAL);
        header.setPadding(dpToPx(12), dpToPx(8), dpToPx(12), dpToPx(8));
        
        android.graphics.drawable.GradientDrawable headerBg = new android.graphics.drawable.GradientDrawable();
        headerBg.setCornerRadius((float) dpToPx(6));
        headerBg.setColor(android.graphics.Color.parseColor(headerColor));
        header.setBackground(headerBg);

        android.widget.ImageView alertIcon = new android.widget.ImageView(this);
        alertIcon.setImageResource(android.R.drawable.stat_sys_warning);
        alertIcon.setColorFilter(android.graphics.Color.parseColor(textColor));
        
        android.widget.TextView titleTv = new android.widget.TextView(this);
        titleTv.setTextSize(13);
        titleTv.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        titleTv.setPadding(dpToPx(8), 0, 0, 0);
        titleTv.setText(titleText);
        titleTv.setTextColor(android.graphics.Color.parseColor(textColor));
        
        header.addView(alertIcon, new android.widget.LinearLayout.LayoutParams(dpToPx(20), dpToPx(20)));
        header.addView(titleTv);
        root.addView(header);
        
        // Threat Details description box
        android.widget.TextView introTv = new android.widget.TextView(this);
        introTv.setText("Interception SP_TG en temps réel :");
        introTv.setTextColor(android.graphics.Color.parseColor("#94A3B8"));
        introTv.setTextSize(10);
        introTv.setPadding(0, dpToPx(14), 0, dpToPx(4));
        root.addView(introTv);

        android.widget.TextView descriptionTv = new android.widget.TextView(this);
        descriptionTv.setText(msgContent);
        descriptionTv.setTextColor(android.graphics.Color.parseColor("#E2E8F0"));
        descriptionTv.setTextSize(12);
        descriptionTv.setPadding(0, 0, 0, dpToPx(10));
        root.addView(descriptionTv);
        
        // Immediate block action callout layout
        android.widget.LinearLayout actionBox = new android.widget.LinearLayout(this);
        actionBox.setOrientation(android.widget.LinearLayout.VERTICAL);
        actionBox.setPadding(dpToPx(10), dpToPx(10), dpToPx(10), dpToPx(10));
        
        android.graphics.drawable.GradientDrawable actionBg = new android.graphics.drawable.GradientDrawable();
        actionBg.setColor(android.graphics.Color.parseColor("#1C1917")); // charcoal deep
        actionBg.setCornerRadius((float) dpToPx(6));
        actionBg.setStroke(dpToPx(1), android.graphics.Color.parseColor("#78716C"));
        actionBox.setBackground(actionBg);

        android.widget.TextView actionTv = new android.widget.TextView(this);
        actionTv.setText(actionText);
        actionTv.setTextColor(android.graphics.Color.parseColor("#EF4444")); // bold red action
        actionTv.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        actionTv.setTextSize(11);
        actionBox.addView(actionTv);
        root.addView(actionBox);

        // Encapsulated text box for the original message content
        android.widget.TextView originalMsgLabel = new android.widget.TextView(this);
        originalMsgLabel.setText("Texte intercepté :");
        originalMsgLabel.setTextColor(android.graphics.Color.parseColor("#94A3B8"));
        originalMsgLabel.setTextSize(10);
        originalMsgLabel.setPadding(0, dpToPx(12), 0, dpToPx(4));
        root.addView(originalMsgLabel);

        android.widget.LinearLayout msgBox = new android.widget.LinearLayout(this);
        msgBox.setOrientation(android.widget.LinearLayout.VERTICAL);
        msgBox.setPadding(dpToPx(10), dpToPx(10), dpToPx(10), dpToPx(10));
        
        android.graphics.drawable.GradientDrawable msgBg = new android.graphics.drawable.GradientDrawable();
        msgBg.setColor(android.graphics.Color.parseColor("#0F172A"));
        msgBg.setCornerRadius((float) dpToPx(6));
        msgBg.setStroke(dpToPx(1), android.graphics.Color.parseColor("#1E293B"));
        msgBox.setBackground(msgBg);
        
        android.widget.TextView bodyTv = new android.widget.TextView(this);
        bodyTv.setText("\"" + text + "\"");
        bodyTv.setTextColor(android.graphics.Color.parseColor("#94A3B8"));
        bodyTv.setTextSize(10.5f);
        bodyTv.setTypeface(android.graphics.Typeface.defaultFromStyle(android.graphics.Typeface.ITALIC));
        msgBox.addView(bodyTv);
        root.addView(msgBox);

        // Trusted sources feedback section (if contact or whitelist possibility)
        android.widget.Button trustBtn = new android.widget.Button(this);
        trustBtn.setText("✅ ENREGISTRER COMME SOURCE FIABLE");
        android.graphics.drawable.GradientDrawable trustBg = new android.graphics.drawable.GradientDrawable();
        trustBg.setColor(android.graphics.Color.parseColor("#1A2542"));
        trustBg.setCornerRadius((float) dpToPx(6));
        trustBg.setStroke(dpToPx(1), android.graphics.Color.parseColor("#3B82F6"));
        trustBtn.setBackground(trustBg);
        trustBtn.setTextColor(android.graphics.Color.parseColor("#60A5FA"));
        trustBtn.setTextSize(11);
        trustBtn.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        android.widget.LinearLayout.LayoutParams trustLp = new android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.MATCH_PARENT, dpToPx(38)
        );
        trustLp.setMargins(0, dpToPx(12), 0, 0);
        trustBtn.setLayoutParams(trustLp);
        trustBtn.setOnClickListener(v -> {
            SharedPreferences prefs = getSharedPreferences("kefyl_prefs", MODE_PRIVATE);
            java.util.Set<String> trusted = new java.util.HashSet<>(prefs.getStringSet("trusted_sources", new java.util.HashSet<>()));
            trusted.add(sender);
            prefs.edit().putStringSet("trusted_sources", trusted).apply();
            Toast.makeText(this, "Source '" + sender + "' autorisée. Plus aucune alerte pour ce contact !", Toast.LENGTH_LONG).show();
            dialog.dismiss();
        });
        root.addView(trustBtn);
        
        // Close button to return to task immediately (medium size window target)
        android.widget.Button closeBtn = new android.widget.Button(this);
        closeBtn.setText("VALIDER ET CONTINUER");
        
        android.graphics.drawable.GradientDrawable btnBg = new android.graphics.drawable.GradientDrawable();
        btnBg.setColor(android.graphics.Color.parseColor("#4F46E5")); // Indigo style
        btnBg.setCornerRadius((float) dpToPx(6));
        closeBtn.setBackground(btnBg);
        closeBtn.setTextColor(android.graphics.Color.WHITE);
        closeBtn.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        closeBtn.setTextSize(11);
        
        android.widget.LinearLayout.LayoutParams lp = new android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
                dpToPx(40)
        );
        lp.setMargins(0, dpToPx(8), 0, 0);
        closeBtn.setLayoutParams(lp);
        
        closeBtn.setOnClickListener(new android.view.View.OnClickListener() {
            @Override
            public void onClick(android.view.View v) {
                dialog.dismiss();
            }
        });
        root.addView(closeBtn);
        
        dialog.setContentView(root);
        
        if (dialog.getWindow() != null) {
            dialog.getWindow().setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(android.graphics.Color.TRANSPARENT));
            dialog.getWindow().setLayout(
                    android.view.ViewGroup.LayoutParams.MATCH_PARENT,
                    android.view.ViewGroup.LayoutParams.WRAP_CONTENT
            );
        }
        
        dialog.show();
    }

    private void showRegistrationFormDialog() {
        final android.app.Dialog dialog = new android.app.Dialog(this);
        dialog.requestWindowFeature(android.view.Window.FEATURE_NO_TITLE);
        dialog.setCancelable(false); // They MUST register to use SP Sentinel

        android.widget.LinearLayout root = new android.widget.LinearLayout(this);
        root.setOrientation(android.widget.LinearLayout.VERTICAL);
        root.setPadding(dpToPx(20), dpToPx(20), dpToPx(20), dpToPx(20));

        android.graphics.drawable.GradientDrawable background = new android.graphics.drawable.GradientDrawable();
        background.setColor(android.graphics.Color.parseColor("#121824")); // Deep professional background matching SOC
        background.setCornerRadius((float) dpToPx(12));
        background.setStroke(dpToPx(1), android.graphics.Color.parseColor("#1F2937"));
        root.setBackground(background);

        // Header Logo & Badge (matching SOC style)
        android.widget.LinearLayout logoLayout = new android.widget.LinearLayout(this);
        logoLayout.setOrientation(android.widget.LinearLayout.HORIZONTAL);
        logoLayout.setGravity(android.view.Gravity.CENTER_HORIZONTAL | android.view.Gravity.CENTER_VERTICAL);
        logoLayout.setPadding(0, 0, 0, dpToPx(16));

        android.widget.LinearLayout badge = new android.widget.LinearLayout(this);
        badge.setOrientation(android.widget.LinearLayout.HORIZONTAL);
        badge.setPadding(dpToPx(10), dpToPx(6), dpToPx(10), dpToPx(6));
        android.graphics.drawable.GradientDrawable badgeBg = new android.graphics.drawable.GradientDrawable();
        badgeBg.setColor(android.graphics.Color.parseColor("#1A2542"));
        badgeBg.setCornerRadius((float) dpToPx(6));
        badge.setBackground(badgeBg);

        android.widget.TextView sTv = new android.widget.TextView(this);
        sTv.setText("S");
        sTv.setTextColor(android.graphics.Color.WHITE);
        sTv.setTextSize(20);
        sTv.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);

        android.widget.TextView pTv = new android.widget.TextView(this);
        pTv.setText("P");
        pTv.setTextColor(android.graphics.Color.parseColor("#06B6D4"));
        pTv.setTextSize(20);
        pTv.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        pTv.setPadding(dpToPx(2), 0, 0, 0);

        badge.addView(sTv);
        badge.addView(pTv);
        logoLayout.addView(badge);
        root.addView(logoLayout);

        // Welcome title
        android.widget.TextView welcomeTv = new android.widget.TextView(this);
        welcomeTv.setText("ENRÔLEMENT DE L'AGENT SP SENTINEL");
        welcomeTv.setTextColor(android.graphics.Color.WHITE);
        welcomeTv.setTextSize(14);
        welcomeTv.setGravity(android.view.Gravity.CENTER_HORIZONTAL);
        welcomeTv.setTypeface(android.graphics.Typeface.DEFAULT, android.graphics.Typeface.BOLD);
        welcomeTv.setPadding(0, 0, 0, dpToPx(6));
        root.addView(welcomeTv);

        android.widget.TextView welcomeSub = new android.widget.TextView(this);
        welcomeSub.setText("Pour renforcer la sécurité du territoire togolais et enquêter sur les réseaux d'arnaque (Yas, Moov Money, CEET), veuillez enregistrer votre terminal de surveillance.");
        welcomeSub.setTextColor(android.graphics.Color.parseColor("#94A3B8"));
        welcomeSub.setTextSize(11);
        welcomeSub.setGravity(android.view.Gravity.CENTER_HORIZONTAL);
        welcomeSub.setPadding(0, 0, 0, dpToPx(20));
        root.addView(welcomeSub);

        // Field 1: Name
        android.widget.TextView nameLabel = new android.widget.TextView(this);
        nameLabel.setText("Nom complet de l'agent (ex: Koffi TOZO) :");
        nameLabel.setTextColor(android.graphics.Color.parseColor("#E2E8F0"));
        nameLabel.setTextSize(12);
        nameLabel.setPadding(0, 0, 0, dpToPx(4));
        root.addView(nameLabel);

        final android.widget.EditText etName = new android.widget.EditText(this);
        etName.setHint("Entrez votre nom complet");
        etName.setTextColor(android.graphics.Color.WHITE);
        etName.setHintTextColor(android.graphics.Color.parseColor("#475569"));
        etName.setTextSize(13);
        etName.setPadding(dpToPx(12), dpToPx(12), dpToPx(12), dpToPx(12));
        android.graphics.drawable.GradientDrawable etBg1 = new android.graphics.drawable.GradientDrawable();
        etBg1.setColor(android.graphics.Color.parseColor("#0F172A"));
        etBg1.setCornerRadius((float) dpToPx(6));
        etBg1.setStroke(dpToPx(1), android.graphics.Color.parseColor("#334155"));
        etName.setBackground(etBg1);
        
        android.widget.LinearLayout.LayoutParams lpName = new android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.MATCH_PARENT, android.view.ViewGroup.LayoutParams.WRAP_CONTENT);
        lpName.setMargins(0, 0, 0, dpToPx(16));
        etName.setLayoutParams(lpName);
        root.addView(etName);

        // Field 2: Phone Number
        android.widget.TextView phoneLabel = new android.widget.TextView(this);
        phoneLabel.setText("Numéro de téléphone (+228) :");
        phoneLabel.setTextColor(android.graphics.Color.parseColor("#E2E8F0"));
        phoneLabel.setTextSize(12);
        phoneLabel.setPadding(0, 0, 0, dpToPx(4));
        root.addView(phoneLabel);

        final android.widget.EditText etPhone = new android.widget.EditText(this);
        etPhone.setHint("Ex: +228 90123456");
        etPhone.setInputType(android.text.InputType.TYPE_CLASS_PHONE);
        etPhone.setTextColor(android.graphics.Color.WHITE);
        etPhone.setHintTextColor(android.graphics.Color.parseColor("#475569"));
        etPhone.setTextSize(13);
        etPhone.setPadding(dpToPx(12), dpToPx(12), dpToPx(12), dpToPx(12));
        android.graphics.drawable.GradientDrawable etBg2 = new android.graphics.drawable.GradientDrawable();
        etBg2.setColor(android.graphics.Color.parseColor("#0F172A"));
        etBg2.setCornerRadius((float) dpToPx(6));
        etBg2.setStroke(dpToPx(1), android.graphics.Color.parseColor("#334155"));
        etPhone.setBackground(etBg2);
        
        android.widget.LinearLayout.LayoutParams lpPhone = new android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.MATCH_PARENT, android.view.ViewGroup.LayoutParams.WRAP_CONTENT);
        lpPhone.setMargins(0, 0, 0, dpToPx(16));
        etPhone.setLayoutParams(lpPhone);
        root.addView(etPhone);

        // Field 3: City
        android.widget.TextView cityLabel = new android.widget.TextView(this);
        cityLabel.setText("Ville de déploiement (Localisation) :");
        cityLabel.setTextColor(android.graphics.Color.parseColor("#E2E8F0"));
        cityLabel.setTextSize(12);
        cityLabel.setPadding(0, 0, 0, dpToPx(4));
        root.addView(cityLabel);

        final android.widget.EditText etCity = new android.widget.EditText(this);
        etCity.setText("Lomé");
        etCity.setTextColor(android.graphics.Color.WHITE);
        etCity.setHintTextColor(android.graphics.Color.parseColor("#475569"));
        etCity.setTextSize(13);
        etCity.setPadding(dpToPx(12), dpToPx(12), dpToPx(12), dpToPx(12));
        android.graphics.drawable.GradientDrawable etBg3 = new android.graphics.drawable.GradientDrawable();
        etBg3.setColor(android.graphics.Color.parseColor("#0F172A"));
        etBg3.setCornerRadius((float) dpToPx(6));
        etBg3.setStroke(dpToPx(1), android.graphics.Color.parseColor("#334155"));
        etCity.setBackground(etBg3);
        
        android.widget.LinearLayout.LayoutParams lpCity = new android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.MATCH_PARENT, android.view.ViewGroup.LayoutParams.WRAP_CONTENT);
        lpCity.setMargins(0, 0, 0, dpToPx(12));
        etCity.setLayoutParams(lpCity);
        root.addView(etCity);

        // Optional Anonymity CheckBox (Reassuring default-on option)
        final android.widget.CheckBox cbAnonymous = new android.widget.CheckBox(this);
        cbAnonymous.setText("Garder l'anonymat (masquer mon nom et numéro sur la console centrale)");
        cbAnonymous.setTextColor(android.graphics.Color.parseColor("#94A3B8"));
        cbAnonymous.setTextSize(11);
        cbAnonymous.setChecked(true); // Default to anonymized layout for reassuring privacy
        android.widget.LinearLayout.LayoutParams lpCb = new android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.MATCH_PARENT, android.view.ViewGroup.LayoutParams.WRAP_CONTENT);
        lpCb.setMargins(0, 0, 0, dpToPx(18));
        cbAnonymous.setLayoutParams(lpCb);
        root.addView(cbAnonymous);

        // Submit Button
        android.widget.Button submitBtn = new android.widget.Button(this);
        submitBtn.setText("🚀 VALIDER ET ENRÔLER L'AGENT");
        android.graphics.drawable.GradientDrawable btnBg = new android.graphics.drawable.GradientDrawable();
        btnBg.setColor(android.graphics.Color.parseColor("#06B6D4")); // Cyan brand matching SOC logo
        btnBg.setCornerRadius((float) dpToPx(6));
        submitBtn.setBackground(btnBg);
        submitBtn.setTextColor(android.graphics.Color.BLACK);
        submitBtn.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        submitBtn.setTextSize(13);

        submitBtn.setOnClickListener(v -> {
            String nameVal = etName.getText().toString().trim();
            String phoneVal = etPhone.getText().toString().trim();
            String cityVal = etCity.getText().toString().trim();

            if (nameVal.isEmpty() || nameVal.length() < 3) {
                etName.setError("Le nom doit contenir au moins 3 caractères !");
                return;
            }
            if (phoneVal.isEmpty() || phoneVal.length() < 8) {
                etPhone.setError("Le numéro de téléphone est obligatoire !");
                return;
            }
            if (cityVal.isEmpty()) {
                cityVal = "Lomé";
            }

            // Save in SharedPreferences
            SharedPreferences.Editor editor = getSharedPreferences("kefyl_prefs", MODE_PRIVATE).edit();
            editor.putString("agent_registered_name", nameVal);
            editor.putString("agent_registered_phone", phoneVal);
            editor.putString("agent_registered_city", cityVal);
            editor.putBoolean("agent_anonymous", cbAnonymous.isChecked());
            // Force clean enrollment to backend
            editor.remove("agent_secure_token");
            editor.apply();

            dialog.dismiss();
            Toast.makeText(this, "Enrôlement en cours pour : " + nameVal, Toast.LENGTH_LONG).show();

            // Force immediate first sync and dynamic registration
            triggerBackgroundSync();
            refreshUiStats();
        });

        root.addView(submitBtn);
        dialog.setContentView(root);

        if (dialog.getWindow() != null) {
            dialog.getWindow().setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(android.graphics.Color.TRANSPARENT));
            dialog.getWindow().setLayout(
                    android.view.ViewGroup.LayoutParams.MATCH_PARENT,
                    android.view.ViewGroup.LayoutParams.WRAP_CONTENT
            );
        }

        dialog.show();
    }

    private void showSettingsDialog() {
        final android.app.Dialog dialog = new android.app.Dialog(this);
        dialog.requestWindowFeature(android.view.Window.FEATURE_NO_TITLE);

        android.widget.LinearLayout root = new android.widget.LinearLayout(this);
        root.setOrientation(android.widget.LinearLayout.VERTICAL);
        root.setPadding(dpToPx(20), dpToPx(20), dpToPx(20), dpToPx(20));

        android.graphics.drawable.GradientDrawable background = new android.graphics.drawable.GradientDrawable();
        background.setColor(android.graphics.Color.parseColor("#121824")); // Deep professional background matching SOC
        background.setCornerRadius((float) dpToPx(12));
        background.setStroke(dpToPx(1), android.graphics.Color.parseColor("#1F2937"));
        root.setBackground(background);

        // Header Info
        android.widget.TextView titleTv = new android.widget.TextView(this);
        titleTv.setText("⚙️ CONFIGURATION DU SERVEUR SOC");
        titleTv.setTextColor(android.graphics.Color.WHITE);
        titleTv.setTextSize(13);
        titleTv.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        titleTv.setPadding(0, 0, 0, dpToPx(12));
        root.addView(titleTv);

        // Server Input Label
        android.widget.TextView labelTv = new android.widget.TextView(this);
        labelTv.setText("Adresse URL de connexion au SOC national :");
        labelTv.setTextColor(android.graphics.Color.parseColor("#CBD5E1"));
        labelTv.setTextSize(12);
        labelTv.setPadding(0, 0, 0, dpToPx(6));
        root.addView(labelTv);

        // Server Input
        final android.widget.EditText etIp = new android.widget.EditText(this);
        String currentIp = getSharedPreferences("kefyl_prefs", MODE_PRIVATE)
                .getString("server_ip_address", "https://sp-sentinel-hq.onrender.com");
        etIp.setText(currentIp);
        etIp.setTextColor(android.graphics.Color.WHITE);
        etIp.setTextSize(13);
        etIp.setPadding(dpToPx(12), dpToPx(12), dpToPx(12), dpToPx(12));
        android.graphics.drawable.GradientDrawable etBg = new android.graphics.drawable.GradientDrawable();
        etBg.setColor(android.graphics.Color.parseColor("#0F172A"));
        etBg.setCornerRadius((float) dpToPx(6));
        etBg.setStroke(dpToPx(1), android.graphics.Color.parseColor("#1E293B"));
        etIp.setBackground(etBg);
        
        android.widget.LinearLayout.LayoutParams lp = new android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.MATCH_PARENT, android.view.ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.setMargins(0, 0, 0, dpToPx(12));
        etIp.setLayoutParams(lp);
        root.addView(etIp);

        // Presets Layout for Easy Jury Testing (Local vs Prod toggles)
        android.widget.LinearLayout presetsLayout = new android.widget.LinearLayout(this);
        presetsLayout.setOrientation(android.widget.LinearLayout.HORIZONTAL);
        android.widget.LinearLayout.LayoutParams presetsLp = new android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.MATCH_PARENT, android.view.ViewGroup.LayoutParams.WRAP_CONTENT);
        presetsLp.setMargins(0, 0, 0, dpToPx(18));
        presetsLayout.setLayoutParams(presetsLp);

        // Prod button
        android.widget.Button prodBtn = new android.widget.Button(this);
        prodBtn.setText("🌐 PROD LIGNE");
        prodBtn.setTextSize(10);
        prodBtn.setTextColor(android.graphics.Color.WHITE);
        android.graphics.drawable.GradientDrawable prodBg = new android.graphics.drawable.GradientDrawable();
        prodBg.setColor(android.graphics.Color.parseColor("#10B981")); // Emerald
        prodBg.setCornerRadius((float) dpToPx(4));
        prodBtn.setBackground(prodBg);
        android.widget.LinearLayout.LayoutParams prodLp = new android.widget.LinearLayout.LayoutParams(
                0, android.view.ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f);
        prodLp.setMargins(0, 0, dpToPx(8), 0);
        prodBtn.setLayoutParams(prodLp);
        prodBtn.setOnClickListener(v -> etIp.setText("https://sp-sentinel-hq.onrender.com"));

        // Local button
        android.widget.Button localBtn = new android.widget.Button(this);
        localBtn.setText("💻 TEST LOCAL");
        localBtn.setTextSize(10);
        localBtn.setTextColor(android.graphics.Color.WHITE);
        android.graphics.drawable.GradientDrawable localBg = new android.graphics.drawable.GradientDrawable();
        localBg.setColor(android.graphics.Color.parseColor("#475569")); // Slate
        localBg.setCornerRadius((float) dpToPx(4));
        localBtn.setBackground(localBg);
        android.widget.LinearLayout.LayoutParams localLp = new android.widget.LinearLayout.LayoutParams(
                0, android.view.ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f);
        localBtn.setLayoutParams(localLp);
        localBtn.setOnClickListener(v -> etIp.setText("http://10.0.2.2:3000")); // Android emulator loopback IP for computer localhost:3000

        presetsLayout.addView(prodBtn);
        presetsLayout.addView(localBtn);
        root.addView(presetsLayout);

        // Save Button
        android.widget.Button saveBtn = new android.widget.Button(this);
        saveBtn.setText("SAUVEGARDER L'ADRESSE");
        android.graphics.drawable.GradientDrawable btnBg = new android.graphics.drawable.GradientDrawable();
        btnBg.setColor(android.graphics.Color.parseColor("#4F46E5")); // Indigo color matching SOC
        btnBg.setCornerRadius((float) dpToPx(6));
        saveBtn.setBackground(btnBg);
        saveBtn.setTextColor(android.graphics.Color.WHITE);
        saveBtn.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        saveBtn.setTextSize(12);

        saveBtn.setOnClickListener(v -> {
            String ipVal = etIp.getText().toString().trim();
            if (!android.text.TextUtils.isEmpty(ipVal)) {
                RetrofitClient.saveServerIp(MainActivity.this, ipVal);
                Toast.makeText(MainActivity.this, "Adresse serveur enregistrée : " + ipVal, Toast.LENGTH_SHORT).show();
                dialog.dismiss();
                triggerBackgroundSync();
            } else {
                etIp.setError("Saisie requise !");
            }
        });
        root.addView(saveBtn);

        dialog.setContentView(root);

        if (dialog.getWindow() != null) {
            dialog.getWindow().setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(android.graphics.Color.TRANSPARENT));
            dialog.getWindow().setLayout(
                    android.view.ViewGroup.LayoutParams.MATCH_PARENT,
                    android.view.ViewGroup.LayoutParams.WRAP_CONTENT
            );
        }

        dialog.show();
    }

    private boolean isNetworkAvailable() {
        android.net.ConnectivityManager cm = (android.net.ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm != null) {
            android.net.NetworkInfo activeNetwork = cm.getActiveNetworkInfo();
            return activeNetwork != null && activeNetwork.isConnectedOrConnecting();
        }
        return false;
    }

    private void triggerBackgroundSync() {
        OneTimeWorkRequest syncRequest = new OneTimeWorkRequest.Builder(SyncWorker.class).build();
        WorkManager.getInstance(this).enqueue(syncRequest);
    }

    private int dpToPx(int dp) {
        float density = getResources().getDisplayMetrics().density;
        return Math.round((float) dp * density);
    }
}
