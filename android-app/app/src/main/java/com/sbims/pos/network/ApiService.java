package com.sbims.pos.network;

import com.sbims.pos.model.DailySummary;
import com.sbims.pos.model.LoginRequest;
import com.sbims.pos.model.LoginResponse;
import com.sbims.pos.model.Product;
import com.sbims.pos.model.SaleRequest;
import com.sbims.pos.model.SaleResponse;
import com.sbims.pos.model.StockBatchRequest;
import com.sbims.pos.model.WastageRequest;
import java.util.List;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.POST;

/**
 * Contract as agreed with the backend schema (see backend/database/schema.sql).
 * Exact paths to be confirmed with Goodson once the login/product/sales APIs
 * land (issues #3-#5, #7) — tracked jointly in #24.
 */
public interface ApiService {

    @POST("api/login")
    Call<LoginResponse> login(@Body LoginRequest request);

    @GET("api/products")
    Call<List<Product>> getProducts();

    @POST("api/sales")
    Call<SaleResponse> recordSale(@Body SaleRequest request);

    @POST("api/stock-batches")
    Call<Void> addStock(@Body StockBatchRequest request);

    @GET("api/sales/today")
    Call<DailySummary> getTodaySummary();

    @POST("api/wastage")
    Call<Void> recordWastage(@Body WastageRequest request);
}
