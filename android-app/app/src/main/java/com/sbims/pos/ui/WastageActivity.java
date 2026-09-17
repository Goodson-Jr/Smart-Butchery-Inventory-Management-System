package com.sbims.pos.ui;

import android.os.Bundle;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;
import com.sbims.pos.R;
import com.sbims.pos.model.Product;
import com.sbims.pos.model.WastageRequest;
import com.sbims.pos.network.ApiClient;
import java.util.ArrayList;
import java.util.List;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class WastageActivity extends AppCompatActivity {

    private ProductPickerAdapter adapter;
    private TextInputEditText quantityInput;
    private TextInputEditText reasonInput;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_wastage);

        RecyclerView productRecyclerView = findViewById(R.id.productRecyclerView);
        quantityInput = findViewById(R.id.quantityInput);
        reasonInput = findViewById(R.id.reasonInput);
        MaterialButton saveWastageButton = findViewById(R.id.saveWastageButton);

        adapter = new ProductPickerAdapter(new ArrayList<>(), product -> {});
        productRecyclerView.setLayoutManager(new GridLayoutManager(this, 3));
        productRecyclerView.setAdapter(adapter);

        loadProducts();

        saveWastageButton.setOnClickListener(v -> submitWastage(saveWastageButton));
    }

    private void loadProducts() {
        ApiClient.getService(this).getProducts().enqueue(new Callback<List<Product>>() {
            @Override
            public void onResponse(Call<List<Product>> call, Response<List<Product>> response) {
                List<Product> loaded = response.isSuccessful() && response.body() != null
                        ? response.body() : new ArrayList<>();
                adapter.replaceAll(loaded);
            }

            @Override
            public void onFailure(Call<List<Product>> call, Throwable t) {
                Toast.makeText(WastageActivity.this, "Could not load products: " + t.getMessage(),
                        Toast.LENGTH_LONG).show();
            }
        });
    }

    private void submitWastage(MaterialButton saveWastageButton) {
        Product selected = adapter.getSelected();
        if (selected == null) {
            Toast.makeText(this, "Select a product first", Toast.LENGTH_SHORT).show();
            return;
        }

        double quantity;
        try {
            quantity = Double.parseDouble(quantityInput.getText() != null ? quantityInput.getText().toString() : "");
        } catch (NumberFormatException e) {
            Toast.makeText(this, "Enter a valid quantity", Toast.LENGTH_SHORT).show();
            return;
        }
        if (quantity <= 0) {
            Toast.makeText(this, "Enter a quantity greater than 0", Toast.LENGTH_SHORT).show();
            return;
        }
        if (quantity > selected.stockKg) {
            Toast.makeText(this, "Only " + selected.stockKg + " kg in stock", Toast.LENGTH_SHORT).show();
            return;
        }

        String reason = reasonInput.getText() != null ? reasonInput.getText().toString().trim() : "";

        saveWastageButton.setEnabled(false);
        ApiClient.getService(this).recordWastage(new WastageRequest(selected.id, quantity, reason))
                .enqueue(new Callback<Void>() {
                    @Override
                    public void onResponse(Call<Void> call, Response<Void> response) {
                        saveWastageButton.setEnabled(true);
                        if (response.isSuccessful()) {
                            Toast.makeText(WastageActivity.this, "Wastage logged", Toast.LENGTH_SHORT).show();
                            finish();
                        } else {
                            Toast.makeText(WastageActivity.this, "Failed: " + response.code(), Toast.LENGTH_LONG).show();
                        }
                    }

                    @Override
                    public void onFailure(Call<Void> call, Throwable t) {
                        saveWastageButton.setEnabled(true);
                        Toast.makeText(WastageActivity.this, "Could not reach server: " + t.getMessage(), Toast.LENGTH_LONG).show();
                    }
                });
    }
}
