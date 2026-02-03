import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/layout/PageHeader";
import ProfileEditor from "@/components/profile/ProfileEditor";
import PhoneEditor from "@/components/profile/PhoneEditor";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { 
  LogOut, 
  Mail, 
  Calendar,
  Star,
  CheckCircle,
  AlertCircle,
  DoorOpen
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const Profile = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSignOutClick = () => {
    setShowSignOutConfirm(true);
  };

  const handleSignOutConfirm = async () => {
    await signOut();
    toast({
      title: "Berhasil Keluar",
      description: "Sampai jumpa lagi!",
    });
    navigate("/auth", { replace: true });
  };

  if (authLoading || profileLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const infoItems = [
    { icon: Mail, label: "Email", value: user?.email || "-" },
    { icon: Calendar, label: "Bergabung", value: formatDate(profile?.join_date || null) },
    { icon: Star, label: "Rating", value: profile?.current_rating?.toFixed(2) || "0.00" },
  ];

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <PageHeader title="Profil" />

      {/* Profile Card with Avatar Editor */}
      <Card className="bg-gradient-to-br from-primary to-accent overflow-hidden">
        <CardContent className="p-6 text-center text-primary-foreground">
          <div className="flex justify-center mb-6">
            <ProfileEditor
              userId={user?.id || ""}
              currentAvatarUrl={profile?.avatar_url}
              fullName={profile?.full_name || "Driver"}
            />
          </div>
          <h2 className="text-2xl font-bold mb-1">
            {profile?.full_name || "Driver Maxim"}
          </h2>
          <p className="text-sm opacity-80">{user?.email}</p>
        </CardContent>
      </Card>

      {/* Info Grid - 2x2 with Phone Editor integrated */}
      <div className="grid grid-cols-2 gap-3">
        {/* Phone Editor - takes first slot */}
        <PhoneEditor 
          userId={user?.id || ""} 
          currentPhone={profile?.phone} 
        />
        
        {/* Other info items */}
        {infoItems.map((item, idx) => (
          <Card key={idx}>
            <CardContent className="p-4">
              <item.icon className="w-5 h-5 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="font-semibold text-foreground truncate">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Attribute Status */}
      <Card className={cn(
        "border-2",
        profile?.attribute_status === "active" 
          ? "border-success/50 bg-success/5" 
          : "border-warning/50 bg-warning/5"
      )}>
        <CardContent className="p-4 flex items-center gap-4">
          {profile?.attribute_status === "active" ? (
            <CheckCircle className="w-10 h-10 text-success flex-shrink-0" />
          ) : (
            <AlertCircle className="w-10 h-10 text-warning flex-shrink-0" />
          )}
          <div>
            <p className="font-semibold text-foreground">
              {profile?.attribute_status === "active" 
                ? "Atribut Aktif" 
                : "Perlu Diperbarui"}
            </p>
            <p className="text-sm text-muted-foreground">
              {profile?.attribute_status === "active"
                ? `Komisi 5% • Hingga ${formatDate(profile?.attribute_expiry_date || null)}`
                : "Perbarui untuk komisi 5%"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Button 
        variant="outline" 
        className="w-full h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={handleSignOutClick}
      >
        <LogOut className="w-4 h-4 mr-2" />
        Keluar
      </Button>

      {/* Sign Out Confirmation Dialog */}
      <ConfirmDialog
        open={showSignOutConfirm}
        onOpenChange={setShowSignOutConfirm}
        title="Keluar dari Akun?"
        description="Anda akan keluar dari aplikasi. Data tersimpan tetap aman."
        confirmLabel="Ya, Keluar"
        cancelLabel="Batal"
        variant="destructive"
        onConfirm={handleSignOutConfirm}
        icon={<DoorOpen className="w-6 h-6 text-destructive" />}
      />
    </div>
  );
};

export default Profile;
