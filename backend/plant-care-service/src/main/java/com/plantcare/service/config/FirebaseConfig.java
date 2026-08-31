package com.plantcare.service.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;

@Configuration
public class FirebaseConfig {

    @Bean
    public FirebaseAuth firebaseAuth() {
        if (FirebaseApp.getApps().isEmpty()) {
            try {
                FirebaseOptions options = FirebaseOptions.builder()
                        .setProjectId("plant-watering-tracker-2026")
                        .setCredentials(GoogleCredentials.getApplicationDefault())
                        .build();
                FirebaseApp.initializeApp(options);
            } catch (IOException e) {
                FirebaseOptions options = FirebaseOptions.builder()
                        .setProjectId("plant-watering-tracker-2026")
                        .build();
                FirebaseApp.initializeApp(options);
            }
        }
        return FirebaseAuth.getInstance();
    }
}
