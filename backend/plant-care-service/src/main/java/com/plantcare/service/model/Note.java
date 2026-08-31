package com.plantcare.service.model;

public class Note {

    private String id;
    private String plantId;
    private String text;
    private String date;
    private String time;

    public Note() {}

    public Note(String id, String plantId, String text, String date, String time) {
        this.id = id;
        this.plantId = plantId;
        this.text = text;
        this.date = date;
        this.time = time;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPlantId() { return plantId; }
    public void setPlantId(String plantId) { this.plantId = plantId; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }
}
