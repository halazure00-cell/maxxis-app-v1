import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/layout/PageHeader";
import { MapPin, Filter, Map as MapIcon, Wifi, WifiOff, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import FullscreenMap from "@/components/map/FullscreenMap";
import HotspotCard from "@/components/map/HotspotCard";
import { useOfflineHotspots } from "@/hooks/useOfflineHotspots";
import { CATEGORY_CONFIG, AREA_CONFIG } from "@/data/bandungHotspots";
import DailyRecommendationDialog from "@/components/welcome/DailyRecommendationDialog";

const Map = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [showSafeOnly, setShowSafeOnly] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // Use offline-first hook
  const {
    hotspots,
    isLoading,
    isOnline,
    lastSync,
    totalCount,
    presetCount,
    communityCount,
    syncStatus,
    forceSync,
  } = useOfflineHotspots();

  // Filter hotspots
  const filteredHotspots = useMemo(() => {
    return hotspots.filter((h) => {
      if (selectedCategory && h.category !== selectedCategory) return false;
      if (selectedArea && h.area !== selectedArea) return false;
      if (showSafeOnly && !h.is_safe_zone) return false;
      return true;
    });
  }, [hotspots, selectedCategory, selectedArea, showSafeOnly]);

  // Check if currently peak hour
  const isCurrentlyPeakHour = (peakHours: string[] | null) => {
    if (!peakHours || peakHours.length === 0) return false;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    return peakHours.some((range) => {
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

  // Main category filters
  const categories = Object.entries(CATEGORY_CONFIG).slice(0, 8);
  
  // Area filters
  const areas = Object.entries(AREA_CONFIG);

  // Format last sync time
  const formatLastSync = () => {
    if (!lastSync) return "Belum sync";
    const diff = Date.now() - lastSync.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Baru saja";
    if (minutes < 60) return `${minutes}m lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}j lalu`;
    return `${Math.floor(hours / 24)}h lalu`;
  };

  return (
    <>
      {/* Daily Recommendation Dialog - shows once per session when entering Map */}
      <DailyRecommendationDialog />

      {/* Fullscreen Map Modal */}
      {showMap && (
        <FullscreenMap
          onClose={() => setShowMap(false)}
          hotspots={filteredHotspots}
        />
      )}

      <div className="p-4 space-y-4 pb-24">
        {/* Header with Status */}
        <div className="flex items-center justify-between">
          <PageHeader title="Hotspot" />
          
          {/* Sync Status Badge */}
          <div className="flex items-center gap-2">
            {syncStatus === "syncing" ? (
              <Badge variant="outline" className="gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Syncing...
              </Badge>
            ) : (
              <Badge 
                variant={isOnline ? "outline" : "secondary"}
                className={cn(
                  "gap-1",
                  !isOnline && "bg-warning/10 text-warning border-warning/30"
                )}
              >
                {isOnline ? (
                  <Wifi className="w-3 h-3 text-success" />
                ) : (
                  <WifiOff className="w-3 h-3" />
                )}
                {isOnline ? "Online" : "Offline"}
              </Badge>
            )}
          </div>
        </div>

        {/* Stats Card */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{totalCount}</p>
                <p className="text-sm text-muted-foreground">lokasi tersedia</p>
              </div>
              <div className="text-right text-xs text-muted-foreground space-y-1">
                <p>🏆 {presetCount} verified</p>
                {communityCount > 0 && <p>👥 {communityCount} community</p>}
                <p>⏱ {formatLastSync()}</p>
              </div>
              {isOnline && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={forceSync}
                  disabled={syncStatus === "syncing"}
                  className="h-8 w-8"
                >
                  <RefreshCw className={cn("w-4 h-4", syncStatus === "syncing" && "animate-spin")} />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Combined Filters Row */}
        <div className="flex gap-3">
          {/* Category Select */}
          <div className="flex-1">
            <Select
              value={selectedCategory || "all"}
              onValueChange={(value) => setSelectedCategory(value === "all" ? null : value)}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Kategori">
                  {selectedCategory ? (
                    <span className="flex items-center gap-1.5">
                      <span>{CATEGORY_CONFIG[selectedCategory]?.emoji}</span>
                      <span className="truncate">{CATEGORY_CONFIG[selectedCategory]?.label}</span>
                    </span>
                  ) : (
                    "Semua Kategori"
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      <span>{config.emoji}</span>
                      <span>{config.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Area Select */}
          <div className="flex-1">
            <Select
              value={selectedArea || "all"}
              onValueChange={(value) => setSelectedArea(value === "all" ? null : value)}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Wilayah">
                  {selectedArea ? AREA_CONFIG[selectedArea]?.label : "Semua Wilayah"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Wilayah</SelectItem>
                {areas.map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Safe Zone Toggle */}
        <button
          onClick={() => setShowSafeOnly(!showSafeOnly)}
          className={cn(
            "w-full flex items-center justify-between p-4 rounded-xl transition-all",
            showSafeOnly
              ? "bg-success/10 border-2 border-success/30"
              : "bg-muted border-2 border-transparent"
          )}
        >
          <div className="flex items-center gap-3">
            <Filter className={cn("w-5 h-5", showSafeOnly ? "text-success" : "text-muted-foreground")} />
            <span className="font-medium text-foreground">Hanya Zona Aman</span>
          </div>
          <div
            className={cn(
              "w-12 h-7 rounded-full transition-all flex items-center px-1",
              showSafeOnly ? "bg-success justify-end" : "bg-muted-foreground/30 justify-start"
            )}
          >
            <div className="w-5 h-5 bg-white rounded-full shadow-sm" />
          </div>
        </button>

        {/* Hotspot List */}
        <div className="space-y-3">
          {isLoading && !hotspots.length ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
                <p className="text-muted-foreground">Memuat data hotspot...</p>
              </CardContent>
            </Card>
          ) : filteredHotspots.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Tidak ada lokasi yang cocok</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Coba ubah filter kategori atau wilayah
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredHotspots.slice(0, 20).map((hotspot) => (
              <HotspotCard
                key={hotspot.id}
                hotspot={hotspot}
                isCurrentlyPeakHour={isCurrentlyPeakHour(hotspot.peak_hours)}
              />
            ))
          )}

          {/* Show more indicator */}
          {filteredHotspots.length > 20 && (
            <Card className="bg-muted/50">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  +{filteredHotspots.length - 20} lokasi lainnya
                </p>
                <p className="text-xs text-muted-foreground">
                  Buka peta untuk melihat semua
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tip */}
        <Card className="bg-primary/10 border-primary/30">
          <CardContent className="p-4">
            <p className="text-sm text-foreground">
              💡 Datang 15 menit sebelum jam sibuk untuk posisi terbaik!
            </p>
          </CardContent>
        </Card>

        {/* Offline Mode Notice */}
        {!isOnline && (
          <Card className="bg-warning/10 border-warning/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-warning" />
                <p className="text-sm text-foreground">
                  Mode offline - {totalCount} lokasi tersedia dari cache
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Floating Map Button */}
      <button
        onClick={() => setShowMap(true)}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center group"
        aria-label="Buka peta"
      >
        <MapIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
        <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
      </button>
    </>
  );
};

export default Map;
