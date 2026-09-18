package com.sbims.pos.ui;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import com.sbims.pos.R;
import com.sbims.pos.model.Product;
import java.util.List;
import java.util.Locale;

public class LowStockNotifier {

    private static final String CHANNEL_ID = "low_stock_alerts";
    private static final int NOTIFICATION_ID = 1001;

    public static void ensureChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID, "Low stock alerts", NotificationManager.IMPORTANCE_DEFAULT);
        channel.setDescription("Alerts when a cut's stock drops to or below its threshold");
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager != null) manager.createNotificationChannel(channel);
    }

    public static void notifyIfLowStock(Context context, List<Product> lowStockProducts) {
        if (lowStockProducts == null || lowStockProducts.isEmpty()) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && ActivityCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
            return;
        }

        StringBuilder names = new StringBuilder();
        for (int i = 0; i < lowStockProducts.size(); i++) {
            if (i > 0) names.append(", ");
            names.append(lowStockProducts.get(i).name);
        }

        String title = lowStockProducts.size() == 1
                ? "1 cut is low on stock"
                : String.format(Locale.getDefault(), "%d cuts are low on stock", lowStockProducts.size());

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_alert)
                .setContentTitle(title)
                .setContentText(names.toString())
                .setStyle(new NotificationCompat.BigTextStyle().bigText(names.toString()))
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setAutoCancel(true);

        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager != null) manager.notify(NOTIFICATION_ID, builder.build());
    }
}
