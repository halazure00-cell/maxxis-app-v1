import { useState } from "react";
import { AlertTriangle, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const PanicButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const { toast } = useToast();

  const handlePanicPress = () => {
    setIsOpen(true);
  };

  const activatePanic = async () => {
    setIsActivating(true);

    try {
      // Get current location
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;

            // Create WhatsApp message with coordinates
            const message = encodeURIComponent(
              `🆘 DARURAT! Saya butuh bantuan!\n\n📍 Lokasi: https://maps.google.com/?q=${latitude},${longitude}\n\nDikirim dari Maxim Driver Assistant`
            );

            // Open WhatsApp with pre-filled message
            window.open(`https://wa.me/?text=${message}`, "_blank");

            toast({
              title: "Alert Terkirim",
              description: "WhatsApp dibuka dengan koordinat lokasi Anda",
            });

            setIsOpen(false);
          },
          (error) => {
            toast({
              title: "Gagal mendapatkan lokasi",
              description: "Pastikan GPS aktif dan izin lokasi diberikan",
              variant: "destructive",
            });
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        toast({
          title: "Lokasi tidak tersedia",
          description: "Perangkat Anda tidak mendukung GPS",
          variant: "destructive",
        });
      }
    } finally {
      setIsActivating(false);
    }
  };

  const callEmergency = (number: string) => {
    window.open(`tel:${number}`, "_self");
  };

  return (
    <>
      <button onClick={handlePanicPress} className="panic-button" aria-label="Tombol Darurat">
        <AlertTriangle className="w-8 h-8" />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Mode Darurat
            </DialogTitle>
            <DialogDescription>Pilih tindakan darurat yang diperlukan</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Button
              onClick={activatePanic}
              disabled={isActivating}
              className="w-full h-14 text-lg bg-destructive hover:bg-destructive/90"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              {isActivating ? "Mengirim..." : "Kirim Lokasi via WhatsApp"}
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => callEmergency("112")} className="h-12">
                <Phone className="w-4 h-4 mr-2" />
                Polisi (112)
              </Button>
              <Button variant="outline" onClick={() => callEmergency("118")} className="h-12">
                <Phone className="w-4 h-4 mr-2" />
                Ambulans (118)
              </Button>
            </div>

            <Button variant="ghost" onClick={() => setIsOpen(false)} className="w-full">
              Batal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PanicButton;
