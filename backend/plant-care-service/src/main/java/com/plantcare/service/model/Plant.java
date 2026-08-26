package com.plantcare.service.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "plants")
public class Plant {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 100)
    private String species;

    @Column(nullable = false, length = 50)
    private String location;

    @Column(nullable = false, length = 50)
    private String room;

    @Column(nullable = false)
    private Integer frequency;

    @Column(name = "watering_frequency", nullable = false)
    private Integer wateringFrequency;

    @Column(name = "last_watered", length = 10)
    private String lastWatered;

    @Column(nullable = false, length = 30)
    private String sunlight;

    // Uploaded photos are stored as base64 data URLs.  A VARCHAR(500) truncates
    // every normal image, so use MySQL LONGTEXT instead.
    @Lob
    @Column(name = "photo_url", columnDefinition = "LONGTEXT")
    private String photoUrl;

    @Column(name = "recommended_water_ml", length = 30)
    private String recommendedWaterMl;

    @Column(length = 30)
    private String humidity;

    @Column(name = "current_streak", nullable = false)
    private Integer currentStreak = 0;

    @Column(name = "best_streak", nullable = false)
    private Integer bestStreak = 0;

    @Column(name = "created_at", nullable = false, length = 10)
    private String createdAt;

    @Column(length = 10)
    private String icon = "🌱";

    @OneToMany(mappedBy = "plant", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<Note> notes = new ArrayList<>();

    public Plant() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSpecies() { return species; }
    public void setSpecies(String species) { this.species = species; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getRoom() { return room; }
    public void setRoom(String room) { this.room = room; }

    public Integer getFrequency() { return frequency; }
    public void setFrequency(Integer frequency) { this.frequency = frequency; }

    public Integer getWateringFrequency() { return wateringFrequency; }
    public void setWateringFrequency(Integer wateringFrequency) { this.wateringFrequency = wateringFrequency; }

    public String getLastWatered() { return lastWatered; }
    public void setLastWatered(String lastWatered) { this.lastWatered = lastWatered; }

    public String getSunlight() { return sunlight; }
    public void setSunlight(String sunlight) { this.sunlight = sunlight; }

    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }

    public String getRecommendedWaterMl() { return recommendedWaterMl; }
    public void setRecommendedWaterMl(String recommendedWaterMl) { this.recommendedWaterMl = recommendedWaterMl; }

    public String getHumidity() { return humidity; }
    public void setHumidity(String humidity) { this.humidity = humidity; }

    public Integer getCurrentStreak() { return currentStreak; }
    public void setCurrentStreak(Integer currentStreak) { this.currentStreak = currentStreak; }

    public Integer getBestStreak() { return bestStreak; }
    public void setBestStreak(Integer bestStreak) { this.bestStreak = bestStreak; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public List<Note> getNotes() { return notes; }
    public void setNotes(List<Note> notes) { this.notes = notes; }
}
