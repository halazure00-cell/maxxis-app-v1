# DEPLOYMENT.md

Panduan lengkap untuk deployment aplikasi Maxim Driver Assistant ke Vercel.

## Prerequisites

1. Akun Vercel (gratis): https://vercel.com/signup
2. Proyek Supabase yang sudah dikonfigurasi
3. Repository GitHub yang sudah terhubung

## Langkah Deployment ke Vercel

### 1. Persiapan Awal

Pastikan semua konfigurasi lokal sudah bekerja dengan baik:

```bash
# Install dependencies
npm install

# Test build lokal
npm run build

# Preview build lokal
npm run preview
```

### 2. Setup Vercel Project

#### Via Vercel Dashboard:

1. Login ke https://vercel.com
2. Klik "Add New Project" atau "Import Project"
3. Pilih repository GitHub: `halazure00-cell/maxxis-app-v1`
4. Vercel akan otomatis mendeteksi framework (Vite)

#### Konfigurasi Build Settings:

Vercel akan otomatis membaca file `vercel.json`, tetapi pastikan:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. Environment Variables

Tambahkan environment variables di Vercel Dashboard:

**Settings → Environment Variables**

```
VITE_SUPABASE_PROJECT_ID = [your_project_id]
VITE_SUPABASE_PUBLISHABLE_KEY = [your_publishable_key]
VITE_SUPABASE_URL = [https://your_project_id.supabase.co]
```

**Catatan Penting:**
- Semua environment variables untuk Vite harus diawali dengan prefix `VITE_`
- Gunakan Supabase publishable key, **bukan** secret key
- Environment variables harus ditambahkan untuk semua environments (Production, Preview, Development)

### 4. Deploy

Setelah konfigurasi selesai:

1. Klik "Deploy"
2. Vercel akan:
   - Clone repository
   - Install dependencies dengan npm
   - Run build command
   - Deploy hasil build ke CDN
3. Deployment selesai dalam 1-3 menit

### 5. Verifikasi Deployment

Setelah deployment berhasil:

1. ✅ Buka URL yang diberikan Vercel (e.g., `https://your-app.vercel.app`)
2. ✅ Test semua halaman utama:
   - Dashboard
   - Finance
   - Map
   - Safety
   - Profile
   - Tips
3. ✅ Verifikasi PWA berfungsi:
   - Service Worker terdaftar
   - Manifest terdeteksi
   - Install prompt muncul (di mobile)
4. ✅ Test koneksi Supabase:
   - Data loading dari Supabase
   - Authentication (jika ada)

## Automatic Deployments

Setelah setup awal, Vercel akan otomatis deploy:

- **Production**: Setiap push ke branch `main`
- **Preview**: Setiap push ke branch lain atau Pull Request

## Custom Domain (Opsional)

Untuk menggunakan domain kustom:

1. Buka Vercel Dashboard → Project Settings → Domains
2. Tambahkan domain Anda
3. Update DNS records sesuai instruksi Vercel
4. Tunggu SSL certificate aktif (otomatis, 1-5 menit)

## Troubleshooting

### Build Gagal

**Error: "peer dependency conflict"**
```
Solusi: File .npmrc sudah dikonfigurasi dengan legacy-peer-deps=true
```

**Error: "Environment variable not found"**
```
Solusi: 
1. Cek Environment Variables di Vercel Dashboard
2. Pastikan prefix VITE_ digunakan
3. Redeploy setelah menambahkan variables
```

### PWA Tidak Berfungsi

**Service Worker tidak terdaftar**
```
Solusi:
1. Pastikan HTTPS aktif (Vercel otomatis provide SSL)
2. Cek file sw.js accessible di /sw.js
3. Clear browser cache dan reload
```

**Install prompt tidak muncul**
```
Solusi:
1. Buka DevTools → Application → Manifest
2. Pastikan manifest valid
3. Test di mobile device (PWA install hanya di mobile)
```

### Route 404

**SPA routing tidak bekerja**
```
Solusi: File vercel.json sudah mengkonfigurasi rewrites
untuk SPA routing. Pastikan file ini ada di root project.
```

## Performance Optimization

### Recommendations Implemented:

1. ✅ **Code Splitting**: Vite otomatis split chunks
2. ✅ **PWA Caching**: Workbox configured untuk cache assets
3. ✅ **Security Headers**: Configured di vercel.json
4. ✅ **Gzip Compression**: Vercel otomatis compress

### Future Optimizations:

- [ ] Implement dynamic imports untuk halaman besar
- [ ] Optimize images dengan responsive images
- [ ] Add preload hints untuk critical resources

## Monitoring & Analytics

### Vercel Analytics (Opsional)

Untuk enable analytics:

1. Vercel Dashboard → Analytics
2. Install `@vercel/analytics`:
   ```bash
   npm install @vercel/analytics
   ```
3. Add to `src/main.tsx`:
   ```typescript
   import { inject } from '@vercel/analytics';
   inject();
   ```

### Performance Monitoring

Gunakan Vercel Speed Insights untuk monitor:
- Core Web Vitals
- Page load times
- Real User Monitoring (RUM)

## Rollback

Jika deployment bermasalah:

1. Buka Vercel Dashboard → Deployments
2. Pilih deployment sebelumnya yang stabil
3. Klik "Promote to Production"
4. Instant rollback tanpa rebuild

## Security Checklist

- [x] Environment variables tidak di-commit ke repository
- [x] .env ada di .gitignore
- [x] .env.example tersedia sebagai template
- [x] Security headers configured (X-Frame-Options, CSP, etc)
- [x] HTTPS enforced (Vercel default)
- [ ] Enable Vercel Firewall (optional, paid feature)
- [ ] Configure rate limiting (optional)

## Resources

- Vercel Documentation: https://vercel.com/docs
- Vite Deployment Guide: https://vitejs.dev/guide/static-deploy.html
- Supabase Documentation: https://supabase.com/docs

## Support

Untuk issues atau pertanyaan deployment:
1. Check Vercel deployment logs
2. Review DEVELOPMENT.md untuk development guidelines
3. Check AGENTS.md untuk project architecture

---

**Last Updated**: 2026-02-03
**Deployment Platform**: Vercel
**Framework**: Vite + React + TypeScript
