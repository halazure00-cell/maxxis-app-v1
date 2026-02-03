import { useState, useRef, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnhancedPanicButtonProps {
  onActivate: () => void;
  holdDuration?: number; // in milliseconds
  className?: string;
}

const EnhancedPanicButton = ({
  onActivate,
  holdDuration = 3000,
  className,
}: EnhancedPanicButtonProps) => {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isActivated, setIsActivated] = useState(false);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const vibrate = (pattern: number | number[]) => {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  const startHold = () => {
    if (isActivated) return;
    
    setIsHolding(true);
    setProgress(0);
    vibrate(50); // Initial haptic feedback

    const startTime = Date.now();
    
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / holdDuration) * 100, 100);
      setProgress(newProgress);
      
      // Haptic feedback at milestones
      if (newProgress >= 33 && newProgress < 34) vibrate(30);
      if (newProgress >= 66 && newProgress < 67) vibrate(30);
    }, 50);

    holdTimerRef.current = setTimeout(() => {
      clearInterval(progressIntervalRef.current!);
      setIsHolding(false);
      setProgress(100);
      setIsActivated(true);
      vibrate([100, 50, 100, 50, 200]); // Success pattern
      onActivate();
    }, holdDuration);
  };

  const cancelHold = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setIsHolding(false);
    setProgress(0);
  };

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  // Reset after activation
  useEffect(() => {
    if (isActivated) {
      const resetTimer = setTimeout(() => {
        setIsActivated(false);
        setProgress(0);
      }, 5000);
      return () => clearTimeout(resetTimer);
    }
  }, [isActivated]);

  const remainingSeconds = Math.ceil(((100 - progress) / 100) * (holdDuration / 1000));

  return (
    <button
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      onTouchCancel={cancelHold}
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      className={cn(
        "relative w-full overflow-hidden rounded-2xl transition-all select-none",
        "flex items-center justify-center gap-3 py-5",
        isActivated 
          ? "bg-success text-success-foreground" 
          : "bg-destructive text-destructive-foreground",
        isHolding && "scale-[0.98]",
        className
      )}
      disabled={isActivated}
      aria-label="Tombol darurat - tahan 3 detik untuk aktivasi"
    >
      {/* Progress overlay */}
      {isHolding && (
        <div
          className="absolute inset-0 bg-destructive-foreground/20 transition-all"
          style={{ width: `${progress}%` }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10 flex items-center gap-3">
        <AlertTriangle className={cn(
          "w-6 h-6",
          isHolding && "animate-pulse"
        )} />
        <div className="text-left">
          <p className="font-bold text-base">
            {isActivated 
              ? "✓ Bantuan Dipanggil" 
              : isHolding 
                ? `Tahan ${remainingSeconds} detik...` 
                : "Tombol Darurat"}
          </p>
          {!isActivated && !isHolding && (
            <p className="text-xs opacity-80">Tahan 3 detik untuk memanggil bantuan</p>
          )}
        </div>
      </div>

      {/* Circular progress indicator */}
      {isHolding && (
        <div className="absolute right-4 w-10 h-10">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.3"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${progress} 100`}
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}
    </button>
  );
};

export default EnhancedPanicButton;
