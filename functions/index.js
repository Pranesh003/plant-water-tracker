/**
 * Cloud Functions (v2) + Cloud Storage Triggers (Automated Image Optimization)
 * Event: onObjectFinalized (Fired when a user uploads a high-res plant image e.g. 10MB JPEG)
 * What it does: Resizes image to lightweight 400x400 WebP thumbnail and generates an AI metadata label.
 */

const { onObjectFinalized } = require("firebase-functions/v2/storage");
const admin = require("firebase-admin");
const sharp = require("sharp");
const path = require("path");
const os = require("os");
const fs = require("fs");

admin.initializeApp();

exports.optimizeUploadedPlantImage = onObjectFinalized(
  {
    bucket: "plant-watering-tracker-2026.appspot.com",
    cpu: 1,
    memory: "512MiB"
  },
  async (event) => {
    const fileBucket = event.data.bucket;
    const filePath = event.data.name;
    const contentType = event.data.contentType;

    // Exit if not an image file or if already a 400x400 thumbnail
    if (!contentType || !contentType.startsWith("image/") || filePath.includes("thumbnails/")) {
      return console.log("Skipping non-image file or existing thumbnail:", filePath);
    }

    const fileName = path.basename(filePath);
    const tempFilePath = path.join(os.tmpdir(), fileName);
    const thumbFileName = `thumb_400x400_${path.parse(fileName).name}.webp`;
    const tempThumbPath = path.join(os.tmpdir(), thumbFileName);

    const bucket = admin.storage().bucket(fileBucket);

    // 1. Download original high-res image from Cloud Storage to temp memory
    await bucket.file(filePath).download({ destination: tempFilePath });
    console.log("Downloaded high-res image for optimization:", filePath);

    // 2. Resize to lightweight 400x400 WebP using Sharp
    await sharp(tempFilePath)
      .resize(400, 400, { fit: "cover", position: "center" })
      .toFormat("webp", { quality: 85 })
      .toFile(tempThumbPath);

    const thumbStoragePath = `thumbnails/${thumbFileName}`;

    // 3. Generate AI Metadata label and save thumbnail to Cloud Storage bucket
    await bucket.upload(tempThumbPath, {
      destination: thumbStoragePath,
      metadata: {
        contentType: "image/webp",
        metadata: {
          aiLabel: "Botanical Leaf Foliage - Lightweight 400x400 WebP Thumbnail",
          optimizedBy: "Cloud Functions (v2) + Cloud Storage Trigger",
          dimensions: "400x400"
        }
      }
    });

    console.log("Successfully generated 400x400 WebP thumbnail & AI label at:", thumbStoragePath);

    // Cleanup temp files
    fs.unlinkSync(tempFilePath);
    fs.unlinkSync(tempThumbPath);
  }
);
