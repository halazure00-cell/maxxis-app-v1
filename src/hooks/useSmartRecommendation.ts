import { useMemo } from "react";

interface Hotspot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: string;
  peak_hours: string[] | null;
  is_safe_zone: boolean;
  description?: string;
  area?: string;
}

interface Weather {
  temperature: number;
  condition: string;
  description: string;
  isGoodForDriving: boolean;
  windSpeed: number;
  precipitation?: number;
}

interface RecommendationContext {
  userLocation: [number, number] | null;
  fallbackCenter: [number, number];
  weather: Weather | null;
  maxDistanceKm?: number;
}

interface ScoredHotspot extends Hotspot {
  score: number;
  distance: number;
  relevanceReason: string[];
  isPeakNow: boolean;
  weatherBonus: number;
  timeBonus: number;
  dayTypeBonus: number;
}

// Kategori yang bagus saat hujan (indoor/covered)
const RAIN_FRIENDLY_CATEGORIES = ["mall", "hospital", "station", "office"];

// Kategori yang bagus saat cuaca cerah
const GOOD_WEATHER_CATEGORIES = ["tourism", "foodcourt", "campus", "school"];

// Peak hours berdasarkan kategori dan tipe hari
const CATEGORY_PEAK_PATTERNS: Record<
  string,
  {
    weekday: string[];
    weekend: string[];
    priority: number;
  }
> = {
  campus: {
    weekday: ["07:00-09:00", "11:00-13:00", "16:00-18:00"],
    weekend: ["09:00-12:00"],
    priority: 10,
  },
  school: {
    weekday: ["06:00-07:30", "11:00-12:00", "14:00-16:00"],
    weekend: [],
    priority: 8,
  },
  mall: {
    weekday: ["11:00-14:00", "17:00-21:00"],
    weekend: ["10:00-22:00"],
    priority: 9,
  },
  foodcourt: {
    weekday: ["11:00-14:00", "18:00-21:00"],
    weekend: ["11:00-22:00"],
    priority: 8,
  },
  station: {
    weekday: ["05:00-08:00", "16:00-20:00"],
    weekend: ["07:00-20:00"],
    priority: 10,
  },
  hospital: {
    weekday: ["07:00-12:00", "14:00-17:00"],
    weekend: ["08:00-12:00"],
    priority: 7,
  },
  office: {
    weekday: ["07:00-09:00", "16:00-19:00"],
    weekend: [],
    priority: 8,
  },
  tourism: {
    weekday: ["09:00-17:00"],
    weekend: ["08:00-18:00"],
    priority: 6,
  },
};

// Calculate distance between two points (Haversine formula)
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Check if today is weekend or holiday
export const isWeekendOrHoliday = (): { isWeekend: boolean; dayType: "weekday" | "weekend" } => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // TODO: Add Indonesian holiday checking if needed
  // const indonesianHolidays = [...];

  return {
    isWeekend,
    dayType: isWeekend ? "weekend" : "weekday",
  };
};

// Get current time context
export const getTimeContext = (): {
  hour: number;
  minute: number;
  timeOfDay: "pagi" | "siang" | "sore" | "malam";
  isRushHour: boolean;
} => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();

  let timeOfDay: "pagi" | "siang" | "sore" | "malam";
  if (hour >= 5 && hour < 11) timeOfDay = "pagi";
  else if (hour >= 11 && hour < 15) timeOfDay = "siang";
  else if (hour >= 15 && hour < 18) timeOfDay = "sore";
  else timeOfDay = "malam";

  // Rush hours: 6-9 AM and 4-8 PM
  const isRushHour = (hour >= 6 && hour < 9) || (hour >= 16 && hour < 20);

  return { hour, minute, timeOfDay, isRushHour };
};

// Check if time is within a range
const isTimeInRange = (currentHour: number, currentMinute: number, ranges: string[]): boolean => {
  const currentTime = currentHour * 60 + currentMinute;

  return ranges.some((range) => {
    if (range.includes("-")) {
      const [start, end] = range.split("-");
      const [startHour, startMin] = start.split(":").map(Number);
      const [endHour, endMin] = end.split(":").map(Number);
      const startTime = startHour * 60 + (startMin || 0);
      const endTime = endHour * 60 + (endMin || 0);
      return currentTime >= startTime && currentTime <= endTime;
    }
    return false;
  });
};

