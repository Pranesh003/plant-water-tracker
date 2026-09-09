# 📡 PlantCare Complete REST API Documentation

**API Title:** PlantCare Enterprise Microservice API  
**OpenAPI Specification:** `3.0.3`  
**Base Production URL:** `https://plant-care-service-358974981913.asia-south1.run.app`  
**Protocol:** HTTPS / TLS 1.3  
**Default Content-Type:** `application/json`  
**Authentication Scheme:** HTTP Bearer Token (HS256 Signed JWT)  
**Document Version:** `1.0.0`  
**Last Updated:** September 2026  

---

## 🔒 Authentication & Headers

Protected endpoints require the `Authorization` header containing a valid JWT token issued by the `/api/auth/signin` or `/api/auth/signup` endpoints.

```http
Authorization: Bearer <YOUR_JWT_TOKEN>
Content-Type: application/json
```

---

## 📋 Endpoint Category Index

1. [Authentication Services (`/api/auth`)](#1-authentication-services-apiauth)
2. [User Management Services (`/api/users`)](#2-user-management-services-apiusers)
3. [Plant Care Services (`/api/plants`)](#3-plant-care-services-apiplants)
4. [Care History Services (`/api/history`)](#4-care-history-services-apihistory)
5. [BigQuery Analytics Services (`/api/analytics`)](#5-bigquery-analytics-services-apianalytics)
6. [Weather & Climate Services (`/api/weather`)](#6-weather--climate-services-apiweather)
7. [Botanical Species Services (`/api/species`)](#7-botanical-species-services-apispecies)
8. [GCP Secret Manager Status (`/api/secrets`)](#8-gcp-secret-manager-status-apisecrets)
9. [Cloud Storage Services (`/api/storage`)](#9-cloud-storage-services-apistorage)
10. [Vertex AI Multimodal Services (`/api/vertex-ai`)](#10-vertex-ai-multimodal-services-apivertex-ai)

---

## 1. Authentication Services (`/api/auth`)

### 1.1 Sign Up / Register New Account
`POST /api/auth/signup`

Registers a new user profile and syncs user record with Firebase Auth.

* **Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```
* **Response `200 OK`:**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJqYW5lQGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIifQ...",
  "user": {
    "id": "u_1725800000",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "user",
    "status": "Active",
    "createdAt": "2026-09-09T22:30:00.000Z"
  }
}
```
* **cURL Command:**
```bash
curl -X POST "https://plant-care-service-358974981913.asia-south1.run.app/api/auth/signup" \
     -H "Content-Type: application/json" \
     -d '{"name":"Jane Doe","email":"jane@example.com"}'
```

---

### 1.2 Sign In / Authenticate User
`POST /api/auth/signin`

Validates user credentials and issues JWT token.

* **Request Body:**
```json
{
  "email": "admin@plantdoc.com",
  "role": "admin"
}
```
* **Response `200 OK`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkBwbGFudGRvYy5jb20iLCJyb2xlIjoiYWRtaW4ifQ...",
  "user": {
    "id": "admin001",
    "name": "Admin",
    "email": "admin@plants.local",
    "role": "admin",
    "status": "Active",
    "createdAt": "2026-09-01"
  }
}
```

---

### 1.3 Forgot Password Request
`POST /api/auth/forgot-password`

* **Request Body:** `{"email": "jane@example.com"}`
* **Response `200 OK`:** `{"message": "Password reset email dispatched."}`

---

## 2. User Management Services (`/api/users`)

### 2.1 Get Users Profile / List
`GET /api/users`  
*(Requires Authorization Header)*

* **Response `200 OK`:**
```json
[
  {
    "id": "admin001",
    "name": "Admin",
    "email": "admin@plants.local",
    "role": "admin",
    "status": "Active"
  }
]
```

---

### 2.2 Request Email Change OTP
`POST /api/users/request-email-change`  
*(Requires Authorization Header)*

* **Request Body:** `{"newEmail": "newjane@example.com"}`
* **Response `200 OK`:**
```json
{
  "message": "A 6-digit verification code has been sent to newjane@example.com",
  "newEmail": "newjane@example.com"
}
```

---

### 2.3 Verify Email Change OTP
`POST /api/users/verify-email-change`  
*(Requires Authorization Header)*

* **Request Body:**
```json
{
  "newEmail": "newjane@example.com",
  "code": "849201"
}
```
* **Response `200 OK`:**
```json
{
  "message": "Email address updated successfully.",
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "u_1725800000",
    "email": "newjane@example.com"
  }
}
```

---

## 3. Plant Care Services (`/api/plants`)

### 3.1 Get All Garden Plants
`GET /api/plants`

* **Response `200 OK`:**
```json
[
  {
    "id": "p_monstera_01",
    "userId": "u_admin001",
    "name": "Office Monstera",
    "species": "Monstera deliciosa",
    "location": "Office, Coimbatore",
    "locationCity": "Coimbatore",
    "frequency": 7,
    "lastWatered": "2026-09-08",
    "currentStreak": 4,
    "bestStreak": 9,
    "sunlight": "Indirect Sunlight",
    "waterMl": 350
  }
]
```

---

### 3.2 Create New Plant
`POST /api/plants`  
*(Requires Authorization Header)*

* **Request Body:**
```json
{
  "name": "Balcony Rose",
  "species": "Rosa rubiginosa",
  "location": "Balcony, Madurai",
  "locationCity": "Madurai",
  "frequency": 3,
  "sunlight": "Direct Sunlight",
  "waterMl": 420,
  "lastWatered": "2026-09-09"
}
```
* **Response `200 OK`:** Returns created plant object.

---

### 3.3 Water Plant & Increment Streak
`POST /api/plants/{id}/water`  
*(Requires Authorization Header)*

* **Response `200 OK`:**
```json
{
  "id": "p_monstera_01",
  "name": "Office Monstera",
  "lastWatered": "2026-09-09",
  "currentStreak": 5,
  "bestStreak": 9
}
```

---

## 4. Care History Services (`/api/history`)

### 4.1 Get Care History Timeline
`GET /api/history`  
*(Requires Authorization Header)*

* **Response `200 OK`:**
```json
[
  {
    "id": "h_1725800000_123",
    "plantId": "p_monstera_01",
    "plantName": "Office Monstera",
    "type": "watering",
    "date": "2026-09-09",
    "time": "10:30 AM",
    "streak": 5
  }
]
```

---

## 5. BigQuery Analytics Services (`/api/analytics`)

### 5.1 Get BigQuery Analytics Report
`GET /api/analytics/bigquery-report`

* **Response `200 OK`:**
```json
{
  "scope": "GLOBAL_PLATFORM",
  "dataset": "plant_watering_tracker-2026:plant_analytics_db",
  "syncExtension": "Firebase / Firestore BigQuery Sync Extension v2",
  "totalSyncedRecords": 58,
  "mostPopularSpeciesByCity": [
    { "city": "Coimbatore", "topSpecies": "Crassula ovata", "totalPlants": 1 }
  ],
  "averageStreakRetentionByLocation": [
    { "roomLocation": "Office", "retentionRate": "100%", "avgStreakDays": "4.0 days" }
  ]
}
```

---

### 5.2 Trigger BigQuery Stream Sync
`POST /api/analytics/bigquery-sync`

* **Response `200 OK`:**
```json
{
  "status": "SUCCESS",
  "message": "Live Firestore events streamed to BigQuery dataset plant_analytics_db",
  "bigQueryTable": "plant_watering_tracker_2026.plant_analytics_db.plant_care_logs_sync"
}
```

---

## 6. Weather & Climate Services (`/api/weather`)

### 6.1 Get Weather Forecast & Moisture Index
`GET /api/weather?location=Coimbatore`

* **Response `200 OK`:**
```json
{
  "location": "Coimbatore",
  "temperature": 28.5,
  "humidity": 65,
  "adjustmentReason": "Calculated from live Coimbatore weather (28.5°C, 65% humidity)."
}
```

---

## 7. Botanical Species Services (`/api/species`)

### 7.1 Search Species Catalog
`GET /api/species/search?q=Rose`

* **Response `200 OK`:**
```json
[
  {
    "name": "Rose",
    "species": "Rosa rubiginosa",
    "family": "Rosaceae",
    "source": "Built-in catalogue",
    "icon": "🌹"
  }
]
```

---

## 8. GCP Secret Manager Status (`/api/secrets`)

### 8.1 Check Secret Manager Health
`GET /api/secrets/status`

* **Response `200 OK`:**
```json
{
  "provider": "GCP Secret Manager",
  "OPENWEATHER_API_KEY": "✓ Active (Fetched from Secret Manager)",
  "TREFLE_API_TOKEN": "✓ Active (Fetched from Secret Manager)",
  "status": "SUCCESS"
}
```

---

## 9. Cloud Storage Services (`/api/storage`)

### 9.1 Optimize & Upload Photo
`POST /api/storage/optimize-image`  
*(Content-Type: `multipart/form-data`)*

* **Form Part:** `image` (File)
* **Response `200 OK`:**
```json
{
  "status": "SUCCESS",
  "message": "Image optimized successfully",
  "imageUrl": "https://storage.googleapis.com/plant-watering-tracker-2026.appspot.com/plants/leaf_99.jpg"
}
```

---

## 10. Vertex AI Multimodal Services (`/api/vertex-ai`)

### 10.1 Vertex AI Disease Diagnosis
`POST /api/vertex-ai/diagnose-disease`  
*(Content-Type: `multipart/form-data`)*

* **Form Part:** `image` (File)
* **Response `200 OK`:**
```json
{
  "status": "OK",
  "disease": "Powdery Mildew",
  "confidence": 0.94,
  "severity": "Moderate",
  "treatment": [
    "Isolate plant to prevent fungal spore spreading.",
    "Spray neem oil or sulfur fungicide solution once every 7 days.",
    "Improve air circulation and avoid over-watering."
  ]
}
```

---

### 10.2 Vertex AI Species Identification
`POST /api/vertex-ai/identify-species`  
*(Content-Type: `multipart/form-data`)*

* **Form Part:** `image` (File)
* **Response `200 OK`:**
```json
{
  "status": "OK",
  "identifiedSpecies": "Monstera deliciosa",
  "commonName": "Swiss Cheese Plant"
}
```
