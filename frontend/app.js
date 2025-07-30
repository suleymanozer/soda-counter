// frontend/app.js
document.addEventListener('DOMContentLoaded', () => {
    const apiUrl = '/api';

    // Formlar ve Listeler
    const cezaFormu = document.getElementById('cezaFormu');
    const kisiEkleFormu = document.getElementById('kisiEkleFormu');
    const icecekEkleFormu = document.getElementById('icecekEkleFormu');
    
    const cezaListesi = document.getElementById('cezaListesi');
    const kisiSelect = document.getElementById('kisi');
    const icecekSelect = document.getElementById('icecek');

    // --- VERİ ÇEKME VE DOLDURMA FONKSİYONLARI ---

    // Kişileri çek ve dropdown'ı doldur
    async function kisileriDoldur() {
        const response = await fetch(`${apiUrl}/kisiler`);
        const { data } = await response.json();
        kisiSelect.innerHTML = '<option value="">Kişi Seçin...</option>'; // Listeyi temizle ve başlık ekle
        data.forEach(kisi => {
            const option = document.createElement('option');
            option.value = kisi.ad_soyad;
            option.textContent = kisi.ad_soyad;
            kisiSelect.appendChild(option);
        });
    }

    // İçecekleri çek ve dropdown'ı doldur
    async function icecekleriDoldur() {
        const response = await fetch(`${apiUrl}/icecekler`);
        const { data } = await response.json();
        icecekSelect.innerHTML = '<option value="">İçecek Seçin...</option>'; // Listeyi temizle ve başlık ekle
        data.forEach(icecek => {
            const option = document.createElement('option');
            option.value = icecek.ad;
            option.textContent = icecek.ad;
            icecekSelect.appendChild(option);
        });
    }

    // Mevcut cezaları listele
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
                el.innerHTML = `<span><strong>${ceza.kisi}</strong>: ${ceza.icecek}</span><button onclick="window.odendiIsaretle(${ceza.id})">Ödendi</button>`;
                cezaListesi.appendChild(el);
            });
        } catch (error) {
            cezaListesi.innerHTML = '<p>Veriler yüklenemedi. Backend çalışıyor mu?</p>';
        }
    }

    // --- FORM GÖNDERME İŞLEMLERİ ---

    // Yeni ceza ekle
    cezaFormu.addEventListener('submit', async (e) => {
        e.preventDefault();
        await fetch(`${apiUrl}/cezalar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kisi: kisiSelect.value, icecek: icecekSelect.value }),
        });
        cezalariGetir(); // Ceza listesini yenile
    });

    // Yeni kişi ekle
    kisiEkleFormu.addEventListener('submit', async (e) => {
        e.preventDefault();
        const yeniKisiInput = document.getElementById('yeniKisiAdi');
        await fetch(`${apiUrl}/kisiler`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ad_soyad: yeniKisiInput.value }),
        });
        yeniKisiInput.value = ''; // Input'u temizle
        kisileriDoldur(); // Kişi listesini yenile
    });

    // Yeni içecek ekle
    icecekEkleFormu.addEventListener('submit', async (e) => {
        e.preventDefault();
        const yeniIcecekInput = document.getElementById('yeniIcecekAdi');
        await fetch(`${apiUrl}/icecekler`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ad: yeniIcecekInput.value }),
        });
        yeniIcecekInput.value = ''; // Input'u temizle
        icecekleriDoldur(); // İçecek listesini yenile
    });


    // --- DİĞER FONKSİYONLAR ---

    // Cezayı "Ödendi" olarak işaretle (Global scope'a taşıdık)
    window.odendiIsaretle = async (id) => {
        await fetch(`${apiUrl}/cezalar/${id}/odendi`, { method: 'PUT' });
        cezalariGetir(); // Listeyi yenile
    }

    // --- SAYFA İLK YÜKLENDİĞİNDE ---
    function init() {
        cezalariGetir();
        kisileriDoldur();
        icecekleriDoldur();
    }

    init();
});
