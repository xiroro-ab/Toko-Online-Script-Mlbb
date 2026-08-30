// ============ 9. PRODUK, ULASAN & CONFIG (MIGRATION) ============
function getProdukSheet() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName("Produk");
  if (!sheet) {
    sheet = ss.insertSheet("Produk");
    sheet.appendRow(["ID", "Nama Produk", "Harga", "Kategori", "Gambar URL", "Status", "Custom Code"]);
  }
  return sheet;
}

function getProdukRowIndex(id) {
  var sheet = getProdukSheet();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) return i + 1;
  }
  return -1;
}

function getConfigSheet() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName("Config");
  if (!sheet) {
    sheet = ss.insertSheet("Config");
    sheet.appendRow(["Key", "Value"]);
  }
  return sheet;
}

function getUlasanRowIndex(id) {
  var sheet = getUlasanSheet();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) return i + 1;
  }
  return -1;
}

function bacaSemuaProduk() {
  var sheet = getProdukSheet();
  var data = sheet.getDataRange().getValues();
  var arr = [];
  for (var i = 1; i < data.length; i++) {
    arr.push({
      id: String(data[i][0]),
      data: {
        namaProduk: String(data[i][1]),
        harga: Number(data[i][2]),
        kategori: String(data[i][3]),
        gambarUrl: String(data[i][4]),
        status: String(data[i][5]),
        customCode: String(data[i][6])
      }
    });
  }
  return arr;
}

function bacaSemuaUlasan() {
  var sheet = getUlasanSheet();
  var data = sheet.getDataRange().getValues();
  var arr = [];
  for (var i = 1; i < data.length; i++) {
    arr.push({
      id: String(data[i][0]),
      data: {
        produkId: String(data[i][1]),
        nama: String(data[i][2]),
        rating: Number(data[i][3]),
        teks: String(data[i][4]),
        waktu: String(data[i][5])
      }
    });
  }
  return arr.reverse();
}

function bacaConfig(key) {
  var sheet = getConfigSheet();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(key)) return String(data[i][1]);
  }
  return "{}";
}

function simpanConfig(key, value) {
  var sheet = getConfigSheet();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(key)) {
      sheet.getRange(i + 1, 2).setValue(String(value));
      return;
    }
  }
  sheet.appendRow([key, String(value)]);
}
