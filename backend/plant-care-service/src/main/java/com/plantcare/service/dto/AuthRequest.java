package com.plantcare.service.dto;

public class AuthRequest {
    private String email;
    private String role;
    private Boolean remember;

    public AuthRequest() {}

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Boolean getRemember() { return remember; }
    public void setRemember(Boolean remember) { this.remember = remember; }
}
