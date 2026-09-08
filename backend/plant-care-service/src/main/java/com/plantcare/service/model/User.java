package com.plantcare.service.model;

public class User {

    private String id;
    private String name;
    private String email;
    private String role;
    private String createdDate;
    private String status;

    private String resetToken;
    private Long resetTokenExpiry;

    private String emailChangeNewEmail;
    private String emailChangeCode;
    private Long emailChangeCodeExpiry;

    public User() {}

    public User(String id, String name, String email, String role, String createdDate, String status) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.createdDate = createdDate;
        this.status = status;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getCreatedDate() { return createdDate; }
    public void setCreatedDate(String createdDate) { this.createdDate = createdDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getResetToken() { return resetToken; }
    public void setResetToken(String resetToken) { this.resetToken = resetToken; }

    public Long getResetTokenExpiry() { return resetTokenExpiry; }
    public void setResetTokenExpiry(Long resetTokenExpiry) { this.resetTokenExpiry = resetTokenExpiry; }

    public String getEmailChangeNewEmail() { return emailChangeNewEmail; }
    public void setEmailChangeNewEmail(String emailChangeNewEmail) { this.emailChangeNewEmail = emailChangeNewEmail; }

    public String getEmailChangeCode() { return emailChangeCode; }
    public void setEmailChangeCode(String emailChangeCode) { this.emailChangeCode = emailChangeCode; }

    public Long getEmailChangeCodeExpiry() { return emailChangeCodeExpiry; }
    public void setEmailChangeCodeExpiry(Long emailChangeCodeExpiry) { this.emailChangeCodeExpiry = emailChangeCodeExpiry; }
}
