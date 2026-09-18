package com.sbims.pos.ui;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.sbims.pos.R;
import com.sbims.pos.model.Product;
import com.sbims.pos.network.ApiClient;
import java.util.ArrayList;
import java.util.List;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class StockListActivity extends AppCompatActivity {

    private static final long REFRESH_INTERVAL_MS = 5000;

    private RecyclerView stockRecyclerView;
    private StockAdapter adapter;
    private final Handler refreshHandler = new Handler(Looper.getMainLooper());

    private final Runnable refreshLoop = new Runnable() {
        @Override
        public void run() {
            loadStock();
            refreshHandler.postDelayed(this, REFRESH_INTERVAL_MS);
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_stock_list);

        stockRecyclerView = findViewById(R.id.stockRecyclerView);
        stockRecyclerView.setLayoutManager(new LinearLayoutManager(this));

        adapter = new StockAdapter(new ArrayList<>());
        stockRecyclerView.setAdapter(adapter);
    }

    @Override
    protected void onResume() {
        super.onResume();
        refreshHandler.removeCallbacks(refreshLoop);
        refreshHandler.post(refreshLoop);
    }

    @Override
    protected void onPause() {
        super.onPause();
        refreshHandler.removeCallbacks(refreshLoop);
    }

    private void loadStock() {
        ApiClient.getService(this).getProducts().enqueue(new Callback<List<Product>>() {
            @Override
            public void onResponse(Call<List<Product>> call, Response<List<Product>> response) {
                List<Product> products = response.isSuccessful() && response.body() != null
                        ? response.body() : new ArrayList<>();
                adapter.replaceAll(products);
            }

            @Override
            public void onFailure(Call<List<Product>> call, Throwable t) {
                Toast.makeText(StockListActivity.this, "Could not load stock: " + t.getMessage(),
                        Toast.LENGTH_LONG).show();
            }
        });
    }
}
