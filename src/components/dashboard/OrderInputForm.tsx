import { useState, useEffect } from "react";
import {
  MapPin,
  Navigation,
  Save,
  Loader2,
  Car,
  UtensilsCrossed,
  Package,
  ShoppingBag,
  Fuel,
  Clock,
  CheckCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CurrencyInput } from "@/components/ui/currency-input";
import { PresetButtons } from "@/components/ui/preset-buttons";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const orderTypes = [
  { id: "ride", label: "Ride", icon: Car },
  { id: "food", label: "Food", icon: UtensilsCrossed },
  { id: "express", label: "Express", icon: Package },
  { id: "shop", label: "Shop", icon: ShoppingBag },
];

const pricePresets = [
  { label: "10rb", value: 10000 },
  { label: "15rb", value: 15000 },
  { label: "20rb", value: 20000 },
  { label: "25rb", value: 25000 },
];

const fuelPresets = [
  { label: "2rb", value: 2000 },
  { label: "3rb", value: 3000 },
  { label: "5rb", value: 5000 },
];

interface OrderInputFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const OrderInputForm = ({ onSuccess, onCancel }: OrderInputFormProps) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form State
  const [orderType, setOrderType] = useState("ride");
  const [grossAmount, setGrossAmount] = useState<number>(0);
  const [fuelCost, setFuelCost] = useState<number>(0);
  const [pickupLocation, setPickupLocation] = useState<{
    lat: number;
    lng: number;
    name: string;
  } | null>(null);
  const [saveAsHotspot, setSaveAsHotspot] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Auto-calculated values
  const commissionRate = profile?.attribute_status === "active" ? 0.05 : 0.15;
  const commissionAmount = grossAmount * commissionRate;
  const netAmount = grossAmount - commissionAmount - fuelCost;

  // Current time
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("GPS tidak didukung di browser ini");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Try to get address name via reverse geocoding (simple approach)
        let locationName = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18`
          );
          const data = await response.json();
          if (data.display_name) {
            // Get shorter name
            const parts = data.display_name.split(",");
            locationName = parts.slice(0, 2).join(",").trim();
          }
        } catch {
          // Use coordinates if geocoding fails
        }

        setPickupLocation({
          lat: latitude,
          lng: longitude,
          name: locationName,
        });
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Akses lokasi ditolak");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Lokasi tidak tersedia");
            break;
          case error.TIMEOUT:
            setLocationError("Timeout mendapatkan lokasi");
            break;
          default:
            setLocationError("Gagal mendapatkan lokasi");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const clearLocation = () => {
    setPickupLocation(null);
    setSaveAsHotspot(false);
  };

  // Save order mutation
  const saveOrderMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");

      // Insert order
      const { error: orderError } = await supabase.from("orders").insert({
        user_id: user.id,
        order_type: orderType,
        gross_amount: grossAmount,
        commission_rate: commissionRate,
        fuel_cost: fuelCost,
        pickup_latitude: pickupLocation?.lat || null,
        pickup_longitude: pickupLocation?.lng || null,
        pickup_name: pickupLocation?.name || null,
        save_as_hotspot: saveAsHotspot,
      });

      if (orderError) throw orderError;

      // If save as hotspot is checked, add to hotspots
      if (saveAsHotspot && pickupLocation) {
        const currentHour = new Date().getHours();
        const peakHourStr = `${currentHour}:00`;

        await supabase.from("hotspots").insert({
          name: pickupLocation.name || "Spot Jemput",
          latitude: pickupLocation.lat,
          longitude: pickupLocation.lng,
          submitted_by: user.id,
          category: orderType,
          is_safe_zone: true,
          is_preset: false,
          peak_hours: [peakHourStr],
        });
      }

      // Update profile stats
      const { data: todayOrders } = await supabase
        .from("orders")
        .select("gross_amount, net_amount")
        .eq("user_id", user.id)
        .gte("created_at", new Date().toISOString().split("T")[0]);

      if (todayOrders) {
        const totalEarnings = todayOrders.reduce((sum, o) => sum + Number(o.gross_amount || 0), 0);
        const totalOrders = todayOrders.length;

        await supabase
          .from("profiles")
          .update({
            earnings_today: totalEarnings,
            total_orders_today: totalOrders,
          })
          .eq("user_id", user.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["hotspots"] });
      toast({
        title: "✅ Order Tersimpan!",
        description: `${formatCurrency(netAmount)} bersih dari ${orderTypes.find((t) => t.id === orderType)?.label}`,
      });
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Gagal",
        description: "Tidak bisa menyimpan order",
        variant: "destructive",
      });
    },
  });

  const handleReset = () => {
    setOrderType("ride");
    setGrossAmount(0);
    setFuelCost(0);
    setPickupLocation(null);
    setSaveAsHotspot(false);
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Time Display */}
      <Card className="bg-muted/30 border-0">
        <CardContent className="p-3 flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <span className="font-mono text-lg font-semibold text-foreground">
            {currentTime.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
          <span className="text-xs text-muted-foreground ml-2">
            {currentTime.toLocaleDateString("id-ID", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </span>
        </CardContent>
      </Card>

      {/* Order Type Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Jenis Order</label>
        <div className="grid grid-cols-4 gap-2">
          {orderTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setOrderType(type.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
                orderType === type.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-primary/50"
              )}
            >
              <type.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Gross Amount */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Harga Order</label>
        <CurrencyInput value={grossAmount} onChange={setGrossAmount} placeholder="0" />
        <PresetButtons options={pricePresets} selectedValue={grossAmount} onSelect={setGrossAmount} />
      </div>

      {/* Auto Commission Display */}
      <Card
        className={cn(
          "border-2",
          profile?.attribute_status === "active" ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"
        )}
      >
        <CardContent className="p-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">
              Potongan Komisi ({(commissionRate * 100).toFixed(0)}%)
            </p>
            <p className="text-xs text-muted-foreground">
              {profile?.attribute_status === "active" ? "Atribut Lengkap" : "Tanpa Atribut"}
            </p>
          </div>
          <span className="text-lg font-bold text-destructive">-{formatCurrency(commissionAmount)}</span>
        </CardContent>
      </Card>

      {/* Fuel Cost */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Fuel className="w-4 h-4 text-muted-foreground" />
          Biaya Bensin (opsional)
        </label>
        <CurrencyInput value={fuelCost} onChange={setFuelCost} placeholder="0" />
        <PresetButtons options={fuelPresets} selectedValue={fuelCost} onSelect={setFuelCost} />
      </div>

      {/* GPS Location Picker */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          Titik Jemput (opsional)
        </label>

        {pickupLocation ? (
          <Card className="border-success/30 bg-success/5">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <Navigation className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{pickupLocation.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {pickupLocation.lat.toFixed(5)}, {pickupLocation.lng.toFixed(5)}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={clearLocation}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Save as Hotspot Toggle */}
              <button
                onClick={() => setSaveAsHotspot(!saveAsHotspot)}
                className={cn(
                  "w-full mt-3 p-2 rounded-lg border-2 flex items-center justify-center gap-2 transition-all text-sm",
                  saveAsHotspot
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground"
                )}
              >
                <CheckCircle className={cn("w-4 h-4", saveAsHotspot && "text-primary")} />
                Simpan sebagai Spot Alternatif
              </button>
            </CardContent>
          </Card>
        ) : (
          <Button variant="outline" className="w-full h-12" onClick={handleGetLocation} disabled={isLocating}>
            {isLocating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Mencari lokasi...
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 mr-2" />
                Tandai Lokasi Saat Ini
              </>
            )}
          </Button>
        )}

        {locationError && <p className="text-xs text-destructive text-center">{locationError}</p>}
      </div>

      {/* Net Result Card */}
      <Card className="bg-gradient-to-br from-warning/10 to-success/10 border-2 border-warning/30">
        <CardContent className="p-4 space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Harga Order</span>
              <span className="text-foreground">{formatCurrency(grossAmount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Komisi ({(commissionRate * 100).toFixed(0)}%)</span>
              <span className="text-destructive">-{formatCurrency(commissionAmount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Bensin</span>
              <span className="text-muted-foreground">-{formatCurrency(fuelCost)}</span>
            </div>
          </div>
          <hr className="border-border" />
          <div className="flex justify-between items-center">
            <span className="font-semibold text-foreground">Pendapatan Bersih</span>
            <span className={cn("text-2xl font-bold", netAmount >= 0 ? "text-success" : "text-destructive")}>
              {formatCurrency(netAmount)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 h-12" onClick={onCancel || handleReset}>
          {onCancel ? "Batal" : "Reset"}
        </Button>
        <Button
          onClick={() => saveOrderMutation.mutate()}
          disabled={saveOrderMutation.isPending || grossAmount === 0}
          className="flex-1 h-12 bg-warning hover:bg-warning/90 text-warning-foreground"
        >
          {saveOrderMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Simpan Order
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default OrderInputForm;
