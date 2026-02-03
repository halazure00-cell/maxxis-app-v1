import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Save, Bike, Car, Package, UtensilsCrossed, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderInputFormProps {
  userId: string;
  commissionRate: number;
  onClose: () => void;
}

const ORDER_TYPES = [
  { id: "ride", label: "Ride", icon: Bike },
  { id: "car", label: "Car", icon: Car },
  { id: "food", label: "Food", icon: UtensilsCrossed },
  { id: "send", label: "Send", icon: Package },
];

const FUEL_RATE = 0.1; // 10% fuel deduction

const OrderInputForm = ({ userId, commissionRate, onClose }: OrderInputFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [pickupLocation, setPickupLocation] = useState("");
  const [grossAmount, setGrossAmount] = useState(0);
  const [orderType, setOrderType] = useState("ride");

  // Calculate deductions
  const commissionAmount = Math.round(grossAmount * commissionRate);
  const fuelCost = Math.round(grossAmount * FUEL_RATE);
  const netAmount = grossAmount - commissionAmount - fuelCost;

  const addOrder = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("orders").insert({
        user_id: userId,
        order_type: orderType,
        gross_amount: grossAmount,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        fuel_cost: fuelCost,
        net_amount: netAmount,
        pickup_name: pickupLocation || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", userId] });
      queryClient.invalidateQueries({ queryKey: ["todayStats", userId] });
      toast({
        title: "✅ Order Tersimpan!",
        description: `Pendapatan bersih: Rp ${netAmount.toLocaleString("id-ID")}`,
      });
      onClose();
    },
    onError: () => {
      toast({ title: "Gagal", description: "Tidak bisa menyimpan order", variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (grossAmount <= 0) {
      toast({
        title: "Harga kosong",
        description: "Masukkan harga order",
        variant: "destructive",
      });
      return;
    }
    addOrder.mutate();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID").format(value);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Input Order Baru</h1>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Order Type Selection */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Jenis Order</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {ORDER_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setOrderType(type.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                    orderType === type.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted bg-muted/30 text-muted-foreground hover:border-primary/50"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{type.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pickup Location */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Lokasi Pickup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Contoh: Dago, Cihampelas, dll"
            value={pickupLocation}
            onChange={(e) => setPickupLocation(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Gross Amount */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Harga Order (Kotor)</CardTitle>
        </CardHeader>
        <CardContent>
          <CurrencyInput value={grossAmount} onChange={setGrossAmount} placeholder="0" />
        </CardContent>
      </Card>

      {/* Auto Deductions Summary */}
      {grossAmount > 0 && (
        <Card className="bg-muted/30">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Harga Kotor</span>
              <span className="font-medium">Rp {formatCurrency(grossAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Potongan Aplikasi ({(commissionRate * 100).toFixed(0)}%)</span>
              <span className="text-destructive">- Rp {formatCurrency(commissionAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Potongan Bensin (10%)</span>
              <span className="text-destructive">- Rp {formatCurrency(fuelCost)}</span>
            </div>
            <div className="h-px bg-border my-2" />
            <div className="flex justify-between text-base font-bold">
              <span className="text-foreground">Pendapatan Bersih</span>
              <span className="text-success">Rp {formatCurrency(netAmount)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={addOrder.isPending || grossAmount <= 0}
        className="w-full h-14 text-base font-semibold"
      >
        {addOrder.isPending ? (
          "Menyimpan..."
        ) : (
          <>
            <Save className="w-5 h-5 mr-2" />
            Simpan Order
          </>
        )}
      </Button>
    </div>
  );
};

export default OrderInputForm;
