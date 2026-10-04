package com.sbims.pos.ui;

import android.os.Bundle;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.chip.ChipGroup;
import com.google.android.material.textfield.TextInputEditText;
import com.sbims.pos.R;
import com.sbims.pos.model.Product;
import com.sbims.pos.model.WastageRequest;
import com.sbims.pos.model.WastageResponse;
import com.sbims.pos.network.ApiClient;
import java.util.ArrayList;
import java.util.List;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class WastageActivity extends AppCompatActivity {

    private ProductPickerAdapter adapter;
    private TextInputEditText quantityInput;
    private ChipGroup reasonChipGroup;
    private TextInputEditText noteInput;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_wastage);

        RecyclerView productRecyclerView = findViewById(R.id.productRecyclerView);
        quantityInput = findViewById(R.id.quantityInput);
        reasonChipGroup = findViewById(R.id.reasonChipGroup);
        noteInput = findViewById(R.id.noteInput);
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

        String reason = selectedReason();
        if (reason == null) {
            Toast.makeText(this, "Choose a reason", Toast.LENGTH_SHORT).show();
            return;
        }
        String note = noteInput.getText() != null ? noteInput.getText().toString().trim() : "";

        saveWastageButton.setEnabled(false);
        ApiClient.getService(this).recordWastage(new WastageRequest(selected.id, quantity, reason, note))
                .enqueue(new Callback<WastageResponse>() {
                    @Override
                    public void onResponse(Call<WastageResponse> call, Response<WastageResponse> response) {
                        saveWastageButton.setEnabled(true);
                        if (response.isSuccessful() && response.body() != null) {
                            // Cashier reports wait for a manager before stock changes (#39).
                            String message = "APPROVED".equals(response.body().status)
                                    ? "Wastage recorded and taken off stock"
                                    : "Reported. A manager needs to approve it before it comes off stock.";
                            Toast.makeText(WastageActivity.this, message, Toast.LENGTH_LONG).show();
                            finish();
                        } else if (response.code() == 409) {
                            Toast.makeText(WastageActivity.this, "Not enough stock to write off", Toast.LENGTH_LONG).show();
                        } else {
                            Toast.makeText(WastageActivity.this, "Failed: " + response.code(), Toast.LENGTH_LONG).show();
                        }
                    }

                    @Override
                    public void onFailure(Call<WastageResponse> call, Throwable t) {
                        saveWastageButton.setEnabled(true);
                        Toast.makeText(WastageActivity.this, "Could not reach server: " + t.getMessage(), Toast.LENGTH_LONG).show();
                    }
                });
    }

    private String selectedReason() {
        int checked = reasonChipGroup.getCheckedChipId();
        if (checked == R.id.reasonSpoilage) return "SPOILAGE";
        if (checked == R.id.reasonExpiry) return "EXPIRY";
        if (checked == R.id.reasonTrim) return "TRIM";
        if (checked == R.id.reasonOther) return "OTHER";
        return null;
    }
}
