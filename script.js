const API_URL = 'https://script.google.com/macros/s/AKfycbzaAtjJVcfog6RYK8TIGKPMs0LA9YuBzRHiX9ft6E14itOAxUA3HMjaiMi8uH-GYh68/exec';

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
        } catch (e) { /* abaikan */ }
    }
});

// Tombol Kirim (Menggunakan addEventListener, BUKAN onclick="prosesPemesanan()")
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

    if (!namaPengirim || !namaJersey || !nomorJersey || !size || !pilihanJersey || !noWA || !fileInput.files[0]) {
        alert('Harap isi semua field!');
        return;
    }

    btn.disabled = true;
    btn.textContent = '⏳ Memproses...';
    resultDiv.style.display = 'none';

    try {
        resultDiv.style.display = 'block';
        resultDiv.className = '';
        resultDiv.textContent = '⏳ Membaca bukti pembayaran...';

        const ocrResult = await Tesseract.recognize(fileInput.files[0], 'ind');
        if (!ocrResult.data.text.toLowerCase().includes('yusuf firdaus')) {
            resultDiv.className = 'gagal';
            resultDiv.textContent = '❌ GAGAL: Tidak ada tulisan "Yusuf Firdaus" di gambar.';
            btn.disabled = false; btn.textContent = 'Kirim Pemesanan'; return;
        }

        resultDiv.textContent = '⏳ Menyimpan data...';
        const data = { namaPengirim, namaJersey, nomorJersey, size, pilihanJersey, keterangan: keterangan || '-', noWA };
        
        // KIRIM DATA KE APPS SCRIPT
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'simpan', data: data })
        });

        const resultData = await response.json();

        if (resultData.status === 'sukses') {
            resultDiv.className = 'sukses';
            resultDiv.textContent = `✅ BERHASIL! Kode: ${resultData.kode}`;
            
            const adminWA = '6287757639277';
            const userWA = noWA.replace(/^0/, '62');
            const pesanWA = `PESANAN BARU\nKode: ${resultData.kode}\nNama: ${namaPengirim}`;
            window.open(`https://wa.me/${adminWA}?text=${encodeURIComponent(pesanWA)}`, '_blank');
            window.open(`https://wa.me/${userWA}?text=${encodeURIComponent('✅ Berhasil!\n\n' + pesanWA)}`, '_blank');
            
            document.getElementById('namaPengirim').value = ''; // Reset form
        } else if (resultData.status === 'duplikat') {
            resultDiv.className = 'gagal';
            resultDiv.textContent = `❌ Nomor ${nomorJersey} sudah dipakai oleh ${resultData.nama}`;
        } else {
            resultDiv.className = 'gagal';
            resultDiv.textContent = '❌ Gagal simpan data.';
        }

    } catch (error) {
        console.error(error);
        resultDiv.className = 'gagal';
        resultDiv.textContent = '❌ Error koneksi. Cek Console (F12).';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Kirim Pemesanan';
    }
});
