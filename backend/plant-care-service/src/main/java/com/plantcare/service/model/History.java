package com.plantcare.service.model;

public class History {

    private String id;
    private String plantId;
    private String plantName;
    private String type;
    private String date;
    private String time;
    private Integer streak;
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
