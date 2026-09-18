package com.sbims.pos.ui;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.google.android.material.button.MaterialButton;
import com.sbims.pos.R;
import com.sbims.pos.model.ReceiptLine;
import com.sbims.pos.model.SaleBatchResponse;
import com.sbims.pos.network.SessionManager;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class ReceiptActivity extends AppCompatActivity {

    public static final String EXTRA_RECEIPT = "extra_receipt";

    private SaleBatchResponse receipt;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_receipt);

        receipt = (SaleBatchResponse) getIntent().getSerializableExtra(EXTRA_RECEIPT);
        if (receipt == null) {
            finish();
            return;
        }

        TextView subtitleText = findViewById(R.id.receiptSubtitleText);
        TextView totalText = findViewById(R.id.receiptTotalText);
        RecyclerView linesRecyclerView = findViewById(R.id.receiptLinesRecyclerView);
        MaterialButton printButton = findViewById(R.id.printButton);
        MaterialButton doneButton = findViewById(R.id.doneButton);

        String receiptNumber = receipt.lines.isEmpty() ? "-" : String.valueOf(receipt.lines.get(0).saleId);
        subtitleText.setText(getString(R.string.receipt_subtitle, receiptNumber, formatDate(receipt.soldAt)));
        totalText.setText(getString(R.string.label_receipt_total, String.format(Locale.getDefault(), "%.2f", receipt.grandTotal)));

        linesRecyclerView.setLayoutManager(new LinearLayoutManager(this));
        linesRecyclerView.setAdapter(new ReceiptLineAdapter(receipt.lines));

        printButton.setOnClickListener(v -> printReceipt());
        doneButton.setOnClickListener(v -> finish());
    }

    private String formatDate(String isoDate) {
        try {
            SimpleDateFormat parser = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault());
            SimpleDateFormat display = new SimpleDateFormat("dd MMM yyyy, HH:mm", Locale.getDefault());
            Date date = parser.parse(isoDate.length() > 19 ? isoDate.substring(0, 19) : isoDate);
            return date != null ? display.format(date) : isoDate;
        } catch (Exception e) {
            return isoDate;
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void printReceipt() {
        WebView webView = new WebView(this);
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                PrintManager printManager = (PrintManager) getSystemService(PRINT_SERVICE);
                if (printManager == null) return;
                String jobName = getString(R.string.app_name) + " Receipt";
                printManager.print(jobName, view.createPrintDocumentAdapter(jobName),
                        new PrintAttributes.Builder().build());
            }
        });
        webView.loadDataWithBaseURL(null, buildReceiptHtml(), "text/html", "UTF-8", null);
    }

    private String buildReceiptHtml() {
        SessionManager sessionManager = new SessionManager(this);
        StringBuilder rows = new StringBuilder();
        for (ReceiptLine line : receipt.lines) {
            rows.append("<tr><td>").append(escape(line.productName)).append("</td>")
                    .append("<td style=\"text-align:right\">").append(String.format(Locale.getDefault(), "%.2f kg", line.quantityKg)).append("</td>")
                    .append("<td style=\"text-align:right\">K").append(String.format(Locale.getDefault(), "%.2f", line.unitPrice)).append("</td>")
                    .append("<td style=\"text-align:right\">K").append(String.format(Locale.getDefault(), "%.2f", line.totalPrice)).append("</td></tr>");
        }

        String cashier = sessionManager.getUsername() != null ? sessionManager.getUsername() : "-";
        String receiptNumber = receipt.lines.isEmpty() ? "-" : String.valueOf(receipt.lines.get(0).saleId);

        return "<html><body style=\"font-family:monospace;padding:16px;\">"
                + "<h2 style=\"text-align:center;margin-bottom:0;\">" + escape(getString(R.string.app_name)) + "</h2>"
                + "<p style=\"text-align:center;margin-top:4px;\">Point of Sale Receipt</p>"
                + "<hr/>"
                + "<p>Receipt #" + receiptNumber + "<br/>"
                + "Date: " + escape(formatDate(receipt.soldAt)) + "<br/>"
                + "Cashier: " + escape(cashier) + "</p>"
                + "<table style=\"width:100%;border-collapse:collapse;\">"
                + "<tr><th style=\"text-align:left\">Item</th><th style=\"text-align:right\">Qty</th><th style=\"text-align:right\">Unit</th><th style=\"text-align:right\">Total</th></tr>"
                + rows
                + "</table>"
                + "<hr/>"
                + "<h3 style=\"text-align:right\">Grand Total: K" + String.format(Locale.getDefault(), "%.2f", receipt.grandTotal) + "</h3>"
                + "<p style=\"text-align:center;margin-top:24px;\">Thank you — please come again.</p>"
                + "</body></html>";
    }

    private String escape(String value) {
        return value == null ? "" : value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
