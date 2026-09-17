package com.sbims.pos.ui;

import android.content.Intent;
import android.os.Bundle;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import com.google.android.material.button.MaterialButton;
import com.sbims.pos.R;
import com.sbims.pos.model.DailySummary;
import com.sbims.pos.network.ApiClient;
import java.util.Locale;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class DashboardActivity extends AppCompatActivity {

    private TextView todaySummaryText;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dashboard);

        todaySummaryText = findViewById(R.id.todaySummaryText);
        MaterialButton saleButton = findViewById(R.id.saleButton);
        MaterialButton addStockButton = findViewById(R.id.addStockButton);
        MaterialButton viewStockButton = findViewById(R.id.viewStockButton);

        saleButton.setOnClickListener(v -> startActivity(new Intent(this, SaleEntryActivity.class)));
        addStockButton.setOnClickListener(v -> startActivity(new Intent(this, AddStockActivity.class)));
        viewStockButton.setOnClickListener(v -> startActivity(new Intent(this, StockListActivity.class)));
    }

    @Override
    protected void onResume() {
        super.onResume();
        loadTodaySummary();
    }

    private void loadTodaySummary() {
        ApiClient.getService(this).getTodaySummary().enqueue(new Callback<DailySummary>() {
            @Override
            public void onResponse(Call<DailySummary> call, Response<DailySummary> response) {
                if (response.isSuccessful() && response.body() != null) {
                    DailySummary summary = response.body();
                    todaySummaryText.setText(getString(R.string.label_today_summary,
                            String.format(Locale.getDefault(), "%.1f", summary.totalKgSold),
                            String.format(Locale.getDefault(), "%.2f", summary.totalRevenue)));
                } else {
                    todaySummaryText.setText(getString(R.string.label_today_summary, "-", "-"));
                }
            }

            @Override
            public void onFailure(Call<DailySummary> call, Throwable t) {
                todaySummaryText.setText(getString(R.string.label_today_summary, "-", "-"));
            }
        });
    }
}
