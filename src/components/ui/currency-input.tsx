import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  showClear?: boolean;
}

const CurrencyInput = ({
  value,
  onChange,
  placeholder = "0",
  className,
  showClear = true,
}: CurrencyInputProps) => {
  const [displayValue, setDisplayValue] = useState("");
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (value > 0) {
      setDisplayValue(formatNumber(value));
    } else {
      setDisplayValue("");
    }
  }, [value]);

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat("id-ID").format(num);
  };

  const parseNumber = (str: string): number => {
    const cleaned = str.replace(/\D/g, "");
    return parseInt(cleaned, 10) || 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numValue = parseNumber(rawValue);
    
    // Shake if trying to input non-numeric
    if (rawValue && !/^[\d.,\s]*$/.test(rawValue)) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    
    onChange(numValue);
    setDisplayValue(numValue > 0 ? formatNumber(numValue) : "");
  };

  const handleClear = () => {
    onChange(0);
    setDisplayValue("");
  };

  return (
    <div className={cn("relative", className)}>
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
        Rp
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          "w-full h-14 pl-12 pr-12 text-xl font-semibold text-right",
          "rounded-xl border-2 border-input bg-background",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
          "placeholder:text-muted-foreground/50 placeholder:font-normal",
          "transition-all",
          shake && "animate-shake border-destructive"
        )}
      />
      {showClear && value > 0 && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors"
          aria-label="Hapus nilai"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
};

export { CurrencyInput };
