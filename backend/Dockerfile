    FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B package -DskipTests

FROM eclipse-temurin:17-jre-alpine
RUN addgroup -S hms && adduser -S hms -G hms
WORKDIR /app
COPY --from=build /app/target/hms-backend.jar app.jar
USER hms
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
