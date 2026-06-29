const API_URL = 'https://script.google.com/macros/s/AKfycbz3lthoiwpH8cjl10oaWLhpTqRJW4TPeRvLbxEhOdyMKP6mYkNwATGMm6xeZOWDxb0j/exec';
async function loadData() {
    const res = await fetch(`${API_URL}?action=ambilDataAdmin`);
    const data = await res.json();
    document.getElementById('totalPeserta').textContent = data.totalPeserta;

    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    data.dataPeserta.slice(-10).reverse().forEach(row => {
        tbody.innerHTML += `<tr>
            <td>${row[1] || '-'}</td>
            <td>${row[2] || '-'}</td>
            <td>${row[4] || '-'}</td>
            <td>${row[5] || '-'}</td>
            <td>${row[9] || '-'}</td>
        </tr>`;
    });
}

async function uploadSizeChart() {
    const file = document.getElementById('sizeChartFile').files[0];
    if (!file) return alert('Pilih gambar dulu!');
    const reader = new FileReader();
    reader.onload = async function(e) {
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({ action: 'uploadSizeChart', url: e.target.result })
        });
        alert('Size chart berhasil diupload!');
    };
    reader.readAsDataURL(file);
}

document.addEventListener('DOMContentLoaded', loadData);
