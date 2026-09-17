package com.sbims.pos.ui;

import android.os.Bundle;
import android.widget.ArrayAdapter;
import android.widget.Spinner;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;
import com.sbims.pos.R;
import com.sbims.pos.model.Product;
import com.sbims.pos.model.StockBatchRequest;
import com.sbims.pos.network.ApiClient;
import java.util.ArrayList;
import java.util.List;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class AddStockActivity extends AppCompatActivity {

    private final List<Product> products = new ArrayList<>();
    private Spinner productSpinner;
    private TextInputEditText quantityInput;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_add_stock);

        productSpinner = findViewById(R.id.productSpinner);
        quantityInput = findViewById(R.id.quantityInput);
        MaterialButton saveStockButton = findViewById(R.id.saveStockButton);

        loadProducts();

        saveStockButton.setOnClickListener(v -> submitStock(saveStockButton));
    }

    private void loadProducts() {
        ApiClient.getService(this).getProducts().enqueue(new Callback<List<Product>>() {
            @Override
            public void onResponse(Call<List<Product>> call, Response<List<Product>> response) {
                products.clear();
                if (response.isSuccessful() && response.body() != null) {
                    products.addAll(response.body());
                }
                List<String> names = new ArrayList<>();
                for (Product p : products) names.add(p.name);
                ArrayAdapter<String> adapter = new ArrayAdapter<>(AddStockActivity.this,
                        android.R.layout.simple_spinner_dropdown_item, names);
                productSpinner.setAdapter(adapter);
            }

            @Override
            public void onFailure(Call<List<Product>> call, Throwable t) {
                Toast.makeText(AddStockActivity.this, "Could not load products: " + t.getMessage(),
                        Toast.LENGTH_LONG).show();
            }
        });
    }

    private void submitStock(MaterialButton saveStockButton) {
        int position = productSpinner.getSelectedItemPosition();
        if (position < 0 || position >= products.size()) {
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

        Product selected = products.get(position);
        saveStockButton.setEnabled(false);
        ApiClient.getService(this).addStock(new StockBatchRequest(selected.id, quantity))
                .enqueue(new Callback<Void>() {
                    @Override
                    public void onResponse(Call<Void> call, Response<Void> response) {
                        saveStockButton.setEnabled(true);
                        if (response.isSuccessful()) {
                            Toast.makeText(AddStockActivity.this, "Stock added", Toast.LENGTH_SHORT).show();
                            finish();
                        } else {
                            Toast.makeText(AddStockActivity.this, "Failed: " + response.code(), Toast.LENGTH_LONG).show();
                        }
                    }

                    @Override
                    public void onFailure(Call<Void> call, Throwable t) {
                        saveStockButton.setEnabled(true);
                        Toast.makeText(AddStockActivity.this, "Could not reach server: " + t.getMessage(), Toast.LENGTH_LONG).show();
                    }
                });
    }
}
