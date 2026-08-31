package com.plantcare.controller;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/firestore")
public class FirestoreTestController {

    private final Firestore firestore;

    public FirestoreTestController(Firestore firestore) {
        this.firestore = firestore;
    }

    @GetMapping("/test")
    public ResponseEntity<?> testFirestore() {
        try {
            Map<String, Object> data = new HashMap<>();
            data.put("message", "Firestore connection successful");
            data.put("project", "plant-watering-tracker-2026");

            DocumentReference document = firestore
                    .collection("system")
                    .document("connection-test");

            document.set(data).get();

            return ResponseEntity.ok(data);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return ResponseEntity
                    .internalServerError()
                    .body("Firestore operation interrupted");

        } catch (ExecutionException e) {
            return ResponseEntity
                    .internalServerError()
                    .body("Firestore error: " + e.getMessage());
        }
    }
}
