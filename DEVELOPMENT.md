# DEVELOPMENT

Panduan ini memastikan pengembangan tetap selaras, stabil, dan minim konflik.

## 1) Setup & Menjalankan
- Install: `npm i`
- Dev: `npm run dev`
- Test: `npm run test`

## 2) Aturan Branch & PR
- Gunakan branch fitur: `feat/<nama-fitur>`
- Gunakan branch perbaikan: `fix/<nama-issue>`
- Wajib update dari `main` sebelum PR
- Sertakan ringkasan perubahan + langkah uji di PR

## 3) Konvensi Kode
- TypeScript/React di `src/`
- Gunakan `cn` untuk className: `src/lib/utils.ts`
- Simpan logic reusable di `src/hooks/`
- Patuhi struktur halaman di `src/pages/`

## 4) Struktur & Routing
- Routing utama di `src/App.tsx`
- Jangan ubah rute tanpa memperbarui menu/nav terkait

## 5) Supabase & Data
- Migrasi ada di `supabase/migrations/`
- Hindari `SECURITY DEFINER` tanpa alasan kuat
- Pastikan RLS tetap aman

## 6) PWA
- Konfigurasi di `vite.config.ts`
- Komponen terkait di `src/components/pwa/`

## 7) Checklist Sebelum Merge
- [ ] `npm run test` lulus
- [ ] Tidak ada error TypeScript
- [ ] Tidak merusak rencana UX di `.lovable/plan.md`
- [ ] README/DEVELOPMENT diperbarui jika perlu

## 8) Resolusi Konflik
- Selalu rebase dari `main` sebelum merge
- Jika konflik di file UI utama, selesaikan dengan review bersama

## 9) Rilis
- Gunakan tag rilis semantik: `vX.Y.Z`
- Catat perubahan di CHANGELOG (jika digunakan)