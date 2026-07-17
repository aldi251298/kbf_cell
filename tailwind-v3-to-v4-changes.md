# Tailwind CSS v3 → v4: Rangkuman Perubahan (Referensi Agent Coding)

> Sumber: Dokumentasi resmi Tailwind CSS (tailwindcss.com/docs/upgrade-guide) + beberapa artikel migrasi 2026.
> Tujuan: mencegah agent coding menulis syntax/config gaya v3 di project yang sudah pakai v4.

---

## 0. Prasyarat & Kompatibilitas Browser

- **Tailwind v4 hanya mendukung browser modern**: Safari 16.4+, Chrome 111+, Firefox 128+.
- Jika project harus support browser lama → **tetap pakai v3.4**, jangan upgrade.
- v4 bergantung pada fitur CSS modern: `@property` dan `color-mix()`.
- Tool upgrade otomatis: `npx @tailwindcss/upgrade` (butuh Node.js 20+).

---

## 1. Perubahan Arsitektur Paling Fundamental

| Area | v3 | v4 |
|---|---|---|
| Engine | JS-based (PostCSS) | Rust-based ("Oxide"), jauh lebih cepat |
| Konfigurasi | `tailwind.config.js` (JS) | CSS-first via `@theme` di file CSS |
| Import CSS | `@tailwind base/components/utilities` | `@import "tailwindcss";` |
| PostCSS plugin | `tailwindcss` | `@tailwindcss/postcss` (paket terpisah) |
| CLI | `npx tailwindcss ...` | `npx @tailwindcss/cli ...` |
| Vite | via PostCSS plugin | plugin khusus `@tailwindcss/vite` (disarankan) |
| `postcss-import`, `autoprefixer` | manual ditambahkan | **otomatis** ditangani Tailwind, boleh dihapus dari config |

### Setup CSS entry point (WAJIB diubah)
```css
/* v3 */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* v4 */
@import "tailwindcss";
```

### postcss.config
```js
// v3
export default {
  plugins: {
    "postcss-import": {},
    tailwindcss: {},
    autoprefixer: {},
  },
};

// v4
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

### Vite (disarankan)
```ts
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
});
```

---

## 2. Konfigurasi: dari JS ke CSS (`@theme`)

- `tailwind.config.js` **masih didukung** untuk backward compatibility, tapi **tidak lagi otomatis terdeteksi**. Harus di-load manual:
```css
@config "../../tailwind.config.js";
```
- Opsi `corePlugins`, `safelist`, `separator` di config JS **tidak didukung lagi** di v4.
  - Ganti `safelist` → gunakan `@source inline(...)`.
- Cara idiomatis v4 — definisikan theme langsung di CSS:
```css
@import "tailwindcss";

