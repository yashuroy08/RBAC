# RBAC Risk Evaluator System — API Documentation

This document provides a technical specification of the available REST APIs in the RBAC Risk Evaluator System.

## 🔑 Authentication Mechanism

The system uses a **Hybrid Authentication Model**:
1. **JWT (JSON Web Token):** Used for stateless authentication during cross-origin requests.
2. **Spring Session (JDBC):** Used for stateful session management, tracking active devices, and enforcing risk-based invalidation.

### Security Headers
Every authenticated request must include:
- `Authorization: Bearer <JWT_TOKEN>`
- `Cookie: RBAC_SESSION=<SESSION_ID>` (handled automatically by browsers if `withCredentials: true` is set)

---

## 🛰️ API Endpoints

### 1. Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Create a new user account | No |
| `POST` | `/login` | Authenticate user & start session | No |
| `POST` | `/logout` | Terminate current session | Yes |
| `GET` | `/health` | Check backend service health | No |
| `GET` | `/me` | Get current authenticated user details | Yes |

#### Login Request Payload
```json
{
  "username": "admin",
  "password": "securePassword",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```
*Note: Geo-coordinates are used by the Risk Engine to verify location-based access policies.*

---

### 2. User Services (`/api/user`)

| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/{id}` | Retrieve user profile by ID | USER, ADMIN |
| `GET` | `/my-risk-status` | Get current user's recalculated risk score | USER, ADMIN |
| `GET` | `/my-sessions` | List all active sessions/devices | USER, ADMIN |
| `GET` | `/my-risk-events` | View recent security events for the current account | USER, ADMIN |

---

### 3. Risk Intelligence (`/api/risk`)

*Note: These endpoints are generally restricted to **ADMIN** role.*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/all-status` | View risk summary for all system users |
| `GET` | `/status/{userId}` | Get current risk indicators for a specific user |
| `GET` | `/evaluate/{userId}` | Trigger a manual risk re-evaluation |
| `GET` | `/sessions/{userId}` | View all active sessions for a specific user |
| `POST` | `/invalidate/{userId}` | Force-terminate all active sessions for a user |

---

### 4. Admin Management (`/api/admin`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/users` | Retrieve a list of all registered users |
| `POST` | `/users/{id}/assign-admin` | Elevate a user to ADMIN status |
| `POST` | `/users/{id}/lock` | Manually lock a user account |
| `GET` | `/audit-logs` | Retrieve global system audit trails |
| `POST` | `/location` | Define or update a Geo-fencing policy |
| `PUT` | `/location/{id}/toggle` | Enable/Disable a specific location policy |

---

## 🛡️ Risk Evaluation Indicators

The system calculates a risk score (0-100) based on the following weighted factors:

1. **Unsuccessful Logins:** Failure attempts within the last hour.
2. **Geographical Variance:** Distance from designated "Safe Zones."
3. **Session Concurrency:** Multiple concurrent sessions from different IP ranges.
4. **Account Age:** Newer accounts are monitored with higher sensitivity initially.

### Automated Responses
- **Score < 40:** Trusted access.
- **Score 40-70:** Flagged (triggers MFA requirement).
- **Score > 70:** Critical (auto-locks account & invalidates all sessions).

---

## 🚦 Common Status Codes

| Code | Meaning | Context |
| :--- | :--- | :--- |
| `200 OK` | Success | Request processed correctly. |
| `401 Unauthorized` | Identity Failure | Credentials missing or token expired. |
| `403 Forbidden` | Permission Denied | Role lacks sufficient privileges. |
| `400 Bad Request` | Validation Error | Missing fields or malformed JSON. |
| `500 Internal Server` | System Error | Unexpected server-side failure. |
