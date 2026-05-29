package com.kefyl.shield;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.os.Bundle;
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

    private TextView tvStatusHeader;
    private TextView tvBlockedCount;
    private TextView tvSignaturesCount;
    private TextView tvLastUpdate;
    private TextView tvPermissionWarning;
    private View tvPermissionWarningLayout;
    
    private EditText etServerIp;
    private Button btnSaveIp;
    private Button btnSyncNow;
    private Button btnEnablePermission;

    private AppDatabase db;
    private StatsReceiver statsReceiver;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        db = AppDatabase.getDatabase(this);

        // Initialisation des éléments d'UI
        tvStatusHeader = findViewById(R.id.tvStatusHeader);
        tvBlockedCount = findViewById(R.id.tvBlockedCount);
        tvSignaturesCount = findViewById(R.id.tvSignaturesCount);
        tvLastUpdate = findViewById(R.id.tvLastUpdate);
        tvPermissionWarning = findViewById(R.id.tvPermissionWarning);
        tvPermissionWarningLayout = findViewById(R.id.tvPermissionWarningLayout);

        etServerIp = findViewById(R.id.etServerIp);
        btnSaveIp = findViewById(R.id.btnSaveIp);
        btnSyncNow = findViewById(R.id.btnSyncNow);
        btnEnablePermission = findViewById(R.id.btnEnablePermission);

        // Charger l'IP du serveur actuellement configurée
        String currentIp = getSharedPreferences("kefyl_prefs", MODE_PRIVATE)
                .getString("server_ip_address", "https://sp-tg-1.onrender.com");
        etServerIp.setText(currentIp);

        // Bouton de sauvegarde d'IP personnalisé
        btnSaveIp.setOnClickListener(v -> {
            String ip = etServerIp.getText().toString().trim();
            if (!TextUtils.isEmpty(ip)) {
                RetrofitClient.saveServerIp(MainActivity.this, ip);
                Toast.makeText(MainActivity.this, "Serveur mis à jour: " + ip, Toast.LENGTH_SHORT).show();
                refreshUiStats();
            } else {
                etServerIp.setError("Saisie requise !");
            }
        });

        // Forcer la synchronisation manuelle instantanée via WorkManager
        btnSyncNow.setOnClickListener(v -> {
            btnSyncNow.setEnabled(false);
            btnSyncNow.setText("Synchronisation...");
            
            OneTimeWorkRequest syncRequest = new OneTimeWorkRequest.Builder(SyncWorker.class).build();
            WorkManager.getInstance(MainActivity.this).enqueue(syncRequest);

            WorkManager.getInstance(MainActivity.this)
                    .getWorkInfoByIdLiveData(syncRequest.getId())
                    .observe(MainActivity.this, workInfo -> {
                        if (workInfo != null && workInfo.getState().isFinished()) {
                            btnSyncNow.setEnabled(true);
                            btnSyncNow.setText("FORCER LA SYNCHRONISATION");
                            refreshUiStats();
                            Toast.makeText(MainActivity.this, "Base de signatures synchronisée !", Toast.LENGTH_SHORT).show();
                        }
                    });
        });

        // Ouvrir les options d'accréditation du Listener de notifications d'Android
        btnEnablePermission.setOnClickListener(v -> {
            Intent intent = new Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS");
            startActivity(intent);
        });

        // Rendre toute la zone de warning rouge cliquable pour une plus grande réceptivité au clic
        if (tvPermissionWarningLayout != null) {
            tvPermissionWarningLayout.setOnClickListener(v -> {
                Intent intent = new Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS");
                startActivity(intent);
                Toast.makeText(MainActivity.this, "Redirection vers les paramètres d'accès aux notifications...", Toast.LENGTH_SHORT).show();
            });
        }

        // Rendre aussi la zone "rouge" du statut en entête cliquable (répond au réflexe de l'utilisateur)
        if (tvStatusHeader != null) {
            tvStatusHeader.setOnClickListener(v -> {
                String enabledListeners = Settings.Secure.getString(getContentResolver(), "enabled_notification_listeners");
                boolean isPermissionGranted = enabledListeners != null && enabledListeners.contains(getPackageName());
                if (!isPermissionGranted) {
                    Intent intent = new Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS");
                    startActivity(intent);
                    Toast.makeText(MainActivity.this, "Redirection vers les paramètres d'accès aux notifications...", Toast.LENGTH_SHORT).show();
                } else {
                    Toast.makeText(MainActivity.this, "SP SENTINEL est bien actif !", Toast.LENGTH_SHORT).show();
                }
            });
        }

        // Programmer la synchronisation périodique toutes les 2 semaines
        schedulePeriodicSync();

        // Écouteur de broadcast pour mettre à jour l'UI quand un événement survient (blocage ou sync)
        statsReceiver = new StatsReceiver();
        if (android.os.Build.VERSION.SDK_INT >= 33) {
            registerReceiver(statsReceiver, new IntentFilter("com.kefyl.shield.UPDATE_STATS"), Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(statsReceiver, new IntentFilter("com.kefyl.shield.UPDATE_STATS"));
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        refreshUiStats();
        checkNotificationPermission();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (statsReceiver != null) {
            unregisterReceiver(statsReceiver);
        }
    }

    private void refreshUiStats() {
        SharedPreferences prefs = getSharedPreferences("kefyl_prefs", MODE_PRIVATE);
        
        // 1. Lire le nombre de menaces interceptées localement
        int blockedCount = prefs.getInt("blocked_threats_count", 0);
        tvBlockedCount.setText(String.valueOf(blockedCount));

        // 2. Lire l'état et la date de dernière mise à jour
        String lastUpdate = prefs.getString("last_update_timestamp", "Jamais");
        tvLastUpdate.setText("Dernière Sync: " + lastUpdate);

        // 3. Compter le nombre d'indicateurs d'attaques actifs en SQLite (Room)
        Executors.newSingleThreadExecutor().execute(() -> {
            int count = db.signatureDao().getCount();
            runOnUiThread(() -> tvSignaturesCount.setText(String.valueOf(count)));
        });
    }

    private void checkNotificationPermission() {
        String enabledListeners = Settings.Secure.getString(getContentResolver(), "enabled_notification_listeners");
        boolean isPermissionGranted = enabledListeners != null && enabledListeners.contains(getPackageName());

        if (isPermissionGranted) {
            tvStatusHeader.setText("🟢 SP SENTINEL ACTIF");
            tvStatusHeader.setTextColor(getResources().getColor(android.R.color.holo_green_dark));
            if (tvPermissionWarningLayout != null) {
                tvPermissionWarningLayout.setVisibility(View.GONE);
            }
            tvPermissionWarning.setVisibility(View.GONE);
            btnEnablePermission.setVisibility(View.GONE);
        } else {
            tvStatusHeader.setText("🔴 EN ATTENTE DE PERMISSIONS");
            tvStatusHeader.setTextColor(getResources().getColor(android.R.color.holo_red_dark));
            if (tvPermissionWarningLayout != null) {
                tvPermissionWarningLayout.setVisibility(View.VISIBLE);
            }
            tvPermissionWarning.setVisibility(View.VISIBLE);
            btnEnablePermission.setVisibility(View.VISIBLE);
            tvPermissionWarning.setText("ATTENTION : L'agent ne peut pas intercepter les attaques Moov/Tmoney sur WhatsApp ou SMS tant que l'accès aux notifications n'est pas autorisé.");
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

    private class StatsReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            refreshUiStats();
        }
    }
}
