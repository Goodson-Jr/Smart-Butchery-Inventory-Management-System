package com.sbims.pos.model;

import com.google.gson.annotations.SerializedName;
import java.io.Serializable;

public class ReceiptLine implements Serializable {
    @SerializedName("sale_id")
    public int saleId;

    @SerializedName("product_id")
    public int productId;

    @SerializedName("product_name")
    public String productName;

    @SerializedName("quantity_kg")
    public double quantityKg;

    @SerializedName("unit_price")
    public double unitPrice;

    @SerializedName("total_price")
    public double totalPrice;
}
