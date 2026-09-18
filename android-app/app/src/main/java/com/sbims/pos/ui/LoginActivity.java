package com.sbims.pos.ui;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;
import com.sbims.pos.R;
import com.sbims.pos.model.LoginRequest;
import com.sbims.pos.model.LoginResponse;
import com.sbims.pos.network.ApiClient;
import com.sbims.pos.network.SessionManager;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class LoginActivity extends AppCompatActivity {

    private SessionManager sessionManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        sessionManager = new SessionManager(this);

        if (sessionManager.isLoggedIn()) {
            goToDashboard();
            return;
        }

        TextInputEditText usernameInput = findViewById(R.id.usernameInput);
        TextInputEditText passwordInput = findViewById(R.id.passwordInput);
        MaterialButton loginButton = findViewById(R.id.loginButton);
        TextView errorText = findViewById(R.id.errorText);

        loginButton.setOnClickListener(v -> {
            String username = usernameInput.getText() != null ? usernameInput.getText().toString().trim() : "";
            String password = passwordInput.getText() != null ? passwordInput.getText().toString() : "";

            if (username.isEmpty() || password.isEmpty()) {
                showError(errorText, "Enter both username and password");
                return;
            }

            loginButton.setEnabled(false);
            ApiClient.getService(this).login(new LoginRequest(username, password))
                    .enqueue(new Callback<LoginResponse>() {
                        @Override
                        public void onResponse(Call<LoginResponse> call, Response<LoginResponse> response) {
                            loginButton.setEnabled(true);
                            if (response.isSuccessful() && response.body() != null) {
                                sessionManager.saveSession(response.body().token, response.body().role, username);
                                goToDashboard();
                            } else {
                                showError(errorText, "Invalid username or password");
                            }
                        }

                        @Override
                        public void onFailure(Call<LoginResponse> call, Throwable t) {
                            loginButton.setEnabled(true);
                            showError(errorText, "Could not reach server: " + t.getMessage());
                        }
                    });
        });
    }

    private void showError(TextView errorText, String message) {
        errorText.setText(message);
        errorText.setVisibility(View.VISIBLE);
    }

    private void goToDashboard() {
        startActivity(new Intent(this, DashboardActivity.class));
        finish();
    }
}
