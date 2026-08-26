package com.plantcare.service.controller;

import com.plantcare.service.model.User;
import com.plantcare.service.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

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
}
