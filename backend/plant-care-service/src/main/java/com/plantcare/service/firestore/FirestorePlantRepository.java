package com.plantcare.service.firestore;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

import org.springframework.stereotype.Repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.plantcare.service.model.Note;
import com.plantcare.service.model.Plant;

@Repository
public class FirestorePlantRepository {

    private static final String COLLECTION_NAME = "plants";

    private final Firestore firestore;

    public FirestorePlantRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    public Plant save(Plant plant) {
        try {
            firestore.collection(COLLECTION_NAME)
                    .document(plant.getId())
                    .set(plant)
                    .get();

            return plant;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Firestore save operation interrupted", e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Error saving plant to Firestore", e
            );
        }
    }

    public Optional<Plant> findById(String id) {

        try {

            DocumentSnapshot snapshot =
                    firestore.collection(COLLECTION_NAME)
                            .document(id)
                            .get()
                            .get();

            if (snapshot.exists()) {

                Plant plant = mapDocumentToPlant(snapshot);

                return Optional.of(plant);
            }

            return Optional.empty();

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Firestore get operation interrupted", e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Error fetching plant from Firestore", e
            );
        }
    }

    public List<Plant> findAll() {

        try {

            ApiFuture<QuerySnapshot> future =
                    firestore.collection(COLLECTION_NAME)
                            .get();

            List<QueryDocumentSnapshot> documents =
                    future.get().getDocuments();

            List<Plant> plants = new ArrayList<>();

            for (QueryDocumentSnapshot document : documents) {

                plants.add(mapDocumentToPlant(document));
            }

            return plants;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Firestore list operation interrupted", e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Error fetching plants from Firestore", e
            );
        }
    }

    public List<Plant> findByUserId(String userId) {

        try {

            ApiFuture<QuerySnapshot> future =
                    firestore.collection(COLLECTION_NAME)
                            .whereEqualTo("userId", userId)
                            .get();

            List<QueryDocumentSnapshot> documents =
                    future.get().getDocuments();

            List<Plant> plants = new ArrayList<>();

            for (QueryDocumentSnapshot document : documents) {

                plants.add(mapDocumentToPlant(document));
            }

            return plants;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Firestore query operation interrupted", e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Error querying plants by userId from Firestore", e
            );
        }
    }

    public void deleteById(String id) {

        try {

            firestore.collection(COLLECTION_NAME)
                    .document(id)
                    .delete()
                    .get();

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Firestore delete operation interrupted", e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Error deleting plant from Firestore", e
            );
        }
    }

    private Plant mapDocumentToPlant(DocumentSnapshot document) {
        Plant plant = new Plant();
        plant.setId(document.getId());
        plant.setUserId(document.getString("userId"));
        plant.setName(document.getString("name"));
        plant.setSpecies(document.getString("species"));
        plant.setLocation(document.getString("location"));
        plant.setLocationCity(document.getString("locationCity"));
        plant.setRoom(document.getString("room"));

        Long frequency = document.getLong("frequency");
        if (frequency != null) {
            plant.setFrequency(frequency.intValue());
        }

        Long wateringFrequency = document.getLong("wateringFrequency");
        if (wateringFrequency != null) {
            plant.setWateringFrequency(wateringFrequency.intValue());
        }

        // Handle lastWatered - may be Timestamp or String
        Object lastWateredVal = document.get("lastWatered");
        if (lastWateredVal instanceof Timestamp) {
            plant.setLastWatered(((Timestamp) lastWateredVal).toDate().toInstant().toString());
        } else if (lastWateredVal != null) {
            plant.setLastWatered(lastWateredVal.toString());
        }
        
        // Handle sunlight and photoUrl - should be String
        String sunlight = document.getString("sunlight");
        if (sunlight != null) {
            plant.setSunlight(sunlight);
        }
        
        String photoUrl = document.getString("photoUrl");
        if (photoUrl != null) {
            plant.setPhotoUrl(photoUrl);
        }

        Object recommendedWaterMlVal = document.get("recommendedWaterMl");
        if (recommendedWaterMlVal != null) {
            plant.setRecommendedWaterMl(recommendedWaterMlVal.toString());
        }

        Object humidityVal = document.get("humidity");
        if (humidityVal != null) {
            plant.setHumidity(humidityVal.toString());
        }

        Long currentStreak = document.getLong("currentStreak");
        if (currentStreak != null) {
            plant.setCurrentStreak(currentStreak.intValue());
        }

        Long bestStreak = document.getLong("bestStreak");
        if (bestStreak != null) {
            plant.setBestStreak(bestStreak.intValue());
        }

        Object createdAtVal = document.get("createdAt");
        if (createdAtVal instanceof Timestamp) {
            plant.setCreatedAt(((Timestamp) createdAtVal).toDate().toInstant().toString());
        } else if (createdAtVal != null) {
            plant.setCreatedAt(createdAtVal.toString());
        }

        plant.setIcon(document.getString("icon"));

        Object notesVal = document.get("notes");
        if (notesVal instanceof List) {
            List<?> notesList = (List<?>) notesVal;
            List<Note> notes = new ArrayList<>();
            for (Object item : notesList) {
                if (item instanceof java.util.Map) {
                    java.util.Map<?, ?> map = (java.util.Map<?, ?>) item;
                    Note note = new Note();
                    note.setId((String) map.get("id"));
                    note.setPlantId((String) map.get("plantId"));
                    note.setText((String) map.get("text"));
                    note.setDate((String) map.get("date"));
                    note.setTime((String) map.get("time"));
                    notes.add(note);
                }
            }
            plant.setNotes(notes);
        }

        return plant;
    }
}
