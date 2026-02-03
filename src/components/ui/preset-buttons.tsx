import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PresetButtonsProps {
  options: { label: string; value: number }[];
  selectedValue?: number;
  onSelect: (value: number) => void;
  className?: string;
  allowDeselect?: boolean;
}

const PresetButtons = ({
  options,
  selectedValue,
  onSelect,
  className,
  allowDeselect = true,
}: PresetButtonsProps) => {
  const handleClick = (value: number) => {
    // If same value clicked and allowDeselect, clear it
    if (allowDeselect && selectedValue === value) {
      onSelect(0);
    } else {
      onSelect(value);
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const isSelected = selectedValue === option.value;
        return (
          <Button
            key={option.value}
            type="button"
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => handleClick(option.value)}
            className={cn(
              "flex-1 min-w-fit transition-all active:scale-95",
              isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
            )}
          >
            {option.label}
            {isSelected && allowDeselect && (
              <span className="ml-1 text-xs opacity-70">✕</span>
            )}
          </Button>
        );
      })}
    </div>
  );
};

export { PresetButtons };
