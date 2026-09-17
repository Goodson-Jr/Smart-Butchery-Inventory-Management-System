package com.sbims.pos.ui;

import android.os.Bundle;
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

    private RecyclerView stockRecyclerView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_stock_list);

        stockRecyclerView = findViewById(R.id.stockRecyclerView);
        stockRecyclerView.setLayoutManager(new LinearLayoutManager(this));

        loadStock();
    }

    private void loadStock() {
        ApiClient.getService(this).getProducts().enqueue(new Callback<List<Product>>() {
            @Override
            public void onResponse(Call<List<Product>> call, Response<List<Product>> response) {
                List<Product> products = response.isSuccessful() && response.body() != null
                        ? response.body() : new ArrayList<>();
                stockRecyclerView.setAdapter(new StockAdapter(products));
            }

            @Override
            public void onFailure(Call<List<Product>> call, Throwable t) {
                Toast.makeText(StockListActivity.this, "Could not load stock: " + t.getMessage(),
                        Toast.LENGTH_LONG).show();
                stockRecyclerView.setAdapter(new StockAdapter(new ArrayList<>()));
            }
        });
    }
}
