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

public class ProductPickerAdapter extends RecyclerView.Adapter<ProductPickerAdapter.ViewHolder> {

    public interface OnProductSelectedListener {
        void onProductSelected(Product product);
    }

    private final List<Product> products;
    private final OnProductSelectedListener listener;
    private int selectedPosition = RecyclerView.NO_POSITION;

    public ProductPickerAdapter(List<Product> products, OnProductSelectedListener listener) {
        this.products = products;
        this.listener = listener;
    }

    public Product getSelected() {
        if (selectedPosition == RecyclerView.NO_POSITION || selectedPosition >= products.size()) return null;
        return products.get(selectedPosition);
    }

    public Product findByBarcode(String barcode) {
        if (barcode == null) return null;
        for (Product product : products) {
            if (barcode.equals(product.barcode)) return product;
        }
        return null;
    }

    /** Selects the product with the given id (e.g. after a barcode scan) and returns its position, or -1. */
    public int selectById(int productId) {
        for (int i = 0; i < products.size(); i++) {
            if (products.get(i).id == productId) {
                int previous = selectedPosition;
                selectedPosition = i;
                if (previous != RecyclerView.NO_POSITION) notifyItemChanged(previous);
                notifyItemChanged(selectedPosition);
                if (listener != null) listener.onProductSelected(products.get(i));
                return i;
            }
        }
        return -1;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_product_picker, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Product product = products.get(position);
        holder.productNameText.setText(product.name);
        holder.productPriceText.setText(holder.itemView.getContext()
                .getString(R.string.label_price_per_kg, String.format(Locale.getDefault(), "%.2f", product.pricePerKg)));
        holder.productStockText.setText(holder.itemView.getContext()
                .getString(R.string.label_kg, String.format(Locale.getDefault(), "%.1f", product.stockKg)));

        int badgeColor = ContextCompat.getColor(holder.itemView.getContext(), CategoryColors.colorRes(product.categoryName));
        holder.badgeBg.setBackgroundTintList(ColorStateList.valueOf(badgeColor));

        holder.cardRoot.setBackgroundResource(
                position == selectedPosition ? R.drawable.bg_card_selected : R.drawable.bg_card_outline);

        holder.itemView.setOnClickListener(v -> {
            int previous = selectedPosition;
            selectedPosition = holder.getBindingAdapterPosition();
            if (previous != RecyclerView.NO_POSITION) notifyItemChanged(previous);
            notifyItemChanged(selectedPosition);
            if (listener != null) listener.onProductSelected(product);
        });
    }

    @Override
    public int getItemCount() {
        return products.size();
    }

    public void replaceAll(List<Product> newProducts) {
        products.clear();
        products.addAll(newProducts);
        selectedPosition = RecyclerView.NO_POSITION;
        notifyDataSetChanged();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        final View cardRoot;
        final View badgeBg;
        final TextView productNameText;
        final TextView productPriceText;
        final TextView productStockText;

        ViewHolder(View itemView) {
            super(itemView);
            cardRoot = itemView.findViewById(R.id.cardRoot);
            badgeBg = itemView.findViewById(R.id.badgeBg);
            productNameText = itemView.findViewById(R.id.productNameText);
            productPriceText = itemView.findViewById(R.id.productPriceText);
            productStockText = itemView.findViewById(R.id.productStockText);
        }
    }
}
