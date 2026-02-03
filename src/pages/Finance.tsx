import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/layout/PageHeader";
import OrderInputForm from "@/components/finance/OrderInputForm";
import ExpenseInputForm from "@/components/finance/ExpenseInputForm";
import DailyStats from "@/components/finance/DailyStats";
import { Wallet, TrendingUp, TrendingDown, Plus, Minus, BarChart3, Package, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  order_type: string;
  gross_amount: number;
  net_amount: number | null;
  commission_amount: number | null;
  fuel_cost: number;
  pickup_name: string | null;
  created_at: string;
}

interface Expense {
  id: string;
  expense_type: string;
  amount: number;
  notes: string | null;
  created_at: string;
}

type ViewMode = "main" | "order" | "expense" | "stats";

const Finance = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<ViewMode>("main");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Fetch orders
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: async (): Promise<Order[]> => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch expenses
  const { data: expenses, isLoading: expensesLoading } = useQuery({
    queryKey: ["expenses", user?.id],
    queryFn: async (): Promise<Expense[]> => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Calculate today's stats
  const todayStats = useMemo(() => {
    const today = new Date().toDateString();

    const todayOrders = orders?.filter((o) => new Date(o.created_at).toDateString() === today) || [];
    const todayExpenses = expenses?.filter((e) => new Date(e.created_at).toDateString() === today) || [];

    const totalNet = todayOrders.reduce((sum, o) => sum + (o.net_amount || 0), 0);
    const totalExpenses = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const takeHome = totalNet - totalExpenses;

    return {
      orderCount: todayOrders.length,
      totalNet,
      totalExpenses,
      takeHome,
      recentOrders: todayOrders.slice(0, 5),
      recentExpenses: todayExpenses.slice(0, 3),
    };
  }, [orders, expenses]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID").format(value);
  };

  const formatShortCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}jt`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}rb`;
    return `${value}`;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const commissionRate = profile?.commission_rate || 0.15;

  if (authLoading || profileLoading || ordersLoading || expensesLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  // Render different views
  if (viewMode === "order") {
    return (
      <OrderInputForm userId={user?.id || ""} commissionRate={commissionRate} onClose={() => setViewMode("main")} />
    );
  }

  if (viewMode === "expense") {
    return <ExpenseInputForm userId={user?.id || ""} onClose={() => setViewMode("main")} />;
  }

  if (viewMode === "stats") {
    return <DailyStats orders={orders || []} expenses={expenses || []} onClose={() => setViewMode("main")} />;
  }

  // Main View
  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <PageHeader title="Keuangan" showBack={false} />

      {/* Today's Take Home - Main Highlight */}
      <Card
        className={cn(
          "border-2",
          todayStats.takeHome >= 0 ? "border-success bg-success/5" : "border-destructive bg-destructive/5"
        )}
      >
        <CardContent className="p-5 text-center">
          <p className="text-sm text-muted-foreground mb-1">💰 Bisa Dibawa Pulang</p>
          <p className={cn("text-3xl font-bold", todayStats.takeHome >= 0 ? "text-success" : "text-destructive")}>
            Rp {formatCurrency(todayStats.takeHome)}
          </p>
          <p className="text-xs text-muted-foreground mt-2">Hari ini • {todayStats.orderCount} order</p>
        </CardContent>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-xs text-muted-foreground">Pendapatan</span>
            </div>
            <p className="text-xl font-bold text-foreground">Rp {formatShortCurrency(todayStats.totalNet)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Pengeluaran</span>
            </div>
            <p className="text-xl font-bold text-foreground">Rp {formatShortCurrency(todayStats.totalExpenses)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={() => setViewMode("order")} className="h-14 text-base font-semibold">
          <Plus className="w-5 h-5 mr-2" />
          Input Order
        </Button>

        <Button
          onClick={() => setViewMode("expense")}
          variant="outline"
          className="h-14 text-base font-semibold border-warning text-warning hover:bg-warning/10"
        >
          <Minus className="w-5 h-5 mr-2" />
          Pengeluaran
        </Button>
      </div>

      {/* Recent Orders */}
      {todayStats.recentOrders.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                Order Hari Ini
              </p>
              <span className="text-xs text-muted-foreground">{todayStats.orderCount} total</span>
            </div>
            <div className="space-y-2">
              {todayStats.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{formatTime(order.created_at)}</span>
                    <span className="text-xs font-medium capitalize">{order.order_type}</span>
                    {order.pickup_name && <span className="text-xs text-muted-foreground">• {order.pickup_name}</span>}
                  </div>
                  <span className="text-sm font-bold text-success">
                    +Rp {formatShortCurrency(order.net_amount || 0)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Expenses */}
      {todayStats.recentExpenses.length > 0 && (
        <Card className="bg-warning/5 border-warning/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <Wallet className="w-4 h-4 text-warning" />
                Pengeluaran Hari Ini
              </p>
            </div>
            <div className="space-y-2">
              {todayStats.recentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-2 rounded-lg bg-background/50">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{formatTime(expense.created_at)}</span>
                    <span className="text-xs font-medium capitalize">{expense.expense_type}</span>
                  </div>
                  <span className="text-sm font-bold text-destructive">-Rp {formatShortCurrency(expense.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Button */}
      <Button
        variant="outline"
        className="w-full h-12 border-2 border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10"
        onClick={() => setViewMode("stats")}
      >
        <BarChart3 className="w-5 h-5 mr-2 text-primary" />
        <span className="font-medium">Lihat Statistik Lengkap</span>
      </Button>

      {/* Tip */}
      <Card className="bg-primary/10 border-primary/30">
        <CardContent className="p-4">
          <p className="text-sm text-foreground">💡 Input setiap order untuk tracking pendapatan bersih yang akurat!</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Finance;
