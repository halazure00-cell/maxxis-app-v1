import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Fuel, Wallet, UtensilsCrossed, MoreHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpenseInputFormProps {
  userId: string;
  onClose: () => void;
}

const EXPENSE_TYPES = [
  { id: "bensin", label: "Bensin", icon: Fuel },
  { id: "saldo", label: "Isi Saldo", icon: Wallet },
  { id: "makan", label: "Makan", icon: UtensilsCrossed },
  { id: "lainnya", label: "Lainnya", icon: MoreHorizontal },
];

const ExpenseInputForm = ({ userId, onClose }: ExpenseInputFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [expenseType, setExpenseType] = useState("bensin");
  const [amount, setAmount] = useState(0);
  const [notes, setNotes] = useState("");

  const addExpense = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("expenses").insert({
        user_id: userId,
        expense_type: expenseType,
        amount: amount,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", userId] });
      queryClient.invalidateQueries({ queryKey: ["todayStats", userId] });
      toast({
        title: "✅ Pengeluaran Tercatat!",
        description: `${EXPENSE_TYPES.find((e) => e.id === expenseType)?.label}: Rp ${amount.toLocaleString("id-ID")}`,
      });
      onClose();
    },
    onError: () => {
      toast({ title: "Gagal", description: "Tidak bisa menyimpan pengeluaran", variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (amount <= 0) {
      toast({
        title: "Nominal kosong",
        description: "Masukkan jumlah pengeluaran",
        variant: "destructive",
      });
      return;
    }
    addExpense.mutate();
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Catat Pengeluaran</h1>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Expense Type Selection */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Jenis Pengeluaran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {EXPENSE_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setExpenseType(type.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                    expenseType === type.id
                      ? "border-warning bg-warning/10 text-warning"
                      : "border-muted bg-muted/30 text-muted-foreground hover:border-warning/50"
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

      {/* Amount */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Jumlah Pengeluaran</CardTitle>
        </CardHeader>
        <CardContent>
          <CurrencyInput value={amount} onChange={setAmount} placeholder="0" />
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Catatan (Opsional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Input placeholder="Contoh: SPBU Dago, dll" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={addExpense.isPending || amount <= 0}
        variant="outline"
        className="w-full h-14 text-base font-semibold border-warning text-warning hover:bg-warning/10"
      >
        {addExpense.isPending ? (
          "Menyimpan..."
        ) : (
          <>
            <Save className="w-5 h-5 mr-2" />
            Simpan Pengeluaran
          </>
        )}
      </Button>
    </div>
  );
};

export default ExpenseInputForm;
