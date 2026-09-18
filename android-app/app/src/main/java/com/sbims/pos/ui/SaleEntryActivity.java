package com.sbims.pos.ui;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.TextView;
import android.widget.Toast;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;
import com.sbims.pos.R;
import com.sbims.pos.model.CartItem;
import com.sbims.pos.model.Product;
import com.sbims.pos.model.SaleBatchRequest;
import com.sbims.pos.model.SaleBatchResponse;
import com.sbims.pos.model.SaleLineRequest;
import com.sbims.pos.network.ApiClient;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class SaleEntryActivity extends AppCompatActivity {

    private final List<CartItem> cart = new ArrayList<>();
    private ProductPickerAdapter productAdapter;
    private CartAdapter cartAdapter;
    private RecyclerView productRecyclerView;
    private TextInputEditText weightInput;
    private TextView emptyCartText;
    private TextView grandTotalText;
    private MaterialButton completeSaleButton;

    private final ActivityResultLauncher<Intent> scanLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(), result -> {
                if (result.getResultCode() == RESULT_OK && result.getData() != null) {
                    handleScannedBarcode(result.getData().getStringExtra(BarcodeScannerActivity.EXTRA_BARCODE));
                }
            });

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_sale_entry);

        productRecyclerView = findViewById(R.id.productRecyclerView);
        RecyclerView cartRecyclerView = findViewById(R.id.cartRecyclerView);
        weightInput = findViewById(R.id.weightInput);
        emptyCartText = findViewById(R.id.emptyCartText);
        grandTotalText = findViewById(R.id.grandTotalText);
        MaterialButton addToCartButton = findViewById(R.id.addToCartButton);
        MaterialButton scanBarcodeButton = findViewById(R.id.scanBarcodeButton);
        completeSaleButton = findViewById(R.id.completeSaleButton);

        productAdapter = new ProductPickerAdapter(new ArrayList<>(), product -> {});
        productRecyclerView.setLayoutManager(new GridLayoutManager(this, 3));
        productRecyclerView.setAdapter(productAdapter);

        cartAdapter = new CartAdapter(cart, this::updateCartSummary);
        cartRecyclerView.setLayoutManager(new LinearLayoutManager(this));
        cartRecyclerView.setAdapter(cartAdapter);

        loadProducts();
        updateCartSummary();

        addToCartButton.setOnClickListener(v -> addToCart());
        completeSaleButton.setOnClickListener(v -> checkout());
        scanBarcodeButton.setOnClickListener(v -> scanLauncher.launch(new Intent(this, BarcodeScannerActivity.class)));
    }

    private void handleScannedBarcode(String barcode) {
        if (barcode == null) return;
        Product match = productAdapter.findByBarcode(barcode);
        if (match == null) {
            Toast.makeText(this, R.string.error_barcode_not_found, Toast.LENGTH_SHORT).show();
            return;
        }
        int position = productAdapter.selectById(match.id);
        if (position >= 0) productRecyclerView.scrollToPosition(position);
    }

    private void loadProducts() {
        ApiClient.getService(this).getProducts().enqueue(new Callback<List<Product>>() {
            @Override
            public void onResponse(Call<List<Product>> call, Response<List<Product>> response) {
                List<Product> loaded = response.isSuccessful() && response.body() != null
                        ? response.body() : new ArrayList<>();
                productAdapter.replaceAll(loaded);
            }

            @Override
            public void onFailure(Call<List<Product>> call, Throwable t) {
                Toast.makeText(SaleEntryActivity.this, "Could not load products: " + t.getMessage(),
                        Toast.LENGTH_LONG).show();
            }
        });
    }

    private void addToCart() {
        Product selected = productAdapter.getSelected();
        double weight = parseWeight();

        if (selected == null) {
            Toast.makeText(this, "Select a product first", Toast.LENGTH_SHORT).show();
            return;
        }
        if (weight <= 0) {
            Toast.makeText(this, "Enter a weight greater than 0", Toast.LENGTH_SHORT).show();
            return;
        }

        double alreadyInCart = 0;
        CartItem existing = null;
        for (CartItem item : cart) {
            if (item.product.id == selected.id) {
                existing = item;
                alreadyInCart = item.quantityKg;
                break;
            }
        }

        if (alreadyInCart + weight > selected.stockKg) {
            Toast.makeText(this, "Only " + selected.stockKg + " kg left in stock", Toast.LENGTH_SHORT).show();
            return;
        }

        if (existing != null) {
            existing.quantityKg += weight;
        } else {
            cart.add(new CartItem(selected, weight));
        }
        cartAdapter.notifyDataSetChanged();
        updateCartSummary();
        weightInput.setText("");
    }

    private void updateCartSummary() {
        double total = 0;
        for (CartItem item : cart) total += item.lineTotal();
        grandTotalText.setText(getString(R.string.label_grand_total, String.format(Locale.getDefault(), "%.2f", total)));
        emptyCartText.setVisibility(cart.isEmpty() ? View.VISIBLE : View.GONE);
        completeSaleButton.setEnabled(!cart.isEmpty());
    }

    private double parseWeight() {
        String text = weightInput.getText() != null ? weightInput.getText().toString() : "";
        try {
            return Double.parseDouble(text);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private void checkout() {
        if (cart.isEmpty()) return;

        List<SaleLineRequest> items = new ArrayList<>();
        for (CartItem item : cart) {
            items.add(new SaleLineRequest(item.product.id, item.quantityKg));
        }

        completeSaleButton.setEnabled(false);
        ApiClient.getService(this).checkout(new SaleBatchRequest(items))
                .enqueue(new Callback<SaleBatchResponse>() {
                    @Override
                    public void onResponse(Call<SaleBatchResponse> call, Response<SaleBatchResponse> response) {
                        completeSaleButton.setEnabled(true);
                        if (response.isSuccessful() && response.body() != null) {
                            Intent intent = new Intent(SaleEntryActivity.this, ReceiptActivity.class);
                            intent.putExtra(ReceiptActivity.EXTRA_RECEIPT, response.body());
                            startActivity(intent);
                            finish();
                        } else {
                            Toast.makeText(SaleEntryActivity.this, "Sale failed: " + response.code(), Toast.LENGTH_LONG).show();
                        }
                    }

                    @Override
                    public void onFailure(Call<SaleBatchResponse> call, Throwable t) {
                        completeSaleButton.setEnabled(true);
                        Toast.makeText(SaleEntryActivity.this, "Could not reach server: " + t.getMessage(), Toast.LENGTH_LONG).show();
                    }
                });
    }
}
