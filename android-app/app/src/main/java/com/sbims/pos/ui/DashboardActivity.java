package com.sbims.pos.ui;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import com.sbims.pos.R;
import com.sbims.pos.model.DailySummary;
import com.sbims.pos.network.ApiClient;
import java.util.Locale;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class DashboardActivity extends AppCompatActivity {

    private TextView kgSoldText;
    private TextView revenueText;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dashboard);

        kgSoldText = findViewById(R.id.kgSoldText);
        revenueText = findViewById(R.id.revenueText);

        View saleButton = findViewById(R.id.saleButton);
        View addStockButton = findViewById(R.id.addStockButton);
        View viewStockButton = findViewById(R.id.viewStockButton);

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
