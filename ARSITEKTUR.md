# ARSITEKTUR — Xiroro Toko Online (MLBB) Sampai ke Akar

Dokumen pendamping `AGENTS.md`. Baca `AGENTS.md` dulu (ringkas), lalu dokumen ini untuk
memahami SELURUH alur sampai ke akarnya: dari klik di browser → GAS → Spreadsheet → Bot
Telegram, dan kembali lagi. Tujuannya agar AI/developer berikut langsung paham tanpa
menebak dan TIDAK merusak alur yang sudah jalan.

`AGENTS.md` = peta cepat. `ARSITEKTUR.md` = detail mendalam fungsi per fungsi.

---

## 0. Gambaran besar (flow bit-per-bit)

Wilayah kerja ada 3 server/klien + 1 database:

```
            (pembeli / admin)
                  │
      ┌───────────┴───────────┐
      │  WEB (GitHub Pages)    │  index/gratis/admin/cek
      │  statis, open-source   │
      └───────────┬───────────┘
                  │  • GET data   (bacaSemuaProduk/Ulasan/Config, cekStatus)
                  │  • POST aksi  (notif, ulasan, adminVerifikasi/Tolak/Selesai, upload, dll)
                  ▼
      ┌─────────────────────┐
      │  GAS (Apps Script)   │  SATU project "AKfycbzB0"
      │  doGet / doPost      │  → sumber kebenaran = Spreadsheet
      └──────────┬──────────┘
                 │  baca/tulis SpreadsheetApp
                 ▼
      ┌─────────────────────┐
      │  Google Spreadsheet  │  SATU file (SPREADSHEET_ID) berisi:
      │                      │  Pesanan · Produk · Ulasan · Config
      └─────────────────────┘
                 │  (webhook via Vercel, lihat §4)
                 ▼
      ┌─────────────────────┐
      │  Bot Telegram        │  XiroroScriptNotifBot
      │  notif + tombol aksi │
      └─────────────────────┘
```

Aliran pesanan baru (end-to-end):
1. Pembeli di `index.html` klik Beli → `klikBeli()` membuat kode `XR-...` →
   `kirimVerifikasi()` → `notifTelegram()` POST `action=notif` ke GAS `/exec`.
2. GAS `doPost` → `notif` action → `getOrderSheet().appendRow(...)` tulis ke sheet
   `Pesanan` (status `MENUNGGU`) → lalu `kirimPesanTombol(...)` ke `TELEGRAM_CHAT_ID`
   (pesan "PESANAN BARU" + tombol).
3. GAS simpan `tgChat`/`tgMsgId` di baris pesanan (untuk bisa `renderPesanan`/hapus notif).
4. Admin klik tombol di Telegram → Telegram kirim **callback_query** ke
   **Vercel proxy** (`/api/telegram`) → Vercel teruskan ke GAS `/exec` → `prosesUpdate`.
5. GAS update baris sheet (status) → `renderPesanan` edit pesan Telegram → web (admin/cek)
   polling & membaca status terbaru dari sheet.

---

## 1. File GAS `.gs` — struktur & fungsi kunci

Satu-satunya file backend yang hidup:
`App Script (jangan di kirim ke github).gs` (di root). **INILAH yang harus di-paste ke
editor GAS project `AKfycbzB0`.**

> `_arsip/` berisi versi lama (Firestore backup, new_*, fix_*, dsb). **Semua itu tidak
> dipakai runtime.** Jangan berpatokan padanya.

Konstanta global (baris atas):
| Konstanta | Nilai / arti |
|---|---|
| `TELEGRAM_TOKEN` | Token bot (rahasia) |
| `TELEGRAM_CHAT_ID` | Chat admin penerima notif |
| `PANEL_URL` / `CEK_URL` | Link admin & cek |
| `FOLDER_FOTO` | Folder Drive utk upload foto produk |
| `GITHUB_*` | Repo + token publish produk.json |
| `SPREADSHEET_ID` | **Satu-satunya spreadsheet** (semua sheet) |
| `UPLOAD_KEY` | Kunci auth `bacaSemuaPesanan` |
| `ADMIN_EMAIL`/`ADMIN_PASSWORD` | Fallback login (jika Config kosong) |

### doGet (request GET dari web)
- `cekStatus` → `bacaPesanan(kode)` → flat objek utk `cek.html`. Kalau status `SELESAI`
  tapi `fileLink` pesanan kosong → **lookup dari katalog produk** by `nama` (defensif).
- `bacaSemuaProduk` → array `{id, data}` (muncul utk web/admin).
- `bacaSemuaUlasan` → array **flat** `{id, produkId, nama, rating, teks, waktu}`.
- `bacaConfig` → `JSON.stringify(cfg[key])`.
- `bacaSemuaPesanan` → **HANYA jika `p.key === UPLOAD_KEY`** → array `{fields:{...}}`.

