import { useState, useEffect } from "react";
import { Phone, Pencil, X, Check, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { validatePhone, formatPhoneDisplay } from "@/lib/validation";

interface PhoneEditorProps {
  userId: string;
  currentPhone?: string | null;
}

const PhoneEditor = ({ userId, currentPhone }: PhoneEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(currentPhone || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset error when phone changes
  useEffect(() => {
    if (phone) {
      const validation = validatePhone(phone);
      setError(validation.isValid ? null : validation.error || null);
    } else {
      setError(null);
    }
  }, [phone]);

  const formatPhoneNumber = (value: string) => {
    // Remove non-digits
    let digits = value.replace(/\D/g, "");
    
    // If starts with 0, replace with 62
    if (digits.startsWith("0")) {
      digits = "62" + digits.slice(1);
    }
    
    // If doesn't start with 62, add it
    if (!digits.startsWith("62") && digits.length > 0) {
      digits = "62" + digits;
    }
    
    return digits ? `+${digits}` : "";
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneDisplay(e.target.value);
    setPhone(formatted);
  };

  const isValidPhone = phone ? validatePhone(phone).isValid : false;

  const handleSave = async () => {
    // Validate before saving
    const validation = validatePhone(phone);
    if (!validation.isValid) {
      setError(validation.error || "Nomor tidak valid");
      return;
    }

    setIsSaving(true);
    try {
      const { error: saveError } = await supabase
        .from("profiles")
        .update({ phone })
        .eq("user_id", userId);

      if (saveError) throw saveError;

      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setIsEditing(false);
      setError(null);
      toast({
        title: "✅ Nomor disimpan",
        description: "Nomor telepon berhasil diperbarui",
      });
    } catch (err) {
      console.error("Save phone error:", err);
      toast({
        title: "Gagal menyimpan",
        description: "Tidak dapat menyimpan nomor",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setPhone(currentPhone || "");
    setIsEditing(false);
    setError(null);
  };

  if (isEditing) {
    return (
      <Card className={error ? "border-destructive" : "border-primary"}>
        <CardContent className="p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Phone className={`w-4 h-4 ${error ? "text-destructive" : "text-primary"}`} />
            <span className="text-xs text-muted-foreground">Telepon</span>
          </div>
          <div className="space-y-1">
            <Input
              type="tel"
              placeholder="+62 812-3456-7890"
              value={phone}
              onChange={handlePhoneChange}
              className={`h-10 text-sm ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
              autoFocus
            />
            {error && (
              <div className="flex items-center gap-1 text-destructive">
                <AlertCircle className="w-3 h-3" />
                <span className="text-xs">{error}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-9"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X className="w-3 h-3 mr-1" />
              Batal
            </Button>
            <Button
              size="sm"
              className="flex-1 h-9"
              onClick={handleSave}
              disabled={isSaving || !phone || !isValidPhone}
            >
              {isSaving ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Check className="w-3 h-3 mr-1" />
              )}
              Simpan
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="cursor-pointer hover:border-primary/50 transition-colors active:scale-[0.98]"
      onClick={() => setIsEditing(true)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <Phone className="w-5 h-5 text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">Telepon</p>
            <p className="font-semibold text-foreground truncate">
              {currentPhone || "Belum diisi"}
            </p>
          </div>
          <Pencil className="w-4 h-4 text-muted-foreground/50 flex-shrink-0 mt-1" />
        </div>
      </CardContent>
    </Card>
  );
};

export default PhoneEditor;