@theme {
  --font-display: "Satoshi", sans-serif;
  --breakpoint-3xl: 120rem;
  --color-avocado-500: oklch(0.84 0.18 117.33);
}
```
- `resolveConfig` (untuk ambil theme di JS) **dihapus**. Ganti dengan `getComputedStyle` untuk baca CSS variable, atau pakai variable CSS langsung (mis. di Motion/Framer Motion: `animate={{ backgroundColor: "var(--color-blue-500)" }}`).
- Disable core plugin lewat `corePlugins` **tidak bisa lagi** di v4.

---

## 3. Utility yang DIHAPUS (deprecated di v3, mati total di v4)

| Dihapus | Ganti dengan |
|---|---|
| `bg-opacity-*` | modifier opacity: `bg-black/50` |
| `text-opacity-*` | `text-black/50` |
| `border-opacity-*` | `border-black/50` |
| `divide-opacity-*` | `divide-black/50` |
| `ring-opacity-*` | `ring-black/50` |
| `placeholder-opacity-*` | `placeholder-black/50` |
| `flex-shrink-*` | `shrink-*` |
| `flex-grow-*` | `grow-*` |
| `overflow-ellipsis` | `text-ellipsis` |
| `decoration-slice` | `box-decoration-slice` |
| `decoration-clone` | `box-decoration-clone` |

---

## 4. Utility yang DI-RENAME (paling sering bikin bug)

| v3 | v4 |
|---|---|
| `shadow-sm` | `shadow-xs` |
| `shadow` | `shadow-sm` |
| `drop-shadow-sm` | `drop-shadow-xs` |
| `drop-shadow` | `drop-shadow-sm` |
| `blur-sm` | `blur-xs` |
| `blur` | `blur-sm` |
| `backdrop-blur-sm` | `backdrop-blur-xs` |
| `backdrop-blur` | `backdrop-blur-sm` |
| `rounded-sm` | `rounded-xs` |
| `rounded` | `rounded-sm` |
| `outline-none` | `outline-hidden` |
| `ring` | `ring-3` |

⚠️ **Perhatian khusus**: skala `shadow`, `blur`, `rounded` di v4 **digeser satu tingkat** (bukan cuma rename biasa). Kelas "bare" (tanpa suffix) tetap bekerja untuk backward-compat, tapi **artinya sudah beda**. Jadi kalau ada `shadow-sm` di kode lama, itu sekarang harus jadi `shadow-xs` agar visualnya sama seperti sebelumnya.

---

## 5. Default Value yang Berubah (silent breaking change — sering luput)

| Hal | v3 | v4 |
|---|---|---|
| `border` default color | `gray-200` | `currentColor` |
| `ring` default width | `3px` | `1px` (gunakan `ring-3` utk width lama) |
| `ring` default color | `blue-500` | `currentColor` |
| `outline` width | tidak fix | `outline-*<number>` otomatis `outline-style: solid` |
| Placeholder text color | `gray-400` | current text color @ 50% opacity |
| Button cursor | `cursor: pointer` | `cursor: default` (ikut browser native) |
| `<dialog>` margin | ada margin bawaan | direset ke `margin: 0` (tidak center otomatis) |
| `hidden` attribute vs display class | display class (`flex`, `block`) menang | `hidden` attribute sekarang **menang** |

**Wajib eksplisit warna border sekarang:**
```html
<!-- v3: otomatis abu-abu -->
<div class="border px-2 py-3">...</div>

<!-- v4: harus tulis warna, kalau tidak jadi currentColor -->
<div class="border border-gray-200 px-2 py-3">...</div>
```

**`ring` default:**
```html
<!-- v3 -->
<button class="focus:ring">...</button>
<!-- v4 (biar sama persis) -->
<button class="focus:ring-3 focus:ring-blue-500">...</button>
```

Kalau mau paksa perilaku v3 tanpa ubah semua kelas, tambahkan di CSS:
```css
@theme {
  --default-ring-width: 3px;
  --default-ring-color: var(--color-blue-500);
}
@layer base {
  *, ::after, ::before, ::backdrop, ::file-selector-button {
    border-color: var(--color-gray-200, currentColor);
  }
  button:not(:disabled), [role="button"]:not(:disabled) {
    cursor: pointer;
  }
  dialog { margin: auto; }
}
```

---

## 6. Selector `space-x-*` / `space-y-*` dan `divide-*` Berubah

Diganti demi performa di halaman besar:
```css
/* v3 */
.space-y-4 > :not([hidden]) ~ :not([hidden]) { margin-top: 1rem; }

/* v4 */
.space-y-4 > :not(:last-child) { margin-bottom: 1rem; }
```
- Bisa memengaruhi layout kalau dipakai bareng elemen inline atau ada margin custom di child.
- **Rekomendasi**: pindah ke `flex`/`grid` + `gap-*` daripada `space-x/y-*`.

`divide-x-*` / `divide-y-*` mengalami perubahan selector serupa.

---

## 7. Gradient dengan Variant (dark mode dsb.)

- v3: override sebagian gradient dengan variant akan **mereset seluruh gradient**.
- v4: value gradient **dipertahankan** (lebih konsisten), sehingga mungkin perlu `via-none` eksplisit untuk "membatalkan" 3-stop gradient jadi 2-stop di state tertentu.

```html
<div class="bg-linear-to-r from-red-500 via-orange-400 to-yellow-400
            dark:via-none dark:from-blue-500 dark:to-teal-400">
