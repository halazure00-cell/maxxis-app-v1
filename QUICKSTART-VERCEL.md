# Quick Reference: Deploy to Vercel

## Langkah Singkat

### 1. Setup Awal (Sekali Saja)
1. Buka https://vercel.com dan login dengan GitHub
2. Klik "Add New Project"
3. Import repository: `halazure00-cell/maxxis-app-v1`
4. Vercel otomatis detect: Framework = Vite ✓

### 2. Environment Variables
Di Vercel Dashboard → Settings → Environment Variables, tambahkan:

```
VITE_SUPABASE_PROJECT_ID
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_URL
```

Copy nilai dari file `.env` lokal Anda.

### 3. Deploy
Klik "Deploy" - selesai! 🚀

## Deployment Otomatis

Setelah setup, setiap:
- Push ke `main` → Deploy Production
- Push ke branch lain → Deploy Preview
- Buat PR → Deploy Preview otomatis

## Akses Aplikasi

Production: `https://your-app.vercel.app`

## Troubleshooting

**Build gagal?**
- Cek logs di Vercel Dashboard
- Pastikan environment variables sudah diset
- Lihat [DEPLOYMENT.md](DEPLOYMENT.md) untuk detail

**PWA tidak jalan?**
- Clear cache browser
- Test di mobile device
- Vercel otomatis provide HTTPS (required untuk PWA)

## Files Penting

- `vercel.json` - Konfigurasi Vercel
- `.env.example` - Template environment variables
- `DEPLOYMENT.md` - Panduan lengkap
- `.npmrc` - npm configuration

## Rollback

Di Vercel Dashboard → Deployments → Pilih deployment sebelumnya → "Promote to Production"

---

Untuk panduan lengkap: [DEPLOYMENT.md](DEPLOYMENT.md)
