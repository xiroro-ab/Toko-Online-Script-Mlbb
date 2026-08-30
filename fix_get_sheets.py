import sys

with open('App Script (jangan di kirim ke github).gs', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    new_lines.append(line)
    if 'function getOrderSheet() {' in line:
        new_lines.append('  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Pesanan");\n')
        new_lines.append('}\n')
        new_lines.append('function getProdukSheet() {\n')
        new_lines.append('  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Produk");\n')
        new_lines.append('}\n')
        new_lines.append('function getUlasanSheet() {\n')
        new_lines.append('  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Ulasan");\n')
        new_lines.append('}\n')
        new_lines.append('function getConfigSheet() {\n')
        new_lines.append('  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Config");\n')
        new_lines.append('}\n')
        # Skip the original body of getOrderSheet which might be there
        skip = True

new_lines2 = []
skip = False
for line in lines:
    if 'function getOrderSheet() {' in line:
        new_lines2.append(line)
        new_lines2.append('  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Pesanan");\n')
        new_lines2.append('}\n')
        new_lines2.append('function getProdukSheet() {\n')
        new_lines2.append('  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Produk");\n')
        new_lines2.append('}\n')
        new_lines2.append('function getUlasanSheet() {\n')
        new_lines2.append('  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Ulasan");\n')
        new_lines2.append('}\n')
        new_lines2.append('function getConfigSheet() {\n')
        new_lines2.append('  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Config");\n')
        new_lines2.append('}\n')
        skip = True
        continue
    
    if skip and line.strip() == '}':
        skip = False
        continue
        
    if not skip:
        new_lines2.append(line)

with open('App Script (jangan di kirim ke github).gs', 'w', encoding='utf-8') as f:
    f.writelines(new_lines2)