### doPost
- Parsing body JSON: jika `callback_query || message` → `prosesUpdate(upd)` (Telegram).
- `notif` → tulis pesanan + kirim notif Telegram.
- `ulasan` → append ke sheet Ulasan + `publishUlasanToGithub`.
- Admin: `adminLogin`, `adminVerifikasiPesanan`, `adminSelesaiPesanan`,
  `adminTolakPesanan`, `adminSimpanCatatan`, `adminTambahProduk`,
  `adminEditProduk`, `adminHapusProduk`, `adminEditUlasan`, `adminHapusUlasan`,
  `adminSimpanConfig`, `upload`, `hapusNotif`, `publish`, `syncStatus`, `migrasiBulk`.

### Update pesanan & konsistensi kolom
`updatePesanan(kode, kolom)` mencari **baris by kode** (`getOrderRowIndex`) lalu
`setValue` kolom sesuai map:
`kode:1 waktu:2 namaProduk:3 nominal:4 namaDana:5 status:6 noRef:7 fileLink:8 tgChat:9 tgMsgId:10 catatan:11`

> Aturan penting: `updatePesanan` **TIDAK auto-sync Telegram** — caller eksplisit
> memanggil `syncTelegramPesanan`/`renderPesanan` agar tidak double-render.

---

## 2. Skema Google Spreadsheet (1-indexed)

### Sheet `Pesanan` — header otomatis, `ensureOrderSheet` tulis bila kosong
`Kode(1) Waktu(2) Produk(3) Nominal(4) NamaDANA(5) Status(6) NoRef(7) FileLink(8) TG-Chat(9) TG-MsgId(10) Catatan(11)`
Status: `MENUNGGU` → `TERVERIFIKASI` → `SELESAI`; atau `DITOLAK`.

### Sheet `Produk` — 13 kolom (WAJIB 13, jgn ubah)
`ID(1) Nama(2) Harga(3) Kategori(4) GambarUrl(5) Status(6) CustomCode(7) Deskripsi(8) VideoID(9) FileLink(10) CreateTime(11) Views(12) Terjual(13)`

> Validasi: `bacaSemuaProduk()` memetakan indeks tsb; `updateKolomProduk` map `nama:2 ...
> fileLink:10`. Admin & Telegram `finalTambahProduk`/`adminTambahProduk` harus menulis
> **13 kolom** (jangan cuma 7 — itu pernah menyebabkan field hilang).

### Sheet `Ulasan`
`ID(1) produkId(2) nama(3) rating(4) teks(5) waktu(6)`

### Sheet `Config`
`Key(1) Value(2)`
Baris dipakai (key → value):
- `site` → JSON tema: `{"video":"...mp4","logo":"...png","kolom":"grid-cols-4"}`
- `admin_user` / `admin_pass` → kredensial login admin (fallback ke konstanta bila kosong).

Nama sheet **case-sensitive**: `Pesanan`, `Produk`, `Ulasan`, `Config`.

---

## 3. Alur Telegram lengkap

`prosesUpdate(upd)` adalah pusat. Ia menerima **update dari webhook** (bukan polling).

- **Callback (`callback_query`)**: `verif:<kode>` → set `awaitPid/awaitChat/awaitMsg`,
  edit pesan meminta No.Ref. `selesai:<kode>` → jika `TERVERIFIKASI`, set `SELESAI` +
  simpan `fileLink`, `renderPesanan`, kirim file ke admin. `tolak:<kode>`, `hapus:<kode>`,
  `rekap`, `menu:*`, `addfoto:*`, `eprod/efield/efto` (edit produk), `dprod` (hapus
  produk), `wa_tpl:<kode>` (template WA).
- **Message teks**: `/menu`, `/rekap`, `/tambah`, `/batal`, atau menanggapi state
  (awaitPid → noRef; cariMode → kata kunci; addState → wizard tambah; editState → edit).

State antar-update disimpan di `PropertiesService` (scriptProperties):
`awaitPid`, `awaitChat`, `awaitMsg`, `cariMode`, `addState`, `editState`.

> WA Template: `tampilDaftarPesananWA` memakai **kode** (bukan `doc.name`) sbg id utk
> `wa_tpl:` → `generateWATemplate(kode)` → `bacaPesanan(kode)`. (Dulu pakai `name`
> yang tak ada → crash. JANGAN regresi.)

`sudahDiproses(update_id)` mencegah proses ganda.

---

## 4. Webhook Telegram — KENAPA lewat Vercel (kunci!)

**Jangan arahkan webhook Telegram ke GAS langsung.** GAS mengirim `302` (atau `200`
halaman "Salah") utk request anonim yang tidak mengikuti redirect. Telegram **tidak
mengikuti redirect** → update gagal/membisu / `pending_update_count` menumpuk.

