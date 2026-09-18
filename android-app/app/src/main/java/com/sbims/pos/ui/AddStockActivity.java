package com.sbims.pos.ui;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Toast;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;
import com.sbims.pos.R;
import com.sbims.pos.model.Product;
import com.sbims.pos.model.StockBatchRequest;
import com.sbims.pos.network.ApiClient;
import com.sbims.pos.network.SessionManager;
import java.util.ArrayList;
import java.util.List;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class AddStockActivity extends AppCompatActivity {

    private final List<Product> products = new ArrayList<>();
    private ProductPickerAdapter adapter;
    private RecyclerView productRecyclerView;
    private TextInputEditText quantityInput;

    private final ActivityResultLauncher<Intent> scanLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(), result -> {
                if (result.getResultCode() == RESULT_OK && result.getData() != null) {
                    handleScannedBarcode(result.getData().getStringExtra(BarcodeScannerActivity.EXTRA_BARCODE));
                }
            });

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_add_stock);

        if (!"admin".equals(new SessionManager(this).getRole())) {
            Toast.makeText(this, "Only admin accounts can add stock", Toast.LENGTH_LONG).show();
            finish();
            return;
        }

        productRecyclerView = findViewById(R.id.productRecyclerView);
        quantityInput = findViewById(R.id.quantityInput);
        MaterialButton saveStockButton = findViewById(R.id.saveStockButton);
        MaterialButton scanBarcodeButton = findViewById(R.id.scanBarcodeButton);

        adapter = new ProductPickerAdapter(products, product -> {});
        productRecyclerView.setLayoutManager(new GridLayoutManager(this, 3));
        productRecyclerView.setAdapter(adapter);

        loadProducts();

        saveStockButton.setOnClickListener(v -> submitStock(saveStockButton));
        scanBarcodeButton.setOnClickListener(v -> scanLauncher.launch(new Intent(this, BarcodeScannerActivity.class)));
    }

    private void handleScannedBarcode(String barcode) {
        if (barcode == null) return;
        Product match = adapter.findByBarcode(barcode);
        if (match == null) {
            Toast.makeText(this, R.string.error_barcode_not_found, Toast.LENGTH_SHORT).show();
            return;
        }
        int position = adapter.selectById(match.id);
        if (position >= 0) productRecyclerView.scrollToPosition(position);
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
                Toast.makeText(AddStockActivity.this, "Could not load products: " + t.getMessage(),
                        Toast.LENGTH_LONG).show();
            }
        });
    }

    private void submitStock(MaterialButton saveStockButton) {
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
