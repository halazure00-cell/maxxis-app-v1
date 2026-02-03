import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Sun, Cloud, CloudRain, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getTimeContext, isWeekendOrHoliday } from "@/hooks/useSmartRecommendation";
import { BANDUNG_HOTSPOTS } from "@/data/bandungHotspots";

interface Weather {
  temperature: number;
  condition: string;
  description: string;
  isGoodForDriving: boolean;
}

// Use sessionStorage so it resets when app is closed/reopened
const SESSION_KEY = "hotspot-recommendation-shown";

// Motivational messages based on time and day
const getMotivationalMessage = (
  timeOfDay: "pagi" | "siang" | "sore" | "malam",
  isWeekend: boolean
): { greeting: string; motivation: string } => {
  if (isWeekend) {
    switch (timeOfDay) {
      case "pagi":
        return {
          greeting: "Selamat pagi! 🌅",
          motivation: "Weekend ini banyak yang jalan-jalan. Saatnya berburu order di tempat wisata & mall!",
        };
      case "siang":
        return {
          greeting: "Halo, Driver! ☀️",
          motivation: "Siang weekend biasanya ramai di area kuliner dan mall. Gas terus!",
        };
      case "sore":
        return {
          greeting: "Selamat sore! 🌇",
          motivation: "Sore weekend golden hour! Banyak keluarga pulang dari jalan-jalan.",
        };
      case "malam":
        return {
          greeting: "Selamat malam! 🌙",
          motivation: "Malam minggu waktunya anak muda hangout. Fokus ke area cafe & hiburan!",
        };
    }
  } else {
    switch (timeOfDay) {
      case "pagi":
        return {
          greeting: "Selamat pagi! 🌅",
          motivation: "Jam sibuk pagi! Fokus ke area kampus, sekolah, dan perkantoran.",
        };
      case "siang":
        return {
          greeting: "Tetap semangat! 💪",
          motivation: "Jam makan siang = jam gacor! Banyak order food di area perkantoran.",
        };
      case "sore":
        return {
          greeting: "Selamat sore! 🌇",
          motivation: "Rush hour sore! Mahasiswa dan karyawan pulang. Siap-siap di kampus & kantor!",
        };
      case "malam":
        return {
          greeting: "Selamat malam! 🌙",
          motivation: "Malam hari fokus ke area kuliner dan cafe. Tetap hati-hati di jalan!",
        };
    }
  }
};

// Get weather icon
const WeatherIcon = ({ condition }: { condition: string }) => {
  switch (condition) {
    case "rain":
    case "showers":
    case "drizzle":
    case "thunderstorm":
      return <CloudRain className="h-4 w-4" />;
    case "clear":
      return <Sun className="h-4 w-4" />;
    default:
      return <Cloud className="h-4 w-4" />;
  }
};

// Get top category recommendation based on conditions
const getTopRecommendation = (
  timeOfDay: "pagi" | "siang" | "sore" | "malam",
  isWeekend: boolean,
  weather: Weather | null
): { category: string; emoji: string; reason: string }[] => {
  const recommendations: { category: string; emoji: string; reason: string }[] = [];
  
  // Weather-based recommendation
  if (weather) {
    const isRaining = ["rain", "showers", "drizzle", "thunderstorm"].includes(weather.condition);
    if (isRaining) {
      recommendations.push({
        category: "Mall & Indoor",
        emoji: "🏬",
        reason: "Cuaca hujan, fokus lokasi indoor",
      });
    }
  }
  
  // Time & day based recommendations
  if (isWeekend) {
    if (timeOfDay === "pagi" || timeOfDay === "siang") {
      recommendations.push({
        category: "Tempat Wisata",
        emoji: "🏞️",
        reason: "Weekend pagi-siang ramai wisatawan",
      });
    }
    recommendations.push({
      category: "Mall & Kuliner",
      emoji: "🍜",
      reason: "Weekend selalu ramai di pusat belanja",
    });
  } else {
    if (timeOfDay === "pagi") {
      recommendations.push({
        category: "Kampus & Sekolah",
        emoji: "🎓",
        reason: "Jam masuk kuliah dan sekolah",
      });
      recommendations.push({
        category: "Perkantoran",
        emoji: "🏢",
        reason: "Karyawan berangkat kerja",
      });
    } else if (timeOfDay === "siang") {
      recommendations.push({
        category: "Area Kuliner",
        emoji: "🍱",
        reason: "Jam makan siang kantor",
      });
    } else if (timeOfDay === "sore") {
      recommendations.push({
        category: "Kampus & Kantor",
        emoji: "🎓",
        reason: "Jam pulang kuliah dan kerja",
      });
      recommendations.push({
        category: "Stasiun",
        emoji: "🚉",
        reason: "Rush hour commuter",
      });
    } else {
      recommendations.push({
        category: "Kuliner & Cafe",
        emoji: "☕",
        reason: "Malam hari hangout spot",
      });
    }
  }
  
  return recommendations.slice(0, 3);
};

