FROM eclipse-temurin:21-jdk

WORKDIR /app

COPY . .

RUN chmod +x mvnw || true
RUN ./mvnw clean package || mvn clean package

EXPOSE 8080

CMD ["java", "-jar", "target/haodaone-backend-0.1.0.jar"]