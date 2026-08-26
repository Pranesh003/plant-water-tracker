package com.plantcare.service.model;

import jakarta.persistence.*;

@Entity
@Table(name = "history")
public class History {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "plant_id", nullable = false, length = 36)
    private String plantId;

    @Column(name = "plant_name", nullable = false, length = 100)
    private String plantName;

    @Column(nullable = false, length = 20)
    private String type; // 'watering' or 'note'

    @Column(nullable = false, length = 10)
    private String date;

    @Column(nullable = false, length = 20)
    private String time;

    @Column(nullable = true)
    private Integer streak;

    @Column(nullable = true, columnDefinition = "TEXT")
    private String text;

    public History() {}

    public History(String id, String plantId, String plantName, String type, String date, String time, Integer streak, String text) {
        this.id = id;
        this.plantId = plantId;
        this.plantName = plantName;
        this.type = type;
        this.date = date;
        this.time = time;
        this.streak = streak;
        this.text = text;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPlantId() { return plantId; }
    public void setPlantId(String plantId) { this.plantId = plantId; }

    public String getPlantName() { return plantName; }
    public void setPlantName(String plantName) { this.plantName = plantName; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }

    public Integer getStreak() { return streak; }
    public void setStreak(Integer streak) { this.streak = streak; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
}
