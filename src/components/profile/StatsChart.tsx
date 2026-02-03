import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, Wallet, Package } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { cn } from "@/lib/utils";

interface StatsChartProps {
  userId: string;
}

type Period = "daily" | "weekly" | "monthly";

interface OrderLog {
  id: string;
  log_date: string;
  orders_completed: number;
  orders_auto_rejected: number;
  orders_cancelled: number;
  gross_earnings: number;
}

const StatsChart = ({ userId }: StatsChartProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [period, setPeriod] = useState<Period>("daily");

  const { data: orderLogs, isLoading } = useQuery({
    queryKey: ["orderLogs", userId],
    queryFn: async (): Promise<OrderLog[]> => {
      const { data, error } = await supabase
        .from("order_logs")
        .select("*")
        .eq("user_id", userId)
        .order("log_date", { ascending: false })
        .limit(90);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId && isExpanded,
  });

  const chartData = useMemo(() => {
    if (!orderLogs || orderLogs.length === 0) return [];

    if (period === "daily") {
      // Last 7 days
      return orderLogs
        .slice(0, 7)
        .reverse()
        .map((log) => ({
          name: new Date(log.log_date).toLocaleDateString("id-ID", { weekday: "short" }),
          selesai: log.orders_completed,
          batal: log.orders_cancelled + log.orders_auto_rejected,
          earnings: log.gross_earnings / 1000, // in thousands
        }));
    }

    if (period === "weekly") {
      // Group by week (last 4 weeks)
      const weeks: Record<string, { selesai: number; batal: number; earnings: number }> = {};

      orderLogs.forEach((log) => {
        const date = new Date(log.log_date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toLocaleDateString("id-ID", { day: "numeric", month: "short" });

        if (!weeks[weekKey]) {
          weeks[weekKey] = { selesai: 0, batal: 0, earnings: 0 };
        }
        weeks[weekKey].selesai += log.orders_completed;
        weeks[weekKey].batal += log.orders_cancelled + log.orders_auto_rejected;
        weeks[weekKey].earnings += log.gross_earnings / 1000;
      });

      return Object.entries(weeks)
        .slice(0, 4)
        .reverse()
        .map(([name, data]) => ({
          name: `Mg ${name}`,
          ...data,
        }));
    }

    // Monthly - last 3 months
    const months: Record<string, { selesai: number; batal: number; earnings: number }> = {};

    orderLogs.forEach((log) => {
      const date = new Date(log.log_date);
      const monthKey = date.toLocaleDateString("id-ID", { month: "short" });

      if (!months[monthKey]) {
        months[monthKey] = { selesai: 0, batal: 0, earnings: 0 };
      }
      months[monthKey].selesai += log.orders_completed;
      months[monthKey].batal += log.orders_cancelled + log.orders_auto_rejected;
      months[monthKey].earnings += log.gross_earnings / 1000;
    });

    return Object.entries(months)
      .slice(0, 3)
      .reverse()
      .map(([name, data]) => ({
        name,
        ...data,
      }));
  }, [orderLogs, period]);

  const totals = useMemo(() => {
    if (!orderLogs) return { orders: 0, earnings: 0, avgRating: 0 };

    const total = orderLogs.reduce(
      (acc, log) => ({
        orders: acc.orders + log.orders_completed,
        earnings: acc.earnings + log.gross_earnings,
      }),
      { orders: 0, earnings: 0 }
    );

    return total;
  }, [orderLogs]);

  const formatCurrency = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}jt`;
    return `${value}rb`;
  };

  if (!isExpanded) {
    return (
      <Button
        variant="outline"
        className="w-full h-12 border-2 border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10"
        onClick={() => setIsExpanded(true)}
      >
        <BarChart3 className="w-5 h-5 mr-2 text-primary" />
        <span className="font-medium">Lihat Statistik</span>
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Statistik
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)} className="text-muted-foreground">
            Tutup
          </Button>
        </div>

        {/* Period Toggle */}
        <div className="flex gap-1 mt-2">
          {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "outline"}
              size="sm"
              className="flex-1 text-xs"
              onClick={() => setPeriod(p)}
            >
              {p === "daily" ? "Harian" : p === "weekly" ? "Mingguan" : "Bulanan"}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            Belum ada data order
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-success/10 rounded-xl p-3 text-center">
                <Package className="w-4 h-4 text-success mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{totals.orders}</p>
                <p className="text-[10px] text-muted-foreground">Total Order</p>
              </div>
              <div className="bg-primary/10 rounded-xl p-3 text-center">
                <Wallet className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">Rp {formatCurrency(totals.earnings / 1000)}</p>
                <p className="text-[10px] text-muted-foreground">Total Pendapatan</p>
              </div>
            </div>

            {/* Chart */}
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === "earnings") return [`Rp ${value}rb`, "Pendapatan"];
                      if (name === "selesai") return [value, "Selesai"];
                      return [value, "Batal/PTO"];
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "10px" }}
                    formatter={(value) => {
                      if (value === "selesai") return "Selesai";
                      if (value === "batal") return "Batal";
                      return "Rp (rb)";
                    }}
                  />
                  <Bar dataKey="selesai" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="batal" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsChart;
