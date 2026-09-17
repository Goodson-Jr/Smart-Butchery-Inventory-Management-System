package com.sbims.pos.model;

import com.google.gson.annotations.SerializedName;

public class DailySummary {
    @SerializedName("total_kg_sold")
    public double totalKgSold;

    @SerializedName("total_revenue")
    public double totalRevenue;
}