Proxy:
- `api/telegram.js` (Node API route Vercel) → `fetch()` ke GAS `/exec` (mengikuti
  redirect) → lalu `res.status(200).json({ok:true})`. Telegram butuh respons **2xx valid**.
- `vercel.json` me-rewrite `/(.*)` → `/api/telegram`, TAPI di production POST ke ROOT bisa
  `405`. Maka **webhook harus memakai path eksplisit** `/api/telegram`.
- Deployment **production**: `toko-online-script-mlbb.vercel.app` (bukan preview yang
  `-7oynhrnth-...` yang ter-proteksi `vercel_auth_enabled`).

Set webhook:
`https://api.telegram.org/bot<TOKEN>/setWebhook` dengan
`url = https://toko-online-script-mlbb.vercel.app/api/telegram`,
`allowed_updates = ["message","edited_message","callback_query"]`.
Periksa `getWebhookInfo`: url benar, `pending_update_count=0`, `last_error_message` kosong.

---

## 5. Web pages & cara mereka membaca/menulis

- `index.html` — etalase + checkout + ulasan (user). Membaca produk **langsung dari GAS
  `?action=bacaSemuaProduk`** (Spreadsheet) → produk baru otomatis tampil, tanpa bergantung
  `produk.json` statis. Ulasan juga dari GAS. **Grid render LANGSUNG** (tak menunggu ulasan
  lambat; ulasan diterapkan asinkron). `kirimUlasan` **optimistic** (tampil dulu, server
  background).
- `gratis.html` — sama, produk gratis.
- `cek.html` — cek status user; **polling 5 detik** `cekStatus`; tombol file muncul jika
  `fileLink` terisi (kini di-backend via lookup katalog bila SELESAI).
- `admin.html` — panel admin; **polling 5 detik** `bacaSemuaPesanan` (butuh `DATA_KEY`);
  aksi verifikasi/selesai/tolak **optimistic** (update memori + render, server background);
  `simpanProduk` memakai id form `nama/harga/deskripsi/videoID/fileLink` (+`edit-id`).
- `sw.js` — service worker (network-first → tidak cache lama). Kondisi origin pakai
  `!== 0`.

`DATA_KEY` di `admin.html` harus **sama** dengan `UPLOAD_KEY` di `.gs`.

---

## 6. Troubleshooting (gejala → akar → perbaikan)

| Gejala | Akar | Perbaikan |
|---|---|---|
| Tombol Telegram diam/no-respon | webhook salah arah / ke GAS langsung (302) atau GAS `/dev` balas "Salah" | set webhook → `...vercel.app/api/telegram`; cek `getWebhookInfo` |
| Verifikasi "pesanan tak ditemukan" | `.gs` menulis & baca sheet beda / `SPREADSHEET_ID` beda | pastikan SATU `SPREADSHEET_ID`; nama sheet persis |
| Status admin/web tak berubah | `fileLink`/status tak disimpan, atau polling lama | cek `updatePesanan` benar; ada `syncTelegramPesanan` |
| cek.html tak ada tombol file | `fileLink` pesanan kosong & tak di-lookup | `selesai:` simpan `fileLink`; `cekStatus` lookup katalog |
| "Terapkan Tema" error | `simpanConfig` tidak ada di `.gs` | pastikan `.gs` punya fungsi `simpanConfig` |
| Simpan produk crash | id form salah (`pNama`) | pakai id `nama/harga/...` + 13 kolom |
| Admin data pesanan `Unauthorized` | `key` salah | samakan `DATA_KEY`(web) & `UPLOAD_KEY`(.gs) |

---

## 7. Aturan pengubahan & keamanan

- `.gs` berisi rahasia (token, `GITHUB_TOKEN`, password) → **diblokir `.gitignore`
  (`*.gs`)**, JANGAN pernah commit/push. Perubahan `.gs` = user paste ulang ke GAS + deploy.
- Spreadsheet `SPREADSHEET_ID` private; jangan share.
- Jangan rename tab `Pesanan/Produk/Ulasan/Config`.
- `bacaSemuaPesanan` butuh `key` (cek `UPLOAD_KEY`).
- Dokumen ini (`ARSITEKTUR.md`) & `AGENTS.md` TIDAK memuat nilai token/rahasia.

## 8. Alur perubahan yang benar

1. Cek `AGENTS.md` + `ARSITEKTUR.md` dulu.
2. Kalau ubah `.gs`: saran ke user **paste ulang + Deploy**, JANGAN push.
3. Kalau ubah web (`*.html`, `api/*`, `vercel.json`, `sw.js`, dll):
   commit & push ke `origin/main` → GitHub Pages rebuild otomatis.
4. Setelah perubahan: verifikasi via `getWebhookInfo`, `bacaSemuaPesanan?key`, kirim `/menu`.
