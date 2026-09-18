package com.sbims.pos.model;

import com.google.gson.annotations.SerializedName;

public class WastageRequest {
    @SerializedName("product_id")
    public int productId;

    @SerializedName("quantity_kg")
    public double quantityKg;

    public String reason;

    public WastageRequest(int productId, double quantityKg, String reason) {
        this.productId = productId;
        this.quantityKg = quantityKg;
        this.reason = reason;
    }
}
