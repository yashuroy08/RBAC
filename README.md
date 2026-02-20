# Adaptive RBAC & Risk Evaluation System

![Project Status](https://img.shields.io/badge/Status-Active-brightgreen)
![Tech Stack](https://img.shields.io/badge/Stack-Spring_Boot_%7C_React-blue)

A sophisticated Role-Based Access Control (RBAC) system integrated with a dynamic Risk Evaluation engine. This platform goes beyond static permissions by analyzing session behavior, geographic locations, and user history to provide an adaptive security layer.

## 🚀 Overview

The **Adaptive RBAC & Risk Evaluation System** is designed to provide robust security for modern enterprise applications. It combines traditional RBAC with a real-time risk assessment module that can automatically invalidate sessions or trigger MFA based on suspicious activity.

### Key Pillars
- **Zero Trust Principles:** Every request is authenticated and authorized based on real-time context.
- **Dynamic Risk Assessment:** Real-time calculation of risk scores based on multi-factor inputs.
- **Session Intelligence:** Proactive management of user sessions with the ability to terminate high-risk sessions instantly.

---

## ✨ Features

### 🔐 Advanced RBAC
- **Granular Permissions:** Assign specific actions to roles and roles to users.
- **Hierarchical Roles:** Support for Admin, User, and Manager roles with inherited permissions.

### 🛡️ Risk Evaluation Engine
- **Location-Based Security:** Restrict or flag access from unauthorized geographic regions or IP ranges.
- **Behavioral Analysis:** Track unsuccessful login attempts and unusual access patterns.
- **Risk Thresholds:** Customizable thresholds that trigger automated security actions (e.g., logging out all other sessions if risk is too high).

### 🖥️ Interactive Dashboard
- **Admin Control Panel:** Manage users, roles, and view global security events.
- **Security Analytics:** Visual representation of risk events and active sessions.
- **User Activity Logs:** Comprehensive audit trails for all security-sensitive actions.

### 📱 Modern User Experience
- **Responsive UI:** Built with React and optimized with Framer Motion for smooth transitions.
- **Interactive Maps:** Integration with Leaflet to visualize login locations.
- **Secure Authentication:** OTP-supported login and secure password management.

---

## 🛠️ Tech Stack

### Backend
- **Framework:** Spring Boot 2.7.18
- **Security:** Spring Security (BCrypt, Session Management)
- **Database:** MS SQL Server
- **ORM:** Spring Data JPA (Hibernate)
- **Documentation:** Swagger UI / Springfox
- **Build Tool:** Maven

### Frontend
- **Library:** React 18
- **Build Tool:** Vite
- **Routing:** React Router DOM
- **Animations:** Framer Motion
- **Maps:** Leaflet & React Leaflet
- **HTTP Client:** Axios

---

## 📂 Project Structure

```text
RBAC/
├── backend/            # Spring Boot Source Code
│   ├── src/main/java/  # Java Backend Logic
│   └── src/resources/  # Configuration (application.properties)
├── frontend/           # React Frontend Source Code
│   ├── src/pages/      # Dashboard, Admin, Auth Pages
│   └── src/components/ # Reusable UI Components
├── database/           # SQL Scripts and Schema Definitions
└── pom.xml             # Root Maven Configuration
```

---

## ⚙️ Setup & Installation

### Prerequisites
- JDK 8 or higher
- Node.js (v18+) & Correspoding NPM
- MS SQL Server

### 1. Backend Setup
1. Navigate to the `backend` directory.
2. Update `src/main/resources/application.properties` with your MS SQL Server credentials.
3. Run the application:
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```
4. Access API documentation at: `http://localhost:8081/swagger-ui/`

### 2. Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser to: `http://localhost:5173`

---

## 🛡️ Security Implementation
- **Password Hashing:** BCrypt password encoding for secure storage.
- **Session Management:** Spring Session JDBC for persistent and scalable session tracking.
- **JWT/CORS:** Properly configured CORS policies for secure frontend-backend communication.

## 🗺️ Roadmap
- [ ] Integration with External Identity Providers (OAuth2/OpenID).
- [ ] AI-driven anomaly detection for risk scoring.
- [ ] Mobile app companion for real-time security alerts.

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
