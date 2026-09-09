# 📜 PlantCare Enterprise Release Changelog

All notable changes, architectural updates, and features for **PlantCare Enterprise** are documented in this file.

---

## [3.0.0] - 2026-09-09

### 🚀 Added
- **Real-Time Client Analytics Engine ([`analyticsUtils.js`](file:///c:/Users/prane/OneDrive/Desktop/npn-cts/plant_watering/src/utils/analyticsUtils.js))**:
  - Implemented `computeSpeciesByLocation`, `computeRoomStreakRetention`, and `computeRegionalClimateGuidance` to calculate live garden stats from active user `plants` and `history` without waiting for backend report caching.
- **Enterprise System Architecture Documentation Suite**:
  - [`GCP_ARCHITECTURE.md`](file:///c:/Users/prane/OneDrive/Desktop/npn-cts/plant_watering/GCP_ARCHITECTURE.md): Multi-tier architecture detailing all 14 GCP Cloud Services (Cloud Run, BigQuery, Vertex AI, Secret Manager, Cloud Storage, Cloud Build, Artifact Registry, Cloud Scheduler, Cloud Logging, Cloud Monitoring, Cloud IAM, Firebase CDN).
  * [`BACKEND_SERVICES.md`](file:///c:/Users/prane/OneDrive/Desktop/npn-cts/plant_watering/BACKEND_SERVICES.md): Spring Boot 3 Java microservice architecture specification covering 11 REST controllers, 6 core services, 4 repositories, DTOs, and JWT security filters.
  * [`DATABASE_SCHEMA.md`](file:///c:/Users/prane/OneDrive/Desktop/npn-cts/plant_watering/DATABASE_SCHEMA.md): Complete field-by-field document schemas for Firestore collections (`users`, `plants`, `history`, `notes`) and BigQuery table `plant_care_logs_sync`.
  * [`API_DOCUMENTATION.md`](file:///c:/Users/prane/OneDrive/Desktop/npn-cts/plant_watering/API_DOCUMENTATION.md): Complete OpenAPI 3.0 specification with detailed request/response JSON payloads & cURL test commands for all 20 REST API endpoints.
  * [`FRONTEND_ARCHITECTURE.md`](file:///c:/Users/prane/OneDrive/Desktop/npn-cts/plant_watering/FRONTEND_ARCHITECTURE.md): React 18 client architecture, component routing, React Context API (`AppProvider`), LocalStorage caching, and Vanilla CSS design tokens.
  * [`AI_VISION_ARCHITECTURE.md`](file:///c:/Users/prane/OneDrive/Desktop/npn-cts/plant_watering/AI_VISION_ARCHITECTURE.md): Multimodal Vertex AI / Gemini 1.5 Flash vision diagnostic engine, HTML5 canvas image optimization, and fallback heuristic rules.
  * [`SECURITY_AND_COMPLIANCE.md`](file:///c:/Users/prane/OneDrive/Desktop/npn-cts/plant_watering/SECURITY_AND_COMPLIANCE.md): Security blueprint covering OAuth 2.0 / JWT HS256 stateless tokens, role-based access control (`USER` vs `ADMIN`), multi-step email change security, Secret Manager key isolation, and TLS 1.3 / AES-256 encryption.
  * [`DEVOPS_AND_DEPLOYMENT.md`](file:///c:/Users/prane/OneDrive/Desktop/npn-cts/plant_watering/DEVOPS_AND_DEPLOYMENT.md): DevOps guide covering Cloud Build CI/CD pipeline, Artifact Registry image repository commands, Firebase CDN deployment scripts, Cloud Logging, and automated health audit execution.
- **Automated Health Audit Scripts**:
  - `scratch/test_full_backend_audit.js`: 19-endpoint backend REST audit script yielding **100% Health Score (19/19 Passed)**.
  - `scratch/test_gcp_services_health.js`: GCP Cloud Infrastructure audit testing all 7 core cloud services.

### 🐛 Fixed
- **Missing `todayISO` Import in `api.js`**:
  - Resolved `ReferenceError: todayISO is not defined` thrown during `waterPlant` offline fallback by importing `todayISO` from `../utils/wateringUtils.js`.
- **Looker Studio & BigQuery Case-Sensitivity Grouping**:
  - Updated `BigQueryAnalyticsService.java` with city name title-casing (`formatCityName`) to clean up duplicate entries in BigQuery analytics dashboards.
