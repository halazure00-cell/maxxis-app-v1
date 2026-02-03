# Maxim Driver Assistant

Aplikasi PWA pribadi untuk membantu driver Maxim mengelola order, keuangan, hotspot lokasi, dan keamanan. Fokus utama aplikasi ini adalah **praktis dipakai harian**, ringan, serta tetap berguna **saat offline**.

## Deskripsi Singkat
Maxim Driver Assistant menyediakan:
- **Dashboard** ringkas performa harian
- **Keuangan**: input order & pengeluaran, tren 7 hari
- **Hotspot**: rekomendasi lokasi ramai order (cache offline)
- **Keamanan**: panic button & kontak darurat
- **Tips**: checklist layanan dan skrip chat cepat

## Cara Menjalankan (Lokal)
Prerequisites: **Node.js 18+**

1) Install dependency:
```sh
npm i
```

2) Jalankan development server:
```sh
npm run dev
```

3) Buka di browser:
```sh
http://localhost:8080
```

## Build & Preview
```sh
npm run build
npm run preview
```

## Testing
```sh
npm run test
```

## Catatan Teknis
- Frontend: React + Vite + TypeScript + Tailwind + shadcn-ui  
- Backend data: Supabase (opsional untuk mode online)  
- PWA: auto-update + dukungan offline cache  

## Struktur Fitur Utama
- **Beranda/Dashboard**: ringkasan performa
- **Keuangan**: input & statistik
- **Hotspot**: peta & rekomendasi lokasi
- **Darurat**: tombol panic + kontak
- **Profil**: data akun dan atribut
- **Tips**: panduan pelayanan

## Lisensi
Private / internal use.
