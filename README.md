# Adaptive RBAC & Risk Evaluation System

![Project Status](https://img.shields.io/badge/Status-Active-brightgreen)
![Tech Stack](https://img.shields.io/badge/Stack-Spring_Boot_%7C_React-blue)
![Security](https://img.shields.io/badge/Model-Zero_Trust-red)

A production-ready Role-Based Access Control (RBAC) system featuring an integrated **Adaptive Risk Evaluation Engine**. This platform implements security-as-code principles by calculating real-time risk scores based on session telemetry, geolocation, and behavioral analytics.

## 🏗️ Architectural Overview

The system is designed as a decoupled full-stack application leveraging a **Hybrid Security Model**:
- **Identity Provider (Backend):** Spring Boot service managing JWT issuance and JDBC-backed session state.
- **Risk Engine:** A dynamic evaluator that monitors cross-referenced data points to enforce adaptive security policies.
- **Client Interface (Frontend):** React 18 application with high-fidelity telemetry gathering and administrative orchestration.

For a deep dive into the service layer, see our [API Documentation](API_DOCUMENTATION.md).

---

## 🛡️ Core Security Capabilities

### 1. Dynamic Risk Scoring
Traditional RBAC is static. Our system adds a fluid intelligence layer:
- **Spatial Validation:** Real-time Geo-fencing using Google Maps API coordinates.
- **Behavioral Fingerprinting:** Tracking failure rates, session concurrency, and IP volatility.
- **Automated Mitigation:** High-risk scores trigger immediate session invalidation and account lockdowns.

### 2. Zero-Trust Session Management
- **JDBC Persistence:** Sessions are persisted in the database to allow for cross-node scalability and administrative termination.
- **MFA Flow:** Suspicious activity automatically upgrades authentication requirements from standard password to OTP.

### 3. Comprehensive Audit Logic
- Every administrative action and security event is logged to a non-repudiable audit trail, searchable via the Admin Panel.

---

## 🛠️ Technology Stack

### Backend Infrastructure
- **Core:** Spring Boot 2.7.18 (Java 11)
- **Security:** Spring Security managed lifecycle
- **Persistence:** PostgreSQL / MS SQL Server (Database agnostic via JPQL)
- **Session Layer:** Spring Session JDBC
- **API Spec:** Swagger / Springfox 3.0.0

### Frontend Infrastructure
- **Core:** React 18 / Vite
- **State Management:** React Context API
- **Visuals:** Tailwind CSS / Framer Motion
- **Integrations:** Axios, Leaflet (Maps), Lucide Icons

---

## 📂 Repository Structure

```text
RBAC/
├── backend/            # Enterprise Java Backend
│   ├── src/main/java/  # Business Logic & Security Configs
│   └── src/resources/  # Application Environment Props
├── frontend/           # React Frontend Application
│   ├── src/pages/      # Dynamic routes (Admin, User, Auth)
│   └── src/components/ # Atomic UI components
├── database/           # Schema migration scripts
└── pom.xml             # Maven Project Object Model
```

---

## ⚙️ Deployment & Development

### Local Setup
1. **Database:** Ensure a SQL instance is running. The system auto-initializes schema on startup.
2. **Backend:**
   ```bash
   cd backend
   mvn spring-boot:run
   ```
3. **Frontend:**
   ```bash
   cd frontend
   npm install && npm run dev
   ```

### Production Deployment
The project is configured for containerized deployment via the included `Dockerfile` and `render.yaml` orchestration.
- **Backend:** Deployed on Render (Postgres internal networking).
- **Frontend:** Optimized Vite build deployed on Vercel.

---

## 🗺️ Engineering Roadmap
- [x] Adaptive Risk Evaluation Engine
- [x] Multi-factor Authentication (OTP)
- [x] Geo-fencing Restrictions
- [ ] Integration with External IDPs (OAuth2)
- [ ] AI-driven anomaly detection models

---

## 📄 Compliance & License
This project is architected for enterprise-scale security compliance. Distributed under the MIT License.
