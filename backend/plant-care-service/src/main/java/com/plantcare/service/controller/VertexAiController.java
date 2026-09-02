package com.plantcare.service.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.plantcare.service.service.VertexAiService;

@RestController
@RequestMapping("/api/vertex-ai")
public class VertexAiController {

    private final VertexAiService vertexAiService;

    public VertexAiController(VertexAiService vertexAiService) {
        this.vertexAiService = vertexAiService;
    }

    @PostMapping(value = "/diagnose-disease", consumes = "multipart/form-data")
    public ResponseEntity<Map<String, Object>> diagnoseDisease(
            @RequestPart(value = "image", required = false) MultipartFile imageFile
    ) {
        return ResponseEntity.ok(vertexAiService.diagnoseDisease(imageFile));
    }

    @PostMapping(value = "/identify-species", consumes = "multipart/form-data")
    public ResponseEntity<Map<String, Object>> identifySpecies(
            @RequestPart(value = "image", required = false) MultipartFile imageFile,
            @RequestParam(value = "hint", required = false) String hint
    ) {
        return ResponseEntity.ok(vertexAiService.identifySpecies(imageFile, hint));
    }
}
