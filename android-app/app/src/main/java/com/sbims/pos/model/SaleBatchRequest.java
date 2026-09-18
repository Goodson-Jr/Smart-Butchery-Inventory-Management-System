package com.sbims.pos.model;

import java.util.List;

public class SaleBatchRequest {
    public List<SaleLineRequest> items;

    public SaleBatchRequest(List<SaleLineRequest> items) {
        this.items = items;
    }
}
