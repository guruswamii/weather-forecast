const API_KEY = "629d1c1bfdbc444b36765abdc1a5fb06";
let hourlyChart = null;
let aqi = null;

document.getElementById('search-btn').addEventListener('click', () => {
    const city = document.getElementById('city-input').value;
    if (city) {
        fetchWeatherData(city);
    }
});


document.getElementById('location-btn').addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            fetchWeatherDataByCoords(latitude, longitude);
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
});


document.getElementById('city-input').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent the form from being submitted
        const city = document.getElementById('city-input').value;
        if (city) {
            fetchWeatherData(city);
        }
    }
});

async function fetchWeatherData(city) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'City not found');
        }

        if (!data) return; // Handling if it is empty 
        const { lat, lon } = data.coord;
        const sunriseSunsetData = await fetchSunriseSunsetData(lat, lon);
        console.log("Sunrise Sunset Data:", sunriseSunsetData); 
        updateCurrentWeather(data, sunriseSunsetData);
        fetchForecastData(lat, lon);
        fetchHourlyForecast(lat, lon); // Fetch hourly forecast data
        document.getElementById('city-input').value = '';  // Clear the input field after search
    } catch (error) {
        console.error('Error fetching weather data:', error);
        if (error.message.toLowerCase().includes('city not found')) {
            // Display a message to the user indicating that the city was not found
            alert('City not found. Please enter a valid city name.');
        }
    }
}

async function fetchSunriseSunsetData(lat, lon) {
    try {
        const response = await fetch(`https://api.sunrisesunset.io/json?lat=${lat}&lng=${lon}`);
        if (!response.ok) {
            throw new Error('Failed to fetch sunrise and sunset data');
        }
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error('Error fetching sunrise and sunset data:', error);
        return null;
    }
}
// Function to fetch weather data by coordinates (latitude and longitude)
async function fetchWeatherDataByCoords(lat, lon) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        const data = await response.json();
        if (!data) return; // Handle empty response
        const sunriseSunsetData = await fetchSunriseSunsetData(lat, lon); // Fetch sunrise and sunset data
        console.log("Sunrise Sunset Data:", sunriseSunsetData); // Log sunrise and sunset data
        updateCurrentWeather(data, sunriseSunsetData); // Update current weather details
        fetchForecastData(lat, lon); // Fetch forecast data
        fetchHourlyForecast(lat, lon); // Fetch hourly forecast data
    } catch (error) {
        console.error('Error fetching weather data:', error);
    }
}


// Function to generate suggestions based on temperature
function generateSuggestion(temp) {
    let suggestionText = '';
    let imageURL = '';

    if (temp < 0) {
        suggestionText = "It's freezing outside! Wear a heavy coat and stay warm.";
        imageURL = 'snow.jpg'; // Path to snow image
    } else if (temp < 10) {
        suggestionText = "It's quite cold. Make sure to wear a coat.";
        imageURL = 'snow.jpg'; // Path to snow image
    } else if (temp < 20) {
        suggestionText = "It's a bit chilly. A light jacket should be fine.";
        imageURL = 'snow.jpg'; // Path to rain image
    } else if (temp < 30) {
        suggestionText = "The weather is nice and warm. Dress comfortably.";
        imageURL = 'normal.jpg'; // Path to normal weather image
    } else {
        suggestionText = "It's hot outside! Stay hydrated and avoid the sun if possible.";
        imageURL = 'clearsky.jpg'; // Path to clear sky image
    }

    return { suggestionText, imageURL };
}

