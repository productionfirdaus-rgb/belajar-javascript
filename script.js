const API_URL = https://script.google.com/macros/s/AKfycbyZnW0zYMb1nTEbUWvn98q-xu1qM4cGwAglwuoTQgyEV4MJxDACfbYE3ajFEZA8ws5O/exec';

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

    if (!namaPengirim || !namaJersey || !nomorJersey || !size || !pilihanJersey || !noWA || !file) {
        alert('Harap isi semua field!');
        return;
    }

    // Cek OCR
    const ocr = await Tesseract.recognize(file, 'ind');
    if (!ocr.data.text.toLowerCase().includes('yusuf firdaus')) {
        document.getElementById('result').className = 'gagal';
        document.getElementById('result').textContent = '❌ Bukti tidak valid (tidak ada "Yusuf Firdaus")';
        document.getElementById('result').style.display = 'block';
        return;
    }

    // Kirim ke spreadsheet
    const data = { namaPengirim, namaJersey, nomorJersey, size, pilihanJersey, noWA };
    const res = await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ action: 'simpan', data })
    });

    document.getElementById('result').className = 'sukses';
    document.getElementById('result').textContent = '✅ Pemesanan berhasil!';
    document.getElementById('result').style.display = 'block';
}