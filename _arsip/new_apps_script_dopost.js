  // Admin Produk API
  if (p.action === "adminTambahProduk" || p.action === "adminEditProduk") {
    try {
      var sheet = getProdukSheet();
      var isEdit = p.action === "adminEditProduk";
      var prodId = isEdit ? p.produkId : "P-" + new Date().getTime();
      
      var newRow = [
        prodId,
        p.namaProduk || "",
        Number(p.harga) || 0,
        p.kategori || "",
        p.gambarUrl || "",
        p.status || "",
        p.customCode || ""
      ];

      if (isEdit) {
        var rowIdx = getProdukRowIndex(prodId);
        if (rowIdx === -1) throw new Error("Produk tidak ditemukan");
        sheet.getRange(rowIdx, 1, 1, newRow.length).setValues([newRow]);
      } else {
        sheet.appendRow(newRow);
      }
      
      publishToGithub(JSON.stringify(bacaSemuaProduk()));
      return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
    } catch(e) { return ContentService.createTextOutput(JSON.stringify({ ok: false, error: e.message })).setMimeType(ContentService.MimeType.JSON); }
  }

  if (p.action === "adminHapusProduk") {
    try {
      var sheet = getProdukSheet();
      var rowIdx = getProdukRowIndex(p.produkId);
      if (rowIdx !== -1) sheet.deleteRow(rowIdx);
      publishToGithub(JSON.stringify(bacaSemuaProduk()));
      return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
    } catch(e) { return ContentService.createTextOutput(JSON.stringify({ ok: false, error: e.message })).setMimeType(ContentService.MimeType.JSON); }
  }

  // Admin Ulasan API
  if (p.action === "adminEditUlasan") {
    try {
      var sheet = getUlasanSheet();
      var rowIdx = getUlasanRowIndex(p.ulasanId);
      if (rowIdx === -1) throw new Error("Ulasan tidak ditemukan");
      // Ulasan columns: ID, produkId, nama, rating, teks, waktu
      sheet.getRange(rowIdx, 3).setValue(p.nama || "");
      sheet.getRange(rowIdx, 4).setValue(Number(p.rating) || 5);
      sheet.getRange(rowIdx, 5).setValue(p.teks || "");
      publishUlasanToGithub();
      return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
    } catch(e) { return ContentService.createTextOutput(JSON.stringify({ ok: false, error: e.message })).setMimeType(ContentService.MimeType.JSON); }
  }
  
  if (p.action === "adminHapusUlasan") {
    try {
      var sheet = getUlasanSheet();
      var rowIdx = getUlasanRowIndex(p.ulasanId);
      if (rowIdx !== -1) sheet.deleteRow(rowIdx);
      publishUlasanToGithub();
      return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
    } catch(e) { return ContentService.createTextOutput(JSON.stringify({ ok: false, error: e.message })).setMimeType(ContentService.MimeType.JSON); }
  }

  // Admin Config API
  if (p.action === "adminSimpanConfig") {
    try {
      simpanConfig("site", p.configData || "{}");
      return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
    } catch(e) { return ContentService.createTextOutput(JSON.stringify({ ok: false, error: e.message })).setMimeType(ContentService.MimeType.JSON); }
  }

  // Migrasi API
  if (p.action === "migrasiBulk") {
    try {
      var payload = JSON.parse(e.postData.contents);
      if (payload.produk && payload.produk.length > 0) {
        var sheetP = getProdukSheet();
        payload.produk.forEach(function(pr) {
          var d = pr.data;
          sheetP.appendRow([pr.id, d.nama || "", Number(d.harga) || 0, d.kategori || "", d.gambar || "", "aktif", d.kode || ""]);
        });
        publishToGithub(JSON.stringify(bacaSemuaProduk()));
      }
      if (payload.ulasan && payload.ulasan.length > 0) {
        var sheetU = getUlasanSheet();
        payload.ulasan.forEach(function(ul) {
          var d = ul.data;
          sheetU.appendRow([ul.id, d.produkId || "", d.nama || "", Number(d.rating) || 5, d.teks || "", d.waktu || new Date().toISOString()]);
        });
        publishUlasanToGithub();
      }
      return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
    } catch(e) { return ContentService.createTextOutput(JSON.stringify({ ok: false, error: e.message })).setMimeType(ContentService.MimeType.JSON); }
  }
