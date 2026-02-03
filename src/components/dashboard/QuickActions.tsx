import { useNavigate } from "react-router-dom";
import { 
  ClipboardList, 
  Calculator, 
  MapPin, 
  BookOpen,
  ChevronRight 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionItem {
  icon: React.ReactNode;
  label: string;
  description: string;
  to: string;
  color: string;
}

const actions: ActionItem[] = [
  {
    icon: <ClipboardList className="w-5 h-5" />,
    label: "Input Order",
    description: "Catat order hari ini",
    to: "/tracker",
    color: "bg-success/10 text-success",
  },
  {
    icon: <Calculator className="w-5 h-5" />,
    label: "Hitung Bersih",
    description: "Kalkulator pendapatan",
    to: "/calculator",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: <MapPin className="w-5 h-5" />,
    label: "Cari Hotspot",
    description: "Lokasi ramai order",
    to: "/map",
    color: "bg-accent/10 text-accent-foreground",
  },
  {
    icon: <BookOpen className="w-5 h-5" />,
    label: "Tips Bintang 5",
    description: "Panduan pelayanan",
    to: "/tips",
    color: "bg-warning/10 text-warning",
  },
];

const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground px-1">Aksi Cepat</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => navigate(action.to)}
            className="flex flex-col items-start gap-2 p-4 bg-card rounded-xl border border-border hover:bg-muted/50 transition-all active:scale-98 text-left"
          >
            <div className={cn("p-2.5 rounded-xl", action.color)}>
              {action.icon}
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">{action.label}</p>
              <p className="text-xs text-muted-foreground">
                {action.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