```
> Catatan: `bg-gradient-to-r` → di v4 sekarang jadi `bg-linear-to-r`.

---

## 8. Container Utility

- Opsi `center`, `padding`, dll di config JS untuk `container` **sudah tidak ada** di v4.
- Custom container sekarang lewat `@utility`:
```css
@utility container {
  margin-inline: auto;
  padding-inline: 2rem;
}
```

---

## 9. Prefix (`prefix` config)

- v4: prefix ditulis seperti variant, **selalu di awal class name**.
```html
<!-- v3 -->
<div class="tw-flex tw-bg-red-500 hover:tw-bg-red-600">

<!-- v4 -->
<div class="tw:flex tw:bg-red-500 tw:hover:bg-red-600">
```
- Setup theme tetap tanpa prefix di `@theme`, tapi generated CSS var akan otomatis prefixed:
```css
@import "tailwindcss" prefix(tw);
@theme {
  --color-avocado-100: oklch(0.99 0 0);
}
/* -> :root { --tw-color-avocado-100: ...; } */
```

---

## 10. Important Modifier (`!`)

```html
<!-- v3: ! di depan -->
<div class="!flex !bg-red-500 hover:!bg-red-600">

<!-- v4: ! di akhir -->
<div class="flex! bg-red-500! hover:bg-red-600/50!">
```
Syntax lama masih jalan (deprecated), tapi agent harus **generate versi v4** untuk kode baru.

---

## 11. Custom Utility (`@layer utilities` / `@layer components`)

v3 pakai `@layer utilities` / `@layer components` untuk custom class yang otomatis dapat variant support. v4 pakai `@utility`:

```css
/* v3 */
@layer utilities {
  .tab-4 { tab-size: 4; }
}

/* v4 */
@utility tab-4 {
  tab-size: 4;
}
```

- Custom utility di v4 di-sort otomatis berdasarkan jumlah properti, jadi component-style class (`.btn`) bisa di-override oleh utility Tailwind lain tanpa config tambahan.

---

## 12. Urutan Stacking Variant Terbalik

- v3: variant bertumpuk diterapkan **kanan ke kiri**.
- v4: **kiri ke kanan** (lebih mirip urutan baca CSS).

```html
<!-- v3 -->
<ul class="py-4 first:*:pt-0 last:*:pb-0">

<!-- v4 -->
<ul class="py-4 *:first:pt-0 *:last:pb-0">
```
Paling sering kena: variant child selector (`*`) dan plugin typography (`prose-headings`).

---

## 13. Arbitrary Value Syntax Berubah

### CSS variable sebagai arbitrary value
```html
<!-- v3 -->
<div class="bg-[--brand-color]"></div>

<!-- v4: harus pakai kurung () bukan [] -->
<div class="bg-(--brand-color)"></div>
```

### Koma di grid/object-position arbitrary value
```html
<!-- v3: koma otomatis jadi spasi -->
<div class="grid-cols-[max-content,auto]"></div>

<!-- v4: HARUS pakai underscore untuk spasi, koma tidak lagi otomatis -->
<div class="grid-cols-[max-content_auto]"></div>
```

---

## 14. Hover di Mobile/Touch Device

v4 membungkus `hover:` dalam media query `@media (hover: hover)` — hover tidak lagi terpicu oleh tap di touch device.

```css
/* Kalau butuh perilaku lama (hover selalu aktif) */
@custom-variant hover (&:hover);
```

---

## 15. Transition Sekarang Include `outline-color`

`transition` / `transition-colors` sekarang otomatis meng-cover `outline-color`. Kalau ada `hover:outline-2 hover:outline-cyan-500` dengan `transition`, warna outline akan **transisi dari warna default**. Fix: set warna outline tanpa syarat.

```html
<!-- Bisa muncul transisi warna aneh -->
<button class="transition hover:outline-2 hover:outline-cyan-500">

<!-- Fix -->
<button class="outline-cyan-500 transition hover:outline-2">
```

---

## 16. Transform: `rotate` / `scale` / `translate` Jadi Property Terpisah

v4 tidak lagi menyatukan semuanya ke satu `transform`, tapi pakai property CSS individual (`rotate`, `scale`, `translate`).

- **Reset transform** — `transform-none` tidak lagi mereset rotate/scale/translate:
```html
<!-- v3 -->
<button class="scale-150 focus:transform-none">

