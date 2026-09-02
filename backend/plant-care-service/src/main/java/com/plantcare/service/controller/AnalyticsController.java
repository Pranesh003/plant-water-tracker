package com.plantcare.service.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.plantcare.service.service.BigQueryAnalyticsService;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final BigQueryAnalyticsService bigQueryAnalyticsService;

    public AnalyticsController(BigQueryAnalyticsService bigQueryAnalyticsService) {
        this.bigQueryAnalyticsService = bigQueryAnalyticsService;
    }

    @GetMapping("/bigquery-report")
    public ResponseEntity<Map<String, Object>> getBigQueryReport(@org.springframework.web.bind.annotation.RequestParam(value = "userId", required = false) String userId) {
        return ResponseEntity.ok(bigQueryAnalyticsService.getBigQueryAnalytics(userId));
    }

    @PostMapping("/bigquery-sync")
    public ResponseEntity<Map<String, Object>> triggerBigQuerySync() {
        return ResponseEntity.ok(bigQueryAnalyticsService.triggerSyncNow());
    }
}
