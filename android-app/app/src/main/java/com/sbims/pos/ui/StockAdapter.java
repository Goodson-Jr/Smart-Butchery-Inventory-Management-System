package com.sbims.pos.ui;

import android.content.res.ColorStateList;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
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
        holder.productPriceText.setText(holder.itemView.getContext()
                .getString(R.string.label_price_per_kg, String.format(Locale.getDefault(), "%.2f", product.pricePerKg)));
        holder.stockKgText.setText(String.format(Locale.getDefault(), "%.2f kg", product.stockKg));
        holder.lowStockText.setVisibility(product.isLowStock() ? View.VISIBLE : View.GONE);

        int badgeColor = ContextCompat.getColor(holder.itemView.getContext(), CategoryColors.colorRes(product.categoryName));
        holder.badgeBg.setBackgroundTintList(ColorStateList.valueOf(badgeColor));
    }

    @Override
    public int getItemCount() {
        return products.size();
    }

    public void replaceAll(List<Product> newProducts) {
        products.clear();
        products.addAll(newProducts);
        notifyDataSetChanged();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        final View badgeBg;
        final TextView productNameText;
        final TextView productPriceText;
        final TextView stockKgText;
        final TextView lowStockText;

        ViewHolder(View itemView) {
            super(itemView);
            badgeBg = itemView.findViewById(R.id.badgeBg);
            productNameText = itemView.findViewById(R.id.productNameText);
            productPriceText = itemView.findViewById(R.id.productPriceText);
            stockKgText = itemView.findViewById(R.id.stockKgText);
            lowStockText = itemView.findViewById(R.id.lowStockText);
        }
    }
}
