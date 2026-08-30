
  if (p.action === "bacaSemuaProduk") {
    try {
      var arr = bacaSemuaProduk();
      return ContentService.createTextOutput(JSON.stringify(arr)).setMimeType(ContentService.MimeType.JSON);
    } catch(e) {
      return ContentService.createTextOutput(JSON.stringify({ error: e.message })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  if (p.action === "bacaSemuaUlasan") {
    try {
      var arr = bacaSemuaUlasan();
      return ContentService.createTextOutput(JSON.stringify(arr)).setMimeType(ContentService.MimeType.JSON);
    } catch(e) {
      return ContentService.createTextOutput(JSON.stringify({ error: e.message })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  if (p.action === "bacaConfig") {
    try {
      var val = bacaConfig(p.key || "");
      return ContentService.createTextOutput(val).setMimeType(ContentService.MimeType.JSON);
    } catch(e) {
      return ContentService.createTextOutput(JSON.stringify({ error: e.message })).setMimeType(ContentService.MimeType.JSON);
    }
  }
