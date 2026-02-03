import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import PageHeader from "@/components/layout/PageHeader";
import EnhancedPanicButton from "@/components/safety/EnhancedPanicButton";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { validatePhone, validateName, formatPhoneDisplay } from "@/lib/validation";
import { 
  Phone, 
  Plus, 
  Trash2, 
  Heart, 
  Ambulance,
  User,
  X,
  AlertCircle,
  UserMinus
} from "lucide-react";

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string | null;
  priority: number;
}

const Safety = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRelation, setFormRelation] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  
  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<EmergencyContact | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const { data: contacts } = useQuery({
    queryKey: ["emergencyContacts", user?.id],
    queryFn: async (): Promise<EmergencyContact[]> => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("emergency_contacts")
        .select("*")
        .eq("user_id", user.id)
        .order("priority", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const addContact = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      if ((contacts?.length || 0) >= 3) throw new Error("Maksimal 3 kontak");

      // Validate inputs
      const nameValidation = validateName(formName);
      const phoneValidation = validatePhone(formPhone);

      if (!nameValidation.isValid) {
        setNameError(nameValidation.error || "Nama tidak valid");
        throw new Error(nameValidation.error);
      }

      if (!phoneValidation.isValid) {
        setPhoneError(phoneValidation.error || "Nomor tidak valid");
        throw new Error(phoneValidation.error);
      }

      const { error } = await supabase.from("emergency_contacts").insert({
        user_id: user.id,
        name: formName.trim(),
        phone: formPhone,
        relationship: formRelation || null,
        priority: (contacts?.length || 0) + 1,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergencyContacts", user?.id] });
      toast({ title: "✅ Kontak ditambahkan" });
      resetForm();
    },
    onError: (error: Error) => {
      // Only show toast for server errors, not validation errors
      if (!error.message.includes("Nama") && !error.message.includes("Nomor")) {
        toast({ title: "Gagal", description: error.message, variant: "destructive" });
      }
    },
  });

  const deleteContact = useMutation({
    mutationFn: async (contactId: string) => {
      const { error } = await supabase
        .from("emergency_contacts")
        .delete()
        .eq("id", contactId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergencyContacts", user?.id] });
      toast({ title: "Kontak dihapus" });
      setContactToDelete(null);
    },
  });

  const handleDeleteClick = (contact: EmergencyContact) => {
    setContactToDelete(contact);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (contactToDelete) {
      deleteContact.mutate(contactToDelete.id);
    }
    setDeleteConfirmOpen(false);
  };

  const resetForm = () => {
    setShowForm(false);
    setFormName("");
    setFormPhone("");
    setFormRelation("");
    setNameError(null);
    setPhoneError(null);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormName(e.target.value);
    const validation = validateName(e.target.value);
    setNameError(validation.isValid ? null : validation.error || null);
  };

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneDisplay(e.target.value);
    setFormPhone(formatted);
    if (formatted) {
      const validation = validatePhone(formatted);
      setPhoneError(validation.isValid ? null : validation.error || null);
    } else {
      setPhoneError(null);
    }
  };

  const isFormValid = () => {
    const nameValid = validateName(formName).isValid;
    const phoneValid = validatePhone(formPhone).isValid;
    return nameValid && phoneValid;
  };

  const callContact = (phone: string) => {
    window.open(`tel:${phone}`, "_self");
  };
  const handlePanicActivate = async () => {
    if (!user?.id) return;
    
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Save panic alert to database
          await supabase.from("panic_alerts").insert({
            user_id: user.id,
            latitude,
            longitude,
            message: "Panic button activated",
            status: "active",
          });

          // Call emergency contacts sequentially
          contacts?.forEach((contact, idx) => {
            setTimeout(() => {
              window.open(`tel:${contact.phone}`, "_self");
            }, idx * 1000);
          });

          toast({ 
            title: "🚨 Darurat Aktif!", 
            description: "Lokasi disimpan & kontak dihubungi" 
          });
        },
        () => {
          // Fallback without location
          toast({ 
            title: "🚨 Darurat Aktif!", 
            description: "Menghubungi kontak darurat..." 
          });
        }
      );
    }
  };

  const emergencyGuides = [
    {
      id: "seizure",
      emoji: "🫨",
      title: "Kejang Epilepsi",
      steps: [
        "Hentikan kendaraan di tempat aman",
        "Jangan masukkan apapun ke mulut",
        "Miringkan tubuh agar tidak tersedak",
        "Hubungi 118 jika > 5 menit",
      ],
    },
    {
      id: "heartattack",
      emoji: "💔",
      title: "Serangan Jantung",
      steps: [
        "Hentikan, nyalakan hazard",
        "Hubungi 118 segera",
        "Bantu duduk/berbaring nyaman",
        "Jangan tinggalkan sendirian",
      ],
    },
    {
      id: "accident",
      emoji: "🚗",
      title: "Kecelakaan",
      steps: [
        "Amankan lokasi, nyalakan hazard",
        "Periksa kondisi diri dulu",
        "Jangan pindahkan korban",
        "Hubungi 112 dan 118",
        "Dokumentasikan kejadian",
      ],
    },
  ];

  const relationOptions = ["Istri/Suami", "Orang Tua", "Anak", "Saudara", "Teman"];

  // Auto-format phone number
  const handlePhoneChange = (value: string) => {
    let formatted = value.replace(/\D/g, "");
    
    // Auto-add +62 for Indonesian numbers
    if (formatted.startsWith("0")) {
      formatted = "62" + formatted.slice(1);
    }
    if (formatted.length > 0 && !formatted.startsWith("62")) {
      formatted = "62" + formatted;
    }
    
    // Format: +62 xxx-xxxx-xxxx
    if (formatted.length > 2) {
      let display = "+62 ";
      const rest = formatted.slice(2);
      if (rest.length <= 3) {
        display += rest;
      } else if (rest.length <= 7) {
        display += rest.slice(0, 3) + "-" + rest.slice(3);
      } else {
        display += rest.slice(0, 3) + "-" + rest.slice(3, 7) + "-" + rest.slice(7, 11);
      }
      setFormPhone(display);
    } else {
      setFormPhone(value);
    }
  };

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <PageHeader title="Darurat" />

      {/* Enhanced Panic Button - Full Width at Top */}
      <EnhancedPanicButton onActivate={handlePanicActivate} />

      {/* Quick Call Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button 
          variant="outline"
          className="h-14 text-base font-semibold border-2 border-destructive/30 hover:bg-destructive hover:text-destructive-foreground"
          onClick={() => callContact("112")}
        >
          <Phone className="w-5 h-5 mr-2" />
          Polisi 112
        </Button>
        <Button 
          variant="outline"
          className="h-14 text-base font-semibold border-2 border-destructive/30 hover:bg-destructive hover:text-destructive-foreground"
          onClick={() => callContact("118")}
        >
          <Ambulance className="w-5 h-5 mr-2" />
          Ambulans 118
        </Button>
      </div>

      {/* Emergency Contacts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Kontak Darurat ({contacts?.length || 0}/3)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {contacts && contacts.length > 0 ? (
            contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center gap-3 p-3 bg-muted rounded-xl"
              >
                <Button
                  size="icon"
                  className="h-12 w-12 rounded-full bg-success hover:bg-success/90"
                  onClick={() => callContact(contact.phone)}
                >
                  <Phone className="w-5 h-5" />
                </Button>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{contact.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {contact.relationship || contact.phone}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDeleteClick(contact)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Belum ada kontak darurat
            </p>
          )}

          {/* Add Contact Form */}
          {showForm ? (
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tambah Kontak</span>
                <Button variant="ghost" size="icon" onClick={resetForm}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-1">
                <Input
                  placeholder="Nama"
                  value={formName}
                  onChange={handleNameChange}
                  className={`h-12 ${nameError ? "border-destructive" : ""}`}
                />
                {nameError && (
                  <div className="flex items-center gap-1 text-destructive">
                    <AlertCircle className="w-3 h-3" />
                    <span className="text-xs">{nameError}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-1">
                <Input
                  type="tel"
                  placeholder="+62 812-3456-7890"
                  value={formPhone}
                  onChange={handlePhoneInputChange}
                  className={`h-12 ${phoneError ? "border-destructive" : ""}`}
                />
                {phoneError && (
                  <div className="flex items-center gap-1 text-destructive">
                    <AlertCircle className="w-3 h-3" />
                    <span className="text-xs">{phoneError}</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {relationOptions.map((rel) => (
                  <Button
                    key={rel}
                    type="button"
                    variant={formRelation === rel ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormRelation(rel)}
                  >
                    {rel}
                  </Button>
                ))}
              </div>
              
              <Button
                onClick={() => addContact.mutate()}
                disabled={!isFormValid() || addContact.isPending}
                className="w-full h-12"
              >
                {addContact.isPending ? "Menyimpan..." : "Simpan Kontak"}
              </Button>
            </div>
          ) : (
            (contacts?.length || 0) < 3 && (
              <Button 
                variant="outline" 
                className="w-full h-12"
                onClick={() => setShowForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Kontak Darurat
              </Button>
            )
          )}
        </CardContent>
      </Card>

      {/* Medical Knowledge - Simplified Accordion */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="w-5 h-5 text-destructive" />
            Panduan Darurat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="seizure" className="border-b-0">
              <AccordionTrigger className="text-sm font-medium py-3">
                🫨 Kejang Epilepsi
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-1.5 pb-4">
                <p>• Hentikan kendaraan di tempat aman</p>
                <p>• Jangan masukkan apapun ke mulut</p>
                <p>• Miringkan tubuh agar tidak tersedak</p>
                <p>• Hubungi 118 jika &gt; 5 menit</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="heartattack" className="border-b-0">
              <AccordionTrigger className="text-sm font-medium py-3">
                💔 Serangan Jantung
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-1.5 pb-4">
                <p>• Hentikan, nyalakan hazard</p>
                <p>• Hubungi 118 segera</p>
                <p>• Bantu duduk/berbaring nyaman</p>
                <p>• Jangan tinggalkan sendirian</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="accident" className="border-b-0">
              <AccordionTrigger className="text-sm font-medium py-3">
                🚗 Kecelakaan
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-1.5 pb-4">
                <p>• Amankan lokasi, nyalakan hazard</p>
                <p>• Periksa kondisi diri dulu</p>
                <p>• Jangan pindahkan korban</p>
                <p>• Hubungi 112 dan 118</p>
                <p>• Dokumentasikan kejadian</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Hapus Kontak Darurat?"
        description={contactToDelete 
          ? `"${contactToDelete.name}${contactToDelete.relationship ? ` (${contactToDelete.relationship})` : ''}" akan dihapus dari daftar kontak darurat Anda.`
          : "Kontak ini akan dihapus."
        }
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        icon={<UserMinus className="w-6 h-6 text-destructive" />}
      />
    </div>
  );
};

export default Safety;