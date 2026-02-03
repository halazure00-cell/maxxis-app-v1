import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface ProfileEditorProps {
  userId: string;
  currentAvatarUrl?: string | null;
  fullName: string;
}

const ProfileEditor = ({ userId, currentAvatarUrl, fullName }: ProfileEditorProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showCameraButton, setShowCameraButton] = useState(!currentAvatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleAvatarClick = () => {
    if (currentAvatarUrl && !showCameraButton) {
      // Show camera button when tapping on existing avatar
      setShowCameraButton(true);
    } else {
      // Open file picker
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "File tidak valid",
        description: "Pilih file gambar (JPG, PNG)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File terlalu besar",
        description: "Maksimal 2MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Delete old avatar if exists
      if (currentAvatarUrl) {
        const oldPath = currentAvatarUrl.split("/").slice(-2).join("/");
        await supabase.storage.from("avatars").remove([oldPath]);
      }

      // Upload new avatar
      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // Update profile with new URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setShowCameraButton(false); // Hide camera after successful upload
      toast({
        title: "✅ Foto diperbarui",
        description: "Foto profil berhasil diubah",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Gagal upload",
        description: "Tidak dapat mengupload foto",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative cursor-pointer group" onClick={handleAvatarClick}>
      <Avatar className="w-20 h-20 border-4 border-primary-foreground/30 shadow-lg transition-transform group-active:scale-95">
        <AvatarImage src={currentAvatarUrl || undefined} alt={fullName} />
        <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-2xl font-bold">
          {fullName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Camera button - only visible when no photo OR when showCameraButton is true */}
      {(showCameraButton || isUploading) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full transition-opacity">
          {isUploading ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Camera className="w-6 h-6 text-white" />
          )}
        </div>
      )}

      {/* Hint text for existing avatar */}
      {currentAvatarUrl && !showCameraButton && (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="text-[10px] text-primary-foreground/60">Tap untuk ubah</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

export default ProfileEditor;
