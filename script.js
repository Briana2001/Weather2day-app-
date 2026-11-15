const cityName = document.getElementById("city-name");
const countryName = document.getElementById("country-name");

const temperature = document.getElementById("temperature-value");
const weatherCondition = document.getElementById("weather-condition");
const weatherDescription = document.getElementById("weather-description");

const humidity = document.getElementById("humidity-value");
const windSpeed = document.getElementById("wind-speed-value");
const feelsLike = document.getElementById("feels-like-value");

const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city");
const currentLocationButton = document.getElementById("current-location-button");

const loadingState = document.getElementById("loading-state");
const errorMessage = document.getElementById("error-message");

function getWeatherDescription(code) {
const weatherCodes = {
0: ["Clear sky", "The sky is clear."],
1: ["Mainly clear", "Mostly clear skies."],
2: ["Partly cloudy", "Some clouds are visible."],
3: ["Overcast", "The sky is covered with clouds."],
45: ["Foggy", "Fog is reducing visibility."],
48: ["Foggy", "Depositing rime fog."],
51: ["Light drizzle", "Light drizzle is falling."],
53: ["Drizzle", "Drizzle is falling."],
55: ["Heavy drizzle", "Heavy drizzle is falling."],
61: ["Light rain", "Light rain is falling."],
63: ["Rainy", "Moderate rainfall."],
65: ["Heavy rain", "Heavy rainfall."],
71: ["Light snow", "Light snowfall."],
73: ["Snowy", "Moderate snowfall."],
75: ["Heavy snow", "Heavy snowfall."],
80: ["Rain showers", "Rain showers are expected."],
81: ["Rain showers", "Moderate rain showers."],
82: ["Heavy showers", "Heavy rain showers."],
95: ["Thunderstorm", "Thunderstorms are occurring."]
};

return weatherCodes[code] || [
"Unknown",
"Weather description unavailable."
];
}

function getWeatherCategory(code, windSpeed) {
if (code >= 95) return "rainy";
if (code >= 71 && code <= 77) return "snowy";
if (code >= 51 && code <= 67) return "rainy";
if (code >= 80 && code <= 82) return "rainy";
if (code === 45 || code === 48) return "cloudy";
if (windSpeed >= 30) return "windy";
if (code === 0 || code === 1) return "sunny";
if (code === 2 || code === 3) return "cloudy";

return "cloudy";
}

async function getCoordinates(city) {
const url = "https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1";

const response = await fetch(url);

if (!response.ok) {
throw new Error("Unable to find location.");
}

const data = await response.json();

if (!data.results || data.results.length === 0) {
throw new Error("City not found. Check the spelling.");
}

return data.results[0];
}

async function getWeather(latitude, longitude) {
const url = "https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto";

const response = await fetch(url);

if (!response.ok) {
throw new Error("Unable to retrieve weather.");
}

const data = await response.json();

return data.current;
}

function updateWeather2day(location, weatherData) {
const description = getWeatherDescription(weatherData.weather_code);

cityName.textContent = location.name;
countryName.textContent = location.country || "";

temperature.textContent = Math.round(weatherData.temperature_2m);

weatherCondition.textContent = description[0];
weatherDescription.textContent = description[1];

humidity.textContent = weatherData.relative_humidity_2m + "%";
windSpeed.textContent = weatherData.wind_speed_10m + " km/h";
feelsLike.textContent = Math.round(weatherData.apparent_temperature) + "°C";

const category = getWeatherCategory(
weatherData.weather_code,
weatherData.wind_speed_10m
);

document.body.dataset.weather = category;
}

async function searchWeather(city) {
loadingState.hidden = false;
errorMessage.hidden = true;

try {
const location = await getCoordinates(city);
const weatherData = await getWeather(
location.latitude,
location.longitude
);

updateWeather2day(location, weatherData);

localStorage.setItem("lastCity", location.name);

} catch (error) {
console.error("Weather2day error:", error);

errorMessage.textContent = error.message;
errorMessage.hidden = false;

} finally {
loadingState.hidden = true;
}
}

searchForm.addEventListener("submit", function (event) {
event.preventDefault();

const searchedCity = cityInput.value.trim();

if (searchedCity === "") {
errorMessage.textContent = "Please enter a city.";
errorMessage.hidden = false;
return;
}

searchWeather(searchedCity);
});

currentLocationButton.addEventListener("click", function () {
if (!navigator.geolocation) {
errorMessage.textContent = "Location is not supported by this browser.";
errorMessage.hidden = false;
return;
}

loadingState.hidden = false;
errorMessage.hidden = true;

navigator.geolocation.getCurrentPosition(
async function (position) {
try {
const weatherData = await getWeather(
position.coords.latitude,
position.coords.longitude
);

    updateWeather2day(
      { name: "Current location", country: "" },
      weatherData
    );

    localStorage.removeItem("lastCity");
  } catch (error) {
    console.error("Weather2day error:", error);
    errorMessage.textContent = error.message;
    errorMessage.hidden = false;
  } finally {
    loadingState.hidden = true;
  }
},
function () {
  loadingState.hidden = true;
  errorMessage.textContent = "Location access denied.";
  errorMessage.hidden = false;
}

);
});

const savedCity = localStorage.getItem("lastCity");

if (savedCity) {
searchWeather(savedCity);
} else {
searchWeather("Abuja");
}