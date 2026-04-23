# RBAC Identity Service API Reference

This document provides a detailed guide to the RBAC Identity Service API. For interactive testing, please use the Swagger UI available during local development.

## 🔐 Authentication Flow

The system uses a **Risk-Based Authentication (RBA)** flow. A successful login doesn't always mean the user is "in"; they might be challenged with MFA based on their risk score.

### 1. Login Phase
**Endpoint:** `POST /api/auth/login`

**Process:**
- User submits credentials.
- System evaluates **Risk Factors**: IP Address, Device Fingerprint, Location, and Time.
- **Possible Responses:**
  - `200 OK`: Successful login (Low Risk). Session cookie is set.
  - `302 Found`: MFA Required (Medium Risk). User is redirected/flagged to verify email.
  - `401 Unauthorized`: Invalid credentials.
  - `403 Forbidden`: Account locked or High Risk (Automatic block).

### 2. MFA Verification
**Endpoint:** `POST /api/auth/verify-mfa`

**Process:**
- Triggered if the login risk score is above the threshold.
- A 6-digit code is sent to the registered email.
- User submits the code to promote the session to "Trusted" status.

---

## 🛡️ Key Endpoints

### User Management
| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user | Public |
| `GET` | `/api/auth/me` | Get current user profile | Authenticated |
| `PUT` | `/api/users/profile` | Update profile information | User/Admin |

### Session & Security
| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/auth/sessions` | List all active sessions | User |
| `DELETE` | `/api/auth/sessions/{id}` | Revoke a specific session | User/Admin |
| `GET` | `/api/auth/trusted-devices` | List trusted devices | User |

### Administrative Controls (RBAC)
| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/users` | List all users | ADMIN |
| `PATCH` | `/api/admin/users/{id}/role` | Change user role | ADMIN |
| `GET` | `/api/admin/audit-logs` | View system audit trail | AUDITOR/ADMIN |

---

## 📈 Risk Evaluation Logic

The system calculates a `risk_score` (0-100) for every request:
- **Unknown Device:** +25 points
- **Unknown IP/Location:** +30 points
- **Impossible Travel:** +50 points (e.g., login from USA then London in 1 hour)

**Threshold Actions:**
- **0-30:** No challenge.
- **31-70:** MFA Required.
- **71+:** Automatic Session Termination & Account Lock.

---

## 🛠️ Integration Guide

### Base URL
- **Local:** `http://localhost/api`
- **Production:** `https://your-api-url.com/api`

### Content Type
All requests should include:
`Content-Type: application/json`

### Error Handling
The API returns standard HTTP status codes:
- `400`: Validation Error
- `401`: Session Expired / Not Logged In
- `403`: Insufficient Permissions (RBAC)
- `429`: Rate Limit Exceeded
