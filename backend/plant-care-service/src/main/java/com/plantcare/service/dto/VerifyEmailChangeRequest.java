package com.plantcare.service.dto;

public class VerifyEmailChangeRequest {
    private String newEmail;
    private String code;

    public VerifyEmailChangeRequest() {}

    public VerifyEmailChangeRequest(String newEmail, String code) {
        this.newEmail = newEmail;
        this.code = code;
    }

    public String getNewEmail() { return newEmail; }
    public void setNewEmail(String newEmail) { this.newEmail = newEmail; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}
