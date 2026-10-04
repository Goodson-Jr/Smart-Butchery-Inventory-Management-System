package com.sbims.pos.model;

import com.google.gson.annotations.SerializedName;

public class WastageRequest {
    @SerializedName("product_id")
    public int productId;

    @SerializedName("quantity_kg")
    public double quantityKg;

    /** One of SPOILAGE, EXPIRY, TRIM, OTHER. */
    public String reason;

    public String note;

    public WastageRequest(int productId, double quantityKg, String reason, String note) {
        this.productId = productId;
        this.quantityKg = quantityKg;
        this.reason = reason;
        this.note = note;
    }
}
