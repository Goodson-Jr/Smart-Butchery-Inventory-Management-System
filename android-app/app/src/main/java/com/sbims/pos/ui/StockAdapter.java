package com.sbims.pos.ui;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.sbims.pos.R;
import com.sbims.pos.model.Product;
import java.util.List;
import java.util.Locale;

public class StockAdapter extends RecyclerView.Adapter<StockAdapter.ViewHolder> {

    private final List<Product> products;

    public StockAdapter(List<Product> products) {
        this.products = products;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_stock, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Product product = products.get(position);
        holder.productNameText.setText(product.name);
        holder.stockKgText.setText(String.format(Locale.getDefault(), "%.2f kg", product.stockKg));
    }

    @Override
    public int getItemCount() {
        return products.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        final TextView productNameText;
        final TextView stockKgText;

        ViewHolder(View itemView) {
            super(itemView);
            productNameText = itemView.findViewById(R.id.productNameText);
            stockKgText = itemView.findViewById(R.id.stockKgText);
        }
    }
}
