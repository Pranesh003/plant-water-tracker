package com.plantcare.service.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.plantcare.service.service.SecretManagerConfigService;

@RestController
@RequestMapping("/api/secrets")
public class SecretManagerController {

    private final SecretManagerConfigService secretManagerConfigService;

    public SecretManagerController(SecretManagerConfigService secretManagerConfigService) {
        this.secretManagerConfigService = secretManagerConfigService;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getSecretStatus() {
        return ResponseEntity.ok(secretManagerConfigService.getSecretManagerStatus());
    }
}
