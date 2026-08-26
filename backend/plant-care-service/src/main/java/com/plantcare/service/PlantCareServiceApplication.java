package com.plantcare.service;

import com.plantcare.service.model.User;
import com.plantcare.service.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.time.LocalDate;

@SpringBootApplication
public class PlantCareServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(PlantCareServiceApplication.class, args);
    }

    /** Creates the demo administrator once, without overwriting an existing account. */
    @Bean
    CommandLineRunner seedSampleAdmin(UserRepository userRepository) {
        return args -> userRepository.findByEmail("admin@plants.local")
                .orElseGet(() -> userRepository.save(new User(
                        "admin001",
                        "Sample Administrator",
                        "admin@plants.local",
                        "admin",
                        LocalDate.now().toString(),
                        "Active"
                )));
    }
}
