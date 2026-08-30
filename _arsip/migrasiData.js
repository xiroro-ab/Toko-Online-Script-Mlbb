const fs = require('fs');

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzB0UZRr5PDWnbY4gKkPSMlti17RKpaHx4zUYhdAaGOVt-8KZVu7pG5h0BWFIPrsjCs/exec";

async function run() {
    try {
        console.log("Membaca produk.json dan ulasan.json...");

        // produk.json format: [{id, data: {nama, harga, ...}}] atau flat [{id, nama, harga, ...}]
        const produkRaw = fs.readFileSync('produk.json', 'utf-8');
        let rawProduk = JSON.parse(produkRaw);

        // Normalisasi: pastikan format {id, data: {...}}
        const produk = rawProduk.map(p => {
            if (p.data) return p; // sudah dalam format benar
            const { id, ...rest } = p;
            return { id, data: rest };
        });

        // ulasan.json format: [{id, produkId, nama, rating, teks, waktu}] (flat)
        let ulasan = [];
        try {
            const ulasanRaw = fs.readFileSync('ulasan.json', 'utf-8');
            const rawUlasan = JSON.parse(ulasanRaw);
            // Normalisasi: pastikan format {id, data: {...}}
            ulasan = rawUlasan.map(u => {
                if (u.data) return u; // sudah dalam format benar
                const { id, ...rest } = u;
                return { id, data: rest };
            });
        } catch (e) {
            console.log("ulasan.json tidak ditemukan atau kosong, mengabaikan ulasan.");
        }

        console.log("Ditemukan " + produk.length + " produk dan " + ulasan.length + " ulasan.");
        console.log("Mengirim data ke Google Sheets (ini butuh waktu beberapa detik)...");

        const payload = { produk, ulasan };
        const data = JSON.stringify(payload);

        const response = await fetch(APPS_SCRIPT_URL + "?action=migrasiBulk", {
            method: 'POST',
            body: data,
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain' }
        });

        const resultText = await response.text();
        console.log("Respon server:", resultText);

        try {
            const json = JSON.parse(resultText);
            if (json.ok) {
                console.log("\n✅ BERHASIL! Semua data sudah dipindahkan ke Google Sheets.");
                console.log("Silakan cek Google Sheets Anda, tab Produk dan Ulasan seharusnya sudah terisi.");
            } else {
                console.log("\n❌ Server error:", json.error);
            }
        } catch (e) {
            console.log("\n⚠️  Respon bukan JSON, kemungkinan redirect/auth issue.");
        }
    } catch (e) {
        console.error("Terjadi kesalahan:", e);
    }
}

run();
