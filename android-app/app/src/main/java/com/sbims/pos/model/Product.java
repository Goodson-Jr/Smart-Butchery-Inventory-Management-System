package com.sbims.pos.model;

import com.google.gson.annotations.SerializedName;

public class Product {
    public int id;
    public String name;

    @SerializedName("price_per_kg")
    public double pricePerKg;

    @SerializedName("stock_kg")
    public double stockKg;

    public Product() {
    }

    public Product(int id, String name, double pricePerKg, double stockKg) {
        this.id = id;
        this.name = name;
        this.pricePerKg = pricePerKg;
        this.stockKg = stockKg;
    }
}
