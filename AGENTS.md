# AGENTS

## Ringkasan Proyek
Aplikasi PWA untuk asisten driver (dashboard, keuangan, hotspot map, keamanan, profil, tips). Frontend React + Vite + TypeScript + Tailwind + shadcn-ui, backend data via Supabase.

Referensi utama:
- [package.json](package.json)
- [vite.config.ts](vite.config.ts)
- [src/App.tsx](src/App.tsx)
- [supabase/](supabase/)
- [README.md](README.md)

## Arsitektur Singkat
- **Routing**: React Router di [`App`](src/App.tsx) dengan halaman utama di [src/pages/](src/pages/)
- **UI**: komponen di [src/components/](src/components/), styling Tailwind + shadcn-ui
- **Data & API**: Supabase client di [src/integrations/supabase/](src/integrations/supabase/)
- **PWA**: konfigurasi di [vite.config.ts](vite.config.ts), UI di [src/components/pwa/](src/components/pwa/)
- **Tests**: Vitest config di [vitest.config.ts](vitest.config.ts)

## Perintah Umum
- Install: `npm i`
- Dev: `npm run dev`
- Test: `npm run test`

## Konvensi Kode
- TypeScript/React (TSX) di [src/](src/)
- Gunakan util `cn` untuk className di [`cn`](src/lib/utils.ts)
- Simpan logic reusable di [src/hooks/](src/hooks/)

## Integrasi Supabase
- Skema & migrasi di [supabase/migrations/](supabase/migrations/)
- Types di [src/integrations/supabase/types.ts](src/integrations/supabase/types.ts)
- Hindari SECURITY DEFINER yang tidak diperlukan; ikuti RLS (lihat [supabase/migrations/](supabase/migrations/))

## Struktur Halaman
- Dashboard: [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx)
- Finance: [src/pages/Finance.tsx](src/pages/Finance.tsx)
- Map/Hotspot: [src/pages/Map.tsx](src/pages/Map.tsx)
- Safety: [src/pages/Safety.tsx](src/pages/Safety.tsx)
- Profile: [src/pages/Profile.tsx](src/pages/Profile.tsx)
- Tips: [src/pages/Tips.tsx](src/pages/Tips.tsx)
- Install (PWA): [src/pages/Install.tsx](src/pages/Install.tsx)

## Data Preset Hotspot
- Data lokal Bandung di [src/data/bandungHotspots.ts](src/data/bandungHotspots.ts)

## Catatan
- Bahasa UI dominan Bahasa Indonesia.
- Pastikan perubahan UI tidak melanggar rencana UX di [.lovable/plan.md](.lovable/plan.md).