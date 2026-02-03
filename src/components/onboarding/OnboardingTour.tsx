import { useOnboarding } from "@/hooks/useOnboarding";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  LayoutDashboard, 
  MapPin, 
  Wallet, 
  Shield,
  ChevronRight,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Ini ringkasan performa harian Anda. Lihat rating, pendapatan, dan statistik order.",
    icon: LayoutDashboard,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    id: "hotspot",
    title: "Spot Gacor",
    description: "Temukan lokasi strategis dengan potensi order tinggi di sekitar Anda.",
    icon: MapPin,
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    id: "finance",
    title: "Keuangan",
    description: "Catat order harian & hitung pendapatan bersih setelah komisi dan bensin.",
    icon: Wallet,
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    id: "safety",
    title: "Keamanan",
    description: "Tombol darurat & kontak emergency untuk keadaan mendesak saat berkendara.",
    icon: Shield,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
];

const OnboardingTour = () => {
  const { 
    showOnboarding, 
    currentStep, 
    totalSteps, 
    nextStep, 
    skipOnboarding 
  } = useOnboarding();

  if (!showOnboarding) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === totalSteps - 1;
  const StepIcon = step.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-sm animate-in slide-in-from-bottom-4 duration-300 shadow-xl">
        <CardContent className="p-6 space-y-5">
          {/* Header with skip */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {Array.from({ length: totalSteps }).map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    idx === currentStep ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={skipOnboarding}
              className="text-muted-foreground h-8 px-2"
            >
              <X className="w-4 h-4 mr-1" />
              Lewati
            </Button>
          </div>

          {/* Step Content */}
          <div className="text-center space-y-4">
            <div className={cn(
              "mx-auto w-16 h-16 rounded-2xl flex items-center justify-center",
              step.bgColor
            )}>
              <StepIcon className={cn("w-8 h-8", step.color)} />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>

          {/* Step indicator */}
          <p className="text-center text-xs text-muted-foreground">
            Langkah {currentStep + 1} dari {totalSteps}
          </p>

          {/* Actions */}
          <Button 
            onClick={nextStep} 
            className="w-full h-12 text-base font-semibold"
          >
            {isLastStep ? (
              "Mulai Sekarang"
            ) : (
              <>
                Lanjut
                <ChevronRight className="w-5 h-5 ml-1" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingTour;