<!-- v4 -->
<button class="scale-150 focus:scale-none">
```

- **Custom transition list** — kalau nulis `transition-[opacity,transform]`, utility rotate/scale/translate **tidak akan** transisi lagi. Harus sebut property spesifik:
```html
<!-- v3 -->
<button class="transition-[opacity,transform] hover:scale-150">

<!-- v4 -->
<button class="transition-[opacity,scale] hover:scale-150">
```

---

## 17. `theme()` Function di CSS

Disarankan pakai CSS variable langsung, bukan `theme()`:
```css
/* v3 gaya lama, masih jalan tapi tidak idiomatis */
.my-class { background-color: theme(colors.red.500); }

/* v4 idiomatis */
.my-class { background-color: var(--color-red-500); }
```

Kalau terpaksa pakai `theme()` (mis. di media query yang belum support CSS var):
```css
/* v3 */
@media (width >= theme(screens.xl)) { ... }

/* v4: pakai nama CSS variable, bukan dot notation */
@media (width >= theme(--breakpoint-xl)) { ... }
```

---

## 18. `@apply` di Vue / Svelte / CSS Modules

Stylesheet yang dibundle terpisah (CSS modules, `<style>` block di Vue/Svelte/Astro) **tidak otomatis** punya akses ke theme variable / custom utility / custom variant dari file lain. Harus di-import pakai `@reference`:

```vue
<style>
@reference "../../app.css";
h1 {
  @apply text-2xl font-bold text-red-500;
}
</style>
```

Alternatif lebih cepat (tanpa `@apply` sama sekali):
```vue
<style>
h1 { color: var(--text-red-500); }
</style>
```

---

## 19. Sass / Less / Stylus TIDAK Didukung Lagi

Tailwind v4 dirancang **sebagai preprocessor itu sendiri**. Tidak bisa dipakai bersama Sass/Less/Stylus untuk stylesheet utama atau `<style>` block di Vue/Svelte/Astro.

---

## 20. Content Detection / Purge

- v3: harus definisikan `content: [...]` di `tailwind.config.js`.
- v4: **automatic content detection** — tidak wajib manual daftar path lagi (meski tetap bisa override via `@source`).
- Untuk safelist class dinamis (mis. dari template literal runtime), gunakan `@source inline("pattern")` — pengganti `safelist` di config JS.

---

## Checklist Cepat untuk Agent Coding

- [ ] File CSS entry pakai `@import "tailwindcss";`, bukan `@tailwind base/components/utilities;`
- [ ] Config theme di CSS (`@theme { ... }`), bukan hanya di `tailwind.config.js`
- [ ] PostCSS pakai `@tailwindcss/postcss`, bukan `tailwindcss` langsung
- [ ] CLI pakai `@tailwindcss/cli`
- [ ] Ganti `shadow-sm→shadow-xs`, `shadow→shadow-sm`, `blur-sm→blur-xs`, `blur→blur-sm`, `rounded-sm→rounded-xs`, `rounded→rounded-sm`
- [ ] Ganti `ring` → `ring-3` + tambahkan warna eksplisit kalau butuh biru default lama
- [ ] Tambahkan `border-gray-200` eksplisit kalau butuh border abu-abu (default sekarang `currentColor`)
- [ ] Ganti `outline-none` → `outline-hidden`
- [ ] Ganti `!` penting dari depan (`!flex`) ke belakang (`flex!`)
- [ ] Ganti arbitrary CSS var `bg-[--x]` → `bg-(--x)`
- [ ] Ganti koma di arbitrary grid/object-position jadi underscore
- [ ] Cek urutan stacking variant (kiri ke kanan sekarang, bukan kanan ke kiri)
- [ ] Ganti `bg-gradient-to-r` → `bg-linear-to-r`
- [ ] Jangan pakai `corePlugins`, `safelist` (JS), `separator` di config — sudah tidak didukung
- [ ] Jangan campur Tailwind dengan Sass/Less/Stylus
- [ ] Kalau pakai `@apply` di Vue/Svelte/CSS module, tambahkan `@reference "path/to/app.css";`
- [ ] Pastikan browser target project modern (Safari 16.4+/Chrome 111+/Firefox 128+); kalau tidak, jangan upgrade ke v4
