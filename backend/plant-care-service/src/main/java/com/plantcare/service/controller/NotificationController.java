package com.plantcare.service.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.plantcare.service.service.NotificationService;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/due")
    public ResponseEntity<List<Map<String, Object>>> getDueReminders(@RequestParam(value = "userId", required = false) String userId) {
        return ResponseEntity.ok(notificationService.getDueReminders(userId));
    }

    @PostMapping("/trigger-reminders")
    public ResponseEntity<Map<String, Object>> triggerReminders() {
        return ResponseEntity.ok(notificationService.triggerDailyCronJob());
    }
}