async function fetchAirQuality(lat, lon) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
        if (!response.ok) {
            throw new Error('Failed to fetch air quality data');
        }
        const data = await response.json();
        return data.list[0].main.aqi; // Extract the Air Quality Index (AQI) from the response
    } catch (error) {
        console.error('Error fetching air quality data:', error);
        return null;
    }
}
// Function to update current weather details on the page
function updateCurrentWeather(data, sunriseSunsetData) {
    const temperatureElement = document.querySelector('.temperature');
    const descriptionElement = document.querySelector('.description');
    const detailsElement = document.querySelector('.details');
    const feelsLikeElement = document.querySelector('.feels-like');
    const precipitationElement = document.querySelector('.precipitation');
    const humidityElement = document.querySelector('.humidity');
    const visibilityElement = document.querySelector('.visibility');
    const windElement = document.querySelector('.wind');
    const suggestionElement = document.querySelector('.suggestion'); // Add suggestion element

    if (!temperatureElement || !descriptionElement || !detailsElement || !feelsLikeElement || !precipitationElement || !humidityElement || !visibilityElement || !windElement || !suggestionElement) {
        console.error('One or more weather elements not found.');
        return;
    }

    const temp = Math.round(data.main.temp);
    temperatureElement.textContent = `${temp}°C`;
    descriptionElement.textContent = data.weather[0].description;
    detailsElement.textContent = `${data.name}, ${data.sys.country}`;

    feelsLikeElement.textContent = `${Math.round(data.main.feels_like)}°C`;
    precipitationElement.textContent = `${data.rain ? (data.rain['1h'] ? data.rain['1h'] : 0) : 0} mm`;
    humidityElement.textContent = `${data.main.humidity}%`;
    visibilityElement.textContent = `${data.visibility / 1000} km`;
    windElement.textContent = `${data.wind.speed} m/s, ${data.wind.deg}°`;

    const dateElement = document.querySelector('.date');
    if (dateElement) {
        const currentDate = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = currentDate.toLocaleDateString('en-US', options);
        dateElement.textContent = `Date: ${formattedDate}`;
    }
    if (sunriseSunsetData) {
        const sunriseElement = document.querySelector('.sunrise');
        const timezoneElement = document.querySelector('.timezone');
        const dayLengthElement = document.querySelector('.day-length');
        const sunsetElement = document.querySelector('.sunset');
        
        if (sunriseElement) sunriseElement.textContent = `Sunrise: ${sunriseSunsetData.sunrise}`;
        if (timezoneElement) timezoneElement.textContent = `Timezone: ${sunriseSunsetData.timezone}`;
        if (dayLengthElement) dayLengthElement.textContent = `Day Length: ${sunriseSunsetData.day_length}`;
        if (sunsetElement) sunsetElement.textContent = `Sunset: ${sunriseSunsetData.sunset}`;
    }

    const { suggestionText, imageURL } = generateSuggestion(temp); // Display the suggestion
    suggestionElement.textContent = suggestionText;

    // Add suggestion image
    const suggestionImageElement = document.createElement('img');
    suggestionImageElement.src = imageURL;
    suggestionImageElement.alt = 'Suggestion Image';

    suggestionImageElement.style.width = '250px'; 
    suggestionImageElement.style.height = '150px'; 

    // Position the image below the suggestion text
    suggestionImageElement.style.display = 'block'; 
    suggestionImageElement.style.margin = 'auto'; 
    suggestionImageElement.style.marginTop = '10px'; 

    suggestionElement.appendChild(suggestionImageElement);
    fetchAirQuality(data.coord.lat, data.coord.lon)
    .then(result => {
        aqi = result; 
        updateAirQuality(aqi); 
    })
    .catch(error => {
        console.error('Error fetching air quality data:', error);
    });
}
function updateAirQuality(aqiData) {
    if (aqiData !== null) {
        // Display air quality data
        const airQualityElement = document.querySelector('.air-quality');
        if (airQualityElement) {
            airQualityElement.textContent = `Air Quality Index (AQI): ${aqiData.aqi}`;
        }

        const airQualityChartElement = document.getElementById('air-quality-chart');
        if (airQualityChartElement) {
            if (window.airQualityChart) {
                window.airQualityChart.destroy();
            }

            // Clear previous chart
            airQualityChartElement.innerHTML = '';
        }

        const totalAQI = aqiData.list[0].components.co + aqiData.list[0].components.no + aqiData.list[0].components.no2 + aqiData.list[0].components.o3 + aqiData.list[0].components.so2 + aqiData.list[0].components.pm2_5 + aqiData.list[0].components.pm10;
        const coPercentage = (aqiData.list[0].components.co / totalAQI) * 100;
        const noPercentage = (aqiData.list[0].components.no / totalAQI) * 100;
        const no2Percentage = (aqiData.list[0].components.no2 / totalAQI) * 100;
        const o3Percentage = (aqiData.list[0].components.o3 / totalAQI) * 100;
        const so2Percentage = (aqiData.list[0].components.so2 / totalAQI) * 100;
        const pm25Percentage = (aqiData.list[0].components.pm2_5 / totalAQI) * 100;
        const pm10Percentage = (aqiData.list[0].components.pm10 / totalAQI) * 100;

        // Custom labels for air quality categories
        const labels = ['Good', 'Moderate', 'Unhealthy for Sensitive Groups', 'Unhealthy', 'Very Unhealthy', 'Hazardous (CO)', 'Hazardous (NO)'];

        // Create new pie chart
        const ctx = airQualityChartElement.getContext('2d');
        window.airQualityChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: [
                        coPercentage.toFixed(2), 
                        noPercentage.toFixed(2), 
                        no2Percentage.toFixed(2), 
                        o3Percentage.toFixed(2), 
                        so2Percentage.toFixed(2), 
                        pm25Percentage.toFixed(2), 
                        pm10Percentage.toFixed(2)
                    ],
                    backgroundColor: [
                        'rgb(0, 255, 0)', // Good (Green)
                        'rgb(255, 255, 0)', // Moderate (Yellow)
                        'rgb(255, 165, 0)', // Unhealthy for Sensitive Groups (Orange)
                        'rgb(255, 0, 0)', // Unhealthy (Red)
                        'rgb(128, 0, 128)', // Very Unhealthy (Purple)
                        'rgb(128, 0, 0)', // Hazardous (Maroon)
                        'rgb(0, 0, 255)' // Hazardous (Blue)
                    ],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Air Pollution',
                        font: {
                            size: 30 
                        }
                    },
                    legend: {
                        display: false 
                    }
                },
                aspectRatio: 2, 
                layout: {
                    padding: {
                        left: 20,
                        right: 20,
                        top:20,
                        bottom: 20
                    }
                },
                tooltips: {
                    callbacks: {
                        label: function(tooltipItem, data) {
                            var label = data.labels[tooltipItem.index] || '';

                            if (label) {
                                label += ': ';
                            }
                            label += data.datasets[0].data[tooltipItem.index] + '%';
                            return label;
                        }
                    }
                }
            }
        });
    }
}

