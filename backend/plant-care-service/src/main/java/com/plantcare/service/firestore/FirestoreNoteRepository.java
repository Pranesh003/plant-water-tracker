package com.plantcare.service.firestore;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.plantcare.service.model.Note;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Repository
public class FirestoreNoteRepository {

    private static final String COLLECTION_NAME = "plant_notes";

    private final Firestore firestore;

    public FirestoreNoteRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    public Note save(Note note) {

        try {

            firestore.collection(COLLECTION_NAME)
                    .document(note.getId())
                    .set(note)
                    .get();

            return note;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Firestore save operation interrupted",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Error saving note to Firestore",
                    e
            );
        }
    }

    public List<Note> findByPlantId(String plantId) {

        try {

            ApiFuture<QuerySnapshot> future =
                    firestore.collection(COLLECTION_NAME)
                            .whereEqualTo("plantId", plantId)
                            .get();

            List<QueryDocumentSnapshot> documents =
                    future.get().getDocuments();

            List<Note> notes = new ArrayList<>();

            for (QueryDocumentSnapshot document : documents) {

                Note note = document.toObject(Note.class);

                notes.add(note);
            }

            return notes;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Firestore query interrupted",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Error fetching notes from Firestore",
                    e
            );
        }
    }

    public void deleteByPlantId(String plantId) {

        try {

            ApiFuture<QuerySnapshot> future =
                    firestore.collection(COLLECTION_NAME)
                            .whereEqualTo("plantId", plantId)
                            .get();

            List<QueryDocumentSnapshot> documents =
                    future.get().getDocuments();

            WriteBatch batch = firestore.batch();

            for (QueryDocumentSnapshot document : documents) {

                batch.delete(document.getReference());
            }

            batch.commit().get();

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Firestore delete interrupted",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Error deleting notes from Firestore",
                    e
            );
        }
    }
}
