# Build stage
FROM maven:3.8.4-eclipse-temurin-11 AS build
WORKDIR /app
COPY pom.xml .
COPY backend ./backend
RUN mvn clean package -DskipTests

# Run stage
FROM eclipse-temurin:11-jre
WORKDIR /app
COPY --from=build /app/target/rbac-risk-evaluator-1.0.0.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
