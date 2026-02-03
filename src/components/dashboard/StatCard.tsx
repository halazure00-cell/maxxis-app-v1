import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtext?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  subtext,
  trend,
  className 
}: StatCardProps) => {
  return (
    <div className={cn("stat-card", className)}>
      <div className="flex items-start justify-between mb-2">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-medium px-1.5 py-0.5 rounded",
            trend === "up" && "bg-success/20 text-success",
            trend === "down" && "bg-destructive/20 text-destructive",
            trend === "neutral" && "bg-muted text-muted-foreground"
          )}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "—"}
          </span>
        )}
      </div>
      <p className="stat-value">{value}</p>
      <p className="stat-label">{label}</p>
      {subtext && (
        <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
      )}
    </div>
  );
};

export default StatCard;
