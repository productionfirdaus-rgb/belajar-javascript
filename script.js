// ============================================
// KONFIGURASI
// ============================================
const API_URL = 'https://script.google.com/macros/s/AKfycbyPrcHKArkB_4_dQhh_Vj5oCuADq4UhX_W9k1N3S1Ae_hV2PdoKadFeMqO4lNxabcxs/exec';

// Cek nomor jersey saat diketik
document.getElementById('nomorJersey').addEventListener('input', async function() {
    const nomor = this.value;
    const info = document.getElementById('nomorInfo');
    
    if (nomor.length > 0) {
        try {
            const res = await fetch(`${API_URL}?action=cekNomor&nomor=${nomor}`);
            const data = await res.json();
            
            if (data.tersedia) {
                info.style.color = 'green';
                info.textContent = '✓ Nomor tersedia';
            } else {
                info.style.color = 'red';
                info.textContent = `✗ Dipakai oleh ${data.nama}`;
            }
        } catch (e) {
            // Abaikan error saat mengetik
        }
    }
});

// Fungsi utama saat tombol diklik
document.getElementById('submitBtn').addEventListener('click', async function() {
    const btn = this;
    const namaPengirim = document.getElementById('namaPengirim').value;
    const namaJersey = document.getElementById('namaJersey').value;
    const nomorJersey = document.getElementById('nomorJersey').value;
    const size = document.getElementById('size').value;
    const pilihanJersey = document.getElementById('pilihanJersey').value;
    const keterangan = document.getElementById('keterangan').value;
    const noWA = document.getElementById('noWA').value;
    const fileInput = document.getElementById('buktiFile');
    const resultDiv = document.getElementById('result');

    // Validasi wajib diisi
    if (!namaPengirim || !namaJersey || !nomorJersey || !size || !pilihanJersey || !noWA || !fileInput.files[0]) {
        alert('Harap isi semua field yang wajib!');
        return;
    }

    // Nonaktifkan tombol agar tidak diklik 2 kali
    btn.disabled = true;
    btn.textContent = '⏳ Memproses...';
    resultDiv.style.display = 'none';

    try {
        // 1. OCR Cek gambar (deteksi Yusuf Firdaus)
        resultDiv.style.display = 'block';
        resultDiv.className = '';
        resultDiv.textContent = '⏳ Membaca bukti pembayaran... (tunggu beberapa detik)';
        
        const ocrResult = await Tesseract.recognize(fileInput.files[0], 'ind');
        const teksGambar = ocrResult.data.text.toLowerCase();
        
        if (!teksGambar.includes('yusuf firdaus')) {
            resultDiv.className = 'gagal';
            resultDiv.textContent = '❌ GAGAL: Tidak ditemukan tulisan "Yusuf Firdaus" di gambar.';
            btn.disabled = false;
            btn.textContent = 'Kirim Pemesanan';
            return;
        }

        // 2. Kirim data ke spreadsheet
        resultDiv.textContent = '⏳ Menyimpan data ke database...';
        
        const data = {
            namaPengirim: namaPengirim,
            namaJersey: namaJersey,
            nomorJersey: nomorJersey,
            size: size,
            pilihanJersey: pilihanJersey,
            keterangan: keterangan || '-',
            noWA: noWA
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'simpan', data: data })
        });

        const resultData = await response.json();

        // 3. Handle hasil dari server
        if (resultData.status === 'sukses') {
            resultDiv.className = 'sukses';
            resultDiv.textContent = `✅ BERHASIL! Kode pemesanan: ${resultData.kode}`;
            
            // Kirim WA ke Admin & User
            const adminWA = '6287757639277';
            const userWA = noWA.replace(/^0/, '62');
            const pesanWA = `*PESANAN BARU JERSEY*\n\nKode: ${resultData.kode}\nNama: ${namaPengirim}\nJersey: ${namaJersey}\nNo: ${nomorJersey}\nSize: ${size}\nPaket: ${pilihanJersey}`;
            
            window.open(`https://wa.me/${adminWA}?text=${encodeURIComponent(pesanWA)}`, '_blank');
            window.open(`https://wa.me/${userWA}?text=${encodeURIComponent('✅ Pemesanan Anda berhasil!\n\n' + pesanWA)}`, '_blank');
            
            // Reset form setelah berhasil
            document.getElementById('namaPengirim').value = '';
            document.getElementById('namaJersey').value = '';
            document.getElementById('nomorJersey').value = '';
            document.getElementById('size').value = '';
            document.getElementById('pilihanJersey').value = '';
            document.getElementById('keterangan').value = '';
            document.getElementById('noWA').value = '';
            document.getElementById('buktiFile').value = '';
            
        } else if (resultData.status === 'duplikat') {
            resultDiv.className = 'gagal';
            resultDiv.textContent = `❌ GAGAL: Nomor ${nomorJersey} sudah dipakai oleh ${resultData.nama}.`;
        } else {
            resultDiv.className = 'gagal';
            resultDiv.textContent = '❌ Terjadi kesalahan server. Coba lagi.';
        }

    } catch (error) {
        console.error('ERROR:', error);
        resultDiv.className = 'gagal';
        resultDiv.textContent = '❌ Error koneksi. Cek Console (F12) untuk detail.';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Kirim Pemesanan';
    }
});
