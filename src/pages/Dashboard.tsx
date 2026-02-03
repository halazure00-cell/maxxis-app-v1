import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Wallet, Package, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import ProfileCard from "@/components/dashboard/ProfileCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  if (authLoading || profileLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  // Calculate health score
  const calculateHealthScore = () => {
    if (!profile) return 50;
    let score = 50;
    score += (profile.current_rating / 1) * 30;
    if (profile.attribute_status === "active") score += 20;
    else if (profile.attribute_status === "warning") score += 10;
    return Math.min(100, Math.round(score));
  };

  const healthScore = calculateHealthScore();

  const getHealthColor = (score: number) => {
    if (score >= 70) return "text-success";
    if (score >= 40) return "text-warning";
    return "text-destructive";
  };

  const getHealthBg = (score: number) => {
    if (score >= 70) return "bg-success";
    if (score >= 40) return "bg-warning";
    return "bg-destructive";
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(1)}jt`;
    if (value >= 1000) return `Rp ${(value / 1000).toFixed(0)}rb`;
    return `Rp ${value}`;
  };

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return "Selamat Pagi";
    if (hour < 15) return "Selamat Siang";
    if (hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{getGreeting()}</p>
          <h1 className="text-xl font-bold text-foreground">{profile?.full_name?.split(" ")[0] || "Driver"}</h1>
        </div>
        <p className="text-xs text-muted-foreground text-right">
          {new Date().toLocaleDateString("id-ID", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })}
        </p>
      </div>

      {/* Profile Card */}
      <ProfileCard
        name={profile?.full_name || "Driver"}
        avatarUrl={profile?.avatar_url || undefined}
        joinDate={
          profile?.join_date
            ? new Date(profile.join_date).toLocaleDateString("id-ID", { month: "long", year: "numeric" })
            : undefined
        }
        attributeStatus={profile?.attribute_status || "active"}
        attributeExpiry={profile?.attribute_expiry_date || undefined}
      />

      {/* Stats Grid - 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        {/* Health Score */}
        <Card className="cursor-pointer active:scale-[0.98] transition-transform" onClick={() => navigate("/finance")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className={cn("w-4 h-4", getHealthColor(healthScore))} />
              <span className="text-xs text-muted-foreground">Kesehatan</span>
            </div>
            <p className={cn("text-2xl font-bold", getHealthColor(healthScore))}>{healthScore}%</p>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
              <div
                className={cn("h-full transition-all", getHealthBg(healthScore))}
                style={{ width: `${healthScore}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Rating */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Rating</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{profile?.current_rating?.toFixed(2) || "0.00"}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {profile?.current_rating && profile.current_rating >= 0.95 ? "Sangat Baik ⭐" : "Perlu Ditingkatkan"}
            </p>
          </CardContent>
        </Card>

        {/* Earnings Today */}
        <Card className="cursor-pointer active:scale-[0.98] transition-transform" onClick={() => navigate("/finance")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-success" />
              <span className="text-xs text-muted-foreground">Hari Ini</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(profile?.earnings_today || 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Komisi {profile?.attribute_status === "active" ? "5%" : "15%"}
            </p>
          </CardContent>
        </Card>

        {/* Orders Today */}
        <Card className="cursor-pointer active:scale-[0.98] transition-transform" onClick={() => navigate("/finance")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-accent-foreground" />
              <span className="text-xs text-muted-foreground">Order</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{profile?.total_orders_today || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">order hari ini</p>
          </CardContent>
        </Card>
      </div>

      {/* Tips Banner */}
      <Card
        className="bg-gradient-to-r from-primary/10 to-warning/10 border-primary/20 cursor-pointer active:scale-[0.98] transition-transform"
        onClick={() => navigate("/tips")}
      >
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground">Tips Bintang 5 ⭐</p>
            <p className="text-sm text-muted-foreground">Tingkatkan rating & pendapatan</p>
          </div>
          <span className="text-primary font-medium text-sm">Lihat →</span>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
