# AGENTS.md — Xiroro Toko Online (MLBB Script)

Panduan ini dibaca AI/developer di awal sesi agar langsung paham arsitektur tanpa menebak.
Membaca file ini WAJIB sebelum mengubah kode apa pun. Ini adalah proyek nyata yang sudah
berjalan (produksi). Berhati-hatilah: jangan merusak alur yang sudah bekerja.

---

## 1. Gambaran sistem (3 layer + bot)

Data mengalir secara konsisten antara:

```
Website (GitHub Pages: xiroro-ab.github.io/Toko-Online-Script-Mlbb)
        │  GET  data (produk/ulasan/config) & POST aksi
        ▼
Google Apps Script (GAS)  —— satu project, satu Google Spreadsheet
        │  POST update Telegram (via webhook)
        ▼
Bot Telegram (XiroroScriptNotifBot)
```

Arsitektur data nyata:

- **Sumber database = Google Spreadsheet** (SATU `SPREADSHEET_ID` untuk semua sheet:
  `Pesanan`, `Produk`, `Ulasan`, `Config`). Semua baca/tulis lewat GAS `SpreadsheetApp`.
- **`produk.json`** dipublish ke GitHub oleh GAS (`publishSemuaProduk` → `publishToGithub`)
  untuk etalase publik yang dimuat cepat oleh `index.html` / `gratis.html`.
- **`ulasan.json`** dipublish oleh `publishUlasanToGithub`. **`public_orders.json`**
  fungsi publish-nya masih kosong (belum dipakai).

## 2. Deployment GAS — INI PENTING (sering jadi sumber bug)

Dua hal yang HARUS diingat dan jangan diubah seenaknya:

- **Web / admin / index / gratis / cek** memakai deployment web:
  `https://script.google.com/macros/s/AKfycbzB0UZRr5PDWnbY4gKkPSMlti17RKpaHx4zUYhdAaGOVt-8KZVu7pG5h0BWFIPrsjCs/exec`
  (project GAS `AKfycbzB0`). Ini yang dipakai semua halaman web (`APPS_SCRIPT_URL` / `appsScriptUrl`).

- **Webhook Telegram JANGAN menunjuk langsung ke GAS.**
  GAS mengirim `302` (atau `200` halaman "Salah") untuk request anonim yang tidak
  mengikuti redirect — Telegram tidak mengikuti redirect → update gagal/membisu.
  Karena itu webhook Telegram diarahkan ke **proxy Vercel** yang mengikuti redirect:

  ```
  https://toko-online-script-mlbb.vercel.app/api/telegram
  ```

  Proxy tersebut adalah `api/telegram.js` (Node, nextjs API route) yang me-forward
  ke GAS `/exec`. `vercel.json` me-rewrite semua path ke `/api/telegram`,
  tetapi di produksi POST ke root bisa kena `405`, jadi webhook memakai path
  `/api/telegram` secara eksplisit.

- **Deployment Vercel preview** (URL yang mengandung hash, mis. `...-7oynhrnth-...`) **ter-proteksi**
  (`vercel_auth_enabled`), tidak bisa dipakai webhook. Gunakan **production**:
  `toko-online-script-mlbb.vercel.app`.

- GAS `/dev` = HEAD deployment (jalankan kode editor). `/exec` = deployment terpublish.

## 3. File & perannya

- `App Script (jangan di kirim ke github).gs` — **SINGLE SOURCE backend GAS**. Berisi
  `doGet`/`doPost`, logika Telegram (`prosesUpdate`, menu, verifikasi, tolak, selesai,
  tambah/edit/hapus produk), akses Spreadsheet, publish GitHub, rekap.
- `App Script V Backup.gs` — versi LAMA berbasis **Firestore**. Jangan dipakai; hanya
  referensi. (Versi baru sudah migrasi ke Spreadsheet.)
- `index.html` — etalase + checkout + ulasan (user).
- `gratis.html` — etalase produk gratis + ulasan.
- `cek.html` — cek status pesanan user (polling live 5 detik).
- `admin.html` — panel admin: kelola pesanan/produk/ulasan/config (polling 5 detik).
- `api/telegram.js` + `vercel.json` — proxy webhook Telegram → GAS.
- `admin.html`, `curr_pesanan.html`, `old_*.html`, `panduan.html` — varian/lama, hati-hati.

## 4. Keamanan (WAJIB)

- File `*.gs` **berisi rahasia** (token Telegram, `GITHUB_TOKEN`, password admin,
  `SPREADSHEET_ID`). Diblokir oleh `.gitignore` (`*.gs`). **JANGAN pernah commit/push
  file `.gs` atau token** ke GitHub (repo publik).
