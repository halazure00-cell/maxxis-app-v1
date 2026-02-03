import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : null;
  const runtimeCaching = [
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|webp)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "images",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 86400 * 30,
        },
      },
    },
    {
      urlPattern: /^https:\/\/api\.open-meteo\.com/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "weather-api",
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 600,
        },
      },
    },
  ];

  if (supabaseOrigin) {
    runtimeCaching.unshift({
      urlPattern: new RegExp(`^${escapeRegExp(supabaseOrigin)}`),
      handler: "NetworkFirst",
      options: {
        cacheName: "supabase-api",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 300,
        },
      },
    });
  }

  return {
    server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "robots.txt", "pwa-*.png", "maskable-icon-512x512.png"],
        manifest: {
          name: "Maxim Driver Assistant",
          short_name: "Maxim Driver",
          description: "Asisten lengkap untuk driver Maxim - Tracking order, keuangan, dan keselamatan",
          theme_color: "#FFD600",
          background_color: "#FAFAFA",
          display: "standalone",
          orientation: "portrait",
          start_url: "/",
          scope: "/",
          icons: [
            {
              src: "/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "/maskable-icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          runtimeCaching,
        },
      }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      minify: false, // Disable minification to avoid circular dependency issues in production
      // Size still manageable due to gzip compression and lazy loading
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          entryFileNames: "assets/[name]-[hash].js",
          chunkFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash][extname]",
        },
      },
    },
  };
});

