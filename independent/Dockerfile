FROM maven:3.9.11-eclipse-temurin-17 AS build
WORKDIR /build
COPY pom.xml .
RUN mvn -B -ntp dependency:go-offline
COPY src src
RUN mvn -B -ntp -DskipTests package
FROM eclipse-temurin:17-jre
RUN useradd --system --create-home jarvis
USER jarvis
WORKDIR /app
COPY --from=build /build/target/jarvis.jar /app/jarvis.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/jarvis.jar"]
