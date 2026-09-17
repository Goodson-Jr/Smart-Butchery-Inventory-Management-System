package com.sbims.pos.ui;

import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.widget.ArrayAdapter;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;
import com.sbims.pos.R;
import com.sbims.pos.model.Product;
import com.sbims.pos.model.SaleRequest;
import com.sbims.pos.model.SaleResponse;
import com.sbims.pos.network.ApiClient;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class SaleEntryActivity extends AppCompatActivity {

    private final List<Product> products = new ArrayList<>();
    private Spinner productSpinner;
    private TextInputEditText weightInput;
    private TextView lineTotalText;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_sale_entry);

        productSpinner = findViewById(R.id.productSpinner);
        weightInput = findViewById(R.id.weightInput);
        lineTotalText = findViewById(R.id.lineTotalText);
        MaterialButton completeSaleButton = findViewById(R.id.completeSaleButton);

        loadProducts();

        weightInput.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                updateLineTotal();
            }

            @Override
            public void afterTextChanged(Editable s) {}
        });

        completeSaleButton.setOnClickListener(v -> submitSale(completeSaleButton));
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
                ArrayAdapter<String> adapter = new ArrayAdapter<>(SaleEntryActivity.this,
                        android.R.layout.simple_spinner_dropdown_item, names);
                productSpinner.setAdapter(adapter);
                updateLineTotal();
            }

            @Override
            public void onFailure(Call<List<Product>> call, Throwable t) {
                Toast.makeText(SaleEntryActivity.this, "Could not load products: " + t.getMessage(),
                        Toast.LENGTH_LONG).show();
            }
        });
    }

    private void updateLineTotal() {
        double total = 0;
        Product selected = selectedProduct();
        double weight = parseWeight();
        if (selected != null) {
            total = selected.pricePerKg * weight;
        }
        lineTotalText.setText(getString(R.string.label_line_total, String.format(Locale.getDefault(), "%.2f", total)));
    }

    private double parseWeight() {
        String text = weightInput.getText() != null ? weightInput.getText().toString() : "";
        try {
            return Double.parseDouble(text);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private Product selectedProduct() {
        int position = productSpinner.getSelectedItemPosition();
        if (position < 0 || position >= products.size()) return null;
        return products.get(position);
    }

    private void submitSale(MaterialButton completeSaleButton) {
        Product selected = selectedProduct();
        double weight = parseWeight();

        if (selected == null) {
            Toast.makeText(this, "Select a product first", Toast.LENGTH_SHORT).show();
            return;
        }
        if (weight <= 0) {
            Toast.makeText(this, "Enter a weight greater than 0", Toast.LENGTH_SHORT).show();
            return;
        }
        if (weight > selected.stockKg) {
            Toast.makeText(this, "Only " + selected.stockKg + " kg left in stock", Toast.LENGTH_SHORT).show();
            return;
        }

        completeSaleButton.setEnabled(false);
        ApiClient.getService(this).recordSale(new SaleRequest(selected.id, weight))
                .enqueue(new Callback<SaleResponse>() {
                    @Override
                    public void onResponse(Call<SaleResponse> call, Response<SaleResponse> response) {
                        completeSaleButton.setEnabled(true);
                        if (response.isSuccessful()) {
                            Toast.makeText(SaleEntryActivity.this, "Sale recorded", Toast.LENGTH_SHORT).show();
                            finish();
                        } else {
                            Toast.makeText(SaleEntryActivity.this, "Sale failed: " + response.code(), Toast.LENGTH_LONG).show();
                        }
                    }

                    @Override
                    public void onFailure(Call<SaleResponse> call, Throwable t) {
                        completeSaleButton.setEnabled(true);
                        Toast.makeText(SaleEntryActivity.this, "Could not reach server: " + t.getMessage(), Toast.LENGTH_LONG).show();
                    }
                });
    }
}
