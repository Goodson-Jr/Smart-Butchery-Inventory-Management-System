package com.sbims.pos.model;

import com.google.gson.annotations.SerializedName;

public class SaleLineRequest {
    @SerializedName("product_id")
    public int productId;

    @SerializedName("quantity_kg")
    public double quantityKg;

    public SaleLineRequest(int productId, double quantityKg) {
        this.productId = productId;
        this.quantityKg = quantityKg;
    }
}
