package com.plantcare.service.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Locale;

@RestController
@RequestMapping("/api/species")
public class SpeciesController {
    private static final String TREFLE_SEARCH_URL = "https://trefle.io/api/v1/species/search";

    @Value("${trefle.api.token:}")
    private String trefleToken;

    @Autowired
    private ObjectMapper objectMapper;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .build();

    private List<Map<String, String>> fallbackSearch(String query) {
        List<Map<String, String>> catalogue = List.of(
                Map.of("name", "Bamboo", "species", "Bambusoideae", "family", "Poaceae", "source", "Built-in catalogue", "icon", "🌿"),
                Map.of("name", "Lucky Bamboo", "species", "Dracaena sanderiana", "family", "Asparagaceae", "source", "Built-in catalogue", "icon", "🌱"),
                Map.of("name", "Money Plant", "species", "Epipremnum aureum", "family", "Araceae", "source", "Built-in catalogue", "icon", "🌿"),
                Map.of("name", "Snake Plant", "species", "Dracaena trifasciata", "family", "Asparagaceae", "source", "Built-in catalogue", "icon", "🌿"),
                Map.of("name", "Aloe Vera", "species", "Aloe barbadensis miller", "family", "Asphodelaceae", "source", "Built-in catalogue", "icon", "🌵"),
                Map.of("name", "Peace Lily", "species", "Spathiphyllum wallisii", "family", "Araceae", "source", "Built-in catalogue", "icon", "🌿"),
                Map.of("name", "Spider Plant", "species", "Chlorophytum comosum", "family", "Asparagaceae", "source", "Built-in catalogue", "icon", "🌿"),
                Map.of("name", "Areca Palm", "species", "Dypsis lutescens", "family", "Arecaceae", "source", "Built-in catalogue", "icon", "🌴"),
                Map.of("name", "Jasmine", "species", "Jasminum sambac", "family", "Oleaceae", "source", "Built-in catalogue", "icon", "🌼"));
        String lowerQuery = query.toLowerCase(Locale.ROOT);
        return catalogue.stream()
                .filter(item -> item.get("name").toLowerCase(Locale.ROOT).contains(lowerQuery)
                        || item.get("species").toLowerCase(Locale.ROOT).contains(lowerQuery))
                .limit(8)
                .toList();
    }

    @GetMapping("/search")
    public ResponseEntity<?> search(@RequestParam String q) {
        String query = q == null ? "" : q.trim();
        if (query.length() < 2) return ResponseEntity.ok(List.of());
        if (trefleToken == null || trefleToken.isBlank()) {
            return ResponseEntity.ok(fallbackSearch(query));
        }

        try {
            String url = TREFLE_SEARCH_URL + "?q=" + URLEncoder.encode(query, StandardCharsets.UTF_8)
                    + "&token=" + URLEncoder.encode(trefleToken, StandardCharsets.UTF_8);
            HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(12))
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                        .body(Map.of("message", "Trefle plant search is temporarily unavailable."));
            }

            JsonNode data = objectMapper.readTree(response.body()).path("data");
            List<Map<String, String>> results = new ArrayList<>();
            for (JsonNode species : data) {
                String scientificName = species.path("scientific_name").asText("");
                String commonName = species.path("common_name").asText("");
                String name = !commonName.isBlank() ? commonName : scientificName;
                if (name.isBlank()) continue;
                Map<String, String> result = new LinkedHashMap<>();
                result.put("name", name);
                result.put("species", scientificName.isBlank() ? name : scientificName);
                result.put("family", species.path("family").asText(""));
                result.put("source", "Trefle");
                result.put("icon", "🌿");
                results.add(result);
                if (results.size() == 8) break;
            }
            return ResponseEntity.ok(results);
        } catch (Exception exception) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("message", "Unable to search Trefle right now."));
        }
    }
}
