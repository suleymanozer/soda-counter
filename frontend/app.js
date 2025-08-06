document.addEventListener('DOMContentLoaded', () => {
    const apiUrl = '/api';

    // Elementler
    const cezaFormu = document.getElementById('cezaFormu');
    const cezaListesi = document.getElementById('cezaListesi');
    const kisiSelect = document.getElementById('kisi');
    const icecekSelect = document.getElementById('icecek');
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalAddForm = document.getElementById('modalAddForm');
    const modalInput = document.getElementById('modalInput');
    const modalList = document.getElementById('modalList');
    const closeModalBtn = document.querySelector('.close-btn');

    let currentManagementType = null;

    // --- API HELPER FUNCTIONS ---
    async function fetchData(endpoint) {
        const response = await fetch(`${apiUrl}/${endpoint}`);
        return response.json();
    }
    async function postData(endpoint, body) {
        await fetch(`${apiUrl}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
    }
    async function deleteData(endpoint, id) {
        await fetch(`${apiUrl}/${endpoint}/${id}`, { method: 'DELETE' });
    }
    async function updateData(endpoint) {
        await fetch(`${apiUrl}/${endpoint}`, { method: 'PUT' });
    }

    // --- RENDER FUNCTIONS ---
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
        const { data: cezalar } = await fetchData('cezalar');
        cezaListesi.innerHTML = '';
        if (cezalar.length === 0) {
            cezaListesi.innerHTML = '<p style="text-align:center;">Kimsenin borcu yok. Harika! 🎉</p>';
            return;
        }

        const borclular = cezalar.reduce((acc, ceza) => {
            acc[ceza.kisi] = acc[ceza.kisi] || {};
            acc[ceza.kisi][ceza.icecek] = acc[ceza.kisi][ceza.icecek] || { count: 0, ids: [] };
            acc[ceza.kisi][ceza.icecek].count++;
            acc[ceza.kisi][ceza.icecek].ids.push(ceza.id);
            acc[ceza.kisi][ceza.icecek].ids.sort((a, b) => a - b);
            return acc;
        }, {});

        const siraliKisiler = Object.keys(borclular).sort((a, b) => a.localeCompare(b, 'tr'));

        for (const kisi of siraliKisiler) {
            const grupElementi = document.createElement('div');
            grupElementi.className = 'borclu-grup';
            const baslikElementi = document.createElement('div');
            baslikElementi.className = 'borclu-baslik';
            baslikElementi.innerHTML = `<i class="fa-solid fa-user"></i> ${kisi}`;
            grupElementi.appendChild(baslikElementi);
            const kisiBorclari = borclular[kisi];
            const siraliIcecekler = Object.keys(kisiBorclari).sort((a, b) => a.localeCompare(b, 'tr'));
            
            for (const icecek of siraliIcecekler) {
                const borc = kisiBorclari[icecek];
                const cezaDetayElementi = document.createElement('div');
                cezaDetayElementi.className = 'ceza-detay';
                cezaDetayElementi.innerHTML = `
                    <span class="ceza-detay-ad">${icecek}</span>
                    <div class="sayac-grup">
                        <button class="sayac-btn sayac-azalt" data-kisi="${kisi}" data-icecek="${icecek}" data-ids='${JSON.stringify(borc.ids)}'>-</button>
                        <span class="borc-sayac">${borc.count}</span>
                        <button class="sayac-btn sayac-arttir" data-kisi="${kisi}" data-icecek="${icecek}">+</button>
                    </div>
                `;
                grupElementi.appendChild(cezaDetayElementi);
            }
            cezaListesi.appendChild(grupElementi);
        }
    }

    // --- MODAL MANAGEMENT ---
    async function openModal(type) {
        currentManagementType = type;
        const isKisi = type === 'kisi';
        modalTitle.textContent = isKisi ? 'Kişileri Yönet' : 'İçecekleri Yönet';
        modalInput.placeholder = isKisi ? 'Yeni Kişi Adı' : 'Yeni İçecek Adı';
        const endpoint = isKisi ? 'kisiler' : 'icecekler';
        const { data: items } = await fetchData(endpoint);
        modalList.innerHTML = '';
        if (items.length === 0) {
            modalList.innerHTML = '<li>Liste boş.</li>';
        } else {
            const sortedItems = items.sort((a, b) => (isKisi ? a.ad_soyad : a.ad).localeCompare(isKisi ? b.ad_soyad : b.ad, 'tr'));
            sortedItems.forEach(item => {
                const li = document.createElement('li');
                li.textContent = isKisi ? item.ad_soyad : item.ad;
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-item-btn';
                deleteBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
                deleteBtn.onclick = () => handleDeleteItem(item.id);
                li.appendChild(deleteBtn);
                modalList.appendChild(li);
            });
        }
        modal.style.display = 'flex';
    }
    
    function closeModal() {
        modal.style.display = 'none';
        modalAddForm.reset();
    }

    async function handleDeleteItem(id) {
        if (!confirm('Bu öğeyi silmek istediğinizden emin misiniz?')) return;
        const isKisi = currentManagementType === 'kisi';
        const endpoint = isKisi ? 'kisiler' : 'icecekler';
        await deleteData(endpoint, id);
        await openModal(currentManagementType);
        await initDropdowns();
    }

    // --- EVENT LISTENERS ---
    document.getElementById('yonetimKisiBtn').addEventListener('click', () => openModal('kisi'));
    document.getElementById('yonetimIcecekBtn').addEventListener('click', () => openModal('icecek'));
    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    modalAddForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const value = modalInput.value.trim();
        if (!value) return;
        const isKisi = currentManagementType === 'kisi';
        const endpoint = isKisi ? 'kisiler' : 'icecekler';
        const body = isKisi ? { ad_soyad: value } : { ad: value };
        await postData(endpoint, body);
        modalInput.value = '';
        await openModal(currentManagementType);
        await initDropdowns();
    });

    cezaFormu.addEventListener('submit', async (e) => {
        e.preventDefault();
        await postData('cezalar', { kisi: kisiSelect.value, icecek: icecekSelect.value });
        renderCezalar();
        cezaFormu.reset();
    });

    cezaListesi.addEventListener('click', async (e) => {
        const azaltBtn = e.target.closest('.sayac-azalt');
        const arttirBtn = e.target.closest('.sayac-arttir');
        if (azaltBtn) {
            const ids = JSON.parse(azaltBtn.dataset.ids);
            if (ids.length > 0) {
                const enEskiId = ids[0];
                await updateData(`cezalar/${enEskiId}/odendi`);
                await renderCezalar();
            }
        }
        if (arttirBtn) {
            const kisi = arttirBtn.dataset.kisi;
            const icecek = arttirBtn.dataset.icecek;
            await postData('cezalar', { kisi, icecek });
            await renderCezalar();
        }
    });

    // --- INITIALIZATION ---
    async function initDropdowns() {
        const [{ data: kisiler }, { data: icecekler }] = await Promise.all([fetchData('kisiler'), fetchData('icecekler')]);
        const sortedKisiler = kisiler.sort((a,b) => a.ad_soyad.localeCompare(b.ad_soyad, 'tr'));
        const sortedIcecekler = icecekler.sort((a,b) => a.ad.localeCompare(b.ad, 'tr'));
        populateSelect(kisiSelect, sortedKisiler, 'ad_soyad', 'ad_soyad');
        populateSelect(icecekSelect, sortedIcecekler, 'ad', 'ad');
    }
    
    async function init() {
        await initDropdowns();
        renderCezalar();
    }

    init();
});
