import { useEffect, useState, useCallback } from "react";
import L from "leaflet";
import { X, Navigation, Loader2, Cloud, CloudRain, Sun, Thermometer, MapPin, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useSmartRecommendation } from "@/hooks/useSmartRecommendation";
import "leaflet/dist/leaflet.css";

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

interface FullscreenMapProps {
  onClose: () => void;
  hotspots: Hotspot[];
}

const categoryEmojis: Record<string, string> = {
  campus: "🎓",
  mall: "🏬",
  school: "🏫",
  foodcourt: "🍜",
  station: "🚂",
  hospital: "🏥",
  tourism: "🎢",
  office: "🏢",
  ride: "🚗",
  food: "🍔",
  express: "📦",
  shop: "🛒",
  general: "📍",
};

const categoryColors: Record<string, string> = {
  campus: "#22c55e",
  mall: "#f59e0b",
  school: "#3b82f6",
  foodcourt: "#ef4444",
  station: "#8b5cf6",
  hospital: "#ec4899",
  tourism: "#06b6d4",
  office: "#64748b",
  ride: "#06b6d4",
  food: "#f97316",
  express: "#84cc16",
  shop: "#ec4899",
  general: "#6b7280",
};

const FullscreenMap = ({ onClose, hotspots }: FullscreenMapProps) => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapCenter] = useState<[number, number]>([-6.9175, 107.6191]); // Bandung
  const [selectedSpot, setSelectedSpot] = useState<Hotspot | null>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  // Fetch weather data
  const { data: weather, isLoading: weatherLoading } = useQuery({
    queryKey: ["weather", mapCenter[0], mapCenter[1]],
    queryFn: async (): Promise<Weather> => {
      const { data, error } = await supabase.functions.invoke("get-weather", {
        body: null,
      });
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Use smart recommendation hook
  const { scoredHotspots, summary } = useSmartRecommendation(hotspots, {
    userLocation,
    fallbackCenter: mapCenter,
    weather: weather || null,
    maxDistanceKm: 5,
  });

  // Initialize Leaflet map manually
  useEffect(() => {
    const container = document.getElementById("leaflet-map-container");
    if (!container || mapInstance) return;

    // Initialize map
    const map = L.map(container, {
      center: mapCenter,
      zoom: 13,
      zoomControl: false,
    });

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    setMapInstance(map);

    return () => {
      map.remove();
    };
  }, [mapCenter, mapInstance]);

  // Update markers when data changes
  useEffect(() => {
    if (!mapInstance) return;

    // Clear existing markers
    mapInstance.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Circle) {
        mapInstance.removeLayer(layer);
      }
    });

    // Add user location marker
    if (userLocation) {
      L.circle(userLocation, {
        radius: 5000,
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.1,
        weight: 2,
        dashArray: "5, 10",
      }).addTo(mapInstance);

      const userIcon = L.divIcon({
        html: `<div style="background: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 4px solid white; box-shadow: 0 0 0 2px #3b82f6, 0 2px 8px rgba(0,0,0,0.3);"></div>`,
        className: "user-location-marker",
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      L.marker(userLocation, { icon: userIcon }).bindPopup("📍 Lokasi Anda").addTo(mapInstance);
    }

    // Add hotspot markers with smart scoring visual
    scoredHotspots.forEach((spot, index) => {
      const emoji = categoryEmojis[spot.category] || "📍";
      const color = categoryColors[spot.category] || "#6b7280";
      const isTopRecommendation = index < 3;
      const borderWidth = isTopRecommendation ? "4px" : "3px";
      const size = isTopRecommendation ? 42 : 36;
      const fontSize = isTopRecommendation ? 18 : 16;

      const customIcon = L.divIcon({
        html: `<div style="
          background: ${color}; 
          width: ${size}px; 
          height: ${size}px; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          border: ${borderWidth} solid ${isTopRecommendation ? "#FFD600" : "white"}; 
          box-shadow: 0 2px 8px rgba(0,0,0,0.3)${isTopRecommendation ? ", 0 0 12px rgba(255,214,0,0.5)" : ""}; 
          font-size: ${fontSize}px;
        ">${emoji}</div>`,
        className: "custom-marker",
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      // Build popup content with relevance reasons
      const reasonsHtml =
        spot.relevanceReason.length > 0
          ? `<div style="margin-top: 6px; display: flex; flex-wrap: wrap; gap: 4px;">
            ${spot.relevanceReason
              .map(
                (r) =>
                  `<span style="display: inline-block; background: #f0f0f0; font-size: 10px; padding: 2px 6px; border-radius: 4px;">${r}</span>`
              )
              .join("")}
           </div>`
          : "";

      const popupContent = `
        <div style="min-width: 200px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span style="font-size: 18px;">${emoji}</span>
            <strong style="font-size: 14px;">${spot.name}</strong>
          </div>
          ${spot.isPeakNow ? '<span style="display: inline-block; background: #22c55e; color: white; font-size: 11px; padding: 2px 8px; border-radius: 9999px; margin-bottom: 4px;">🔥 RAMAI SEKARANG</span>' : ""}
          <p style="font-size: 12px; color: #666; margin-bottom: 4px;">${spot.description || spot.category}</p>
          <p style="font-size: 12px; color: #888;">📏 ${spot.distance.toFixed(1)} km • ⭐ Skor: ${spot.score}</p>
          ${!spot.is_safe_zone ? '<p style="font-size: 12px; color: #f97316; margin-top: 4px;">⚠️ Zona waspada</p>' : ""}
          ${reasonsHtml}
        </div>
      `;

      L.marker([spot.latitude, spot.longitude], { icon: customIcon })
        .bindPopup(popupContent)
        .on("click", () => setSelectedSpot(spot))
        .addTo(mapInstance);
    });
  }, [mapInstance, userLocation, scoredHotspots]);

  // Handle keyboard ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Get user location
  const handleGetLocation = () => {
    if (!navigator.geolocation) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        if (mapInstance) {
          mapInstance.flyTo([latitude, longitude], 14, { duration: 1 });
        }
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Fly to spot
  const handleSpotClick = useCallback(
    (spot: Hotspot) => {
      setSelectedSpot(spot);
      if (mapInstance) {
        mapInstance.flyTo([spot.latitude, spot.longitude], 16, { duration: 1 });
      }
    },
    [mapInstance]
  );

  const getWeatherIcon = () => {
    if (!weather) return <Cloud className="w-5 h-5" />;
    switch (weather.condition) {
      case "rain":
      case "showers":
      case "drizzle":
        return <CloudRain className="w-5 h-5 text-blue-500" />;
      case "clear":
        return <Sun className="w-5 h-5 text-yellow-500" />;
      default:
        return <Cloud className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Map Container - Native Leaflet */}
      <div id="leaflet-map-container" className="w-full h-full" />

      {/* Top Controls */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex justify-between items-start gap-3">
        {/* Weather & Context Card */}
        <Card className="bg-background/95 backdrop-blur shadow-lg flex-1 max-w-xs">
          <CardContent className="p-3 space-y-2">
            {/* Weather Row */}
            <div className="flex items-center gap-2">
              {weatherLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : weather ? (
                <>
                  {getWeatherIcon()}
                  <div className="flex-1">
                    <p className="text-sm font-semibold flex items-center gap-1">
                      <Thermometer className="w-3 h-3" />
                      {weather.temperature}°C
                    </p>
                  </div>
                  <Badge
                    variant={weather.isGoodForDriving ? "default" : "destructive"}
                    className="text-[10px] px-1.5 py-0.5"
                  >
                    {weather.isGoodForDriving ? "✓ Aman" : "⚠️ Hujan"}
                  </Badge>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">Cuaca N/A</span>
              )}
            </div>

            {/* Context Row */}
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {summary.dayType}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {summary.timeContext}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Close Button */}
        <Button
          onClick={onClose}
          size="icon"
          variant="destructive"
          className="h-12 w-12 rounded-full shadow-xl bg-destructive hover:bg-destructive/90 border-2 border-white"
          aria-label="Tutup peta"
        >
          <X className="w-6 h-6 text-destructive-foreground" />
        </Button>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-6 left-4 right-4 z-[1000] space-y-3">
        {/* Smart Recommendation Summary */}
        <Card className="bg-background/95 backdrop-blur shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Rekomendasi Smart
              </p>
              <Badge variant="outline" className="text-xs">
                {summary.totalSpots} spot
              </Badge>
            </div>

            {/* Context info */}
            <p className="text-[10px] text-muted-foreground mb-2">
              Berdasarkan lokasi, waktu ({summary.timeContext}), {summary.dayType.toLowerCase()}, dan cuaca
            </p>

            {scoredHotspots.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {scoredHotspots.slice(0, 5).map((spot, index) => {
                  const emoji = categoryEmojis[spot.category] || "📍";
                  const isTop = index === 0;

                  return (
                    <button
                      key={spot.id}
                      onClick={() => handleSpotClick(spot)}
                      className={cn(
                        "flex-shrink-0 px-3 py-2 rounded-lg border-2 transition-all text-left",
                        isTop && "ring-2 ring-primary/50",
                        selectedSpot?.id === spot.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className={isTop ? "text-lg" : ""}>{emoji}</span>
                        <div>
                          <p className="text-xs font-medium text-foreground truncate max-w-[100px]">{spot.name}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            📏 {spot.distance.toFixed(1)}km
                            {spot.isPeakNow && <span className="text-green-500">• 🔥</span>}
                          </p>
                          {isTop && spot.relevanceReason.length > 0 && (
                            <p className="text-[9px] text-primary truncate max-w-[100px]">{spot.relevanceReason[0]}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-2">
                {userLocation ? "Tidak ada spot dalam radius 5km" : "Aktifkan lokasi untuk rekomendasi akurat"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Location Button */}
        <Button
          onClick={handleGetLocation}
          disabled={isLocating}
          className="w-full h-12 bg-primary hover:bg-primary/90 shadow-lg"
        >
          {isLocating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Mencari lokasi...
            </>
          ) : (
            <>
              <Navigation className="w-5 h-5 mr-2" />
              {userLocation ? "Perbarui Lokasi Saya" : "Lihat Lokasi Saya"}
            </>
          )}
        </Button>
      </div>

      {/* ESC Hint */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[1001] pointer-events-none">
        <kbd className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground bg-background/95 border border-border rounded-lg shadow-lg backdrop-blur-sm">
          <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded font-mono">ESC</span>
          <span className="text-muted-foreground">untuk keluar</span>
        </kbd>
      </div>
    </div>
  );
};

export default FullscreenMap;
