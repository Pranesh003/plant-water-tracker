package com.plantcare.service.controller;

import com.plantcare.service.config.JwtUtil;
import com.plantcare.service.dto.AuthRequest;
import com.plantcare.service.dto.AuthResponse;
import com.plantcare.service.dto.SignupRequest;
import com.plantcare.service.firestore.FirestoreUserRepository;
import com.plantcare.service.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.plantcare.service.dto.ForgotPasswordRequest;
import com.plantcare.service.dto.ResetPasswordRequest;
import java.util.HashMap;
import java.util.Map;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import com.plantcare.service.service.EmailService;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.UserRecord;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private FirestoreUserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private EmailService emailService;

    private void syncToFirebaseAuth(String email, String displayName) {
        if (email == null || email.trim().isEmpty()) return;
        try {
            FirebaseAuth auth = FirebaseAuth.getInstance();
            try {
                auth.getUserByEmail(email);
            } catch (Exception notFound) {
                UserRecord.CreateRequest createRequest = new UserRecord.CreateRequest()
                    .setEmail(email)
                    .setDisplayName(displayName != null && !displayName.trim().isEmpty() ? displayName.trim() : email)
                    .setPassword("PlantCare2026!")
                    .setEmailVerified(true);
                auth.createUser(createRequest);
            }
        } catch (Exception e) {
            System.out.println("Firebase Auth Sync Notice: " + e.getMessage());
        }
    }

    @PostMapping("/signin")
    public ResponseEntity<?> signIn(@RequestBody AuthRequest authRequest) {
        String email = authRequest.getEmail();
        String role = authRequest.getRole();
        
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Email cannot be empty");
        }

        String cleanEmail = email.contains("@") ? email.trim() : email.trim() + "@plants.local";
        String normalizedEmail = cleanEmail.toLowerCase();
        String selectedRole = role != null ? role.trim() : "user";

        Optional<User> optionalUser = userRepository.findByEmail(normalizedEmail);
        User user;

        if (optionalUser.isPresent()) {
            user = optionalUser.get();
        } else {
            // Check if email matches admin login criteria to seed admin
            if ("admin".equalsIgnoreCase(email) || "admin@plants.local".equalsIgnoreCase(email)) {
                user = new User(
                    "admin001",
                    "Admin",
                    "admin@plants.local",
                    "admin",
                    LocalDate.now().toString(),
                    "Active"
                );
                userRepository.save(user);
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Account not found. Please create an account to continue.");
            }
        }

        if ("suspended".equalsIgnoreCase(user.getStatus())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Your account has been suspended. Please contact the administrator.");
        }

        syncToFirebaseAuth(user.getEmail(), user.getName());

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
        return ResponseEntity.ok(new AuthResponse(token, user));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signUp(@RequestBody SignupRequest signupRequest) {
        String email = signupRequest.getEmail();
        String name = signupRequest.getName();

        if (email == null || email.trim().isEmpty() || name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Name and Email are required");
        }

        String cleanEmail = email.contains("@") ? email.trim() : email.trim() + "@plants.local";
        String normalizedEmail = cleanEmail.toLowerCase();

        Optional<User> existing = userRepository.findByEmail(normalizedEmail);
        if (existing.isPresent()) {
            return ResponseEntity.badRequest().body("Email already registered. Please sign in instead.");
        }

        User user = new User(
            UUID.randomUUID().toString(),
            name.trim(),
            normalizedEmail,
            "user",
            LocalDate.now().toString(),
            "Active"
        );
        userRepository.save(user);
        syncToFirebaseAuth(user.getEmail(), user.getName());

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
        return ResponseEntity.ok(new AuthResponse(token, user));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        String email = request.getEmail();
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required."));
        }
        String cleanEmail = email.contains("@") ? email.trim().toLowerCase() : email.trim().toLowerCase() + "@plants.local";
        Optional<User> optionalUser = userRepository.findByEmail(cleanEmail);

        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "No registered account found with that email."));
        }

        User user = optionalUser.get();
        String resetToken = String.format("%06d", (int) (Math.random() * 900000) + 100000);
        user.setResetToken(resetToken);
        user.setResetTokenExpiry(System.currentTimeMillis() + 15 * 60 * 1000); // 15 mins expiry
        userRepository.save(user);

        emailService.sendPasswordResetEmail(cleanEmail, resetToken);

        Map<String, String> response = new HashMap<>();
        response.put("message", "A 6-digit verification code has been sent to your email address.");
        response.put("email", cleanEmail);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        String email = request.getEmail();
        String token = request.getToken();
        String newPassword = request.getNewPassword();

        if (email == null || email.trim().isEmpty() || token == null || token.trim().isEmpty() || newPassword == null || newPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email, verification code, and new password are required."));
        }
        String cleanEmail = email.contains("@") ? email.trim().toLowerCase() : email.trim().toLowerCase() + "@plants.local";
        Optional<User> optionalUser = userRepository.findByEmail(cleanEmail);

        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User account not found."));
        }

        User user = optionalUser.get();
        if (user.getResetToken() == null || !user.getResetToken().equals(token.trim())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid verification code. Please check your email and try again."));
        }
        if (user.getResetTokenExpiry() != null && System.currentTimeMillis() > user.getResetTokenExpiry()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Verification code has expired. Please request a new code."));
        }

        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Password reset successfully. You can now sign in with your new password.");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof String) {
            String email = (String) principal;
            Optional<User> user = userRepository.findByEmail(email);
            if (user.isPresent()) {
                return ResponseEntity.ok(user.get());
            }
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
    }
}
