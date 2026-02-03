import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, TrendingDown, Package, BarChart3, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Order {
  id: string;
  gross_amount: number;
  net_amount: number | null;
  created_at: string;
}

interface Expense {
  id: string;
  amount: number;
  expense_type: string;
  created_at: string;
}

interface DailyStatsProps {
  orders: Order[];
  expenses: Expense[];
  onClose: () => void;
}

const DailyStats = ({ orders, expenses, onClose }: DailyStatsProps) => {
  // Group data by day for chart
  const chartData = useMemo(() => {
    const dailyMap: Record<
      string,
      {
        date: string;
        pendapatan: number;
        pengeluaran: number;
        bersih: number;
      }
    > = {};

    // Process orders
    orders.forEach((order) => {
      const date = new Date(order.created_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      });
      if (!dailyMap[date]) {
        dailyMap[date] = { date, pendapatan: 0, pengeluaran: 0, bersih: 0 };
      }
      dailyMap[date].pendapatan += order.net_amount || 0;
    });

    // Process expenses
    expenses.forEach((expense) => {
      const date = new Date(expense.created_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      });
      if (!dailyMap[date]) {
        dailyMap[date] = { date, pendapatan: 0, pengeluaran: 0, bersih: 0 };
      }
      dailyMap[date].pengeluaran += expense.amount;
    });

    // Calculate net for each day
    Object.values(dailyMap).forEach((day) => {
      day.bersih = day.pendapatan - day.pengeluaran;
      // Convert to thousands for chart
      day.pendapatan = Math.round(day.pendapatan / 1000);
      day.pengeluaran = Math.round(day.pengeluaran / 1000);
      day.bersih = Math.round(day.bersih / 1000);
    });

    return Object.values(dailyMap).slice(-7).reverse();
  }, [orders, expenses]);

  // Today's stats
  const todayStats = useMemo(() => {
    const today = new Date().toDateString();

    const todayOrders = orders.filter((o) => new Date(o.created_at).toDateString() === today);
    const todayExpenses = expenses.filter((e) => new Date(e.created_at).toDateString() === today);

    const totalGross = todayOrders.reduce((sum, o) => sum + o.gross_amount, 0);
    const totalNet = todayOrders.reduce((sum, o) => sum + (o.net_amount || 0), 0);
    const totalExpenses = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const takeHome = totalNet - totalExpenses;

    return {
      orderCount: todayOrders.length,
      totalGross,
      totalNet,
      totalExpenses,
      takeHome,
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

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Statistik Keuangan
        </h1>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Today's Take Home - Main Highlight */}
      <Card
        className={cn(
          "border-2",
          todayStats.takeHome >= 0 ? "border-success bg-success/5" : "border-destructive bg-destructive/5"
        )}
      >
        <CardContent className="p-5 text-center">
          <p className="text-sm text-muted-foreground mb-1">💰 Bisa Dibawa Pulang Hari Ini</p>
          <p className={cn("text-3xl font-bold", todayStats.takeHome >= 0 ? "text-success" : "text-destructive")}>
            Rp {formatCurrency(todayStats.takeHome)}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {todayStats.orderCount} order • Pendapatan Rp {formatShortCurrency(todayStats.totalNet)} - Pengeluaran Rp{" "}
            {formatShortCurrency(todayStats.totalExpenses)}
          </p>
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
            <p className="text-[10px] text-muted-foreground">dari {todayStats.orderCount} order</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Pengeluaran</span>
            </div>
            <p className="text-xl font-bold text-foreground">Rp {formatShortCurrency(todayStats.totalExpenses)}</p>
            <p className="text-[10px] text-muted-foreground">hari ini</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Tren 7 Hari Terakhir (dalam ribuan)</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              Belum ada data. Input order untuk melihat statistik.
            </div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number, name: string) => {
                      const label =
                        name === "pendapatan" ? "Pendapatan" : name === "pengeluaran" ? "Pengeluaran" : "Bersih";
                      return [`Rp ${value}rb`, label];
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "10px" }}
                    formatter={(value) => {
                      if (value === "pendapatan") return "Pendapatan";
                      if (value === "pengeluaran") return "Pengeluaran";
                      return "Bersih";
                    }}
                  />
                  <Bar dataKey="pendapatan" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pengeluaran" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyStats;
