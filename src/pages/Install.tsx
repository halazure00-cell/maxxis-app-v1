import { useState } from "react";
import { Download, Smartphone, Zap, WifiOff, Shield, ArrowLeft, Share, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePWA } from "@/hooks/usePWA";
import { useNavigate } from "react-router-dom";

const benefits = [
  {
    icon: Zap,
    title: "Akses Instan",
    description: "Buka dari home screen tanpa perlu browser",
  },
  {
    icon: WifiOff,
    title: "Mode Offline",
    description: "Tetap berfungsi meski tanpa internet",
  },
  {
    icon: Shield,
    title: "Keamanan",
    description: "Data tersimpan aman di perangkat Anda",
  },
  {
    icon: Smartphone,
    title: "Pengalaman Native",
    description: "Tampilan layar penuh seperti aplikasi asli",
  },
];

export default function Install() {
  const navigate = useNavigate();
  const { isIOS, isAndroid, canPrompt, promptInstall, isInstalled, isStandalone } = usePWA();
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    if (!canPrompt) return;
    
    setInstalling(true);
    try {
      const result = await promptInstall();
      if (result.outcome === "accepted") {
        // Success - will redirect or show success
      }
    } finally {
      setInstalling(false);
    }
  };

  // Already installed and running as PWA
  if (isStandalone || isInstalled) {
    return (
      <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
            <Check className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold">Sudah Terinstall!</h1>
          <p className="text-muted-foreground">
            Anda sudah menggunakan Maxim Driver sebagai aplikasi
          </p>
          <Button onClick={() => navigate("/")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary p-6 pb-12">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="mb-4 text-primary-foreground hover:bg-primary/80"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="text-center text-primary-foreground">
          <div className="mx-auto mb-4 w-20 h-20 rounded-2xl bg-background/10 flex items-center justify-center">
            <Smartphone className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold">Install Maxim Driver</h1>
          <p className="text-primary-foreground/80 mt-2">
            Dapatkan pengalaman terbaik dengan aplikasi
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-6 pb-8 space-y-6">
        {/* Benefits Grid */}
        <div className="grid grid-cols-2 gap-3">
          {benefits.map((benefit) => (
            <Card key={benefit.title} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="rounded-full bg-primary/10 w-10 h-10 flex items-center justify-center mb-3">
                  <benefit.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-medium text-sm">{benefit.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Install Section */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            {isIOS ? (
              <div className="space-y-4">
                <h3 className="font-semibold text-center">
                  Cara Install di iPhone/iPad
                </h3>
                <ol className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                      1
                    </span>
                    <div>
                      <p className="font-medium">Ketuk tombol Share</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        Ikon <Share className="h-4 w-4" /> di bawah layar Safari
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                      2
                    </span>
                    <div>
                      <p className="font-medium">Pilih "Add to Home Screen"</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        Scroll ke bawah dan cari <Plus className="h-4 w-4" />
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                      3
                    </span>
                    <div>
                      <p className="font-medium">Ketuk "Add"</p>
                      <p className="text-sm text-muted-foreground">
                        Di pojok kanan atas layar
                      </p>
                    </div>
                  </li>
                </ol>
              </div>
            ) : canPrompt ? (
              <div className="space-y-4 text-center">
                <h3 className="font-semibold">Siap untuk Install?</h3>
                <p className="text-sm text-muted-foreground">
                  Klik tombol di bawah untuk menambahkan Maxim Driver ke home screen Anda
                </p>
                <Button
                  onClick={handleInstall}
                  disabled={installing}
                  className="w-full"
                  size="lg"
                >
                  <Download className="mr-2 h-5 w-5" />
                  {installing ? "Installing..." : "Install Maxim Driver"}
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <p className="text-muted-foreground">
                  {isAndroid
                    ? "Gunakan Chrome untuk menginstall aplikasi ini"
                    : "Buka di Chrome atau Edge untuk menginstall"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Browser saat ini tidak mendukung instalasi PWA
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skip Button */}
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => navigate("/")}
        >
          Lewati untuk sekarang
        </Button>
      </div>
    </div>
  );
}
