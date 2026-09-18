package com.sbims.pos.ui;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.widget.TextView;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import com.sbims.pos.R;
import com.sbims.pos.model.DailySummary;
import com.sbims.pos.model.Product;
import com.sbims.pos.network.ApiClient;
import com.sbims.pos.network.SessionManager;
import java.util.List;
import java.util.Locale;
import java.util.TreeSet;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class DashboardActivity extends AppCompatActivity {

    private static final long REFRESH_INTERVAL_MS = 5000;

    private TextView kgSoldText;
    private TextView revenueText;
    private final Handler refreshHandler = new Handler(Looper.getMainLooper());
    private String lastNotifiedSignature = null;

    private final Runnable refreshLoop = new Runnable() {
        @Override
        public void run() {
            loadTodaySummary();
            checkLowStock();
            refreshHandler.postDelayed(this, REFRESH_INTERVAL_MS);
        }
    };

    private final ActivityResultLauncher<String> notificationPermissionLauncher =
            registerForActivityResult(new ActivityResultContracts.RequestPermission(), granted -> checkLowStock());

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dashboard);

        LowStockNotifier.ensureChannel(this);

        kgSoldText = findViewById(R.id.kgSoldText);
        revenueText = findViewById(R.id.revenueText);

        View saleButton = findViewById(R.id.saleButton);
        View addStockButton = findViewById(R.id.addStockButton);
        View viewStockButton = findViewById(R.id.viewStockButton);
        View wastageButton = findViewById(R.id.wastageButton);
        View logoutButton = findViewById(R.id.logoutButton);

        saleButton.setOnClickListener(v -> startActivity(new Intent(this, SaleEntryActivity.class)));
        addStockButton.setOnClickListener(v -> startActivity(new Intent(this, AddStockActivity.class)));
        viewStockButton.setOnClickListener(v -> startActivity(new Intent(this, StockListActivity.class)));
        wastageButton.setOnClickListener(v -> startActivity(new Intent(this, WastageActivity.class)));
        logoutButton.setOnClickListener(v -> logout());
    }

    private void logout() {
        new SessionManager(this).clear();
        Intent intent = new Intent(this, LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }

    @Override
    protected void onResume() {
        super.onResume();
        requestNotificationPermissionIfNeeded();
        refreshHandler.removeCallbacks(refreshLoop);
        refreshHandler.post(refreshLoop);
    }

    @Override
    protected void onPause() {
        super.onPause();
        refreshHandler.removeCallbacks(refreshLoop);
    }

    private void requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
            notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS);
        }
    }

    private void checkLowStock() {
        ApiClient.getService(this).getLowStockAlerts().enqueue(new Callback<List<Product>>() {
            @Override
            public void onResponse(Call<List<Product>> call, Response<List<Product>> response) {
                if (!response.isSuccessful() || response.body() == null) return;

                List<Product> lowStock = response.body();
                if (lowStock.isEmpty()) {
                    lastNotifiedSignature = null;
                    return;
                }

                // Only notify when the low-stock set actually changes -- otherwise
                // a 5s poll would re-notify constantly for the same items.
                TreeSet<Integer> ids = new TreeSet<>();
                for (Product p : lowStock) ids.add(p.id);
                String signature = ids.toString();
                if (signature.equals(lastNotifiedSignature)) return;
                lastNotifiedSignature = signature;

                LowStockNotifier.notifyIfLowStock(DashboardActivity.this, lowStock);
            }

            @Override
            public void onFailure(Call<List<Product>> call, Throwable t) {
                // silent -- this is a background check, not a user-triggered action
            }
        });
    }

    private void loadTodaySummary() {
        ApiClient.getService(this).getTodaySummary().enqueue(new Callback<DailySummary>() {
            @Override
            public void onResponse(Call<DailySummary> call, Response<DailySummary> response) {
                if (response.isSuccessful() && response.body() != null) {
                    DailySummary summary = response.body();
                    kgSoldText.setText(String.format(Locale.getDefault(), "%.1f", summary.totalKgSold));
                    revenueText.setText(String.format(Locale.getDefault(), "K%.2f", summary.totalRevenue));
                } else {
                    kgSoldText.setText("—");
                    revenueText.setText("—");
                }
            }

            @Override
            public void onFailure(Call<DailySummary> call, Throwable t) {
                kgSoldText.setText("—");
                revenueText.setText("—");
            }
        });
    }
}
