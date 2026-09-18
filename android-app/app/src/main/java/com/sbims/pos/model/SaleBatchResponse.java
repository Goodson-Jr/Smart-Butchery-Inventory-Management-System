package com.sbims.pos.model;

import com.google.gson.annotations.SerializedName;
import java.io.Serializable;
import java.util.List;

public class SaleBatchResponse implements Serializable {
    public List<ReceiptLine> lines;

    @SerializedName("grand_total")
    public double grandTotal;

    @SerializedName("sold_at")
    public String soldAt;
}
