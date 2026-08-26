# Plant Care Tracker

A frontend-only React.js hackathon application for plant watering, care history, notes, streaks, and analytics.

## Run

```bash
pnpm install
pnpm dev
```

The app uses localStorage-backed mock data through `src/services/api.js`, so it is ready to swap to a Node.js + Express + MongoDB API later.

## Trefle plant species search

The Add Plant search uses Trefle to find common and scientific plant names. Create a Trefle access token, set it before starting the plant-care service, then restart that service:

```powershell
$env:TREFLE_API_TOKEN = "your-trefle-token"
java -jar backend/plant-care-service/target/plant-care-service-1.0.0.jar
```

The token is kept on the server and is never sent to the browser.

## Live weather

The dashboard's weather card uses OpenWeather. Create an API key in your
OpenWeather account, then set it in the same terminal before starting (or
restarting) the plant-care service:

```powershell
$env:OPENWEATHER_API_KEY = "your-openweather-api-key"
java -jar backend/plant-care-service/target/plant-care-service-1.0.0.jar
```

`WEATHER_API_KEY` is also supported for existing setups. Do not put either key
in the React app or commit it to source control.
