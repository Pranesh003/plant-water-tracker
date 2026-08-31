package com.plantcare.service.firestore;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.plantcare.service.model.History;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Repository
public class FirestoreHistoryRepository {

    private static final String COLLECTION_NAME = "watering_history";

    private final Firestore firestore;

    public FirestoreHistoryRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    public History save(History history) {

        try {

            firestore.collection(COLLECTION_NAME)
                    .document(history.getId())
                    .set(history)
                    .get();

            return history;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Firestore save interrupted",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Error saving history",
                    e
            );
        }
    }

    public List<History> findByPlantId(String plantId) {

        try {

            ApiFuture<QuerySnapshot> future =
                    firestore.collection(COLLECTION_NAME)
                            .whereEqualTo("plantId", plantId)
                            .get();

            return convert(future.get());

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Firestore query interrupted",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Error fetching history",
                    e
            );
        }
    }

    public boolean existsByPlantIdAndTypeIgnoreCaseAndDate(String plantId, String type, String date) {
        try {
            ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                    .whereEqualTo("plantId", plantId)
                    .whereEqualTo("date", date)
                    .get();
            List<QueryDocumentSnapshot> documents = future.get().getDocuments();
            for (QueryDocumentSnapshot doc : documents) {
                History h = doc.toObject(History.class);
                if (h.getType() != null && h.getType().equalsIgnoreCase(type)) {
                    return true;
                }
            }
            return false;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Firestore exists query interrupted", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Error checking history existence in Firestore: " + e.getMessage(), e);
        }
    }

    public List<History> findByPlantIdInOrderByDateDescTimeDesc(
            List<String> plantIds
    ) {

        if (plantIds == null || plantIds.isEmpty()) {
            return new ArrayList<>();
        }

        try {

            List<History> result = new ArrayList<>();

            for (String plantId : plantIds) {

                result.addAll(findByPlantId(plantId));
            }

            sortByDateTimeDescending(result);

            return result;

        } catch (Exception e) {

            throw new RuntimeException(
                    "Error fetching history for plants",
                    e
            );
        }
    }

    public List<History> findAll() {

        try {

            ApiFuture<QuerySnapshot> future =
                    firestore.collection(COLLECTION_NAME)
                            .get();

            return convert(future.get());

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Firestore query interrupted",
                    e
            );

        } catch (ExecutionException e) {

            throw new RuntimeException(
                    "Error fetching all history",
                    e
            );
        }
    }

    public List<History> findAllByOrderByDateDescTimeDesc() {

        List<History> history = findAll();

        sortByDateTimeDescending(history);

        return history;
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
                    "Error deleting history",
                    e
            );
        }
    }

    private List<History> convert(QuerySnapshot snapshot) {

        List<History> result = new ArrayList<>();

        for (QueryDocumentSnapshot document :
                snapshot.getDocuments()) {

            History history =
                    document.toObject(History.class);

            result.add(history);
        }

        return result;
    }

    private void sortByDateTimeDescending(
            List<History> history
    ) {

        history.sort(
                Comparator
                        .comparing(
                                History::getDate,
                                Comparator.nullsLast(
                                        Comparator.naturalOrder()
                                )
                        )
                        .thenComparing(
                                History::getTime,
                                Comparator.nullsLast(
                                        Comparator.naturalOrder()
                                )
                        )
                        .reversed()
        );
    }
}
