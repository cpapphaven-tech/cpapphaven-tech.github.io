// Weather Code Mapping (WMO codes from Open-Meteo)
const weatherStates = {
    0: { label: 'Clear Sky', icon: 'sun' },
    1: { label: 'Mainly Clear', icon: 'cloud-sun' },
    2: { label: 'Partly Cloudy', icon: 'cloud-sun' },
    3: { label: 'Overcast', icon: 'cloud' },
    45: { label: 'Foggy', icon: 'cloud-fog' },
    48: { label: 'Foggy', icon: 'cloud-fog' },
    51: { label: 'Light Drizzle', icon: 'cloud-drizzle' },
    61: { label: 'Slight Rain', icon: 'cloud-rain' },
    63: { label: 'Rain', icon: 'cloud-rain' },
    65: { label: 'Heavy Rain', icon: 'cloud-rain' },
    71: { label: 'Slight Snow', icon: 'cloud-snow' },
    80: { label: 'Rain Showers', icon: 'cloud-rain' },
    95: { label: 'Thunderstorm', icon: 'cloud-lightning' },
};

function getIcon(code) {
    return weatherStates[code]?.icon || 'cloud';
}

function getLabel(code) {
    return weatherStates[code]?.label || 'Cloudy';
}

// State
let currentCity = { name: 'Detecting...', lat: null, lon: null };
let savedCities = JSON.parse(localStorage.getItem('skycast_cities')) || [];

// DOM Elements
const cityInput = document.getElementById('city-input');
const citySuggestions = document.getElementById('city-suggestions');
const addCityBtn = document.getElementById('add-city-btn');
const locationName = document.getElementById('location-name');
const currentDate = document.getElementById('current-date');
const currentTemp = document.getElementById('current-temp');
const weatherDesc = document.getElementById('weather-description');
const windSpeed = document.getElementById('wind-speed');
const humidity = document.getElementById('humidity');
const rainProb = document.getElementById('rain-prob');
const hourlyList = document.getElementById('hourly-list');
const dailyList = document.getElementById('daily-list');
const savedCitiesList = document.getElementById('saved-cities-list');
const weatherIconLarge = document.getElementById('weather-icon-large');
// City Suggestions Dropdown Logic
let suggestionActiveIdx = -1;
let currentSuggestions = [];

cityInput.addEventListener('input', async (e) => {
    const query = cityInput.value.trim();
    if (query.length < 2) {
        citySuggestions.innerHTML = '';
        citySuggestions.style.display = 'none';
        return;
    }
    // Fetch suggestions
    try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
            currentSuggestions = data.results;
            citySuggestions.innerHTML = data.results.map((result, idx) => {
                const fullName = result.name + (result.admin1 ? ', ' + result.admin1 : '') + ', ' + result.country;
                return `<div class="suggestion-item" data-idx="${idx}">${fullName}</div>`;
            }).join('');
            citySuggestions.style.display = 'block';
        } else {
            citySuggestions.innerHTML = '<div class="suggestion-item disabled">No results</div>';
            citySuggestions.style.display = 'block';
        }
        suggestionActiveIdx = -1;
    } catch (err) {
        citySuggestions.innerHTML = '<div class="suggestion-item disabled">Error</div>';
        citySuggestions.style.display = 'block';
    }
});

citySuggestions.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('suggestion-item') && !e.target.classList.contains('disabled')) {
        const idx = parseInt(e.target.getAttribute('data-idx'));
        if (!isNaN(idx) && currentSuggestions[idx]) {
            selectSuggestion(idx);
        }
    }
});

cityInput.addEventListener('keydown', (e) => {
    const items = citySuggestions.querySelectorAll('.suggestion-item:not(.disabled)');
    if (!items.length) return;
    if (e.key === 'ArrowDown') {
        suggestionActiveIdx = (suggestionActiveIdx + 1) % items.length;
        updateSuggestionActive(items);
        e.preventDefault();
    } else if (e.key === 'ArrowUp') {
        suggestionActiveIdx = (suggestionActiveIdx - 1 + items.length) % items.length;
        updateSuggestionActive(items);
        e.preventDefault();
    } else if (e.key === 'Enter') {
        if (suggestionActiveIdx >= 0 && currentSuggestions[suggestionActiveIdx]) {
            selectSuggestion(suggestionActiveIdx);
            e.preventDefault();
        }
    }
});

cityInput.addEventListener('blur', () => {
    setTimeout(() => {
        citySuggestions.style.display = 'none';
    }, 120);
});

function updateSuggestionActive(items) {
    items.forEach((item, idx) => {
        if (idx === suggestionActiveIdx) {
            item.classList.add('active');
            item.scrollIntoView({ block: 'nearest' });
        } else {
            item.classList.remove('active');
        }
    });
}

