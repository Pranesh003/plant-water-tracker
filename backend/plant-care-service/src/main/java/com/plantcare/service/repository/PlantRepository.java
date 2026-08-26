package com.plantcare.service.repository;

import com.plantcare.service.model.Plant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlantRepository extends JpaRepository<Plant, String> {
    List<Plant> findByUserId(String userId);
}