// Get nearby area suggestion
const getNearbyAreaSuggestion = (isWeekend: boolean, timeOfDay: string): string => {
  const hotspots = BANDUNG_HOTSPOTS;
  
  // Filter by relevant category for current conditions
  let relevantCategory = "mall";
  if (!isWeekend && (timeOfDay === "pagi" || timeOfDay === "sore")) {
    relevantCategory = "campus";
  } else if (timeOfDay === "siang") {
    relevantCategory = "foodcourt";
  }
  
  const relevantSpots = hotspots.filter(h => h.category === relevantCategory);
  const randomSpot = relevantSpots[Math.floor(Math.random() * relevantSpots.length)];
  
  return randomSpot?.name || "Paris Van Java";
};

export const DailyRecommendationDialog = () => {
  const [open, setOpen] = useState(false);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);

  const { timeOfDay } = getTimeContext();
  const { isWeekend, dayType } = isWeekendOrHoliday();
  const { greeting, motivation } = getMotivationalMessage(timeOfDay, isWeekend);
  const recommendations = getTopRecommendation(timeOfDay, isWeekend, weather);
  const suggestedSpot = getNearbyAreaSuggestion(isWeekend, timeOfDay);

  useEffect(() => {
    // Check if already shown this session
    const shownThisSession = sessionStorage.getItem(SESSION_KEY);
    
    if (shownThisSession === "true") {
      setLoading(false);
      return;
    }

    // Fetch weather and show dialog
    const fetchWeather = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-weather", {
          body: {},
        });
        
        if (!error && data) {
          setWeather(data);
        }
      } catch (e) {
        console.log("Weather fetch failed, continuing without weather data");
      } finally {
        setLoading(false);
        setOpen(true);
      }
    };

    fetchWeather();
  }, []);

  const handleClose = () => {
    // Mark as shown for this session only
    sessionStorage.setItem(SESSION_KEY, "true");
    setOpen(false);
  };

  if (loading) return null;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-sm mx-auto rounded-2xl">
        <AlertDialogHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="p-3 rounded-full bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
          </div>
          <AlertDialogTitle className="text-xl">
            {greeting}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base text-foreground/80">
            {motivation}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Context badges */}
        <div className="flex flex-wrap justify-center gap-2 my-3">
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            {timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)}
          </Badge>
          <Badge variant="secondary" className="gap-1">
            📅 {dayType === "weekend" ? "Akhir Pekan" : "Hari Kerja"}
          </Badge>
          {weather && (
            <Badge variant="secondary" className="gap-1">
              <WeatherIcon condition={weather.condition} />
              {weather.description}
            </Badge>
          )}
        </div>

        {/* Recommendations */}
        <div className="space-y-2 my-4">
          <p className="text-xs font-medium text-muted-foreground text-center">
            REKOMENDASI HARI INI
          </p>
          <div className="space-y-2">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50"
              >
                <span className="text-lg">{rec.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{rec.category}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {rec.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Suggested spot */}
        <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm">
            Coba mulai dari <strong>{suggestedSpot}</strong>
          </span>
        </div>

        <AlertDialogFooter className="mt-4">
          <AlertDialogAction 
            onClick={handleClose}
            className="w-full"
          >
            Mulai Narik! 🚀
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DailyRecommendationDialog;
