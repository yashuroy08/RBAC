# Build stage
FROM maven:3.9-eclipse-temurin-11 AS build
WORKDIR /app
COPY pom.xml .
# Pre-download dependencies for better layer caching
RUN mvn dependency:go-offline -q || true
COPY backend ./backend
RUN mvn clean package -DskipTests -q

# Run stage
FROM eclipse-temurin:11-jre
WORKDIR /app
COPY --from=build /app/target/rbac-risk-evaluator-1.0.0.jar app.jar

# Render provides $PORT, default to 8081
EXPOSE ${PORT:-8081}

# Optimized JVM settings for free-tier containers (512MB RAM)
ENTRYPOINT ["java", "-Xmx256m", "-Xms128m", "-XX:+UseG1GC", "-XX:MaxGCPauseMillis=100", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
