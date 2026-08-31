package com.plantcare.service.service;

import com.google.cloud.storage.Blob;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
public class CloudStorageService {

    private static final String BUCKET_NAME = "plant-watering-tracker-2026-images";

    private final Storage storage;

    public CloudStorageService() {
        this.storage = StorageOptions.getDefaultInstance().getService();
    }

    public String uploadImage(MultipartFile file, String userId) throws IOException {

        if (file == null || file.isEmpty()) {
            return "";
        }

        String contentType = file.getContentType();

        if (contentType == null ||
                (!contentType.equalsIgnoreCase("image/jpeg")
                        && !contentType.equalsIgnoreCase("image/jpg")
                        && !contentType.equalsIgnoreCase("image/png")
                        && !contentType.equalsIgnoreCase("image/webp"))) {

            throw new IllegalArgumentException(
                    "Only JPEG, PNG and WEBP images are allowed."
            );
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException(
                    "Image size must be less than 5 MB."
            );
        }

        String extension = getExtension(contentType);

        String objectName =
                "plant-images/"
                        + userId
                        + "/"
                        + UUID.randomUUID()
                        + extension;

        BlobId blobId = BlobId.of(BUCKET_NAME, objectName);

        BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                .setContentType(contentType)
                .build();

        storage.create(
                blobInfo,
                file.getBytes()
        );

        return "https://storage.googleapis.com/"
                + BUCKET_NAME
                + "/"
                + objectName;
    }

    private String getExtension(String contentType) {
        String lower = contentType.toLowerCase();
        if (lower.contains("jpeg") || lower.contains("jpg")) return ".jpg";
        if (lower.contains("png")) return ".png";
        if (lower.contains("webp")) return ".webp";
        return ".jpg";
    }
}
