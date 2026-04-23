# 🛡️ RBAC Identity Service

[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.0-6DB33F?logo=spring&logoColor=white)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-316192?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

A production-ready, highly secure **Role-Based Access Control (RBAC)** Identity Management Service. Built with Java Spring Boot, this platform delivers comprehensive identity management, session tracking, and adaptive security mechanisms out-of-the-box.

---

## 📖 Overview

The RBAC Identity Service acts as a centralized authentication and authorization hub. It goes beyond simple JWT generation by incorporating a robust Redis-backed session management system, geographic anomaly detection, and trusted device tracking. It is designed to be deployed as a microservice in an enterprise architecture, fronted by an Nginx reverse proxy that handles rate limiting and security headers.

## ✨ Key Features

*   **Advanced Authentication:** Secure JWT-based authentication with stateful session tracking via Redis.
*   **Role-Based Access Control:** Granular permission management across distinct user roles (Admin, Manager, User).
*   **Adaptive Security & MFA:** Context-aware security that flags suspicious logins based on IP location anomalies and unknown devices, triggering dynamic MFA flows.
*   **Device & Session Management:** Users can view active sessions, revoke access to specific devices, and manage trusted devices.
*   **Security Hardened:** 
    *   Strict Nginx reverse proxy configurations (Rate Limiting, CSP, XSS Protection).
    *   Automated PII log sanitization (IP Masking).
*   **Real-time Observability:** Built-in integration with GoAccess (Nginx traffic analytics) and RedisInsight (cache exploration).
*   **Horizontal Scalability:** Docker Compose architecture ready for multi-node backend scaling.

## 🛠️ Technology Stack

| Component | Technology |
| :--- | :--- |
| **Backend Framework** | Java 17, Spring Boot 3.x, Spring Security |
| **Database** | PostgreSQL 15 |
| **Caching & Sessions** | Redis 7 |
| **Web Server / Proxy** | Nginx (Alpine) |
| **Containerization** | Docker, Docker Compose |
| **Monitoring** | GoAccess (Traffic), RedisInsight (Cache) |
| **Frontend Integration** | React (Vite) |

## 🚀 Getting Started

To get the project running on your local machine, please refer to our comprehensive setup documentation.

👉 **[View the Setup Guide](SETUP_GUIDE.md)**

## 📚 API Documentation

The service exposes a RESTful API. For detailed endpoints, request payloads, and example responses, please consult the API documentation.

👉 **[View the API Documentation](API_DOCUMENTATION.md)**

### OpenAPI Specification
For automated testing and integration (Postman, Insomnia, or Client Generation), we provide a machine-readable specification:

💾 **[Download swagger.json](docs/api/swagger.json)** (Exported from live Swagger UI)


## 🏗️ Architecture

The application runs in a containerized environment managed by Docker Compose.

1.  **Nginx (`rbac-nginx`)**: Acts as the edge proxy. Handles static file serving for the frontend, routes `/api` requests to the backend, applies rate limits, and enforces security headers.
2.  **Spring Boot (`rbac-backend`)**: The core identity engine. Connects to Postgres for persistent storage and Redis for ephemeral session state.
3.  **PostgreSQL (`rbac-postgres`)**: Persistent storage for Users, Roles, Audit Logs, and Trusted Devices.
4.  **Redis (`rbac-redis`)**: High-performance cache for active JWT sessions, MFA tokens, and quick lookup data.
5.  **Observability Layer**: `goaccess` and `redisinsight` containers provide deep visibility into the system's operational state.

## 📝 References & Acknowledgments

*   [Spring Security Reference](https://docs.spring.io/spring-security/reference/index.html)
*   [OWASP Top Ten Security Best Practices](https://owasp.org/www-project-top-ten/)
*   [GoAccess Nginx Monitoring](https://goaccess.io/)
*   [Redis Session Management](https://redis.io/docs/manual/patterns/session-management/)

---

<p align="center">Made with ❤️ by a Professional Developer</p>
