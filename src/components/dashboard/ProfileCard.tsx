import { CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ProfileCardProps {
  name: string;
  avatarUrl?: string;
  joinDate?: string;
  attributeStatus: "active" | "warning" | "expired";
  attributeExpiry?: string;
}

const ProfileCard = ({
  name,
  avatarUrl,
  joinDate,
  attributeStatus,
  attributeExpiry,
}: ProfileCardProps) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
        return {
          label: "Atribut Aktif",
          icon: CheckCircle,
          className: "bg-success/20 text-success",
        };
      case "warning":
        return {
          label: "Perlu Diperbarui",
          icon: Clock,
          className: "bg-warning/20 text-warning",
        };
      case "expired":
        return {
          label: "Kadaluarsa",
          icon: AlertCircle,
          className: "bg-destructive/20 text-destructive",
        };
      default:
        return {
          label: "Unknown",
          icon: AlertCircle,
          className: "bg-muted text-muted-foreground",
        };
    }
  };

  const status = getStatusConfig(attributeStatus);
  const StatusIcon = status.icon;

  return (
    <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-5 text-primary-foreground">
      <div className="flex items-center gap-4">
        <Avatar className="w-16 h-16 border-3 border-primary-foreground/30 shadow-lg">
          <AvatarImage src={avatarUrl} alt={name} />
          <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xl font-bold">
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold truncate">{name || "Driver Maxim"}</h2>
          {joinDate && (
            <p className="text-sm opacity-80 mb-2">Sejak {joinDate}</p>
          )}
          <div className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
            status.className
          )}>
            <StatusIcon className="w-3.5 h-3.5" />
            {status.label}
          </div>
        </div>
      </div>

      {attributeStatus !== "active" && attributeExpiry && (
        <div className="mt-4 p-3 bg-primary-foreground/10 rounded-xl text-sm">
          ⚠️ Perbarui sebelum {attributeExpiry} untuk komisi 5%
        </div>
      )}
    </div>
  );
};

export default ProfileCard;
