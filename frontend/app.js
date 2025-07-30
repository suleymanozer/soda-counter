document.addEventListener('DOMContentLoaded', () => {
    const apiUrl = '/api';

    // Elementler
    const cezaFormu = document.getElementById('cezaFormu');
    const cezaListesi = document.getElementById('cezaListesi');
    const kisiSelect = document.getElementById('kisi');
    const icecekSelect = document.getElementById('icecek');
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalForm = document.getElementById('modalForm');
    const modalInput = document.getElementById('modalInput');
    const closeModalBtn = document.querySelector('.close-btn');

    let currentModalAction = null;

    // --- VERİ YÜKLEME VE GÖSTERİM ---

    async function fetchData(endpoint) {
        const response = await fetch(`${apiUrl}/${endpoint}`);
        const { data } = await response.json();
        return data;
    }

    async function postData(endpoint, body) {
        await fetch(`${apiUrl}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
    }

    async function updateData(endpoint) {
        await fetch(`${apiUrl}/${endpoint}`, { method: 'PUT' });
    }

    function populateSelect(selectElement, items, valueKey, textKey) {
        selectElement.innerHTML = `<option value="">${selectElement.id === 'kisi' ? 'Kişi' : 'İçecek'} Seçin...</option>`;
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item[valueKey];
            option.textContent = item[textKey];
            selectElement.appendChild(option);
        });
    }

    async function renderCezalar() {
        const cezalar = await fetchData('cezalar');
        cezaListesi.innerHTML = '';
        if (cezalar.length === 0) {
            cezaListesi.innerHTML = '<p style="text-align:center;">Kimsenin borcu yok. Harika! 🎉</p>';
            return;
        }

        const borclular = cezalar.reduce((acc, ceza) => {
            acc[ceza.kisi] = acc[ceza.kisi] || { icecekler: {}, ids: [] };
            acc[ceza.kisi].icecekler[ceza.icecek] = (acc[ceza.kisi].icecekler[ceza.icecek] || 0) + 1;
            acc[ceza.kisi].ids.push(ceza.id);
            return acc;
        }, {});

        for (const kisi in borclular) {
            const borcDetaylari = Object.entries(borclular[kisi].icecekler)
                .map(([icecek, sayi]) => `<span class="borc">${sayi} ${icecek}</span>`)
                .join(' ');
            
            const borcluElementi = document.createElement('div');
            borcluElementi.className = 'borclu-item';
            borcluElementi.innerHTML = `
                <div class="borclu-info">
                    <strong>${kisi}</strong>
                    <span class="borclar">${borcDetaylari}</span>
                </div>
                <button class="ode-btn" data-ids='${JSON.stringify(borclular[kisi].ids)}'>Tümünü Öde</button>
            `;
            cezaListesi.appendChild(borcluElementi);
        }
    }

    // --- MODAL YÖNETİMİ ---
    
    function openModal(type) {
        currentModalAction = type;
        modalTitle.textContent = type === 'kisi' ? 'Yeni Kişi Ekle' : 'Yeni İçecek Ekle';
        modalInput.placeholder = type === 'kisi' ? 'Ahmet Yılmaz' : 'Limonlu Soda';
        modal.style.display = 'flex';
    }

    function closeModal() {
        modal.style.display = 'none';
        modalForm.reset();
    }

    document.getElementById('yeniKisiBtn').addEventListener('click', () => openModal('kisi'));
    document.getElementById('yeniIcecekBtn').addEventListener('click', () => openModal('icecek'));
    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    modalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const value = modalInput.value.trim();
        if (currentModalAction === 'kisi') {
            await postData('kisiler', { ad_soyad: value });
            populateSelect(kisiSelect, await fetchData('kisiler'), 'ad_soyad', 'ad_soyad');
        } else {
            await postData('icecekler', { ad: value });
            populateSelect(icecekSelect, await fetchData('icecekler'), 'ad', 'ad');
        }
        closeModal();
    });

    // --- OLAY DİNLEYİCİLERİ ---

    cezaFormu.addEventListener('submit', async (e) => {
        e.preventDefault();
        await postData('cezalar', { kisi: kisiSelect.value, icecek: icecekSelect.value });
        renderCezalar();
        cezaFormu.reset();
    });

    cezaListesi.addEventListener('click', async (e) => {
        if (e.target.classList.contains('ode-btn')) {
            const ids = JSON.parse(e.target.dataset.ids);
            const odemeIstekleri = ids.map(id => updateData(`cezalar/${id}/odendi`));
            await Promise.all(odemeIstekleri);
            renderCezalar();
        }
    });

    // --- İLK YÜKLEME ---

    async function init() {
        const [kisiler, icecekler] = await Promise.all([fetchData('kisiler'), fetchData('icecekler')]);
        populateSelect(kisiSelect, kisiler, 'ad_soyad', 'ad_soyad');
        populateSelect(icecekSelect, icecekler, 'ad', 'ad');
        renderCezalar();
    }

    init();
});
