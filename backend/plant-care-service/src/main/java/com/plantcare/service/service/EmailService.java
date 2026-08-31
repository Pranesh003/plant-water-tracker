package com.plantcare.service.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    public boolean sendPasswordResetEmail(String toEmail, String code) {
        System.out.println("==================================================");
        System.out.println("PASSWORD RESET CODE GENERATED FOR: " + toEmail);
        System.out.println("VERIFICATION CODE: " + code);
        System.out.println("==================================================");

        if (mailSender != null && fromEmail != null && !fromEmail.trim().isEmpty()) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail.trim());
                message.setTo(toEmail.trim());
                message.setSubject("Plant Care Tracker - Password Reset Verification Code");
                message.setText("Hello,\n\nYour 6-digit password reset verification code is: " + code + "\n\nThis code will expire in 15 minutes.\n\nBest regards,\nPlant Care Tracker Team");
                mailSender.send(message);
                System.out.println("Password reset email sent successfully to " + toEmail);
                return true;
            } catch (Exception e) {
                System.err.println("Failed to send email via SMTP: " + e.getMessage());
            }
        } else {
            System.out.println("SMTP credentials (SPRING_MAIL_USERNAME) not configured. Email logged to console.");
        }
        return false;
    }
}
