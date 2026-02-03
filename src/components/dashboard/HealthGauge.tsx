import { cn } from "@/lib/utils";

interface HealthGaugeProps {
  value: number;
  label: string;
  className?: string;
}

const HealthGauge = ({ value, label, className }: HealthGaugeProps) => {
  const getColor = (val: number) => {
    if (val >= 70) return { text: "text-success", bg: "bg-success", emoji: "😊" };
    if (val >= 40) return { text: "text-warning", bg: "bg-warning", emoji: "😐" };
    return { text: "text-destructive", bg: "bg-destructive", emoji: "😟" };
  };

  const colors = getColor(value);

  return (
    <div className={cn("text-center", className)}>
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="text-2xl">{colors.emoji}</span>
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>

      <div className={cn("text-5xl font-bold mb-4", colors.text)}>{value}%</div>

      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full transition-all duration-700 ease-out", colors.bg)} style={{ width: `${value}%` }} />
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        {value >= 70 ? "Akun dalam kondisi prima" : value >= 40 ? "Perlu ditingkatkan" : "Butuh perhatian segera"}
      </p>
    </div>
  );
};

export default HealthGauge;
