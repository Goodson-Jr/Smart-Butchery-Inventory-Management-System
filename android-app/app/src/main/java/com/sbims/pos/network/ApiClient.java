package com.sbims.pos.network;

import android.content.Context;
import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class ApiClient {

    // Goodson's live Railway deployment (#10 done). Swap to the localhost
    // line below when developing against a backend running on your own
    // machine instead -- 10.0.2.2 is the emulator's alias for the host's
    // localhost, and needs the cleartext exception in
    // res/xml/network_security_config.xml since it's plain HTTP.
    private static final String BASE_URL = "https://sbims-backend-production.up.railway.app/";
    // private static final String BASE_URL = "http://10.0.2.2:3000/";

    private static Retrofit retrofit;

    public static ApiService getService(Context context) {
        if (retrofit == null) {
            SessionManager sessionManager = new SessionManager(context);

            HttpLoggingInterceptor logging = new HttpLoggingInterceptor();
            logging.setLevel(HttpLoggingInterceptor.Level.BODY);

            OkHttpClient client = new OkHttpClient.Builder()
                    .addInterceptor(new AuthInterceptor(sessionManager))
                    .addInterceptor(logging)
                    .build();

            retrofit = new Retrofit.Builder()
                    .baseUrl(BASE_URL)
                    .client(client)
                    .addConverterFactory(GsonConverterFactory.create())
                    .build();
        }
        return retrofit.create(ApiService.class);
    }
}
