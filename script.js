const API_URL =https://script.google.com/macros/s/AKfycbwADVt7oYojmTGbT2giHJ3cDB4zDRA9nHybw53bsksJhT1MYLc3veU4oZo7HkNXgAAq/exec';

document.getElementById('nomorJersey').addEventListener('input', async function() {
    const nomor = this.value;
    if (nomor.length > 0) {
        const res = await fetch(`${API_URL}?action=cekNomor&nomor=${nomor}`);
        const data = await res.json();
        const info = document.getElementById('nomorInfo');
        if (data.tersedia) {
            info.style.color = 'green';
            info.textContent = '✓ Nomor tersedia';
        } else {
            info.style.color = 'red';
            info.textContent = `✗ Dipakai oleh ${data.nama}`;
        }
    }
});

async function prosesPemesanan() {
    const namaPengirim = document.getElementById('namaPengirim').value;
    const namaJersey = document.getElementById('namaJersey').value;
    const nomorJersey = document.getElementById('nomorJersey').value;
    const size = document.getElementById('size').value;
    const pilihanJersey = document.getElementById('pilihanJersey').value;
    const noWA = document.getElementById('noWA').value;
    const file = document.getElementById('buktiFile').files[0];
    const resultDiv = document.getElementById('result');
    const btn = document.getElementById('submitBtn');

    // Validasi
    if (!namaPengirim || !namaJersey || !nomorJersey || !size || !pilihanJersey || !noWA || !file) {
        alert('Harap isi semua field!');
        return;
    }

    btn.disabled = true;
    resultDiv.style.display = 'none';

    try {
        // 1. Cek OCR (deteksi Yusuf Firdaus)
        resultDiv.textContent = '⏳ Mengecek bukti pembayaran...';
        resultDiv.style.display = 'block';
        const ocr = await Tesseract.recognize(file, 'ind');
        
        if (!ocr.data.text.toLowerCase().includes('yusuf firdaus')) {
            resultDiv.className = 'gagal';
            resultDiv.textContent = '❌ Bukti tidak valid (tidak ada tulisan "Yusuf Firdaus")';
            resultDiv.style.display = 'block';
            btn.disabled = false;
            return;
        }

        // 2. Kirim ke spreadsheet (PERBAIKAN DI SINI)
        resultDiv.textContent = '⏳ Menyimpan data...';
        const data = { 
            namaPengirim, 
            namaJersey, 
            nomorJersey, 
            size, 
            pilihanJersey, 
            noWA,
            keterangan: document.getElementById('keterangan').value || ''
        };

        // Ganti dengan fetch yang BENAR (tanpa mode: 'no-cors')
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: 'simpan', data: data })
        });

        // 3. Tampilkan hasil
        const result = await res.json();
        if (result.status === 'sukses') {
            resultDiv.className = 'sukses';
            resultDiv.textContent = `✅ Pemesanan berhasil! Kode: ${result.kode}`;
            
            // Buka WA otomatis ke admin dan user
            const adminWA = '6287757639277';
            const userWA = noWA.replace(/^0/, '62');
            const invoice = `Pesanan Baru\nKode: ${result.kode}\nNama: ${namaPengirim}\nNo Jersey: ${nomorJersey}`;
            
            window.open(`https://wa.me/${adminWA}?text=${encodeURIComponent(invoice)}`, '_blank');
            window.open(`https://wa.me/${userWA}?text=${encodeURIComponent('✅ Pemesanan Anda berhasil!\n\n' + invoice)}`, '_blank');
            
            // Reset form
            document.getElementById('namaPengirim').value = '';
            document.getElementById('namaJersey').value = '';
            document.getElementById('nomorJersey').value = '';
            document.getElementById('size').value = '';
            document.getElementById('pilihanJersey').value = '';
            document.getElementById('noWA').value = '';
            document.getElementById('buktiFile').value = '';
        } else if (result.status === 'duplikat') {
            resultDiv.className = 'gagal';
            resultDiv.textContent = `❌ Nomor ${nomorJersey} sudah dipakai oleh ${result.nama}!`;
        } else {
            resultDiv.className = 'gagal';
            resultDiv.textContent = '❌ Gagal menyimpan data. Coba lagi.';
        }

    } catch (error) {
        console.error(error);
        resultDiv.className = 'gagal';
        resultDiv.textContent = '❌ Terjadi kesalahan koneksi. Cek console browser (F12).';
    } finally {
        btn.disabled = false;
        resultDiv.style.display = 'block';
    }
}