// Check if hotspot's peak hours match current time
export const isPeakHourNow = (peakHours: string[] | null): boolean => {
  if (!peakHours || peakHours.length === 0) return false;

  const { hour, minute } = getTimeContext();
  return isTimeInRange(hour, minute, peakHours);
};

// Get weather-based score modifier
const getWeatherModifier = (weather: Weather | null, category: string): { score: number; reason: string | null } => {
  if (!weather) return { score: 0, reason: null };

  const isRaining =
    weather.condition === "rain" ||
    weather.condition === "showers" ||
    weather.condition === "drizzle" ||
    (weather.precipitation && weather.precipitation > 0);

  const isHotDay = weather.temperature > 32;
  const isColdDay = weather.temperature < 20;

  // Rain scenario
  if (isRaining) {
    if (RAIN_FRIENDLY_CATEGORIES.includes(category)) {
      return {
        score: 25,
        reason: "🌧️ Lokasi indoor, cocok saat hujan",
      };
    }
    // Penalize outdoor locations during rain
    if (GOOD_WEATHER_CATEGORIES.includes(category)) {
      return {
        score: -15,
        reason: null,
      };
    }
    return { score: 0, reason: null };
  }

  // Good weather scenario
  if (weather.isGoodForDriving) {
    if (GOOD_WEATHER_CATEGORIES.includes(category)) {
      return {
        score: 20,
        reason: "☀️ Cuaca bagus untuk outdoor",
      };
    }
    return { score: 10, reason: null };
  }

  // Hot day - prefer indoor
  if (isHotDay && RAIN_FRIENDLY_CATEGORIES.includes(category)) {
    return {
      score: 15,
      reason: "🥵 Panas terik, lokasi ber-AC",
    };
  }

  return { score: 0, reason: null };
};

// Get time-based score modifier based on category patterns
const getTimeModifier = (
  category: string,
  dayType: "weekday" | "weekend"
): { score: number; reason: string | null } => {
  const pattern = CATEGORY_PEAK_PATTERNS[category];
  if (!pattern) return { score: 0, reason: null };

  const { hour, minute, isRushHour } = getTimeContext();
  const peakHours = dayType === "weekday" ? pattern.weekday : pattern.weekend;

  // No peak hours on this day type
  if (peakHours.length === 0) {
    return {
      score: -20,
      reason: dayType === "weekend" ? "📅 Jarang ramai di weekend" : null,
    };
  }

  // Check if current time matches category peak
  if (isTimeInRange(hour, minute, peakHours)) {
    return {
      score: pattern.priority * 3,
      reason: `⏰ Jam ramai ${category === "campus" ? "kampus" : category}`,
    };
  }

  // Bonus for rush hour on transport-related categories
  if (isRushHour && ["station", "office", "campus"].includes(category)) {
    return {
      score: 15,
      reason: "🚗 Jam sibuk commute",
    };
  }

  return { score: 0, reason: null };
};

// Get day type modifier
const getDayTypeModifier = (category: string, isWeekend: boolean): { score: number; reason: string | null } => {
  // Weekend bonuses
  if (isWeekend) {
    if (["mall", "tourism", "foodcourt"].includes(category)) {
      return {
        score: 25,
        reason: "🎉 Ramai di akhir pekan",
      };
    }
    if (["school", "office"].includes(category)) {
      return {
        score: -30,
        reason: null, // Don't show negative reason
      };
    }
  }
  // Weekday bonuses
  else {
    if (["campus", "school", "office"].includes(category)) {
      return {
        score: 20,
        reason: "📚 Hari aktif",
      };
    }
  }

  return { score: 0, reason: null };
};

// Get distance score
const getDistanceScore = (distanceKm: number): number => {
  if (distanceKm <= 0.5) return 50;
  if (distanceKm <= 1) return 40;
  if (distanceKm <= 2) return 30;
  if (distanceKm <= 3) return 20;
  if (distanceKm <= 5) return 10;
  return 0;
};

