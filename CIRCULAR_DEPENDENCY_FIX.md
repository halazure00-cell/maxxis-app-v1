# Circular Dependency & Module Initialization Fix Guide

## Problem
Error: `ReferenceError: Cannot access 'x' before initialization` di production build karena minification menyebabkan module initialization order berubah.

## Root Causes
1. **Heavy page imports** - semua pages di-import statis di App.tsx
2. **Circular dependencies** - module A import B, B import A (indirect)
3. **Side effects di top-level** - code yang run saat module load
4. **Aggressive code splitting** - manual chunks yang tidak coherent

## Solutions (Applied)

### 1. **Lazy Load Pages** ✅
```tsx
// BEFORE (problematic)
import Dashboard from "@/pages/Dashboard";

// AFTER (fixed)
const Dashboard = lazy(() => import("@/pages/Dashboard"));
```
- Defer import hingga page dibutuhkan
- Reduce initial bundle size
- Menghindari initialization conflicts

### 2. **Simplify Build Config** ✅
```typescript
// vite.config.ts
build: {
  minify: "terser",
  terserOptions: {
    compress: { passes: 1 },
    mangle: { keep_fnames: true },
  },
  rollupOptions: {
    output: {
      // Let Rollup handle chunks, don't force manualChunks
    },
  },
}
```

### 3. **Use Suspense Boundary**
```tsx
<Suspense fallback={<PageLoader />}>
  <Routes>...</Routes>
</Suspense>
```
- Graceful loading state
- Prevent race conditions

### 4. **Avoid Side Effects in Modules**
❌ BAD:
```typescript
// utils.ts
const someValue = heavyComputation();
export const useMyHook = () => someValue;
```

✅ GOOD:
```typescript
// useMyHook.ts
export const useMyHook = () => {
  const [value, setValue] = useState(null);
  useEffect(() => {
    setValue(heavyComputation());
  }, []);
  return value;
};
```

### 5. **Lint for Circular Dependencies**
Install:
```bash
npm install --save-dev eslint-plugin-import
```

Add to `.eslintrc`:
```json
{
  "extends": ["plugin:import/recommended"],
  "rules": {
    "import/no-cycle": ["error", { "maxDepth": "∞" }]
  }
}
```

### 6. **Terser Options for Safety**
```typescript
terserOptions: {
  compress: {
    passes: 1,          // Single pass (safer)
    unused: true,       // Remove unused code
    dead_code: true,    // Remove dead code
  },
  mangle: {
    keep_fnames: true,  // Avoid variable name collisions
    properties: false,  // Don't mangle object properties
  },
}
```

## Testing Checklist
- [x] Dev mode works (`npm run dev`)
- [x] Production build succeeds (`npm run build`)
- [x] Preview loads without errors (`npm run preview`)
- [x] Console has no "Cannot access before initialization"
- [x] All pages load via lazy routes
- [x] Loading states work (Skeleton components)

## Prevention for Future Projects
1. Always use lazy loading for route-based code splitting
2. Avoid side effects at module top-level
3. Keep build config simple - let Vite optimize
4. Use import cycle linting
5. Test build output regularly (`npm run build && npm run preview`)
6. Use `--legacy-peer-deps` in Vercel build settings (.npmrc)

## References
- Vite Lazy Loading: https://vitejs.dev/guide/features.html#dynamic-import
- React Code Splitting: https://react.dev/reference/react/lazy
- Rollup Code Splitting: https://rollupjs.org/guide/en/#code-splitting
