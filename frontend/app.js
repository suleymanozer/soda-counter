// frontend/app.js
const apiUrl = '/api'; // Backend'e Nginx üzerinden ulaşacağız.
const cezaListesi = document.getElementById('cezaListesi');
const cezaFormu = document.getElementById('cezaFormu');

async function cezalariGetir() {
    try {
        const response = await fetch(`${apiUrl}/cezalar`);
        const { data } = await response.json();
        cezaListesi.innerHTML = '';
        if (data.length === 0) {
            cezaListesi.innerHTML = '<p>Ödenmemiş ceza yok! 🎉</p>';
            return;
        }
        data.forEach(ceza => {
            const el = document.createElement('div');
            el.className = 'ceza-item';
            el.innerHTML = `<span><strong>${ceza.kisi}</strong>: ${ceza.icecek}</span><button onclick="odendiIsaretle(${ceza.id})">Ödendi</button>`;
            cezaListesi.appendChild(el);
        });
    } catch (error) {
        cezaListesi.innerHTML = '<p>Veriler yüklenemedi. Backend çalışıyor mu?</p>';
    }
}

cezaFormu.addEventListener('submit', async (e) => {
    e.preventDefault();
    await fetch(`${apiUrl}/cezalar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kisi: document.getElementById('kisi').value, icecek: document.getElementById('icecek').value }),
    });
    cezaFormu.reset();
    cezalariGetir();
});

async function odendiIsaretle(id) {
    await fetch(`${apiUrl}/cezalar/${id}/odendi`, { method: 'PUT' });
    cezalariGetir();
}

document.addEventListener('DOMContentLoaded', cezalariGetir);