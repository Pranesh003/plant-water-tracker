package com.plantcare.service.model;

import java.util.ArrayList;
import java.util.List;

public class Plant {

    private String id;
    private String userId;
    private String name;
    private String species;
    private String location;
    private String room;
    private Integer frequency;
    private Integer wateringFrequency;
    private String lastWatered;
    private String sunlight;
    private String photoUrl;
    private String recommendedWaterMl;
    private String humidity;
    private Integer currentStreak = 0;
    private Integer bestStreak = 0;
    private String createdAt;
    private String icon = "🌱";

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
