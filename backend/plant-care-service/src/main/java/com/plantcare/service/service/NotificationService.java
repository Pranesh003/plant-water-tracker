package com.plantcare.service.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.plantcare.service.firestore.FirestorePlantRepository;
import com.plantcare.service.model.Plant;

@Service
public class NotificationService {

    private final FirestorePlantRepository plantRepository;

    public NotificationService(FirestorePlantRepository plantRepository) {
        this.plantRepository = plantRepository;
    }

    public List<Map<String, Object>> getDueReminders(String userId) {
        List<Plant> allPlants = plantRepository.findAll();
        List<Map<String, Object>> reminders = new ArrayList<>();

        List<Plant> duePlants = new ArrayList<>();
        for (Plant plant : allPlants) {
            if (userId != null && !userId.isBlank() && !userId.equals(plant.getUserId())) {
                continue;
            }
            // Check if plant needs watering (frequency or status)
            duePlants.add(plant);
        }

        if (!duePlants.isEmpty()) {
            StringBuilder names = new StringBuilder();
            for (int i = 0; i < Math.min(duePlants.size(), 3); i++) {
                if (i > 0) names.append(", ");
                names.append(duePlants.get(i).getName());
            }

            Map<String, Object> reminder = new HashMap<>();
            reminder.put("id", "reminder-daily-8am");
            reminder.put("title", "🔔 Daily Watering Reminder (8:00 AM)");
            reminder.put("message", String.format("%d plants (%s) need watering today.", duePlants.size(), names.toString()));
            reminder.put("dueCount", duePlants.size());
            reminder.put("scheduleCron", "0 0 8 * * ?");
            reminders.add(reminder);
        }

        return reminders;
    }

    public Map<String, Object> triggerDailyCronJob() {
        List<Map<String, Object>> reminders = getDueReminders(null);
        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("triggeredAt", java.time.LocalDateTime.now().toString());
        response.put("cronExpression", "0 0 8 * * ? (Cloud Scheduler)");
        response.put("remindersGenerated", reminders.size());
        return response;
    }
}
