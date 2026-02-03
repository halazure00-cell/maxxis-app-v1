import { Clock, AlertTriangle, CheckCircle, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CATEGORY_CONFIG } from "@/data/bandungHotspots";
import { MergedHotspot } from "@/hooks/useOfflineHotspots";

interface HotspotCardProps {
  hotspot: MergedHotspot;
  isCurrentlyPeakHour: boolean;
  onClick?: () => void;
}

const HotspotCard = ({ hotspot, isCurrentlyPeakHour, onClick }: HotspotCardProps) => {
  const config = CATEGORY_CONFIG[hotspot.category as keyof typeof CATEGORY_CONFIG] || {
    label: "Umum",
    emoji: "📍",
    color: "#6b7280",
  };

  return (
    <Card
      className={cn(
        "transition-all cursor-pointer hover:shadow-md active:scale-[0.98]",
        !hotspot.is_safe_zone && "border-warning/50 bg-warning/5"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Category Emoji */}
          <span className="text-2xl flex-shrink-0">{config.emoji}</span>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header Row */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-semibold text-foreground truncate">
                {hotspot.name}
              </h3>
              
              {/* Peak Hour Badge */}
              {isCurrentlyPeakHour && (
                <Badge className="bg-success text-success-foreground text-xs px-2">
                  🔥 RAMAI
                </Badge>
              )}
              
              {/* Source Badge */}
              {hotspot.source === "preset" || hotspot.is_preset ? (
                <Badge variant="outline" className="text-xs px-1.5 gap-1 border-primary/30">
                  <CheckCircle className="w-3 h-3 text-primary" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs px-1.5 gap-1 border-muted-foreground/30">
                  <Users className="w-3 h-3" />
                  Community
                </Badge>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-2">
              {hotspot.description || hotspot.category}
            </p>

            {/* Tips (if available) */}
            {hotspot.tips && (
              <p className="text-xs text-primary/80 bg-primary/5 rounded-md px-2 py-1 mb-2 line-clamp-2">
                💡 {hotspot.tips}
              </p>
            )}

            {/* Peak Hours */}
            {hotspot.peak_hours && hotspot.peak_hours.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{hotspot.peak_hours.join(", ")}</span>
              </div>
            )}

            {/* Warning for unsafe zones */}
            {!hotspot.is_safe_zone && (
              <div className="flex items-center gap-1.5 mt-2 text-warning text-xs font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Zona waspada</span>
              </div>
            )}

            {/* Upvotes */}
            {hotspot.upvotes > 0 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <span>👍</span>
                <span>{hotspot.upvotes} driver merekomendasikan</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HotspotCard;
