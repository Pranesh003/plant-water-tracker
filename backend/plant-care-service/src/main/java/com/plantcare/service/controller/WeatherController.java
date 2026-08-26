package com.plantcare.service.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/weather")
public class WeatherController {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
            
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final String weatherApiKey;

    public WeatherController(@Value("${weather.api-key:}") String weatherApiKey) {
        this.weatherApiKey = weatherApiKey;
    }

    private int kmh(double ms) {
        return (int) Math.round(ms * 3.6);
    }

    private String conditionFromWmoCode(int code) {
        if (code == 0) return "clear sky";
        if (code <= 3) return "cloudy";
        if (code == 45 || code == 48) return "fog";
        if (code <= 57) return "drizzle";
        if (code <= 67 || code <= 82) return "rain";
        if (code <= 77) return "snow";
        if (code <= 86) return "snow showers";
        return "thunderstorm";
    }

    private String resolveCityName(double latitude, double longitude) {
        try {
            String reverseGeocodeUrl = String.format(
                    "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=%f&lon=%f&zoom=10",
                    latitude, longitude);
            HttpResponse<String> response = httpClient.send(
                    HttpRequest.newBuilder()
                            .uri(URI.create(reverseGeocodeUrl))
                            .header("User-Agent", "PlantCareTracker/1.0")
                            .GET()
                            .build(),
                    HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode address = objectMapper.readTree(response.body()).path("address");
                String city = address.path("city").asText();
                if (city.isBlank()) city = address.path("town").asText();
                if (city.isBlank()) city = address.path("village").asText();
                if (city.isBlank()) city = address.path("county").asText();
                if (!city.isBlank()) return city;
            }
        } catch (Exception ignored) {
            // Weather still works when reverse geocoding is unavailable.
        }
        return String.format("%.4f, %.4f", latitude, longitude);
    }

