package com.sbims.pos.model;

public class WastageResponse {
    public int id;

    /** PENDING for cashiers (waits for a manager), APPROVED for admins. */
    public String status;
}
