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

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/history")
public class HistoryController {

    @Autowired
    private HistoryRepository historyRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PlantRepository plantRepository;

    private User getCurrentUser() {
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Current user not found"));
    }

    @GetMapping
    public ResponseEntity<?> getHistory() {
        User user = getCurrentUser();
        
        if ("admin".equalsIgnoreCase(user.getRole())) {
            List<History> allHistory = historyRepository.findAllByOrderByDateDescTimeDesc();
            return ResponseEntity.ok(allHistory);
        }

        List<Plant> userPlants = plantRepository.findByUserId(user.getId());
        if (userPlants.isEmpty()) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        List<String> plantIds = userPlants.stream().map(Plant::getId).collect(Collectors.toList());
        List<History> ownHistory = historyRepository.findByPlantIdInOrderByDateDescTimeDesc(plantIds);
        return ResponseEntity.ok(ownHistory);
    }
}