async function fetchAirQuality(lat, lon) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
        if (!response.ok) {
            throw new Error('Failed to fetch air quality data');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching air quality data:', error);
        return null;
    }
}



async function fetchForecastData(lat, lon) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        if (!response.ok) {
            throw new Error('Failed to fetch forecast data');
        }
        const data = await response.json();
        updateForecast(data.list);
    } catch (error) {
        console.error('Error fetching forecast data:', error);
    }
}


async function fetchHourlyForecast(lat, lon) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        if (!response.ok) {
            throw new Error('Failed to fetch hourly forecast data');
        }
        const data = await response.json();
        updateHourlyForecast(data.list);
    } catch (error) {
        console.error('Error fetching hourly forecast data:', error);
    }
}

function updateHourlyForecast(hourlyData) {
    const hourlyForecastElement = document.querySelector('.hourly-table');
    hourlyForecastElement.innerHTML = ''; 

    if (Array.isArray(hourlyData)) {
        const table = document.createElement('table');
        table.classList.add('hourly-table');
        table.style.borderCollapse = 'collapse'; // Add border collapse style

        // Create table headers
        const headers = ['Time', 'Temperature (°C)', 'Feels Like (°C)', 'Wind Speed (m/s)', 'Humidity (%)', 'Visibility (km)'];
        const headerRow = document.createElement('tr');
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            th.style.border = '1px solid black'; // Add border to table headers
            th.style.padding = '8px'; // Add padding to table headers
            th.style.backgroundColor = '#009688'; // Header background color
            th.style.color = '#fff'; // Header text color
            th.style.fontWeight = 'bold'; // Bold font for headers
            th.style.textAlign = 'center'; // Center align header text
            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);

        hourlyData.slice(0, 8).forEach((hourly, index) => { 
            const date = new Date(hourly.dt * 1000);
            const hourOfDay = date.toLocaleTimeString('en-US', { hour: 'numeric' });

            const row = document.createElement('tr');

            const timeCell = document.createElement('td');
            timeCell.textContent = hourOfDay;
            timeCell.style.border = '1px solid black'; // Add border to table cells
            timeCell.style.padding = '8px'; // Add padding to table cells
            row.appendChild(timeCell);

            const tempCell = document.createElement('td');
            tempCell.textContent = `${Math.round(hourly.main.temp)}°`;
            tempCell.style.border = '1px solid black'; // Add border to table cells
            tempCell.style.padding = '8px'; // Add padding to table cells
            row.appendChild(tempCell);

            const feelsLikeCell = document.createElement('td');
            feelsLikeCell.textContent = `${Math.round(hourly.main.feels_like)}°`;
            feelsLikeCell.style.border = '1px solid black'; // Add border to table cells
            feelsLikeCell.style.padding = '8px'; // Add padding to table cells
            row.appendChild(feelsLikeCell);

            const windCell = document.createElement('td');
            windCell.textContent = `${hourly.wind.speed} m/s`;
            windCell.style.border = '1px solid black'; 
            windCell.style.padding = '8px'; 
            row.appendChild(windCell);

            const humidityCell = document.createElement('td');
            humidityCell.textContent = `${hourly.main.humidity}%`;
            humidityCell.style.border = '1px solid black';
            humidityCell.style.padding = '8px'; 
            row.appendChild(humidityCell);

            const visibilityCell = document.createElement('td');
            visibilityCell.textContent = `${hourly.visibility / 1000} km`;
            visibilityCell.style.border = '1px solid black'; 
            visibilityCell.style.padding = '8px'; 
            row.appendChild(visibilityCell);

            // Apply different background colors to alternate rows for better readability
            if (index % 2 === 0) {
                row.style.backgroundColor = '#f2f2f2'; 
            }

            table.appendChild(row);
        });

        hourlyForecastElement.appendChild(table);

        // Create chart
        const ctx = document.getElementById('hourly-chart').getContext('2d');

        const hourlyTemperatures = hourlyData.slice(0, 16).map(hourly => Math.round(hourly.main.temp));
        const hourlyFeelsLike = hourlyData.slice(0, 16).map(hourly => Math.round(hourly.main.feels_like));
        const hourlyWindSpeeds = hourlyData.slice(0, 16).map(hourly => hourly.wind.speed);
        const hourlyHumidity = hourlyData.slice(0, 16).map(hourly => hourly.main.humidity);
        const hourlyVisibility = hourlyData.slice(0, 16).map(hourly => hourly.visibility / 1000);
        const hourlyLabels = hourlyData.slice(0, 16).map(hourly => {
            const date = new Date(hourly.dt * 1000);
            return date.toLocaleTimeString('en-US', { hour: 'numeric' });
        });
        if(hourlyChart){
            hourlyChart.destroy();
        }

        hourlyChart=new Chart(ctx, {
            type: 'line',
            data: {
                labels: hourlyLabels,
                datasets: [
                    {
                        label: 'Temperature (°C)',
                        data: hourlyTemperatures,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                    },
                    {
                        label: 'Feels Like (°C)',
                        data: hourlyFeelsLike,
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                    },
                    {
                        label: 'Wind Speed (m/s)',
                        data: hourlyWindSpeeds,
                        borderColor: 'rgba(255, 206, 86, 1)',
                        backgroundColor: 'rgba(255, 206, 86, 0.2)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                    },
                    {
                        label: 'Humidity (%)',
                        data: hourlyHumidity,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                    },
                    {
                        label: 'Visibility (km)',
                        data: hourlyVisibility,
                        borderColor: 'rgba(153, 102, 255, 1)',
                        backgroundColor: 'rgba(153, 102, 255, 0.2)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: 'black',
                            font: {
                                size: 14
                            }
                        }
                    },
                    tooltip: {
                        enabled: true,
                        mode: 'index',
                        intersect: false,
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                        },
                        ticks: {
                            color: 'black',
                        }
                    },
                    y: {
                        display: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                        },
                        ticks: {
                            color: 'black',
                        }
                    }
                }
            }
        });
    } else {
        console.error('Hourly forecast data is not in the expected format.');
    }
}

