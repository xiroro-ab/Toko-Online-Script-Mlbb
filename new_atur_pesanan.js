          function aturPesanan(id, statusBaru) {
              const promptNoRef = () => {
                  Swal.fire({
                      title: 'Kunci No. Ref DANA',
                      input: 'text',
                      inputPlaceholder: 'Nomor transaksi pada aplikasi DANA Anda',
                      showCancelButton: true,
                      confirmButtonColor: '#0891b2',
                      background: '#1e293b',
                      color: '#fff'
                  }).then(async res => {
                      if (!res.isConfirmed || !res.value.trim()) return;
                      const body = new URLSearchParams({ action: 'adminVerifikasiPesanan', pesananId: id, noRef: res.value.trim() });
                      await fetch(appsScriptUrl, { method: 'POST', body: body });
                      (function () {
                          const orP = (semuaPesanan.find(o => o.id === id) || {}).data || {};
                          const kodeP = orP.kode || '';
                          Swal.fire({
                              icon: 'success', title: 'Terverifikasi!',
                              html: <div class="text-left text-sm text-slate-300">
                                  <p>No.Ref terkunci: <b class="text-yellow-400"> + escP(res.value.trim()) + </b> <span class="text-xs text-slate-400">(status pembeli ter-update LIVE)</span></p>
                                  <p class="mt-3 text-xs">Info untuk pembeli — salin & kirim di WhatsApp:</p>
                                  <div class="bg-slate-900 border border-slate-700 rounded p-2 mt-1 text-xs text-cyan-300">Status pembayaran Anda <b>TERVERIFIKASI</b>. + (kodeP ? ' Pantau: https://xiroro-ab.github.io/Toko-Online-Script-Mlbb/cek.html?kode=' + kodeP : '') + </div>
                              </div>,
                              background: '#1e293b'
                          });
                      })();
                      loadPesanan();
                  });
              };
  
              if (statusBaru === 'MENUNGGU') {
                  promptNoRef();
              } else if (statusBaru === 'SELESAI') {
                  const d = (semuaPesanan.find(o => o.id === id) || {}).data || {};
                  Swal.fire({ title: 'Selesaikan Pesanan?', text: 'File akan dikirim ke pembeli setelah ini.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#22c55e', background: '#1e293b' }).then(async res => {
                      if (!res.isConfirmed) return;
                      const body = new URLSearchParams({ action: 'adminSelesaiPesanan', pesananId: id });
                      await fetch(appsScriptUrl, { method: 'POST', body: body });
                      const fl = d.fileLink || '';
                      if (fl) {
                          Swal.fire({
                              title: 'Kirim File Ini',
                              html: 
                                  <p class="text-sm text-slate-300 mb-3">Kirim link di bawah ini ke pembeli via WhatsApp:</p>
                                  <input id="linkFileOrder" value=" + escP(fl) + " readonly class="w-full bg-slate-800 border border-slate-700 p-3 rounded-lg text-xs text-cyan-300 mb-3">
                                  <button onclick="navigator.clipboard.writeText(document.getElementById('linkFileOrder').value);Swal.fire({icon:'success',title:'Tersalin',timer:1200,showConfirmButton:false,background:'#1e293b'})" class="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded-lg font-bold transition"><i class="fa-solid fa-copy mr-2"></i> Salin Link</button>
                                  <p class="text-[11px] text-slate-400 text-left mt-2">Status di halaman cek pembeli otomatis jadi SELESAI (live), file tampil di sana. Info ke pembeli: sudah dikirim file  + (d.kode ? - pantau https://xiroro-ab.github.io/Toko-Online-Script-Mlbb/cek.html?kode= + d.kode : '') + .</p>
                              ,
                              background: '#1e293b'
                          });
                      } else {
                          Swal.fire({ icon: 'warning', title: 'Tidak Ada Link File', text: 'Pesanan ini tidak menyimpan link file. Periksa link di katalog produk.', background: '#1e293b' });
                      }
                      loadPesanan();
                  });
              } else {
                  Swal.fire({ title: 'Tolak Pesanan?', text: 'Pastikan pembayaran tidak masuk sebelum menolak.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', background: '#1e293b' }).then(async res => {
                      if (res.isConfirmed) { 
                          const body = new URLSearchParams({ action: 'adminTolakPesanan', pesananId: id });
                          await fetch(appsScriptUrl, { method: 'POST', body: body });
                          loadPesanan(); 
                      }
                  });
              }
          }
