import { Download, Smartphone, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePWA } from "@/hooks/usePWA";

interface InstallPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InstallPrompt({ open, onOpenChange }: InstallPromptProps) {
  const { isIOS, canPrompt, promptInstall, isInstalled } = usePWA();

  const handleInstall = async () => {
    if (canPrompt) {
      const result = await promptInstall();
      if (result.outcome === "accepted") {
        onOpenChange(false);
      }
    }
  };

  if (isInstalled) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            Install Maxim Driver
          </DialogTitle>
          <DialogDescription>
            Dapatkan pengalaman terbaik dengan menginstall aplikasi ke perangkat Anda
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Benefits */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Download className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Akses Cepat</p>
                <p className="text-xs text-muted-foreground">
                  Buka langsung dari home screen tanpa browser
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Smartphone className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Mode Offline</p>
                <p className="text-xs text-muted-foreground">
                  Tetap bisa digunakan meski tanpa koneksi internet
                </p>
              </div>
            </div>
          </div>

          {/* Install Instructions */}
          {isIOS ? (
            <div className="rounded-lg bg-muted p-4 space-y-3">
              <p className="text-sm font-medium">Cara Install di iPhone/iPad:</p>
              <ol className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    1
                  </span>
                  Ketuk tombol <Share className="h-4 w-4 inline mx-1" /> Share
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    2
                  </span>
                  Scroll dan pilih <Plus className="h-4 w-4 inline mx-1" /> Add to Home Screen
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    3
                  </span>
                  Ketuk "Add" di pojok kanan atas
                </li>
              </ol>
            </div>
          ) : canPrompt ? (
            <Button onClick={handleInstall} className="w-full" size="lg">
              <Download className="mr-2 h-4 w-4" />
              Install Sekarang
            </Button>
          ) : (
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground text-center">
                Gunakan Chrome atau Edge untuk menginstall aplikasi ini
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
