import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BANDUNG_HOTSPOTS, PresetHotspot } from "@/data/bandungHotspots";
import {
  saveHotspots,
  getAllHotspots,
  getLastSyncTime,
  setLastSyncTime,
  hasOfflineData,
  HotspotRecord,
} from "@/lib/indexedDB";
import { usePWA } from "@/hooks/usePWA";

export interface MergedHotspot {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  category: string;
  peak_hours: string[] | null;
  is_safe_zone: boolean;
  is_preset: boolean;
  verified: boolean;
  upvotes: number;
  tips?: string;
  area?: string;
  source: "preset" | "database" | "cached";
}

interface UseOfflineHotspotsReturn {
  hotspots: MergedHotspot[];
  isLoading: boolean;
  isOnline: boolean;
  lastSync: Date | null;
  totalCount: number;
  presetCount: number;
  communityCount: number;
  syncStatus: "synced" | "syncing" | "offline" | "error";
  refetch: () => void;
  forceSync: () => Promise<void>;
}

// Convert preset hotspot to merged format
const presetToMerged = (preset: PresetHotspot): MergedHotspot => ({
  id: preset.id,
  name: preset.name,
  description: preset.description,
  latitude: preset.latitude,
  longitude: preset.longitude,
  category: preset.category,
  peak_hours: preset.peak_hours,
  is_safe_zone: preset.is_safe_zone,
  is_preset: true,
  verified: true,
  upvotes: preset.upvotes,
  tips: preset.tips,
  area: preset.area,
  source: "preset",
});

// Convert cached record to merged format
const cachedToMerged = (cached: HotspotRecord): MergedHotspot => ({
  id: cached.id,
  name: cached.name,
  description: cached.description,
  latitude: cached.latitude,
  longitude: cached.longitude,
  category: cached.category,
  peak_hours: cached.peak_hours,
  is_safe_zone: cached.is_safe_zone,
  is_preset: cached.is_preset,
  verified: cached.verified,
  upvotes: cached.upvotes,
  tips: cached.tips,
  area: cached.area,
  source: "cached",
});

export const useOfflineHotspots = (): UseOfflineHotspotsReturn => {
  const { isOnline } = usePWA();
  const queryClient = useQueryClient();
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "offline" | "error">("synced");
  const [cachedHotspots, setCachedHotspots] = useState<MergedHotspot[]>([]);

  // Load cached data from IndexedDB on mount
  useEffect(() => {
    const loadCached = async () => {
      try {
        const syncTime = await getLastSyncTime();
        if (syncTime) {
          setLastSync(new Date(syncTime));
        }

        if (!isOnline) {
          const cached = await getAllHotspots();
          if (cached.length > 0) {
            setCachedHotspots(cached.map(cachedToMerged));
            setSyncStatus("offline");
          }
        }
      } catch (error) {
        console.error("Error loading cached hotspots:", error);
      }
    };

    loadCached();
  }, [isOnline]);

  // Fetch database hotspots when online
  const { data: dbHotspots, isLoading, refetch } = useQuery({
    queryKey: ["hotspots-offline"],
    queryFn: async () => {
      setSyncStatus("syncing");
      
      const { data, error } = await supabase
        .from("hotspots")
        .select("*")
        .order("upvotes", { ascending: false });

      if (error) {
        setSyncStatus("error");
        throw error;
      }

      // Map database hotspots
      const dbMapped: MergedHotspot[] = (data || []).map((h) => ({
        id: h.id,
        name: h.name,
        description: h.description,
        latitude: h.latitude,
        longitude: h.longitude,
        category: h.category || "general",
        peak_hours: h.peak_hours,
        is_safe_zone: h.is_safe_zone ?? true,
        is_preset: h.is_preset ?? false,
        verified: h.verified ?? false,
        upvotes: h.upvotes ?? 0,
        source: "database" as const,
      }));

      // Cache to IndexedDB for offline use
      const toCache: HotspotRecord[] = [
        // Cache preset data
        ...BANDUNG_HOTSPOTS.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          latitude: p.latitude,
          longitude: p.longitude,
          category: p.category,
          peak_hours: p.peak_hours,
          is_safe_zone: p.is_safe_zone,
          is_preset: true,
          verified: true,
          upvotes: p.upvotes,
          tips: p.tips,
          area: p.area,
          synced_at: Date.now(),
        })),
        // Cache database data
        ...dbMapped.map((h) => ({
          id: h.id,
          name: h.name,
          description: h.description,
          latitude: h.latitude,
          longitude: h.longitude,
          category: h.category,
          peak_hours: h.peak_hours,
          is_safe_zone: h.is_safe_zone,
          is_preset: h.is_preset,
          verified: h.verified,
          upvotes: h.upvotes,
          synced_at: Date.now(),
        })),
      ];

      try {
        await saveHotspots(toCache);
        await setLastSyncTime();
        setLastSync(new Date());
        setSyncStatus("synced");
      } catch (cacheError) {
        console.error("Error caching hotspots:", cacheError);
      }

      return dbMapped;
    },
    enabled: isOnline,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Force sync function
  const forceSync = useCallback(async () => {
    if (isOnline) {
      await refetch();
    }
  }, [isOnline, refetch]);

  // Merge all hotspot sources
  const mergedHotspots = useMemo(() => {
    const presetData = BANDUNG_HOTSPOTS.map(presetToMerged);
    
    // If offline and we have cached data, use cached
    if (!isOnline && cachedHotspots.length > 0) {
      // Deduplicate: cached data includes everything
      const idSet = new Set<string>();
      return cachedHotspots.filter((h) => {
        if (idSet.has(h.id)) return false;
        idSet.add(h.id);
        return true;
      });
    }

    // If online, merge preset + database
    const databaseData = dbHotspots || [];
    
    // Create a map for deduplication (database takes precedence for same IDs)
    const hotspotMap = new Map<string, MergedHotspot>();
    
    // Add presets first
    presetData.forEach((h) => {
      hotspotMap.set(h.id, h);
    });
    
    // Add/override with database data
    databaseData.forEach((h) => {
      // Only add if not a preset ID (avoid duplicates)
      if (!h.id.startsWith("campus-") && 
          !h.id.startsWith("mall-") && 
          !h.id.startsWith("station-") &&
          !h.id.startsWith("food-") &&
          !h.id.startsWith("hospital-") &&
          !h.id.startsWith("school-") &&
          !h.id.startsWith("tourism-") &&
          !h.id.startsWith("office-") &&
          !h.id.startsWith("caution-")) {
        hotspotMap.set(h.id, h);
      }
    });

    return Array.from(hotspotMap.values());
  }, [isOnline, cachedHotspots, dbHotspots]);

  // Calculate counts
  const presetCount = BANDUNG_HOTSPOTS.length;
  const communityCount = (dbHotspots || []).filter((h) => !h.is_preset).length;
  const totalCount = mergedHotspots.length;

  return {
    hotspots: mergedHotspots,
    isLoading,
    isOnline,
    lastSync,
    totalCount,
    presetCount,
    communityCount,
    syncStatus: isOnline ? syncStatus : "offline",
    refetch,
    forceSync,
  };
};
