// Validation Library - Centralized input validation functions

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Phone number validation for Indonesian format
export const validatePhone = (phone: string): ValidationResult => {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, "");
  
  // Check if empty
  if (!digits) {
    return { isValid: false, error: "Nomor telepon tidak boleh kosong" };
  }
  
  // Normalize: remove leading 0 or 62
  let normalized = digits;
  if (normalized.startsWith("62")) {
    normalized = normalized.slice(2);
  } else if (normalized.startsWith("0")) {
    normalized = normalized.slice(1);
  }
  
  // Check length (Indonesian mobile: 9-12 digits after prefix)
  if (normalized.length < 9) {
    return { isValid: false, error: "Nomor telepon terlalu pendek" };
  }
  if (normalized.length > 12) {
    return { isValid: false, error: "Nomor telepon terlalu panjang" };
  }
  
  // Check valid Indonesian mobile prefixes
  const validPrefixes = ["81", "82", "83", "85", "87", "88", "89", "21", "22", "31"];
  const prefix = normalized.slice(0, 2);
  if (!validPrefixes.includes(prefix)) {
    return { isValid: false, error: "Nomor harus dimulai dengan 08 atau +62" };
  }
  
  return { isValid: true };
};

// Format phone number for display
export const formatPhoneDisplay = (phone: string): string => {
  const digits = phone.replace(/\D/g, "");
  
  if (!digits) return "";
  
  // Normalize to start with 62
  let normalized = digits;
  if (normalized.startsWith("0")) {
    normalized = "62" + normalized.slice(1);
  } else if (!normalized.startsWith("62")) {
    normalized = "62" + normalized;
  }
  
  // Format: +62 xxx-xxxx-xxxx
  if (normalized.length > 2) {
    let display = "+62 ";
    const rest = normalized.slice(2);
    if (rest.length <= 3) {
      display += rest;
    } else if (rest.length <= 7) {
      display += rest.slice(0, 3) + "-" + rest.slice(3);
    } else {
      display += rest.slice(0, 3) + "-" + rest.slice(3, 7) + "-" + rest.slice(7, 11);
    }
    return display;
  }
  
  return phone;
};

// Name validation
export const validateName = (name: string): ValidationResult => {
  const trimmed = name.trim();
  
  if (!trimmed) {
    return { isValid: false, error: "Nama tidak boleh kosong" };
  }
  
  if (trimmed.length < 2) {
    return { isValid: false, error: "Nama minimal 2 karakter" };
  }
  
  if (trimmed.length > 50) {
    return { isValid: false, error: "Nama maksimal 50 karakter" };
  }
  
  // Check if name is only numbers
  if (/^\d+$/.test(trimmed)) {
    return { isValid: false, error: "Nama tidak boleh hanya angka" };
  }
  
  return { isValid: true };
};

// Currency validation
export const validateCurrency = (
  amount: number, 
  min: number = 5000, 
  max: number = 1000000
): ValidationResult => {
  if (amount < min) {
    return { isValid: false, error: `Minimal Rp ${min.toLocaleString("id-ID")}` };
  }
  
  if (amount > max) {
    return { isValid: false, error: `Maksimal Rp ${max.toLocaleString("id-ID")}` };
  }
  
  return { isValid: true };
};

// Fuel vs Gross sanity check
export const validateFuelRatio = (fuel: number, gross: number): ValidationResult => {
  if (gross <= 0) {
    return { isValid: true }; // Skip check if no gross
  }
  
  const ratio = fuel / gross;
  if (ratio > 0.5) {
    return { 
      isValid: false, 
      error: "Bensin melebihi 50% dari pendapatan. Pastikan data benar." 
    };
  }
  
  return { isValid: true };
};

// Email validation (basic)
export const validateEmail = (email: string): ValidationResult => {
  const trimmed = email.trim();
  
  if (!trimmed) {
    return { isValid: false, error: "Email tidak boleh kosong" };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: "Format email tidak valid" };
  }
  
  return { isValid: true };
};
