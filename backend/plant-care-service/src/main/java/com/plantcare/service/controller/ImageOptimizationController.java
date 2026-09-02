package com.plantcare.service.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.plantcare.service.service.ImageOptimizationService;

@RestController
@RequestMapping("/api/storage")
public class ImageOptimizationController {

    private final ImageOptimizationService imageOptimizationService;

    public ImageOptimizationController(ImageOptimizationService imageOptimizationService) {
        this.imageOptimizationService = imageOptimizationService;
    }

    @PostMapping("/optimize-image")
    public ResponseEntity<Map<String, Object>> optimizeImage(@RequestParam("image") MultipartFile imageFile) {
        Map<String, Object> response = imageOptimizationService.optimizeAndLabelImage(imageFile);
        return ResponseEntity.ok(response);
    }
}
