package com.sbims.pos.ui;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.sbims.pos.R;
import com.sbims.pos.model.CartItem;
import java.util.List;
import java.util.Locale;

public class CartAdapter extends RecyclerView.Adapter<CartAdapter.ViewHolder> {

    public interface OnCartChangedListener {
        void onCartChanged();
    }

    private final List<CartItem> items;
    private final OnCartChangedListener listener;

    public CartAdapter(List<CartItem> items, OnCartChangedListener listener) {
        this.items = items;
        this.listener = listener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_cart_row, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        CartItem item = items.get(position);
        holder.nameText.setText(item.product.name);
        holder.qtyText.setText(String.format(Locale.getDefault(), "%.2f kg × K%.2f/kg", item.quantityKg, item.product.pricePerKg));
        holder.totalText.setText(String.format(Locale.getDefault(), "K%.2f", item.lineTotal()));

        holder.removeText.setOnClickListener(v -> {
            int position1 = holder.getBindingAdapterPosition();
            if (position1 == RecyclerView.NO_POSITION) return;
            items.remove(position1);
            notifyItemRemoved(position1);
            if (listener != null) listener.onCartChanged();
        });
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        final TextView nameText;
        final TextView qtyText;
        final TextView totalText;
        final TextView removeText;

        ViewHolder(View itemView) {
            super(itemView);
            nameText = itemView.findViewById(R.id.cartItemNameText);
            qtyText = itemView.findViewById(R.id.cartItemQtyText);
            totalText = itemView.findViewById(R.id.cartItemTotalText);
            removeText = itemView.findViewById(R.id.cartItemRemoveText);
        }
    }
}
