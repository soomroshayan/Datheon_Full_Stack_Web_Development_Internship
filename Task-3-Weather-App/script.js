// Replace with your free OpenWeatherMap API key
const API_KEY = "2ea9062d4b01f983d8fbc5b99688d1beY";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

let currentUnit = "metric"; // "metric" = °C, "imperial" = °F
let lastSearchedCity = "Karachi";

const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const unitToggle = document.getElementById("unitToggle");

const loader = document.getElementById("loader");
const errorBox = document.getElementById("errorBox");
const errorText = document.getElementById("errorText");
const weatherDashboard = document.getElementById("weatherDashboard");

const cityNameEl = document.getElementById("cityName");
const dateTimeEl = document.getElementById("dateTime");
const currentTempEl = document.getElementById("currentTemp");
const weatherConditionEl = document.getElementById("weatherCondition");
const feelsLikeEl = document.getElementById("feelsLike");
const weatherIconEl = document.getElementById("weatherIcon");

const humidityValEl = document.getElementById("humidityVal");
const windValEl = document.getElementById("windVal");
const pressureValEl = document.getElementById("pressureVal");
const visibilityValEl = document.getElementById("visibilityVal");
const forecastGridEl = document.getElementById("forecastGrid");

function showLoading() {
  loader.classList.remove("hidden");
  errorBox.classList.add("hidden");
  weatherDashboard.classList.add("hidden");
}

function showError(message) {
  loader.classList.add("hidden");
  weatherDashboard.classList.add("hidden");
  errorText.textContent = message;
  errorBox.classList.remove("hidden");
}

function updateBackgroundTheme(weatherMain, iconCode) {
  const body = document.body;
  body.className = "";

  const isNight = iconCode.endsWith("n");
  const condition = weatherMain.toLowerCase();

  if (isNight) {
    body.classList.add("theme-night");
  } else if (condition.includes("rain") || condition.includes("drizzle") || condition.includes("thunderstorm")) {
    body.classList.add("theme-rainy");
  } else if (condition.includes("clear")) {
    body.classList.add("theme-sunny");
  } else if (condition.includes("cloud") || condition.includes("mist") || condition.includes("haze")) {
    body.classList.add("theme-cloudy");
  } else {
    body.classList.add("theme-default");
  }
}

async function fetchWeatherData(city) {
  if (!API_KEY || API_KEY === "YOUR_OPENWEATHERMAP_API_KEY") {
    showError("Please add your OpenWeatherMap API key in script.js first.");
    return;
  }

  showLoading();

  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(`${BASE_URL}/weather?q=${encodeURIComponent(city)}&units=${currentUnit}&appid=${API_KEY}`),
      fetch(`${BASE_URL}/forecast?q=${encodeURIComponent(city)}&units=${currentUnit}&appid=${API_KEY}`)
    ]);

    if (!currentRes.ok) {
      if (currentRes.status === 404) {
        throw new Error(`City "${city}" not found. Please verify the city name.`);
      } else if (currentRes.status === 401) {
        throw new Error("Invalid or inactive API key. Wait a few minutes if you just created it.");
      }
      throw new Error("Unable to fetch weather telemetry right now.");
    }

    const currentData = await currentRes.json();
    const forecastData = await forecastRes.json();

    lastSearchedCity = currentData.name;
    renderCurrentWeather(currentData);
    renderFiveDayForecast(forecastData.list);

    loader.classList.add("hidden");
    weatherDashboard.classList.remove("hidden");
  } catch (err) {
    showError(err.message || "Network error. Please check your internet connection.");
  }
}

function renderCurrentWeather(data) {
  const unitSymbol = currentUnit === "metric" ? "°C" : "°F";
  const windUnit = currentUnit === "metric" ? "m/s" : "mph";

  const weatherInfo = data.weather[0];
  updateBackgroundTheme(weatherInfo.main, weatherInfo.icon);

  cityNameEl.textContent = `${data.name}, ${data.sys.country}`;
  dateTimeEl.textContent = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  currentTempEl.textContent = `${Math.round(data.main.temp)}${unitSymbol}`;
  weatherConditionEl.textContent = weatherInfo.description;
  feelsLikeEl.textContent = `Feels like ${Math.round(data.main.feels_like)}${unitSymbol}`;
  weatherIconEl.src = `https://openweathermap.org/img/wn/${weatherInfo.icon}@2x.png`;
  weatherIconEl.alt = weatherInfo.description;

  humidityValEl.textContent = `${data.main.humidity}%`;
  windValEl.textContent = `${data.wind.speed} ${windUnit}`;
  pressureValEl.textContent = `${data.main.pressure} hPa`;
  visibilityValEl.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
}

function renderFiveDayForecast(list) {
  const unitSymbol = currentUnit === "metric" ? "°C" : "°F";

  // Pick one midday snapshot per day (next 5 days)
  const dailySnapshots = list
    .filter((item) => item.dt_txt.includes("12:00:00"))
    .slice(0, 5);

  // Fallback if API returns fewer 12:00 entries
  const selectedDays =
    dailySnapshots.length === 5
      ? dailySnapshots
      : list.filter((_, index) => index % 8 === 0).slice(0, 5);

  forecastGridEl.innerHTML = selectedDays
    .map((day) => {
      const dayName = new Date(day.dt * 1000).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric"
      });
      const icon = day.weather[0].icon;
      const desc = day.weather[0].description;
      const temp = Math.round(day.main.temp);

      return `
        <article class="forecast-card">
          <span class="forecast-day">${dayName}</span>
          <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}" />
          <span class="forecast-temp">${temp}${unitSymbol}</span>
          <span class="forecast-desc">${desc}</span>
        </article>
      `;
    })
    .join("");
}

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const query = cityInput.value.trim();
  if (query) {
    fetchWeatherData(query);
  }
});

unitToggle.addEventListener("click", () => {
  currentUnit = currentUnit === "metric" ? "imperial" : "metric";
  unitToggle.textContent = currentUnit === "metric" ? "°C" : "°F";
  fetchWeatherData(lastSearchedCity);
});

// Load default city on startup
fetchWeatherData(lastSearchedCity);