import { useState } from "react";
import { Calculator, TrendingDown, TrendingUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CurrencyInput } from "@/components/ui/currency-input";
import { PresetButtons } from "@/components/ui/preset-buttons";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import OrderInputForm from "./OrderInputForm";

const incomePresets = [
  { label: "100rb", value: 100000 },
  { label: "200rb", value: 200000 },
  { label: "300rb", value: 300000 },
  { label: "500rb", value: 500000 },
];

const fuelPresets = [
  { label: "20rb", value: 20000 },
  { label: "30rb", value: 30000 },
  { label: "50rb", value: 50000 },
];

interface EarningsCalculatorProps {
  defaultHasAttribute?: boolean;
}

const EarningsCalculator = ({ defaultHasAttribute = true }: EarningsCalculatorProps) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("input");

  // Calculator State
  const [grossIncome, setGrossIncome] = useState<number>(0);
  const [hasAttribute, setHasAttribute] = useState(defaultHasAttribute);
  const [fuelCost, setFuelCost] = useState<number>(0);

  // Calculator values
  const commissionRate = hasAttribute ? 0.05 : 0.15;
  const commission = grossIncome * commissionRate;
  const netIncome = grossIncome - commission - fuelCost;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleReset = () => {
    if (activeTab === "hitung") {
      setGrossIncome(0);
      setFuelCost(0);
    }
  };

  const handleOrderSaved = () => {
    setOpen(false);
  };

  return (
    <>
      {/* Floating Action Button - Bottom Center */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-14 h-14 rounded-full bg-warning text-warning-foreground shadow-xl hover:bg-warning/90 active:scale-95 transition-all flex items-center justify-center group"
        aria-label="Hitung Pendapatan"
      >
        <Calculator className="w-6 h-6 group-hover:scale-110 transition-transform" />
        {/* Pulse ring animation */}
        <span className="absolute inset-0 rounded-full bg-warning/30 animate-ping" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[92vh] rounded-t-3xl flex flex-col">
          <SheetHeader className="pb-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-warning" />
                Keuangan Harian
              </SheetTitle>
              {activeTab === "hitung" && (
                <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground">
                  Reset
                </Button>
              )}
            </div>
          </SheetHeader>

          {/* Sub-menu Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2 h-11 flex-shrink-0">
              <TabsTrigger value="input" className="text-xs font-medium">
                <Plus className="w-4 h-4 mr-1.5" />
                Input Order
              </TabsTrigger>
              <TabsTrigger value="hitung" className="text-xs font-medium">
                <Calculator className="w-4 h-4 mr-1.5" />
                Kalkulator
              </TabsTrigger>
            </TabsList>

            {/* INPUT ORDER TAB */}
            <TabsContent value="input" className="flex-1 overflow-y-auto mt-4 -mx-6 px-6">
              <OrderInputForm onSuccess={handleOrderSaved} />
            </TabsContent>

            {/* KALKULATOR TAB */}
            <TabsContent value="hitung" className="flex-1 overflow-y-auto mt-4 space-y-4 pb-6 -mx-6 px-6">
              {/* Gross Income */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Pendapatan Kotor</label>
                <CurrencyInput value={grossIncome} onChange={setGrossIncome} placeholder="0" />
                <PresetButtons options={incomePresets} selectedValue={grossIncome} onSelect={setGrossIncome} />
              </div>

              {/* Attribute Toggle */}
              <Card
                className={cn(
                  "cursor-pointer transition-all",
                  hasAttribute ? "border-success/50 bg-success/5" : "border-warning/50 bg-warning/5"
                )}
                onClick={() => setHasAttribute(!hasAttribute)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{hasAttribute ? "Atribut Lengkap" : "Tanpa Atribut"}</p>
                    <p className={cn("text-sm", hasAttribute ? "text-success" : "text-warning")}>
                      Komisi {hasAttribute ? "5%" : "15%"}
                    </p>
                  </div>
                  <Switch checked={hasAttribute} onCheckedChange={setHasAttribute} />
                </CardContent>
              </Card>

              {/* Fuel Cost */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Biaya BBM</label>
                <CurrencyInput value={fuelCost} onChange={setFuelCost} placeholder="0" />
                <PresetButtons options={fuelPresets} selectedValue={fuelCost} onSelect={setFuelCost} />
              </div>

              {/* Result Card */}
              <Card className="bg-gradient-to-br from-warning/10 to-success/10 border-2 border-warning/30">
                <CardContent className="p-4 space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <TrendingDown className="w-3.5 h-3.5" />
                        Komisi ({(commissionRate * 100).toFixed(0)}%)
                      </span>
                      <span className="text-destructive">-{formatCurrency(commission)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <TrendingDown className="w-3.5 h-3.5" />
                        BBM
                      </span>
                      <span className="text-muted-foreground">-{formatCurrency(fuelCost)}</span>
                    </div>
                  </div>
                  <hr className="border-border" />
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-success" />
                      Bersih
                    </span>
                    <span className={cn("text-2xl font-bold", netIncome >= 0 ? "text-success" : "text-destructive")}>
                      {formatCurrency(netIncome)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default EarningsCalculator;
