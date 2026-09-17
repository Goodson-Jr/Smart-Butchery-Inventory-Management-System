package com.sbims.pos.model;

import com.google.gson.annotations.SerializedName;

public class Product {
    public int id;
    public String name;

    @SerializedName("category_name")
    public String categoryName;

    @SerializedName("price_per_kg")
    public double pricePerKg;

    @SerializedName("stock_kg")
    public double stockKg;

    @SerializedName("low_stock_threshold_kg")
    public double lowStockThresholdKg;

    public String barcode;

    public Product() {
    }

    public Product(int id, String name, String categoryName, double pricePerKg, double stockKg, double lowStockThresholdKg) {
        this.id = id;
        this.name = name;
        this.categoryName = categoryName;
        this.pricePerKg = pricePerKg;
        this.stockKg = stockKg;
        this.lowStockThresholdKg = lowStockThresholdKg;
    }

    public boolean isLowStock() {
        return stockKg <= lowStockThresholdKg;
    }
}
