const API_URL = 'https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnSJ0bV8UkRu66ZbQCdLhUQGR6UQtsalqVEWzyNBrsh8D3kXUIiWKFKzdi1yg6r6v1FfTyb4LUJyphXbqipkoVAj2Wd5X_UA6S0aftyvlaYzxUv-jp2oS-WH-RV86aNv3YSyTQk4tU6uyxHjKESWYycJ4P6C8isTIxUbPSaQZDqVD9jjn3llKTZCS3eBa8jYyEwFPZ04NY_U8R160e7H_KZsDIwNaZo3FWnghAP0Yhm-Uz72pfhdq8nNN7SgjV13iaso1KLqzrTXPcAutrrISHVZgevv5A&lib=MK5-Q8VkVkeL_sCr8Q5MYTQ3tbNh787q5';

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