function selectSuggestion(idx) {
    const result = currentSuggestions[idx];
    if (result) {
        const fullName = result.name + (result.admin1 ? ', ' + result.admin1 : '') + ', ' + result.country;
        cityInput.value = fullName;
        citySuggestions.innerHTML = '';
        citySuggestions.style.display = 'none';
        fetchWeather(result.latitude, result.longitude, fullName);
    }
}

// Initial Setup
async function init() {
    updateDate();
    await detectLocation();
    renderSavedCities();
}

function updateDate() {
    const d = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    currentDate.textContent = d.toLocaleDateString('en-US', options);
}

// 1. Detect Location via IP
async function detectLocation() {
    try {
        console.log("Detecting location via ipapi.co...");
        const res = await fetch('https://ipapi.co/json/');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();

        if (data.latitude && data.longitude) {
            currentCity = {
                name: data.city + ', ' + data.country_name,
                lat: data.latitude,
                lon: data.longitude
            };
            console.log("Location detected:", currentCity.name);
            await fetchWeather(currentCity.lat, currentCity.lon, currentCity.name);
        } else {
            console.warn("Invalid location data from API, using fallback.");
            await fetchWeather(40.7128, -74.0060, "New York, US");
        }
    } catch (err) {
        console.error("Location detection failed:", err);
        // Fallback to New York
        await fetchWeather(40.7128, -74.0060, "New York, US");
    }
}

// 2. Fetch Weather from Open-Meteo
async function fetchWeather(lat, lon, name) {
    console.log(`Fetching weather for: ${name} (${lat}, ${lon})`);
    locationName.textContent = name;

    // Use NWS API for US locations, fallback to Open-Meteo for others
    let isUS = false;
    if (name && name.match(/,\s*(US|United States)$/i)) {
        isUS = true;
    }

    if (isUS) {
        try {
            // Step 1: Get NWS gridpoint endpoint
            const pointsUrl = `https://api.weather.gov/points/${lat},${lon}`;
            const pointsRes = await fetch(pointsUrl);
            if (!pointsRes.ok) throw new Error(`NWS points error: ${pointsRes.status}`);
            const pointsData = await pointsRes.json();
            const forecastUrl = pointsData.properties.forecast;
            const hourlyUrl = pointsData.properties.forecastHourly;

            // Step 2: Get current and daily forecast
            const [forecastRes, hourlyRes] = await Promise.all([
                fetch(forecastUrl),
                fetch(hourlyUrl)
            ]);
            if (!forecastRes.ok || !hourlyRes.ok) throw new Error('NWS forecast fetch error');
            const forecastData = await forecastRes.json();
            const hourlyData = await hourlyRes.json();

            // NWS does not provide current weather as a separate endpoint, so use first period as current
            const current = hourlyData.properties.periods[0];
            const daily = forecastData.properties.periods.slice(0, 7);
            const hourly = hourlyData.properties.periods.slice(0, 24);

            updateCurrentWeatherNWS(current);
            updateHourlyForecastNWS(hourly);
            updateDailyForecastNWS(daily);
        } catch (err) {
            console.error("NWS Weather fetch failed:", err);
            currentTemp.textContent = "!";
            weatherDesc.textContent = "Error loading data";
        }
    } else {
        // fallback to Open-Meteo for non-US
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,precipitation_probability,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            if (data.current_weather) {
                updateCurrentWeather(data.current_weather, data.hourly);
                updateHourlyForecast(data.hourly);
                updateDailyForecast(data.daily);
            } else {
                console.error("No current weather data in response");
            }
        } catch (err) {
            console.error("Weather fetch failed:", err);
            currentTemp.textContent = "!";
            weatherDesc.textContent = "Error loading data";
        }
    }
}
// NWS-specific UI update functions
function updateCurrentWeatherNWS(current) {
    if (!current) return;
    currentTemp.textContent = Math.round(current.temperature);
    weatherDesc.textContent = current.shortForecast;
    windSpeed.textContent = current.windSpeed;
    humidity.textContent = '--'; // NWS hourly does not provide humidity directly
    rainProb.textContent = '--'; // NWS hourly does not provide rain prob directly
    // Use icon from NWS or fallback
    weatherIconLarge.innerHTML = `<img src="${current.icon}" alt="icon" style="width:64px;height:64px;">`;
}

function updateHourlyForecastNWS(hourly) {
    hourlyList.innerHTML = '';
    for (let i = 0; i < hourly.length; i++) {
        const h = hourly[i];
        const item = document.createElement('div');
        item.className = 'hourly-item';
        item.innerHTML = `
            <span class="time">${h.startTime.slice(11,16)}</span>
            <img src="${h.icon}" alt="icon" style="width:32px;height:32px;">
            <span class="temp">${Math.round(h.temperature)}°</span>
        `;
        hourlyList.appendChild(item);
    }
}

