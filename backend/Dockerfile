# Stage 1: resolve dependencies (cached layer — only re-runs when pom.xml changes)
FROM maven:3.9.8-amazoncorretto-21 AS deps
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Stage 2: build
FROM deps AS build
COPY src ./src
RUN mvn package -DskipTests -q

# Stage 3: runtime
FROM amazoncorretto:21
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
