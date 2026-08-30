import sys

with open('App Script (jangan di kirim ke github).gs', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    # Find the corrupted section where we transition incorrectly
    if "fileLink: f.fileLink ? f.fileLink.stringValue : """ in line:
        new_lines.append(line)
        # inject the fix directly after
        new_lines.append('      };\n')
        new_lines.append('      return ContentService.createTextOutput(JSON.stringify(flat)).setMimeType(ContentService.MimeType.JSON);\n')
        new_lines.append('    } catch(e) {\n')
        new_lines.append('      return ContentService.createTextOutput(JSON.stringify({ error: "Tidak ditemukan" })).setMimeType(ContentService.MimeType.JSON);\n')
        new_lines.append('    }\n')
        new_lines.append('  }\n')
        new_lines.append('  if (p.action === "bacaSemuaPesanan") {\n')
        new_lines.append('    try {\n')
        new_lines.append('      var arr = ambilPesananFs();\n')
        new_lines.append('      return ContentService.createTextOutput(JSON.stringify(arr)).setMimeType(ContentService.MimeType.JSON);\n')
        new_lines.append('    } catch(e) {\n')
        new_lines.append('      return ContentService.createTextOutput(JSON.stringify({ error: e.message })).setMimeType(ContentService.MimeType.JSON);\n')
        new_lines.append('    }\n')
        new_lines.append('  }\n')
        new_lines.append('  if (p.action === "bacaSemuaProduk") {\n')
        new_lines.append('    try {\n')
        new_lines.append('      var arr = bacaSemuaProduk();\n')
        new_lines.append('      return ContentService.createTextOutput(JSON.stringify(arr)).setMimeType(ContentService.MimeType.JSON);\n')
        new_lines.append('    } catch(e) {\n')
        new_lines.append('      return ContentService.createTextOutput(JSON.stringify({ error: e.message })).setMimeType(ContentService.MimeType.JSON);\n')
        new_lines.append('    }\n')
        new_lines.append('  }\n')
        new_lines.append('  if (p.action === "bacaSemuaUlasan") {\n')
        new_lines.append('    try {\n')
        new_lines.append('      var arr = bacaSemuaUlasan();\n')
        new_lines.append('      return ContentService.createTextOutput(JSON.stringify(arr)).setMimeType(ContentService.MimeType.JSON);\n')
        new_lines.append('    } catch(e) {\n')
        new_lines.append('      return ContentService.createTextOutput(JSON.stringify({ error: e.message })).setMimeType(ContentService.MimeType.JSON);\n')
        new_lines.append('    }\n')
        new_lines.append('  }\n')
        new_lines.append('  if (p.action === "bacaConfig") {\n')
        new_lines.append('    try {\n')
        new_lines.append('      var val = bacaConfig(p.key || "");\n')
        new_lines.append('      return ContentService.createTextOutput(val).setMimeType(ContentService.MimeType.JSON);\n')
        new_lines.append('    } catch(e) {\n')
        new_lines.append('      return ContentService.createTextOutput(JSON.stringify({ error: e.message })).setMimeType(ContentService.MimeType.JSON);\n')
        new_lines.append('    }\n')
        new_lines.append('  }\n\n')
        new_lines.append('  return ContentService.createTextOutput("XIRORO BOT ACTIVE").setMimeType(ContentService.MimeType.TEXT);\n')
        new_lines.append('}\n\n')
        new_lines.append('function doPost(e) {\n')
        new_lines.append('  var ok = ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);\n')
        new_lines.append('  if (!e) return ok;\n')
        new_lines.append('  var p = e.parameter || {};\n\n')
        
        # Now we need to skip whatever was incorrectly placed right after fileLink until we reach the real if (e.postData && ...
        skip = True
        continue
    
    if skip:
        if 'if (e.postData && e.postData.contents && e.postData.contents.indexOf("{") === 0)' in line:
            skip = False
            new_lines.append(line)
        continue
        
    new_lines.append(line)

with open('App Script (jangan di kirim ke github).gs', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
