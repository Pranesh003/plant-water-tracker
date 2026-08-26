package com.plantcare.service.dto;

public class PlantRequest {
    private String name;
    private String species;
    private String location;
    private Integer frequency;
    private String lastWatered;
    private String sunlight;
    private String photoUrl;
    private String recommendedWaterMl;
    private String humidity;
    private String icon;
    private String notes;

    public PlantRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSpecies() { return species; }
    public void setSpecies(String species) { this.species = species; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public Integer getFrequency() { return frequency; }
    public void setFrequency(Integer frequency) { this.frequency = frequency; }

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

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