- `AGENTS.md` juga JANGAN berisi nilai token/rahasia.
- Saat memberitahu AI "ubah kode", AI harus memberi tahu user untuk **paste ulang file
  `.gs` ke editor GAS** + deploy — perubahan `.gs` tidak otomatis naik, dan tidak boleh di-push.

## 5. Skema Google Spreadsheet (kolom — 1-indexed)

**Sheet `Pesanan`** (header bisa ditulis ulang jika baris kosong):
`Kode(1) Waktu(2) Produk(3) Nominal(4) NamaDANA(5) Status(6) NoRef(7) FileLink(8) TG-Chat(9) TG-MsgId(10) Catatan(11)`

Status: `MENUNGGU` → `TERVERIFIKASI` → `SELESAI`; atau `DITOLAK`.
Map di `updatePesanan`: `kode:1, waktu:2, namaProduk:3, nominal:4, namaDana:5, status:6,
noRef:7, fileLink:8, tgChat:9, tgMsgId:10, catatan:11`.

**Sheet `Produk`**:
`ID(1) Nama(2) Harga(3) Kategori(4) GambarUrl(5) Status(6) CustomCode(7) Deskripsi(8) VideoID(9) FileLink(10) CreateTime(11) Views(12) Terjual(13)`

**Sheet `Ulasan`**:
`ID(1) produkId(2) nama(3) rating(4) teks(5) waktu(6)`

**Sheet `Config`**: `Key(1) Value(2)`.

## 6. Alur Telegram (bagian yang paling sering "ganggu")

- Pesanan baru: web memanggil action `notif` → GAS tulis ke Sheet `Pesanan` + kirim
  pesan tombol `PESANAN BARU` ke `TELEGRAM_CHAT_ID`.
- Tombol di notif: `verif:<kode>` (set state awaitPid, minta No.Ref), `selesai:<kode>`
  (SELESAI + simpan fileLink), `tolak:<kode>`, `hapus:<kode>`, `rekap`.
- Menu admin Telegram: `/menu` → tambah/edit/hapus/10 terbaru/rekap/WA template/batal.
- Handler `dprod:` (hapus produk dari hasil cari) & `menu:rekap` SUDAH ditambahkan
  (wajib ada; dulu hilang).

## 7. Pelajaran kunci yang SUDAH diatasi (jangan di-regresi)

1. Webhook Telegram harus lewat **Vercel `/api/telegram`**, bukan langsung GAS
   (GAS 302 / "Salah" untuk anonim).
2. `.gs` harus konsisten satu `SPREADSHEET_ID` (notif & pembacaan memakai sheet sama).
3. Saat "Sudah Kirim File" (`selesai:`), backend harus **menyimpan fileLink ke pesanan**
   agar `cek.html` menampilkan tombol download. `cekStatus` melakukan lookup fileLink
   dari katalog bila kosong (defensif).
4. Grid produk (`index.html`, `gratis.html`) render **langsung**, tidak menunggu fetch
   ulasan/config yang lambat (olutkan asinkron).
5. Setelah kirim ulasan, **jangan panggil `renderProduk()`** (membangun ulang grid =
   terasa reload); cukup `refreshUlasanRatings()` + `muatUlasan()`.
6. `admin.html` polling = **5 detik**; `checkLogin` menghindari interval ganda.

## 8. Cara kerja perubahan

- **Perubahan di `.gs`** → user harus **paste ulang file ke editor GAS project `AKfycbzB0`**
  lalu **Deploy > Manage deployments > /exec > Edit > Save** (aplikasi). Tidak di-push.
- **Perubahan file web** (`*.html`, `api/*`, `vercel.json`, `produk.json`, dll) → commit
  & push ke `origin/main` (GitHub Pages otomatis rebuild). Webhook Telegram tidak berubah.
- **Set webhook Telegram** (bila perlu reset): pakai Bot API `setWebhook` dengan
  `url = https://toko-online-script-mlbb.vercel.app/api/telegram`,
  `allowed_updates = [message, edited_message, callback_query]`.
  Token ada di `.gs` (`TELEGRAM_TOKEN`).

## 9. Verifikasi cepat setelah perubahan besar

- `GET <GAS-exec>?action=bacaSemuaPesanan` → JSON array pesanan (pastikan tidak kosong).
- `getWebhookInfo` → url harus `...vercel.app/api/telegram`, `pending_update_count=0`,
  `last_error_message` kosong. Jika ada `302` / "Salah" → jangan set webhook ke GAS langsung.
- Kirim `/menu` ke bot Telegram → menu admin muncul = seluruh jalur hidup.