// Function to update daily forecast on the page
function updateForecast(forecastList) {
    const dailyForecastElement = document.querySelector('.daily-list');
    dailyForecastElement.innerHTML = ''; 

    const groupedForecast = groupForecastByDay(forecastList);

    for (const dayForecast of groupedForecast) {
        const date = new Date(dayForecast[0].dt * 1000);
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        const dayName = date.toLocaleDateString('en-US', options);

        const forecastItem = document.createElement('div');
        forecastItem.classList.add('forecast-item');
        forecastItem.style.backgroundColor = 'lightblue';

        forecastItem.innerHTML = `
            <div class="day">${dayName}</div>
            <div class="weather-icon">
                <img src="http://openweathermap.org/img/wn/${dayForecast[0].weather[0].icon}.png" alt="${dayForecast[0].weather[0].description}">
            </div>
            <div class="temperature">${Math.round(dayForecast[0].main.temp)}°C</div>
        `;
        dailyForecastElement.appendChild(forecastItem);
    }
}

// Function to group forecast data by day
function groupForecastByDay(forecastList) {
    const groupedForecast = [];
    let currentDay = null;
    let dayForecast = [];

    for (const forecast of forecastList) {
        const date = new Date(forecast.dt * 1000);
        const day = date.getDay();

        if (currentDay === null) {
            currentDay = day;
        }

        if (day === currentDay) {
            dayForecast.push(forecast);
        } else {
            groupedForecast.push(dayForecast);
            dayForecast = [forecast];
            currentDay = day;
        }
    }

    if (dayForecast.length > 0) {
        groupedForecast.push(dayForecast);
    }

    return groupedForecast;
}

// Select the container element of the entire page
const pageContainer = document.querySelector('.container');

// Apply background color to the container
pageContainer.style.backgroundColor = "wheat";

document.body.style.background = "#182657";

