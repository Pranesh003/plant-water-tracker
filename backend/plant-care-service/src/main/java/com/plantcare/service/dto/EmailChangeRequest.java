package com.plantcare.service.dto;

public class EmailChangeRequest {
    private String newEmail;

    public EmailChangeRequest() {}

    public EmailChangeRequest(String newEmail) {
        this.newEmail = newEmail;
    }

    public String getNewEmail() { return newEmail; }
    public void setNewEmail(String newEmail) { this.newEmail = newEmail; }
}
