package com.plantcare.service.controller;

import com.plantcare.service.dto.PlantRequest;
import com.plantcare.service.model.History;
import com.plantcare.service.model.Note;
import com.plantcare.service.model.Plant;
import com.plantcare.service.model.User;
import com.plantcare.service.repository.HistoryRepository;
import com.plantcare.service.repository.NoteRepository;
import com.plantcare.service.repository.PlantRepository;
import com.plantcare.service.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/api/plants")
public class PlantController {

    @Autowired
    private PlantRepository plantRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HistoryRepository historyRepository;

    @Autowired
    private NoteRepository noteRepository;

    private User getCurrentUser() {
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Current user not found"));
    }

    private String getFormattedTime() {
        return LocalTime.now().format(DateTimeFormatter.ofPattern("hh:mm a"));
    }

    @GetMapping
    public ResponseEntity<?> getPlants() {
        User user = getCurrentUser();
        if ("admin".equalsIgnoreCase(user.getRole())) {
            return ResponseEntity.ok(plantRepository.findAll());
        }
        return ResponseEntity.ok(plantRepository.findByUserId(user.getId()));
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllPlants() {
        // Return all plants (for admin dashboard / summary)
        return ResponseEntity.ok(plantRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPlantById(@PathVariable String id) {
        User user = getCurrentUser();
        Optional<Plant> optionalPlant = plantRepository.findById(id);
        if (optionalPlant.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Plant plant = optionalPlant.get();
        if (!"admin".equalsIgnoreCase(user.getRole()) && !plant.getUserId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }
        return ResponseEntity.ok(plant);
    }

    @PostMapping
    public ResponseEntity<?> createPlant(@RequestBody PlantRequest plantRequest) {
        User user = getCurrentUser();
        
        Plant plant = new Plant();
        plant.setId(UUID.randomUUID().toString());
        plant.setUserId(user.getId());
        plant.setName(plantRequest.getName().trim());
        plant.setSpecies(plantRequest.getSpecies().trim());
        plant.setLocation(plantRequest.getLocation());
        plant.setRoom(plantRequest.getLocation());
        plant.setFrequency(plantRequest.getFrequency());
        plant.setWateringFrequency(plantRequest.getFrequency());
        plant.setLastWatered(plantRequest.getLastWatered() != null && !plantRequest.getLastWatered().isBlank()
                ? plantRequest.getLastWatered() : null);
        plant.setSunlight(plantRequest.getSunlight());
        plant.setPhotoUrl(plantRequest.getPhotoUrl() != null ? plantRequest.getPhotoUrl() : "");
        plant.setRecommendedWaterMl(plantRequest.getRecommendedWaterMl() != null ? plantRequest.getRecommendedWaterMl() : "");
        plant.setHumidity(plantRequest.getHumidity() != null ? plantRequest.getHumidity() : "");
        plant.setCreatedAt(LocalDate.now().toString());
        plant.setIcon(plantRequest.getIcon() != null ? plantRequest.getIcon() : "🌱");
        
        if (plantRequest.getNotes() != null && !plantRequest.getNotes().trim().isEmpty()) {
            Note note = new Note();
            note.setId(UUID.randomUUID().toString());
            note.setPlant(plant);
            note.setText(plantRequest.getNotes().trim());
            note.setDate(LocalDate.now().toString());
            note.setTime(getFormattedTime());
            plant.setNotes(new ArrayList<>(List.of(note)));
        }
        
        plantRepository.save(plant);

        // If there was a note, record history
        if (!plant.getNotes().isEmpty()) {
            Note note = plant.getNotes().get(0);
            History history = new History(
                UUID.randomUUID().toString(),
                plant.getId(),
                plant.getName(),
                "note",
                note.getDate(),
                note.getTime(),
                null,
                note.getText()
            );
            historyRepository.save(history);
        }

        return ResponseEntity.ok(plant);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePlant(@PathVariable String id, @RequestBody PlantRequest plantRequest) {
        User user = getCurrentUser();
        Optional<Plant> optionalPlant = plantRepository.findById(id);
        if (optionalPlant.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Plant plant = optionalPlant.get();
        if (!"admin".equalsIgnoreCase(user.getRole()) && !plant.getUserId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }

        if (plantRequest.getName() != null) plant.setName(plantRequest.getName().trim());
        if (plantRequest.getSpecies() != null) plant.setSpecies(plantRequest.getSpecies().trim());
        if (plantRequest.getLocation() != null) {
            plant.setLocation(plantRequest.getLocation());
            plant.setRoom(plantRequest.getLocation());
        }
        if (plantRequest.getFrequency() != null) {
            plant.setFrequency(plantRequest.getFrequency());
            plant.setWateringFrequency(plantRequest.getFrequency());
        }
        if (plantRequest.getLastWatered() != null) plant.setLastWatered(plantRequest.getLastWatered().isBlank() ? null : plantRequest.getLastWatered());
        if (plantRequest.getSunlight() != null) plant.setSunlight(plantRequest.getSunlight());
        if (plantRequest.getPhotoUrl() != null) plant.setPhotoUrl(plantRequest.getPhotoUrl());
        if (plantRequest.getRecommendedWaterMl() != null) plant.setRecommendedWaterMl(plantRequest.getRecommendedWaterMl());
        if (plantRequest.getHumidity() != null) plant.setHumidity(plantRequest.getHumidity());
        if (plantRequest.getIcon() != null) plant.setIcon(plantRequest.getIcon());

        plantRepository.save(plant);
        return ResponseEntity.ok(plant);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deletePlant(@PathVariable String id) {
        User user = getCurrentUser();
        Optional<Plant> optionalPlant = plantRepository.findById(id);
        if (optionalPlant.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Plant plant = optionalPlant.get();
        if (!"admin".equalsIgnoreCase(user.getRole()) && !plant.getUserId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }

        historyRepository.deleteByPlantId(id);
        plantRepository.delete(plant);
        return ResponseEntity.ok(true);
    }

    @PostMapping("/{id}/water")
    public ResponseEntity<?> waterPlant(@PathVariable String id) {
        User user = getCurrentUser();
        Optional<Plant> optionalPlant = plantRepository.findById(id);
        if (optionalPlant.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Plant plant = optionalPlant.get();
        if (!"admin".equalsIgnoreCase(user.getRole()) && !plant.getUserId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }

        LocalDate today = LocalDate.now();
        if (historyRepository.existsByPlantIdAndTypeIgnoreCaseAndDate(plant.getId(), "watering", today.toString())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("This plant has already been watered today.");
        }
        boolean wasOnTime = true;
        if (plant.getLastWatered() != null && !plant.getLastWatered().isBlank()) {
            LocalDate lastWateredDate = LocalDate.parse(plant.getLastWatered());
            long daysBetween = ChronoUnit.DAYS.between(lastWateredDate, today);
            wasOnTime = plant.getFrequency() - daysBetween >= 0;
        }
        int currentStreak = wasOnTime ? plant.getCurrentStreak() + 1 : 1;
        int bestStreak = Math.max(plant.getBestStreak(), currentStreak);

        plant.setLastWatered(today.toString());
        plant.setCurrentStreak(currentStreak);
        plant.setBestStreak(bestStreak);

        plantRepository.save(plant);

        History history = new History(
            UUID.randomUUID().toString(),
            plant.getId(),
            plant.getName(),
            "watering",
            today.toString(),
            getFormattedTime(),
            currentStreak,
            null
        );
        historyRepository.save(history);

        return ResponseEntity.ok(plant);
    }

    @PostMapping("/{id}/notes")
    public ResponseEntity<?> addNote(@PathVariable String id, @RequestBody Map<String, String> body) {
        User user = getCurrentUser();
        Optional<Plant> optionalPlant = plantRepository.findById(id);
        if (optionalPlant.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Plant plant = optionalPlant.get();
        if (!"admin".equalsIgnoreCase(user.getRole()) && !plant.getUserId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }

        String text = body.get("text");
        if (text == null || text.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Note text cannot be empty");
        }

        Note note = new Note();
        note.setId(UUID.randomUUID().toString());
        note.setPlant(plant);
        note.setText(text.trim());
        note.setDate(LocalDate.now().toString());
        note.setTime(getFormattedTime());

        noteRepository.save(note);

        History history = new History(
            UUID.randomUUID().toString(),
            plant.getId(),
            plant.getName(),
            "note",
            note.getDate(),
            note.getTime(),
            null,
            text.trim()
        );
        historyRepository.save(history);

        return ResponseEntity.ok(note);
    }
}
