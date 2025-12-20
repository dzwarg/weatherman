/**
 * Mock data for tests
 */

export const mockWeatherResponse = {
  coord: { lon: -71.0589, lat: 42.3601 },
  weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
  base: 'stations',
  main: {
    temp: 45.5,
    feels_like: 38.2,
    temp_min: 42,
    temp_max: 48,
    pressure: 1015,
    humidity: 65,
  },
  visibility: 10000,
  wind: { speed: 12, deg: 270, gust: 18 },
  clouds: { all: 0 },
  dt: 1703001600,
  sys: { type: 2, id: 2013408, country: 'US', sunrise: 1702986234, sunset: 1703020567 },
  timezone: -18000,
  id: 4930956,
  name: 'Boston',
  cod: 200,
};

export const mockForecastResponse = {
  cod: '200',
  message: 0,
  cnt: 40,
  list: [
    {
      dt: 1703001600,
      main: { temp: 45.5, feels_like: 38.2, temp_min: 42, temp_max: 48, pressure: 1015, humidity: 65 },
      weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
      clouds: { all: 0 },
      wind: { speed: 12, deg: 270, gust: 18 },
      visibility: 10000,
      pop: 0.1,
      dt_txt: '2023-12-19 12:00:00',
    },
    {
      dt: 1703012400,
      main: { temp: 43.2, feels_like: 36.8, temp_min: 40, temp_max: 45, pressure: 1016, humidity: 68 },
      weather: [{ id: 801, main: 'Clouds', description: 'few clouds', icon: '02d' }],
      clouds: { all: 20 },
      wind: { speed: 10, deg: 260, gust: 15 },
      visibility: 10000,
      pop: 0.15,
      dt_txt: '2023-12-19 15:00:00',
    },
    {
      dt: 1703023200,
      main: { temp: 41.0, feels_like: 35.0, temp_min: 38, temp_max: 42, pressure: 1017, humidity: 70 },
      weather: [{ id: 802, main: 'Clouds', description: 'scattered clouds', icon: '03n' }],
      clouds: { all: 40 },
      wind: { speed: 8, deg: 250, gust: 12 },
      visibility: 10000,
      pop: 0.2,
      dt_txt: '2023-12-19 18:00:00',
    },
  ],
  city: {
    id: 4930956,
    name: 'Boston',
    coord: { lat: 42.3601, lon: -71.0589 },
    country: 'US',
    population: 667137,
    timezone: -18000,
    sunrise: 1702986234,
    sunset: 1703020567,
  },
};

export const mockOllamaResponse = {
  model: 'mistral:latest',
  created_at: '2025-12-19T10:30:00.000Z',
  response: 'Clothing recommendation response text here',
  done: true,
};

export const mockRecommendationRequest = {
  profile: {
    id: '4yo-girl',
    age: 4,
    gender: 'girl',
  },
  weather: {
    temperature: 35,
    feelsLike: 28,
    conditions: 'Rain',
    precipitationProbability: 80,
    windSpeed: 12,
    uvIndex: 2,
  },
  prompt: 'What should I wear to the playground today?',
  timeframe: 'morning',
};

export const mockRecommendationResponse = {
  id: 'test-recommendation-id',
  profileId: '4yo-girl',
  weatherData: {
    temperature: 35,
    feelsLike: 28,
    conditions: 'Rain',
    precipitationProbability: 80,
    windSpeed: 12,
    uvIndex: 2,
  },
  recommendations: {
    baseLayers: [{ item: 'Long-sleeve t-shirt', reason: 'To stay warm' }],
    outerwear: [{ item: 'Warm winter coat', reason: "It's cold and rainy" }],
    bottoms: [{ item: 'Pull-on pants or leggings', reason: 'Easy to put on and warm' }],
    accessories: [
      { item: 'Warm hat', reason: 'To keep your head warm' },
      { item: 'Gloves or mittens', reason: 'To keep your hands warm' },
    ],
    footwear: [{ item: 'Rain boots', reason: 'To keep your feet dry' }],
  },
  spokenResponse: "It's cold and rainy today! You should wear a long-sleeve shirt, warm coat, and rain boots.",
  confidence: 0.95,
  createdAt: '2025-12-19T10:30:00.000Z',
  feedbackProvided: false,
};
