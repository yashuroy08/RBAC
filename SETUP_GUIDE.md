# 🛠️ RBAC Identity Service - Setup Guide

This guide provides step-by-step instructions to set up, build, and run the RBAC Identity Service on your local machine using Docker Compose.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:
*   **[Docker](https://www.docker.com/products/docker-desktop/)**: Required for running the containerized infrastructure.
*   **[Docker Compose](https://docs.docker.com/compose/install/)**: Required to orchestrate the multi-container setup.
*   *(Optional)* **Node.js & npm**: If you plan to run or build the frontend code separately.
*   *(Optional)* **Java 17 & Maven**: If you wish to build the Spring Boot application outside of Docker.

## 🚀 1. Clone and Navigate

Clone the repository and navigate into the project root directory:

```bash
git clone <repository-url>
cd RBAC
```

## 🔐 2. Environment Configuration

The application relies on environment variables. While defaults are provided in the `docker-compose.yml`, it is best practice to create an `.env` file in the root directory.

Create an `.env` file (if you want to override defaults):
```env
POSTGRES_USER=springuser
POSTGRES_PASSWORD=Spring@123
POSTGRES_DB=rbac_db
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
```

## 🏗️ 3. Build and Start the Infrastructure

The entire stack (Database, Cache, Backend, Nginx, and Dashboards) is orchestrated via Docker Compose.

Run the following command to build the backend image and start all containers in detached mode:

```bash
docker-compose up --build -d
```

**What this does:**
1.  Pulls necessary images (Postgres, Redis, Nginx, GoAccess, RedisInsight).
2.  Compiles the Spring Boot backend using a multi-stage Docker build.
3.  Provisions persistent Docker volumes (`postgres_data`, `nginx_logs`, `goaccess_data`).
4.  Starts the services in the correct dependency order.

## 🔍 4. Verifying the Setup

Check the status of your containers:
```bash
docker-compose ps
```
You should see all containers marked as `Up` (and `Healthy` for the backend, redis, and postgres).

## 🌐 5. Accessing the Services

Once the containers are healthy, you can access the various layers of the stack:

| Service | Local URL | Description |
| :--- | :--- | :--- |
| **API Endpoint** | `http://localhost/api/...` | The Nginx reverse proxy routes these directly to the Spring Boot backend. |
| **Nginx Status** | `http://localhost/nginx_status` | Raw connection statistics for the Nginx proxy. |
| **Traffic Dashboard** | `http://localhost/dashboard/` | Real-time visual traffic analyzer (Powered by GoAccess). |
| **Redis Insight** | `http://localhost:5540` | GUI to manage Redis. Connect using host: `redis` and port `6379`. |

## ⚖️ 6. Horizontal Scaling (Advanced)

The backend is configured to support horizontal scaling out-of-the-box. Nginx will automatically load balance traffic between multiple backend instances.

To scale the backend to 3 instances, run:
```bash
docker-compose up -d --scale rbac-backend=3
```

## 🛑 7. Stopping the Application

To cleanly stop the services without deleting your database or log data:
```bash
docker-compose stop
```

To tear down the containers and network (data in volumes will persist):
```bash
docker-compose down
```

To tear down **and** delete all persistent data (Warning: This will delete your database!):
```bash
docker-compose down -v
```

## 🐛 Troubleshooting

*   **Port Conflicts**: If port `80` or `5540` is already in use, modify the port mappings in `docker-compose.yml`.
*   **Database Connection Errors**: Ensure the `db` container is fully healthy before the backend attempts to connect. The current compose file handles this via `depends_on: condition: service_healthy`.
*   **Logs**: If the backend fails to start, inspect the logs:
    ```bash
    docker-compose logs -f rbac-backend
    ```
