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

    public boolean sendEmailChangeVerificationCode(String newEmail, String code) {
        System.out.println("==================================================");
        System.out.println("EMAIL CHANGE VERIFICATION CODE FOR: " + newEmail);
        System.out.println("VERIFICATION CODE: " + code);
        System.out.println("==================================================");

        if (mailSender != null && fromEmail != null && !fromEmail.trim().isEmpty()) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail.trim());
                message.setTo(newEmail.trim());
                message.setSubject("Plant Care Tracker - Email Change Verification Code");
                message.setText("Hello,\n\nYour 6-digit email change verification code is: " + code + "\n\nThis code will expire in 15 minutes.\n\nBest regards,\nPlant Care Tracker Team");
                mailSender.send(message);
                System.out.println("Email change verification code sent successfully to " + newEmail);
                return true;
            } catch (Exception e) {
                System.err.println("Failed to send email change verification code via SMTP: " + e.getMessage());
            }
        }
        return false;
    }

    public boolean sendEmailChangeSecurityAlert(String oldEmail, String newEmail) {
        System.out.println("==================================================");
        System.out.println("SECURITY ALERT: EMAIL CHANGE INITIATED FOR: " + oldEmail);
        System.out.println("NEW TARGET EMAIL: " + newEmail);
        System.out.println("==================================================");

        if (mailSender != null && fromEmail != null && !fromEmail.trim().isEmpty()) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail.trim());
                message.setTo(oldEmail.trim());
                message.setSubject("SECURITY ALERT: Plant Care Tracker Account Email Change Requested");
                message.setText("Hello,\n\nWe received a request to change the email address for your Plant Care Tracker account from " + oldEmail + " to " + newEmail + ".\n\nIf you initiated this change, please enter the 6-digit verification code sent to your new email.\n\nIF YOU DID NOT REQUEST THIS CHANGE, please secure your account immediately or reset your password.\n\nBest regards,\nPlant Care Tracker Security Team");
                mailSender.send(message);
                System.out.println("Security alert email sent successfully to " + oldEmail);
                return true;
            } catch (Exception e) {
                System.err.println("Failed to send security alert email via SMTP: " + e.getMessage());
            }
        }
        return false;
    }
}
