const API_URL = 'https://script.google.com/macros/s/AKfycbxkWD9owyUKb0XBnsYb7taCSCPujedwL-7nNVisbWhLB4evAYondCHjffrMJDJ2nGQG/exec';

// Cek nomor jersey saat diketik (fitur realtime)
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
        } catch (e) { /* abaikan error saat mengetik */ }
    }
});

// Tombol Kirim (TIDAK menggunakan onclick="prosesPemesanan()")
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

    // 1. Validasi wajib diisi
    if (!namaPengirim || !namaJersey || !nomorJersey || !size || !pilihanJersey || !noWA || !fileInput.files[0]) {
        alert('Harap isi semua field wajib!');
        return;
    }

    // 2. Nonaktifkan tombol agar tidak double-click
    btn.disabled = true;
    btn.textContent = '⏳ Memproses...';
    resultDiv.style.display = 'none';

    try {
        resultDiv.style.display = 'block';
        resultDiv.className = '';
        resultDiv.textContent = '⏳ Membaca bukti pembayaran... (tunggu)';

        // 3. OCR Deteksi tulisan "Yusuf Firdaus"
        const ocrResult = await Tesseract.recognize(fileInput.files[0], 'ind');
        if (!ocrResult.data.text.toLowerCase().includes('yusuf firdaus')) {
            resultDiv.className = 'gagal';
            resultDiv.textContent = '❌ GAGAL: Tidak ditemukan tulisan "Yusuf Firdaus" di gambar.';
            btn.disabled = false;
            btn.textContent = 'Kirim Pemesanan';
            return;
        }

        resultDiv.textContent = '⏳ Menyimpan data ke database...';
        
        // 4. Kirim data ke Apps Script
        const data = { 
            namaPengirim, 
            namaJersey, 
            nomorJersey, 
            size, 
            pilihanJersey, 
            keterangan: keterangan || '-', 
            noWA 
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'simpan', data: data })
        });

        const resultData = await response.json();

        // 5. Handle hasil dari server
        if (resultData.status === 'sukses') {
            resultDiv.className = 'sukses';
            resultDiv.textContent = `✅ BERHASIL! Kode pemesanan: ${resultData.kode}`;
            
            // Kirim WA ke Admin & User
            const adminWA = '6287757639277';
            const userWA = noWA.replace(/^0/, '62');
            const pesanWA = `*PESANAN BARU JERSEY*\nKode: ${resultData.kode}\nNama: ${namaPengirim}\nNo Jersey: ${nomorJersey}`;
            
            window.open(`https://wa.me/${adminWA}?text=${encodeURIComponent(pesanWA)}`, '_blank');
            window.open(`https://wa.me/${userWA}?text=${encodeURIComponent('✅ Pemesanan Anda berhasil!\n\n' + pesanWA)}`, '_blank');
            
            // Reset form
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
            resultDiv.textContent = `❌ Nomor ${nomorJersey} sudah dipakai oleh ${resultData.nama}.`;
        } else {
            resultDiv.className = 'gagal';
            resultDiv.textContent = '❌ Gagal menyimpan data. Coba lagi.';
        }

    } catch (error) {
        console.error('ERROR:', error);
        resultDiv.className = 'gagal';
        resultDiv.textContent = '❌ Error koneksi. Cek Console (F12).';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Kirim Pemesanan';
    }
});
