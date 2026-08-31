package com.plantcare.service.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FirestoreOptions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;

@Configuration
public class FirestoreConfig {

    @Bean
    public Firestore firestore() {
        try {
            return FirestoreOptions.getDefaultInstance()
                    .toBuilder()
                    .setProjectId("plant-watering-tracker-2026")
                    .setCredentials(GoogleCredentials.getApplicationDefault())
                    .build()
                    .getService();
        } catch (IOException e) {
            // Fallback for environment where default credentials cannot be loaded immediately
            return FirestoreOptions.getDefaultInstance()
                    .toBuilder()
                    .setProjectId("plant-watering-tracker-2026")
                    .build()
                    .getService();
        }
    }
}
