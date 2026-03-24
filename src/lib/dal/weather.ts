// Sunset Harbor Marina — Fort Lauderdale, FL area
const MARINA_LAT = 26.12;
const MARINA_LON = -80.11;

export interface WeatherData {
  temperature: number; // °F
  windSpeed: number; // mph
  windDirection: number; // degrees
  weatherCode: number;
  isDay: boolean;
  humidity: number;
  waveHeight: number | null; // feet
  conditions: string;
  icon: string;
}

const WMO_CODES: Record<number, { label: string; icon: string }> = {
  0: { label: 'Clear sky', icon: 'sun' },
  1: { label: 'Mainly clear', icon: 'sun' },
  2: { label: 'Partly cloudy', icon: 'cloud-sun' },
  3: { label: 'Overcast', icon: 'cloud' },
  45: { label: 'Foggy', icon: 'cloud-fog' },
  48: { label: 'Rime fog', icon: 'cloud-fog' },
  51: { label: 'Light drizzle', icon: 'cloud-drizzle' },
  53: { label: 'Moderate drizzle', icon: 'cloud-drizzle' },
  55: { label: 'Dense drizzle', icon: 'cloud-drizzle' },
  61: { label: 'Slight rain', icon: 'cloud-rain' },
  63: { label: 'Moderate rain', icon: 'cloud-rain' },
  65: { label: 'Heavy rain', icon: 'cloud-rain' },
  80: { label: 'Rain showers', icon: 'cloud-rain' },
  81: { label: 'Moderate showers', icon: 'cloud-rain' },
  82: { label: 'Heavy showers', icon: 'cloud-rain' },
  95: { label: 'Thunderstorm', icon: 'cloud-lightning' },
  96: { label: 'Thunderstorm w/ hail', icon: 'cloud-lightning' },
  99: { label: 'Severe thunderstorm', icon: 'cloud-lightning' },
};

export async function getWeather(): Promise<WeatherData | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${MARINA_LAT}&longitude=${MARINA_LON}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,is_day&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FNew_York`;

    const res = await fetch(url, { next: { revalidate: 900 } }); // cache 15 min
    if (!res.ok) return null;

    const data = await res.json();
    const current = data.current;

    const code = current.weather_code ?? 0;
    const wmo = WMO_CODES[code] ?? { label: 'Unknown', icon: 'cloud' };

    return {
      temperature: Math.round(current.temperature_2m),
      windSpeed: Math.round(current.wind_speed_10m),
      windDirection: current.wind_direction_10m,
      weatherCode: code,
      isDay: current.is_day === 1,
      humidity: current.relative_humidity_2m,
      waveHeight: null, // Open-Meteo marine API is separate; skip for now
      conditions: wmo.label,
      icon: wmo.icon,
    };
  } catch {
    return null;
  }
}

export function windDirectionLabel(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}
