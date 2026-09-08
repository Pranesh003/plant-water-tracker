package com.plantcare.service.controller;

import com.plantcare.service.config.JwtUtil;
import com.plantcare.service.dto.EmailChangeRequest;
import com.plantcare.service.dto.VerifyEmailChangeRequest;
import com.plantcare.service.firestore.FirestoreUserRepository;
import com.plantcare.service.model.User;
import com.plantcare.service.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private FirestoreUserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private EmailService emailService;

    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        // Admin or authenticated user check
        String currentEmail = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Optional<User> currentUserOpt = userRepository.findByEmail(currentEmail);
        
        if (currentUserOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }
        
        User currentUser = currentUserOpt.get();
        if ("admin".equalsIgnoreCase(currentUser.getRole())) {
            // The administrator is managed through the admin profile, not the user list.
            List<User> users = userRepository.findByRoleIgnoreCase("user");
            return ResponseEntity.ok(users);
        } else {
            // Non-admin can only see themselves
            return ResponseEntity.ok(List.of(currentUser));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable String id) {
        String currentEmail = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Optional<User> currentUserOpt = userRepository.findByEmail(currentEmail);
        
        if (currentUserOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }
        
        User currentUser = currentUserOpt.get();
        if (!"admin".equalsIgnoreCase(currentUser.getRole()) && !currentUser.getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }

        Optional<User> targetUser = userRepository.findById(id);
        if (targetUser.isPresent()) {
            return ResponseEntity.ok(targetUser.get());
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable String id, @RequestBody User userData) {
        String currentEmail = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Optional<User> currentUserOpt = userRepository.findByEmail(currentEmail);
        
        if (currentUserOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }
        
        User currentUser = currentUserOpt.get();
        boolean isAdmin = "admin".equalsIgnoreCase(currentUser.getRole());
        
        if (!isAdmin && !currentUser.getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }

        Optional<User> targetUserOpt = userRepository.findById(id);
        if (targetUserOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

        User targetUser = targetUserOpt.get();
        if (userData.getName() != null) targetUser.setName(userData.getName().trim());
        if (userData.getEmail() != null) targetUser.setEmail(userData.getEmail().trim().toLowerCase());
        
        // Only Admin can change role and status
        if (isAdmin) {
            if (userData.getRole() != null) targetUser.setRole(userData.getRole().trim());
            if (userData.getStatus() != null) targetUser.setStatus(userData.getStatus().trim());
        }

        userRepository.save(targetUser);
        return ResponseEntity.ok(targetUser);
    }

    @PostMapping("/request-email-change")
    public ResponseEntity<?> requestEmailChange(@RequestBody EmailChangeRequest request) {
        String currentEmail = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Optional<User> currentUserOpt = userRepository.findByEmail(currentEmail);
        
        if (currentUserOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        
        String newEmail = request.getNewEmail();
        if (newEmail == null || newEmail.trim().isEmpty() || !newEmail.contains("@")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please provide a valid new email address."));
        }
        
        String cleanNewEmail = newEmail.trim().toLowerCase();
        if (cleanNewEmail.equalsIgnoreCase(currentEmail.toLowerCase())) {
            return ResponseEntity.badRequest().body(Map.of("error", "New email address must be different from current email."));
        }

        Optional<User> existing = userRepository.findByEmail(cleanNewEmail);
        if (existing.isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "This email address is already registered to another account."));
        }

        User user = currentUserOpt.get();
        String verificationCode = String.format("%06d", (int) (Math.random() * 900000) + 100000);
        user.setEmailChangeNewEmail(cleanNewEmail);
        user.setEmailChangeCode(verificationCode);
        user.setEmailChangeCodeExpiry(System.currentTimeMillis() + 15 * 60 * 1000);
        userRepository.save(user);

        // Send 6-digit OTP code to new email, and security alert notification to old email
        emailService.sendEmailChangeVerificationCode(cleanNewEmail, verificationCode);
        emailService.sendEmailChangeSecurityAlert(user.getEmail(), cleanNewEmail);

        Map<String, String> response = new HashMap<>();
        response.put("message", "A 6-digit verification code has been sent to " + cleanNewEmail + ", and a security alert notification has been sent to your current email.");
        response.put("newEmail", cleanNewEmail);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-email-change")
    public ResponseEntity<?> verifyEmailChange(@RequestBody VerifyEmailChangeRequest request) {
        String currentEmail = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Optional<User> currentUserOpt = userRepository.findByEmail(currentEmail);
        
        if (currentUserOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        
        User user = currentUserOpt.get();
        String newEmail = request.getNewEmail();
        String code = request.getCode();

        if (newEmail == null || newEmail.trim().isEmpty() || code == null || code.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "New email and verification code are required."));
        }

        String cleanNewEmail = newEmail.trim().toLowerCase();
        if (user.getEmailChangeNewEmail() == null || !user.getEmailChangeNewEmail().equalsIgnoreCase(cleanNewEmail)) {
            return ResponseEntity.badRequest().body(Map.of("error", "No pending email change request found for this email."));
        }

        if (user.getEmailChangeCode() == null || !user.getEmailChangeCode().equals(code.trim())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid verification code. Please check your email and try again."));
        }

        if (user.getEmailChangeCodeExpiry() != null && System.currentTimeMillis() > user.getEmailChangeCodeExpiry()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Verification code has expired. Please request a new code."));
        }

        // Update email
        user.setEmail(cleanNewEmail);
        user.setEmailChangeNewEmail(null);
        user.setEmailChangeCode(null);
        user.setEmailChangeCodeExpiry(null);
        userRepository.save(user);

        // Generate fresh JWT token for updated email
        String newToken = jwtUtil.generateToken(user.getEmail(), user.getRole());

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Email address updated successfully.");
        response.put("user", user);
        response.put("token", newToken);
        return ResponseEntity.ok(response);
    }
}
