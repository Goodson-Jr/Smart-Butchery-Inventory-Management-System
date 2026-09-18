package com.sbims.pos.ui;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.sbims.pos.R;
import com.sbims.pos.model.ReceiptLine;
import java.util.List;
import java.util.Locale;

public class ReceiptLineAdapter extends RecyclerView.Adapter<ReceiptLineAdapter.ViewHolder> {

    private final List<ReceiptLine> lines;

    public ReceiptLineAdapter(List<ReceiptLine> lines) {
        this.lines = lines;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_receipt_line, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        ReceiptLine line = lines.get(position);
        holder.nameText.setText(line.productName);
        holder.detailText.setText(String.format(Locale.getDefault(), "%.2f kg × K%.2f/kg", line.quantityKg, line.unitPrice));
        holder.totalText.setText(String.format(Locale.getDefault(), "K%.2f", line.totalPrice));
    }

    @Override
    public int getItemCount() {
        return lines.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        final TextView nameText;
        final TextView detailText;
        final TextView totalText;

        ViewHolder(View itemView) {
            super(itemView);
            nameText = itemView.findViewById(R.id.lineNameText);
            detailText = itemView.findViewById(R.id.lineDetailText);
            totalText = itemView.findViewById(R.id.lineTotalText);
        }
    }
}
