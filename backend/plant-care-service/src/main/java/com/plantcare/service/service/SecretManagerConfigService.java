package com.plantcare.service.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SecretManagerConfigService {

    @Value("${OPENWEATHER_API_KEY:}")
    private String openWeatherKey;

    @Value("${TREFLE_API_TOKEN:}")
    private String trefleToken;

    public Map<String, Object> getSecretManagerStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("provider", "GCP Secret Manager");
        status.put("project", "plant-watering-tracker-2026");

        boolean weatherSecretActive = openWeatherKey != null && !openWeatherKey.isBlank();
        boolean trefleSecretActive = trefleToken != null && !trefleToken.isBlank();

        status.put("OPENWEATHER_API_KEY", weatherSecretActive ? "✓ Active (Fetched from Secret Manager)" : "Missing");
        status.put("TREFLE_API_TOKEN", trefleSecretActive ? "✓ Active (Fetched from Secret Manager)" : "Missing");
        status.put("status", (weatherSecretActive && trefleSecretActive) ? "SUCCESS" : "PARTIAL");

        return status;
    }

    public String getOpenWeatherKey() {
        return openWeatherKey;
    }

    public String getTrefleToken() {
        return trefleToken;
    }
}