function updateDailyForecastNWS(daily) {
    dailyList.innerHTML = '';
    for (let i = 0; i < daily.length; i++) {
        const d = daily[i];
        const item = document.createElement('div');
        item.className = 'daily-item';
        item.innerHTML = `
            <span class="day">${d.name}</span>
            <div class="weather">
                <img src="${d.icon}" alt="icon" style="width:32px;height:32px;">
                <span>${d.shortForecast}</span>
            </div>
            <div class="temps">
                <span class="max">${Math.round(d.temperature)}°</span>
                <span class="min">${d.temperatureTrend ? d.temperatureTrend : ''}</span>
            </div>
        `;
        dailyList.appendChild(item);
    }
}

function updateCurrentWeather(current, hourly) {
    if (!current) return;

    console.log("Updating UI with current temp:", current.temperature);
    currentTemp.textContent = Math.round(current.temperature);
    weatherDesc.textContent = getLabel(current.weathercode);
    windSpeed.textContent = Math.round(current.windspeed) + ' km/h';

    // Get current hour's humidity and rain prob from hourly data
    const now = new Date();
    const nowIdx = now.getHours();

    if (hourly && hourly.relativehumidity_2m) {
        humidity.textContent = (hourly.relativehumidity_2m[nowIdx] || '--') + '%';
    }
    if (hourly && hourly.precipitation_probability) {
        rainProb.textContent = (hourly.precipitation_probability[nowIdx] || '--') + '%';
    }

    // Update large icon
    weatherIconLarge.innerHTML = `<i data-lucide="${getIcon(current.weathercode)}"></i>`;
    if (window.lucide) lucide.createIcons();
}

function updateHourlyForecast(hourly) {
    hourlyList.innerHTML = '';
    const now = new Date().getHours();

    // Show next 24 hours
    for (let i = now; i < now + 24; i++) {
        const temp = Math.round(hourly.temperature_2m[i]);
        const code = hourly.weathercode[i];
        const time = i % 24;
        const timeStr = time === 0 ? '12 AM' : time > 12 ? (time - 12) + ' PM' : time + ' AM';

        const item = document.createElement('div');
        item.className = 'hourly-item';
        item.innerHTML = `
            <span class="time">${timeStr}</span>
            <i data-lucide="${getIcon(code)}"></i>
            <span class="temp">${temp}°</span>
        `;
        hourlyList.appendChild(item);
    }
    lucide.createIcons();
}

function updateDailyForecast(daily) {
    dailyList.innerHTML = '';
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dayName = i === 0 ? 'Today' : days[date.getDay()];

        const maxTemp = Math.round(daily.temperature_2m_max[i]);
        const minTemp = Math.round(daily.temperature_2m_min[i]);
        const code = daily.weathercode[i];

        const item = document.createElement('div');
        item.className = 'daily-item';
        item.innerHTML = `
            <span class="day">${dayName}</span>
            <div class="weather">
                <i data-lucide="${getIcon(code)}"></i>
                <span>${getLabel(code)}</span>
            </div>
            <div class="temps">
                <span class="max">${maxTemp}°</span>
                <span class="min">${minTemp}°</span>
            </div>
        `;
        dailyList.appendChild(item);
    }
    lucide.createIcons();
}

// 3. Search logic (Geo-encoding via Open-Meteo)
async function searchCity(query) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=1&language=en&format=json`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
            const result = data.results[0];
            const fullName = result.name + (result.admin1 ? ', ' + result.admin1 : '') + ', ' + result.country;
            fetchWeather(result.latitude, result.longitude, fullName);
            return result;
        }
    } catch (err) {
        console.error("Search failed", err);
    }
}

// Keep enter key for manual search if no suggestion is selected
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && suggestionActiveIdx === -1) {
        searchCity(cityInput.value);
        cityInput.value = '';
        citySuggestions.innerHTML = '';
        citySuggestions.style.display = 'none';
    }
});

// 4. Saved Cities Logic
addCityBtn.addEventListener('click', async () => {
    const query = cityInput.value || locationName.textContent;
    const result = await searchCity(query);
    if (result) {
        const cityObj = {
            name: result.name,
            lat: result.latitude,
            lon: result.longitude,
            country: result.country_code
        };
        // Avoid duplicates
        if (!savedCities.some(c => c.name === cityObj.name)) {
            savedCities.push(cityObj);
            localStorage.setItem('skycast_cities', JSON.stringify(savedCities));
            renderSavedCities();
        }
    }
});

function renderSavedCities() {
    savedCitiesList.innerHTML = '';
    savedCities.forEach(city => {
        const card = document.createElement('div');
        card.className = 'city-card';
        card.innerHTML = `
            <div class="city-info">
                <h4>${city.name}</h4>
                <span>${city.country}</span>
            </div>
            <i data-lucide="chevron-right"></i>
        `;
        card.onclick = () => fetchWeather(city.lat, city.lon, city.name);
        savedCitiesList.appendChild(card);
    });
    lucide.createIcons();
}

init();
