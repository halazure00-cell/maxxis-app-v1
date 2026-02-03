import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load pages to avoid circular dependencies and reduce initial bundle
const Auth = lazy(() => import("@/pages/Auth"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Finance = lazy(() => import("@/pages/Finance"));
const Map = lazy(() => import("@/pages/Map"));
const Safety = lazy(() => import("@/pages/Safety"));
const Profile = lazy(() => import("@/pages/Profile"));
const Tips = lazy(() => import("@/pages/Tips"));
const Install = lazy(() => import("@/pages/Install"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="p-4 space-y-4">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-28 w-full rounded-xl" />
    <Skeleton className="h-20 w-full rounded-xl" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <OfflineIndicator />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/install" element={<Install />} />
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/finance" element={<Finance />} />
                <Route path="/map" element={<Map />} />
                <Route path="/safety" element={<Safety />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/tips" element={<Tips />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
