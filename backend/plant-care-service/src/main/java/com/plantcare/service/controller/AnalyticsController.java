package com.plantcare.service.controller;

import com.plantcare.service.model.History;
import com.plantcare.service.model.Plant;
import com.plantcare.service.model.User;
import com.plantcare.service.repository.HistoryRepository;
import com.plantcare.service.repository.PlantRepository;
import com.plantcare.service.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @Autowired
    private PlantRepository plantRepository;

    @Autowired
    private HistoryRepository historyRepository;

    @Autowired
    private UserRepository userRepository;

    private User getCurrentUser() {
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Current user not found"));
    }

    private String getWateringStatus(String lastWatered, int frequency) {
        try {
            LocalDate last = LocalDate.parse(lastWatered);
            LocalDate today = LocalDate.now();
            long days = ChronoUnit.DAYS.between(last, today);
            long remaining = frequency - days;
            if (remaining < 0) return "Overdue";
            if (remaining <= 1) return "Water Soon";
            return "Safe";
        } catch (Exception e) {
            return "Safe";
        }
    }

    private int calculateWateringConsistency(Plant plant, List<History> history) {
        long wateringsCount = history.stream()
                .filter(h -> h.getPlantId().equals(plant.getId()) && "watering".equalsIgnoreCase(h.getType()))
                .count();
        if (wateringsCount == 0) return 0;
        
        String status = getWateringStatus(plant.getLastWatered(), plant.getFrequency());
        int statusScore = "Overdue".equals(status) ? 72 : "Water Soon".equals(status) ? 88 : 96;
        
        int currentStreak = plant.getCurrentStreak() != null ? plant.getCurrentStreak() : 0;
        double streakAdder = Math.min(currentStreak, 20) / 5.0;
        
        return (int) Math.min(100, Math.round(statusScore + streakAdder));
    }

    private Map<String, Object> computeAnalytics(List<Plant> plants, List<History> history) {
        Map<String, Integer> statuses = new HashMap<>();
        statuses.put("Safe", 0);
        statuses.put("Water Soon", 0);
        statuses.put("Overdue", 0);

        for (Plant plant : plants) {
            String status = getWateringStatus(plant.getLastWatered(), plant.getFrequency());
            statuses.put(status, statuses.getOrDefault(status, 0) + 1);
        }

        long totalWaterings = history.stream()
                .filter(h -> "watering".equalsIgnoreCase(h.getType()))
                .count();

        int bestStreak = plants.stream()
                .mapToInt(p -> p.getBestStreak() != null ? p.getBestStreak() : 0)
                .max()
                .orElse(0);

        int currentActiveStreak = plants.stream()
                .mapToInt(p -> p.getCurrentStreak() != null ? p.getCurrentStreak() : 0)
                .max()
                .orElse(0);

        double totalConsistency = 0;
        Plant topPlant = null;
        int topConsistency = -1;

        for (Plant plant : plants) {
            int consistency = calculateWateringConsistency(plant, history);
            totalConsistency += consistency;
            if (consistency > topConsistency) {
                topConsistency = consistency;
                topPlant = plant;
            }
        }

        int averageConsistency = plants.isEmpty() ? 0 : (int) Math.round(totalConsistency / plants.size());

        Map<String, Object> result = new HashMap<>();
        result.put("statuses", statuses);
        result.put("totalWaterings", totalWaterings);
        result.put("bestStreak", bestStreak);
        result.put("currentActiveStreak", currentActiveStreak);
        result.put("consistency", averageConsistency);
        
        if (topPlant != null) {
            // Include top plant with its consistency attached
            Map<String, Object> topPlantMap = new HashMap<>();
            topPlantMap.put("id", topPlant.getId());
            topPlantMap.put("name", topPlant.getName());
            topPlantMap.put("species", topPlant.getSpecies());
            topPlantMap.put("location", topPlant.getLocation());
            topPlantMap.put("room", topPlant.getRoom());
            topPlantMap.put("frequency", topPlant.getFrequency());
            topPlantMap.put("wateringFrequency", topPlant.getWateringFrequency());
            topPlantMap.put("lastWatered", topPlant.getLastWatered());
            topPlantMap.put("sunlight", topPlant.getSunlight());
            topPlantMap.put("photoUrl", topPlant.getPhotoUrl());
            topPlantMap.put("recommendedWaterMl", topPlant.getRecommendedWaterMl());
            topPlantMap.put("humidity", topPlant.getHumidity());
            topPlantMap.put("currentStreak", topPlant.getCurrentStreak());
            topPlantMap.put("bestStreak", topPlant.getBestStreak());
            topPlantMap.put("createdAt", topPlant.getCreatedAt());
            topPlantMap.put("icon", topPlant.getIcon());
            topPlantMap.put("consistency", topConsistency);
            result.put("topPlant", topPlantMap);
        } else {
            result.put("topPlant", null);
        }

        return result;
    }

    @GetMapping
    public ResponseEntity<?> getAnalytics() {
        User user = getCurrentUser();
        List<Plant> plants = plantRepository.findByUserId(user.getId());
        List<String> plantIds = plants.stream().map(Plant::getId).collect(Collectors.toList());
        List<History> history = plantIds.isEmpty() ? Collections.emptyList() : historyRepository.findByPlantIdInOrderByDateDescTimeDesc(plantIds);
        
        return ResponseEntity.ok(computeAnalytics(plants, history));
    }

    @GetMapping("/admin")
    public ResponseEntity<?> getAdminAnalytics() {
        List<Plant> plants = plantRepository.findAll();
        List<History> history = historyRepository.findAll();
        return ResponseEntity.ok(computeAnalytics(plants, history));
    }
}
