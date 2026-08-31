package com.plantcare.service.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/species")
public class SpeciesController {

    private List<Map<String, String>> fallbackSearch(String query) {

        List<Map<String, String>> catalogue = List.of(
                Map.of(
                        "name", "Bamboo",
                        "species", "Bambusoideae",
                        "family", "Poaceae",
                        "source", "Built-in catalogue",
                        "icon", "🌿"
                ),
                Map.of(
                        "name", "Lucky Bamboo",
                        "species", "Dracaena sanderiana",
                        "family", "Asparagaceae",
                        "source", "Built-in catalogue",
                        "icon", "🌱"
                ),
                Map.of(
                        "name", "Money Plant",
                        "species", "Epipremnum aureum",
                        "family", "Araceae",
                        "source", "Built-in catalogue",
                        "icon", "🌿"
                ),
                Map.of(
                        "name", "Snake Plant",
                        "species", "Dracaena trifasciata",
                        "family", "Asparagaceae",
                        "source", "Built-in catalogue",
                        "icon", "🌿"
                ),
                Map.of(
                        "name", "Aloe Vera",
                        "species", "Aloe barbadensis miller",
                        "family", "Asphodelaceae",
                        "source", "Built-in catalogue",
                        "icon", "🌵"
                ),
                Map.of(
                        "name", "Peace Lily",
                        "species", "Spathiphyllum wallisii",
                        "family", "Araceae",
                        "source", "Built-in catalogue",
                        "icon", "🌿"
                ),
                Map.of(
                        "name", "Spider Plant",
                        "species", "Chlorophytum comosum",
                        "family", "Asparagaceae",
                        "source", "Built-in catalogue",
                        "icon", "🌿"
                ),
                Map.of(
                        "name", "Areca Palm",
                        "species", "Dypsis lutescens",
                        "family", "Arecaceae",
                        "source", "Built-in catalogue",
                        "icon", "🌴"
                ),
                Map.of(
                        "name", "Jasmine",
                        "species", "Jasminum sambac",
                        "family", "Oleaceae",
                        "source", "Built-in catalogue",
                        "icon", "🌼"
                )
        );

        String lowerQuery = query.toLowerCase(Locale.ROOT);

        return catalogue.stream()
                .filter(item ->
                        item.get("name").toLowerCase(Locale.ROOT).contains(lowerQuery)
                                || item.get("species").toLowerCase(Locale.ROOT).contains(lowerQuery)
                )
                .limit(8)
                .toList();
    }

    @GetMapping("/search")
    public ResponseEntity<?> search(@RequestParam String q) {

        String query = q == null ? "" : q.trim();

        if (query.length() < 2) {
            return ResponseEntity.ok(List.of());
        }

        return ResponseEntity.ok(fallbackSearch(query));
    }
}   