package com.plantcare.service.repository;

import com.plantcare.service.model.History;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistoryRepository extends JpaRepository<History, String> {
    List<History> findByPlantIdInOrderByDateDescTimeDesc(List<String> plantIds);
    List<History> findAllByOrderByDateDescTimeDesc();
    boolean existsByPlantIdAndTypeIgnoreCaseAndDate(String plantId, String type, String date);
    void deleteByPlantId(String plantId);
}
