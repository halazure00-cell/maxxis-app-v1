import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const NumberStepper = ({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  label,
  size = "md",
  className,
}: NumberStepperProps) => {
  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  const sizeClasses = {
    sm: {
      button: "h-10 w-10",
      value: "text-xl min-w-[3rem]",
      icon: "w-4 h-4",
    },
    md: {
      button: "h-12 w-12",
      value: "text-2xl min-w-[4rem]",
      icon: "w-5 h-5",
    },
    lg: {
      button: "h-14 w-14",
      value: "text-3xl min-w-[5rem]",
      icon: "w-6 h-6",
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {label && <span className="text-sm font-medium text-muted-foreground">{label}</span>}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleDecrement}
          disabled={value <= min}
          className={cn(
            sizes.button,
            "rounded-full border-2 border-border bg-background transition-all active:scale-95",
            "hover:border-destructive hover:bg-destructive/10 hover:text-destructive",
            value <= min && "opacity-40 cursor-not-allowed"
          )}
        >
          <Minus className={sizes.icon} />
        </Button>

        <div
          className={cn(
            sizes.value,
            "font-bold text-center tabular-nums px-2",
            "rounded-lg bg-primary/10 text-primary py-1"
          )}
        >
          {value}
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleIncrement}
          disabled={value >= max}
          className={cn(
            sizes.button,
            "rounded-full border-2 border-border bg-background transition-all active:scale-95",
            "hover:border-success hover:bg-success/10 hover:text-success",
            value >= max && "opacity-40 cursor-not-allowed"
          )}
        >
          <Plus className={sizes.icon} />
        </Button>
      </div>
    </div>
  );
};

export { NumberStepper };
