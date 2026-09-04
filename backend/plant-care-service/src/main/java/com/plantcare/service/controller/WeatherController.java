package com.plantcare.service.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
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
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/weather")
public class WeatherController {

    private static final Map<String, double[]> CITY_COORDINATES = new HashMap<>();

    static {
        CITY_COORDINATES.put("chennai", new double[]{13.0827, 80.2707});
        CITY_COORDINATES.put("coimbatore", new double[]{11.0168, 76.9558});
        CITY_COORDINATES.put("salem", new double[]{11.6643, 78.1460});
        CITY_COORDINATES.put("madurai", new double[]{9.9252, 78.1198});
        CITY_COORDINATES.put("trichy", new double[]{10.7905, 78.7047});
        CITY_COORDINATES.put("bengaluru", new double[]{12.9716, 77.5946});
        CITY_COORDINATES.put("bangalore", new double[]{12.9716, 77.5946});
        CITY_COORDINATES.put("mumbai", new double[]{19.0760, 72.8777});
        CITY_COORDINATES.put("delhi", new double[]{28.6139, 77.2090});
        CITY_COORDINATES.put("hyderabad", new double[]{17.3850, 78.4867});
        CITY_COORDINATES.put("london", new double[]{51.5074, -0.1278});
        CITY_COORDINATES.put("tokyo", new double[]{35.6762, 139.6503});
        CITY_COORDINATES.put("new york", new double[]{40.7128, -74.0060});
    }

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    private final String weatherApiKey;

    public WeatherController(@Value("${OPENWEATHER_API_KEY:${weather.api-key:}}") String weatherApiKey) {
        this.weatherApiKey = weatherApiKey;
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
                    Locale.US,
                    "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=%.6f&lon=%.6f&zoom=10",
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
                if (city.isBlank()) city = address.path("state_district").asText();
                if (!city.isBlank()) return city;
            }
        } catch (Exception ignored) {}
        return String.format(Locale.US, "%.4f, %.4f", latitude, longitude);
    }

    private ResponseEntity<?> getOpenMeteoWeather(Double lat, Double lon, String city, Double baseWaterMl, Boolean outdoor) {
        try {
            Double latitude = lat;
            Double longitude = lon;
            String locationName = null;

            if (latitude != null && longitude != null) {
                locationName = resolveCityName(latitude, longitude);
            } else {
                locationName = city;
                String cleanCityKey = (city != null && !city.isBlank()) ? city.trim().toLowerCase() : "chennai";
                if (CITY_COORDINATES.containsKey(cleanCityKey)) {
                    double[] coords = CITY_COORDINATES.get(cleanCityKey);
                    latitude = coords[0];
                    longitude = coords[1];
                    locationName = city.substring(0, 1).toUpperCase() + city.substring(1);
                } else {
                    String geocodeUrl = "https://geocoding-api.open-meteo.com/v1/search?name="
                            + URLEncoder.encode(cleanCityKey, StandardCharsets.UTF_8) + "&count=5&language=en&format=json";
                    HttpResponse<String> geocodeResponse = httpClient.send(
                            HttpRequest.newBuilder().uri(URI.create(geocodeUrl)).GET().build(),
                            HttpResponse.BodyHandlers.ofString());

                    boolean matched = false;
                    if (geocodeResponse.statusCode() == 200) {
                        JsonNode locations = objectMapper.readTree(geocodeResponse.body()).path("results");
                        if (locations.isArray() && !locations.isEmpty()) {
                            JsonNode location = locations.get(0);
                            latitude = location.path("latitude").asDouble(13.0827);
                            longitude = location.path("longitude").asDouble(80.2707);
                            locationName = location.path("name").asText(city);
                            matched = true;
                        }
                    }
                    if (!matched) {
                        latitude = 13.0827;
                        longitude = 80.2707;
                        locationName = (city != null && !city.isBlank()) ? city : "Chennai";
                    }
                }
            }

            if (locationName == null || locationName.trim().isEmpty()) {
                locationName = resolveCityName(latitude, longitude);
            }

            String forecastUrl = String.format(
                    Locale.US,
                    "https://api.open-meteo.com/v1/forecast?latitude=%.6f&longitude=%.6f&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=precipitation_probability_max&timezone=auto",
                    latitude, longitude);

            HttpResponse<String> forecastResponse = httpClient.send(
                    HttpRequest.newBuilder().uri(URI.create(forecastUrl)).GET().build(),
                    HttpResponse.BodyHandlers.ofString());

            if (forecastResponse.statusCode() == 200) {
                JsonNode data = objectMapper.readTree(forecastResponse.body());
                JsonNode current = data.path("current");
                int temperature = (int) Math.round(current.path("temperature_2m").asDouble(30.0));
                int humidity = current.path("relative_humidity_2m").asInt(75);
                int windSpeed = (int) Math.round(current.path("wind_speed_10m").asDouble(12.0));
                int rainProbability = data.path("daily").path("precipitation_probability_max").path(0).asInt(
                        current.path("precipitation").asDouble(0) > 0 ? 100 : 30);
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
        } catch (Exception ignored) {}

        return ResponseEntity.ok(createFallbackWeather(city != null ? city : "Chennai", baseWaterMl));
    }

    private Map<String, Object> createFallbackWeather(String cityName, Double baseWaterMl) {
        Map<String, Object> result = new HashMap<>();
        result.put("location", cityName);
        result.put("temperature", 30);
        result.put("humidity", 78);
        result.put("condition", "cloudy");
        result.put("rainProbability", 40);
        result.put("windSpeed", 13);
        result.put("updatedAt", Instant.now().toString());
        result.put("source", "System Preset");
        result.put("watering", Map.of("baseWaterMl", baseWaterMl, "recommendedWaterMl", (int) (baseWaterMl * 1.05), "factors", Map.of(
                "tempFactor", 1.05, "humFactor", 1.0, "rainFactor", 1.0, "sunlightFactor", 1.0)));
        return result;
    }

    @GetMapping
    public ResponseEntity<?> getWeather(
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lon,
            @RequestParam(required = false) String city,
            @RequestParam(defaultValue = "400") Double baseWaterMl,
            @RequestParam(defaultValue = "false") Boolean outdoor
    ) {
        return getOpenMeteoWeather(lat, lon, city, baseWaterMl, outdoor);
    }
}
