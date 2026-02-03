import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import PageHeader from "@/components/layout/PageHeader";
import { Star, MessageSquare, Shield, CheckCircle, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const serviceChecklist = [
  { id: "1", label: "Sapa pelanggan dengan ramah", emoji: "👋" },
  { id: "2", label: "Konfirmasi alamat tujuan", emoji: "📍" },
  { id: "3", label: "Tawarkan helm bersih", emoji: "🪖" },
  { id: "4", label: "Berkendara aman & nyaman", emoji: "🛵" },
  { id: "5", label: "Ucapkan terima kasih", emoji: "🙏" },
  { id: "6", label: "Minta rating bintang 5", emoji: "⭐" },
];

const STORAGE_KEY = "tips_checklist_state";

const Tips = () => {
  const { toast } = useToast();
  const [copiedScript, setCopiedScript] = useState<string | null>(null);
  
  // Load checklist from localStorage
  const [checkedItems, setCheckedItems] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Reset if it's a new day
        const savedDate = localStorage.getItem(`${STORAGE_KEY}_date`);
        const today = new Date().toDateString();
        if (savedDate !== today) {
          localStorage.setItem(`${STORAGE_KEY}_date`, today);
          return [];
        }
        return parsed;
      } catch {
        return [];
      }
    }
    return [];
  });

  // Save checklist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedItems));
    localStorage.setItem(`${STORAGE_KEY}_date`, new Date().toDateString());
  }, [checkedItems]);

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const copyScript = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedScript(id);
      toast({ title: "📋 Tersalin!", description: "Script siap di-paste" });
      setTimeout(() => setCopiedScript(null), 2000);
    } catch {
      toast({ title: "Gagal menyalin", variant: "destructive" });
    }
  };

  const scripts = [
    {
      id: "undefined",
      title: "📍 Alamat Tidak Jelas",
      text: "Selamat [pagi/siang/sore] Kak. Mohon maaf, alamat penjemputan belum jelas. Bisa tolong share pin lokasi? Terima kasih 🙏",
    },
    {
      id: "confirm",
      title: "✅ Konfirmasi Jemput",
      text: "Halo Kak, saya driver Maxim. Sudah sampai di lokasi. Posisi Kakak di mana ya?",
    },
    {
      id: "rating",
      title: "⭐ Minta Rating",
      text: "Terima kasih Kak. Kalau berkenan, mohon bantu rating bintang 5 ya. Terima kasih banyak! 🙏⭐",
    },
  ];

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <PageHeader title="Tips Bintang 5" />

      {/* Service Checklist - Gamified */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              Checklist Pelayanan
            </CardTitle>
            <span className="text-sm font-semibold text-primary">
              {checkedItems.length}/{serviceChecklist.length}
            </span>
          </div>
          {/* Progress Bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(checkedItems.length / serviceChecklist.length) * 100}%` }}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {serviceChecklist.map((item) => {
            const isChecked = checkedItems.includes(item.id);
            return (
              <button
                key={item.id}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                  isChecked 
                    ? "bg-success/10 border-2 border-success/30" 
                    : "bg-muted border-2 border-transparent"
                )}
                onClick={() => toggleCheck(item.id)}
              >
                <span className="text-xl">{item.emoji}</span>
                <span className={cn(
                  "flex-1 font-medium",
                  isChecked && "line-through text-muted-foreground"
                )}>
                  {item.label}
                </span>
                {isChecked && (
                  <CheckCircle className="w-5 h-5 text-success" />
                )}
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Communication Scripts with Copy */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Script Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {scripts.map((script) => (
              <AccordionItem key={script.id} value={script.id} className="border-b-0">
                <AccordionTrigger className="text-sm font-medium py-3">
                  {script.title}
                </AccordionTrigger>
                <AccordionContent className="text-sm pb-4">
                  <div className="p-3 bg-muted rounded-xl text-muted-foreground italic relative">
                    {script.text}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 h-8 w-8 p-0"
                      onClick={() => copyScript(script.text, script.id)}
                    >
                      {copiedScript === script.id ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Attribute Tips - Simplified */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Jaga Atribut
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-muted rounded-xl">
            <span className="text-xl">📸</span>
            <div>
              <p className="font-medium text-foreground">Foto Helm & Jaket</p>
              <p className="text-sm text-muted-foreground">
                Verifikasi setiap 3 bulan
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-success/10 rounded-xl border border-success/30">
            <span className="text-xl">💰</span>
            <div>
              <p className="font-medium text-foreground">Atribut = Komisi 5%</p>
              <p className="text-sm text-muted-foreground">
                Hemat 10% dari pendapatan!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Tips;
