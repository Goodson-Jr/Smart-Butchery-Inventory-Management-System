package com.sbims.pos.model;

import com.google.gson.annotations.SerializedName;

public class SaleResponse {
    public int id;

    @SerializedName("total_price")
    public double totalPrice;
}