    /**
     * Key-free fallback so local development works without exposing a weather
     * provider secret in the browser. OpenWeather remains the preferred source
     * when OPENWEATHER_API_KEY is configured.
     */
    private ResponseEntity<?> getOpenMeteoWeather(Double lat, Double lon, String city, Double baseWaterMl, Boolean outdoor) throws Exception {
        Double latitude = lat;
        Double longitude = lon;
        String locationName = city;

        if (latitude == null || longitude == null) {
            if (city == null || city.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Provide a location or city to load weather."));
            }
            String geocodeUrl = "https://geocoding-api.open-meteo.com/v1/search?name="
                    + URLEncoder.encode(city, StandardCharsets.UTF_8) + "&count=1&language=en&format=json";
            HttpResponse<String> geocodeResponse = httpClient.send(
                    HttpRequest.newBuilder().uri(URI.create(geocodeUrl)).GET().build(),
                    HttpResponse.BodyHandlers.ofString());
            if (geocodeResponse.statusCode() != 200) {
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("error", "Weather location lookup is unavailable."));
            }
            JsonNode locations = objectMapper.readTree(geocodeResponse.body()).path("results");
            if (!locations.isArray() || locations.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "City not found."));
            }
            JsonNode location = locations.get(0);
            latitude = location.path("latitude").asDouble();
            longitude = location.path("longitude").asDouble();
            locationName = location.path("name").asText(city);
        }

        if (lat != null && lon != null) {
            locationName = resolveCityName(latitude, longitude);
        } else if (locationName == null || locationName.trim().isEmpty()) {
            locationName = resolveCityName(latitude, longitude);
        }

        String forecastUrl = String.format("https://api.open-meteo.com/v1/forecast?latitude=%f&longitude=%f&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=precipitation_probability_max&timezone=auto", latitude, longitude);
        HttpResponse<String> forecastResponse = httpClient.send(
                HttpRequest.newBuilder().uri(URI.create(forecastUrl)).GET().build(),
                HttpResponse.BodyHandlers.ofString());
        if (forecastResponse.statusCode() != 200) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("error", "Weather provider is unavailable."));
        }
        JsonNode data = objectMapper.readTree(forecastResponse.body());
        JsonNode current = data.path("current");
        int temperature = (int) Math.round(current.path("temperature_2m").asDouble(25));
        int humidity = current.path("relative_humidity_2m").asInt(50);
        int windSpeed = (int) Math.round(current.path("wind_speed_10m").asDouble(0));
        int rainProbability = data.path("daily").path("precipitation_probability_max").path(0).asInt(
                current.path("precipitation").asDouble(0) > 0 ? 100 : 0);
        String condition = conditionFromWmoCode(current.path("weather_code").asInt(0));

        double tempFactor = temperature < 20 ? 0.9 : temperature <= 28 ? 1.0 : temperature <= 34 ? 1.1 : 1.2;
        double humFactor = humidity > 80 ? 0.9 : humidity >= 60 ? 1.0 : humidity >= 40 ? 1.1 : 1.25;
        double rainFactor = rainProbability >= 60 && Boolean.TRUE.equals(outdoor) ? 0.5 : rainProbability >= 30 ? 0.8 : 1.0;
        double sunlightFactor = condition.contains("cloud") ? 0.95 : condition.contains("rain") ? 0.9 : condition.contains("clear") ? 1.1 : 1.0;
        int recommended = (int) Math.max(0, Math.round(baseWaterMl * tempFactor * humFactor * rainFactor * sunlightFactor));

        Map<String, Object> result = new HashMap<>();
        result.put("location", locationName);
        result.put("temperature", temperature);
        result.put("humidity", humidity);
        result.put("condition", condition);
        result.put("rainProbability", rainProbability);
        result.put("windSpeed", windSpeed);
        result.put("updatedAt", Instant.now().toString());
        result.put("source", "Open-Meteo");
        result.put("watering", Map.of("baseWaterMl", baseWaterMl, "recommendedWaterMl", recommended, "factors", Map.of(
                "tempFactor", tempFactor, "humFactor", humFactor, "rainFactor", rainFactor, "sunlightFactor", sunlightFactor)));
        return ResponseEntity.ok(result);
    }

    @GetMapping
    public ResponseEntity<?> getWeather(
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lon,
            @RequestParam(required = false) String city,
            @RequestParam(defaultValue = "400") Double baseWaterMl,
            @RequestParam(defaultValue = "false") Boolean outdoor
    ) {
        try {
            if (weatherApiKey == null || weatherApiKey.trim().isEmpty()) {
                return getOpenMeteoWeather(lat, lon, city, baseWaterMl, outdoor);
            }

            Double latitude = lat;
            Double longitude = lon;

            if (latitude == null || longitude == null) {
                if (city == null || city.trim().isEmpty()) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "Provide either lat+lon or city query parameters."));
                }

                // Geocode city using OpenWeatherMap geocoding
                String geoUrl = String.format("https://api.openweathermap.org/geo/1.0/direct?q=%s&limit=1&appid=%s",
                        URLEncoder.encode(city, StandardCharsets.UTF_8), weatherApiKey);

                HttpRequest geoRequest = HttpRequest.newBuilder().uri(URI.create(geoUrl)).GET().build();
                HttpResponse<String> geoResponse = httpClient.send(geoRequest, HttpResponse.BodyHandlers.ofString());

                if (geoResponse.statusCode() != 200) {
                    return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                            .body(Map.of("error", "Geocoding provider returned error: " + geoResponse.statusCode()));
                }

                JsonNode geoJson = objectMapper.readTree(geoResponse.body());
                if (!geoJson.isArray() || geoJson.isEmpty()) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(Map.of("error", "City not found."));
                }

                latitude = geoJson.get(0).get("lat").asDouble();
                longitude = geoJson.get(0).get("lon").asDouble();
            }

            String onecall = String.format("https://api.openweathermap.org/data/2.5/weather?lat=%f&lon=%f&units=metric&appid=%s",
                    latitude, longitude, weatherApiKey);

            HttpRequest weatherRequest = HttpRequest.newBuilder().uri(URI.create(onecall)).GET().build();
            HttpResponse<String> weatherResponse = httpClient.send(weatherRequest, HttpResponse.BodyHandlers.ofString());

            if (weatherResponse.statusCode() != 200) {
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                        .body(Map.of("error", "Weather provider returned error: " + weatherResponse.statusCode()));
            }

            JsonNode data = objectMapper.readTree(weatherResponse.body());
            JsonNode current = data;

            int temperature = (int) Math.round(current.path("main").path("temp").asDouble(25.0));
            int humidity = current.path("main").path("humidity").asInt(50);
            
            String condition = "Unknown";
            JsonNode weatherArray = current.path("weather");
            if (weatherArray.isArray() && !weatherArray.isEmpty()) {
                condition = weatherArray.get(0).path("description").asText("Unknown");
            }

            // Current Weather reports measured rainfall rather than a forecast
            // probability. Treat current rain as a wet condition for watering.
            int rainProbability = current.path("rain").path("1h").asDouble(0.0) > 0 ? 100 : 0;
            int windSpeed = kmh(current.path("wind").path("speed").asDouble(0.0));
            String updatedAt = Instant.ofEpochSecond(current.path("dt").asLong(Instant.now().getEpochSecond())).toString();

            // Simple watering adjustment factors
            double tempFactor = 1.0;
            if (temperature < 20) tempFactor = 0.9;
            else if (temperature <= 28) tempFactor = 1.0;
            else if (temperature <= 34) tempFactor = 1.1;
            else tempFactor = 1.2;

            double humFactor = 1.0;
            if (humidity > 80) humFactor = 0.9;
            else if (humidity >= 60) humFactor = 1.0;
            else if (humidity >= 40) humFactor = 1.1;
            else humFactor = 1.25;

            double rainFactor = 1.0;
            if (rainProbability >= 60 && outdoor) rainFactor = 0.5;
            else if (rainProbability >= 30) rainFactor = 0.8;

            double sunlightFactor = 1.0;
            String cond = condition.toLowerCase();
            if (cond.contains("cloud")) sunlightFactor = 0.95;
            else if (cond.contains("rain") || cond.contains("shower")) sunlightFactor = 0.9;
            else if (cond.contains("clear") || cond.contains("sun")) sunlightFactor = 1.1;

            int recommended = (int) Math.max(0, Math.round(baseWaterMl * tempFactor * humFactor * rainFactor * sunlightFactor));

            Map<String, Object> result = new HashMap<>();
            result.put("location", lat != null && lon != null
                    ? resolveCityName(latitude, longitude)
                    : city);
            result.put("temperature", temperature);
            result.put("humidity", humidity);
            result.put("condition", condition);
            result.put("rainProbability", rainProbability);
            result.put("windSpeed", windSpeed);
            result.put("updatedAt", updatedAt);

            Map<String, Object> watering = new HashMap<>();
            watering.put("baseWaterMl", baseWaterMl);
            watering.put("recommendedWaterMl", recommended);
            watering.put("factors", Map.of(
                    "tempFactor", tempFactor,
                    "humFactor", humFactor,
                    "rainFactor", rainFactor,
                    "sunlightFactor", sunlightFactor
            ));
            result.put("watering", watering);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Unknown server error"));
        }
    }
}
