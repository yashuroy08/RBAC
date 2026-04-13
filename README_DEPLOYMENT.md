# Deployment Guide: Vercel & Render

This guide explains how to deploy the RBAC system to **Vercel** (Frontend) and **Render** (Backend).

## 1. Backend Deployment (Render)

1.  Create a new **Web Service** on Render.
2.  Connect your GitHub repository.
3.  Set the **Build Command**: `./mvnw clean package -DskipTests` (or `mvn clean package -DskipTests`)
4.  Set the **Start Command**: `java -jar target/*.jar`
5.  Add the following **Environment Variables**:
    *   `SPRING_DATASOURCE_URL`: Your production database URL (e.g., MS SQL Server on Azure/AWS).
    *   `SPRING_DATASOURCE_USERNAME`: Database username.
    *   `SPRING_DATASOURCE_PASSWORD`: Database password.
    *   `ALLOWED_ORIGINS`: Your Vercel domain (e.g., `https://your-app.vercel.app`).
    *   `SESSION_COOKIE_SECURE`: `true`
    *   `PORT`: `8081` (Render will override this, but good to have a default).

## 2. Frontend Deployment (Vercel)

1.  Connect your repository to Vercel.
2.  Set the **Root Directory** to `frontend`.
3.  Add the following **Environment Variables**:
    *   `VITE_API_BASE_URL`: Your Render backend URL (e.g., `https://your-backend.onrender.com/api`).
4.  Vercel will use the `vercel.json` file for routing.

## 3. SEO & Google Search Console

1.  **Search Console**: Go to [Google Search Console](https://search.google.com/search-console/), add your property, and get the verification code.
2.  Replace `ADD_YOUR_VERIFICATION_CODE_HERE` in `frontend/index.html` with your code.
3.  Update `frontend/public/robots.txt` and `frontend/public/sitemap.xml` with your actual Vercel domain.

## 4. Keywords & Metadata

The system is already configured with high-impact keywords:
- `RBAC`, `Adaptive MFA`, `Risk Evaluation`, `Cybersecurity`, `Secure Login`.
- OpenGraph and Twitter tags are included for social media optimization.
