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
import com.plantcare.service.model.User;

@Repository
public class FirestoreUserRepository {

    private static final String COLLECTION_NAME = "users";
    private final Firestore firestore;

    public FirestoreUserRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    public User save(User user) {
        try {
            firestore.collection(COLLECTION_NAME).document(user.getId()).set(user).get();
            return user;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Firestore save operation interrupted", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Error saving user to Firestore: " + e.getMessage(), e);
        }
    }

    public Optional<User> findById(String id) {
        try {
            DocumentSnapshot snapshot = firestore.collection(COLLECTION_NAME).document(id).get().get();
            if (snapshot.exists()) {
                return Optional.of(mapDocumentToUser(snapshot));
            }
            return Optional.empty();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Firestore get operation interrupted", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Error fetching user from Firestore: " + e.getMessage(), e);
        }
    }

    public Optional<User> findByEmail(String email) {
        try {
            ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                    .whereEqualTo("email", email)
                    .get();
            List<QueryDocumentSnapshot> documents = future.get().getDocuments();
            if (!documents.isEmpty()) {
                return Optional.of(mapDocumentToUser(documents.get(0)));
            }
            return Optional.empty();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Firestore query operation interrupted", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Error querying user by email from Firestore: " + e.getMessage(), e);
        }
    }

    public List<User> findByRoleIgnoreCase(String role) {
        try {
            ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME).get();
            List<QueryDocumentSnapshot> documents = future.get().getDocuments();
            List<User> users = new ArrayList<>();
            for (QueryDocumentSnapshot doc : documents) {
                User user = mapDocumentToUser(doc);
                if (user.getRole() != null && user.getRole().equalsIgnoreCase(role)) {
                    users.add(user);
                }
            }
            return users;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Firestore list operation interrupted", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Error querying users by role from Firestore: " + e.getMessage(), e);
        }
    }

    public List<User> findAll() {
        try {
            ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME).get();
            List<QueryDocumentSnapshot> documents = future.get().getDocuments();
            List<User> users = new ArrayList<>();
            for (QueryDocumentSnapshot doc : documents) {
                users.add(mapDocumentToUser(doc));
            }
            return users;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Firestore list operation interrupted", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Error fetching users from Firestore: " + e.getMessage(), e);
        }
    }

    private User mapDocumentToUser(DocumentSnapshot document) {
        User user = new User();
        user.setId(document.getId());
        user.setEmail(document.getString("email"));
        user.setRole(document.getString("role"));

        String name = document.getString("name");
        user.setName(name != null ? name : "Plant User");

        String status = document.getString("status");
        user.setStatus(status != null ? status : "Active");

        Object createdAt = document.get("createdAt");
        if (createdAt instanceof Timestamp) {
            user.setCreatedDate(((Timestamp) createdAt).toDate().toInstant().toString());
        } else if (createdAt != null) {
            user.setCreatedDate(createdAt.toString());
        } else {
            user.setCreatedDate(document.getString("createdDate"));
        }

        user.setResetToken(document.getString("resetToken"));
        user.setResetTokenExpiry(document.getLong("resetTokenExpiry"));

        return user;
    }
}