// Main recommendation hook
export const useSmartRecommendation = (
  hotspots: Hotspot[],
  context: RecommendationContext
): {
  scoredHotspots: ScoredHotspot[];
  summary: {
    totalSpots: number;
    topCategory: string | null;
    timeContext: string;
    dayType: string;
    weatherContext: string;
  };
} => {
  const { userLocation, fallbackCenter, weather, maxDistanceKm = 5 } = context;
  const { isWeekend, dayType } = isWeekendOrHoliday();
  const { timeOfDay, isRushHour } = getTimeContext();

  const scoredHotspots = useMemo(() => {
    const referencePoint = userLocation || fallbackCenter;

    const scored = hotspots.map((spot): ScoredHotspot => {
      const relevanceReason: string[] = [];
      let score = 0;

      // 1. Distance score (max 50 points)
      const distance = calculateDistance(referencePoint[0], referencePoint[1], spot.latitude, spot.longitude);
      const distanceScore = getDistanceScore(distance);
      score += distanceScore;

      if (distance <= 1) {
        relevanceReason.push("📍 Sangat dekat");
      }

      // 2. Peak hour check (max 30 points)
      const isPeakNow = isPeakHourNow(spot.peak_hours);
      let timeBonus = 0;
      if (isPeakNow) {
        timeBonus = 30;
        score += timeBonus;
        relevanceReason.push("🔥 Sedang ramai");
      }

      // 3. Category-time pattern match (max 30 points)
      const timeModifier = getTimeModifier(spot.category, dayType);
      score += timeModifier.score;
      timeBonus += Math.max(0, timeModifier.score);
      if (timeModifier.reason) {
        relevanceReason.push(timeModifier.reason);
      }

      // 4. Weather modifier (max 25 points)
      const weatherModifier = getWeatherModifier(weather, spot.category);
      const weatherBonus = Math.max(0, weatherModifier.score);
      score += weatherModifier.score;
      if (weatherModifier.reason) {
        relevanceReason.push(weatherModifier.reason);
      }

      // 5. Day type modifier (max 25 points)
      const dayTypeModifier = getDayTypeModifier(spot.category, isWeekend);
      const dayTypeBonus = Math.max(0, dayTypeModifier.score);
      score += dayTypeModifier.score;
      if (dayTypeModifier.reason) {
        relevanceReason.push(dayTypeModifier.reason);
      }

      // 6. Safety bonus (10 points)
      if (spot.is_safe_zone) {
        score += 10;
      } else {
        relevanceReason.push("⚠️ Zona waspada");
      }

      // 7. User location bonus (10 points if we have precise location)
      if (userLocation) {
        score += 10;
      }

      return {
        ...spot,
        score: Math.max(0, score),
        distance,
        relevanceReason,
        isPeakNow,
        weatherBonus,
        timeBonus,
        dayTypeBonus,
      };
    });

    // Filter by max distance and sort by score
    return scored
      .filter((spot) => spot.distance <= maxDistanceKm)
      .sort((a, b) => {
        // Primary sort: score descending
        if (b.score !== a.score) return b.score - a.score;
        // Secondary sort: distance ascending
        return a.distance - b.distance;
      });
  }, [hotspots, userLocation, fallbackCenter, weather, maxDistanceKm, isWeekend, dayType]);

  // Generate summary
  const summary = useMemo(() => {
    // Find top category
    const categoryCounts: Record<string, number> = {};
    scoredHotspots.slice(0, 10).forEach((spot) => {
      categoryCounts[spot.category] = (categoryCounts[spot.category] || 0) + 1;
    });

    const topCategory = Object.entries(categoryCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || null;

    // Time context string
    const timeContext = isRushHour
      ? `Jam sibuk ${timeOfDay}`
      : `${timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)}`;

    // Weather context string
    let weatherContext = "Cuaca tidak tersedia";
    if (weather) {
      weatherContext = weather.isGoodForDriving
        ? `${weather.description} - aman berkendara`
        : `${weather.description} - hati-hati`;
    }

    return {
      totalSpots: scoredHotspots.length,
      topCategory,
      timeContext,
      dayType: isWeekend ? "Akhir Pekan" : "Hari Kerja",
      weatherContext,
    };
  }, [scoredHotspots, isWeekend, timeOfDay, isRushHour, weather]);

  return { scoredHotspots, summary };
};

export default useSmartRecommendation;
