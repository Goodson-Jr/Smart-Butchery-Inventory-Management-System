package com.sbims.pos.model;

public class LoginResponse {
    public String token;
    public int userId;
    public String role; // "admin" | "cashier" — matches users.role in schema.sql
}
