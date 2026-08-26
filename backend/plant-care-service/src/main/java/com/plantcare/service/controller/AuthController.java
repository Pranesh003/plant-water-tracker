package com.plantcare.service.controller;

import com.plantcare.service.config.JwtUtil;
import com.plantcare.service.dto.AuthRequest;
import com.plantcare.service.dto.AuthResponse;
import com.plantcare.service.dto.SignupRequest;
import com.plantcare.service.model.User;
import com.plantcare.service.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

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
            if (!user.getRole().equalsIgnoreCase(selectedRole)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials for the selected role.");
            }
        } else {
            // If it's admin, and matches admin login criteria, seed admin
            if ("admin".equalsIgnoreCase(selectedRole) && ("admin".equalsIgnoreCase(email) || "admin@plants.local".equalsIgnoreCase(email))) {
                user = new User(
                    "admin001",
                    "Admin",
                    "admin@plants.local",
                    "admin",
                    LocalDate.now().toString(),
                    "Active"
                );
                userRepository.save(user);
            } else if ("user".equalsIgnoreCase(selectedRole)) {
                // Auto create user if they don't exist yet (matching mock implementation)
                String namePart = cleanEmail.split("@")[0];
                String name = namePart.replaceAll("[._-]", " ");
                // capitalize words
                StringBuilder capitalizedName = new StringBuilder();
                for (String word : name.split(" ")) {
                    if (!word.isEmpty()) {
                        capitalizedName.append(Character.toUpperCase(word.charAt(0)))
                                         .append(word.substring(1))
                                         .append(" ");
                    }
                }
                user = new User(
                    UUID.randomUUID().toString(),
                    capitalizedName.toString().trim(),
                    normalizedEmail,
                    "user",
                    LocalDate.now().toString(),
                    "Active"
                );
                userRepository.save(user);
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials for the selected role.");
            }
        }

        if ("suspended".equalsIgnoreCase(user.getStatus())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Your account has been suspended. Please contact the administrator.");
        }

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

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
        return ResponseEntity.ok(new AuthResponse(token, user));
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
