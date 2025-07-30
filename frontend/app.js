document.addEventListener('DOMContentLoaded', () => {
    const apiUrl = '/api';

    // Elementler
    const cezaFormu = document.getElementById('cezaFormu');
    const cezaListesi = document.getElementById('cezaListesi');
    const kisiSelect = document.getElementById('kisi');
    const icecekSelect = document.getElementById('icecek');
    const modal = document.getElementById('modal');
    // ... (diğer modal elementleri aynı kalıyor)
    const modalTitle = document.getElementById('modalTitle');
    const modalAddForm = document.getElementById('modalAddForm');
    const modalInput = document.getElementById('modalInput');
    const modalList = document.getElementById('modalList');
    const closeModalBtn = document.querySelector('.close-btn');

    let currentManagementType = null;

    // --- API HELPER FUNCTIONS (Aynı kalıyor) ---
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
    // --- Diğer yardımcı fonksiyonlar (populateSelect vs.) aynı kalıyor ---
    function populateSelect(selectElement, items, valueKey, textKey) {
        selectElement.innerHTML = `<option value="">${selectElement.id === 'kisi' ? 'Kişi' : 'İçecek'} Seçin...</option>`;
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item[valueKey];
            option.textContent = item[textKey];
            selectElement.appendChild(option);
        });
    }

    // --- YENİ RENDER FONKSİYONU ---
    async function renderCezalar() {
        const { data: cezalar } = await fetchData('cezalar');
        cezaListesi.innerHTML = '';
        if (cezalar.length === 0) {
            cezaListesi.innerHTML = '<p style="text-align:center;">Kimsenin borcu yok. Harika! 🎉</p>';
            return;
        }

        // 1. Adım: Cezaları hem kişiye hem de içeceğe göre grupla
        const borclular = cezalar.reduce((acc, ceza) => {
            // Kişi anahtarı yoksa oluştur
            acc[ceza.kisi] = acc[ceza.kisi] || {};
            // İçecek anahtarı yoksa oluştur
            acc[ceza.kisi][ceza.icecek] = acc[ceza.kisi][ceza.icecek] || { count: 0, ids: [] };
            
            // Sayacı artır ve cezanın ID'sini listeye ekle
            acc[ceza.kisi][ceza.icecek].count++;
            acc[ceza.kisi][ceza.icecek].ids.push(ceza.id);
            // En eskisini ödemek için ID'leri küçükten büyüğe sırala
            acc[ceza.kisi][ceza.icecek].ids.sort((a, b) => a - b);

            return acc;
        }, {});

        // 2. Adım: Gruplanmış veriyi HTML'e dönüştür
        for (const kisi in borclular) {
            const grupElementi = document.createElement('div');
            grupElementi.className = 'borclu-grup';

            const baslikElementi = document.createElement('div');
            baslikElementi.className = 'borclu-baslik';
            baslikElementi.innerHTML = `<i class="fa-solid fa-user"></i> ${kisi}`;
            grupElementi.appendChild(baslikElementi);

            for (const icecek in borclular[kisi]) {
                const borc = borclular[kisi][icecek];
                const cezaDetayElementi = document.createElement('div');
                cezaDetayElementi.className = 'ceza-detay';

                // Gerekli verileri butonlara gömmek için data-* attribute'larını kullanıyoruz
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

    // --- YENİ OLAY DİNLEYİCİSİ ---
    cezaListesi.addEventListener('click', async (e) => {
        const azaltBtn = e.target.closest('.sayac-azalt');
        const arttirBtn = e.target.closest('.sayac-arttir');

        if (azaltBtn) {
            // '-' butonuna tıklandı
            const ids = JSON.parse(azaltBtn.dataset.ids);
            if (ids.length > 0) {
                const enEskiId = ids[0]; // Sıralı olduğu için ilk eleman en eskidir
                await updateData(`cezalar/${enEskiId}/odendi`);
                await renderCezalar(); // Listeyi yenile
            }
        }

        if (arttirBtn) {
            // '+' butonuna tıklandı
            const kisi = arttirBtn.dataset.kisi;
            const icecek = arttirBtn.dataset.icecek;
            await postData('cezalar', { kisi, icecek });
            await renderCezalar(); // Listeyi yenile
        }
    });

    // --- Diğer Fonksiyonlar (Modal, Form Submit vb. aynı kalıyor) ---
    async function openModal(type) { /* ... Bu fonksiyonun içeriği aynı ... */ 
        currentManagementType = type;
        const isKisi = type === 'kisi';
        modalTitle.textContent = isKisi ? 'Kişileri Yönet' : 'İçecekleri Yönet';
        modalInput.placeholder = isKisi ? 'Yeni Kişi Adı' : 'Yeni İçecek Adı';
        const endpoint = isKisi ? 'kisiler' : 'icecekler';
        const { data: items } = await fetchData(endpoint);
        modalList.innerHTML = '';
        if (items.length === 0) { modalList.innerHTML = '<li>Liste boş.</li>'; }
        else {
            items.forEach(item => {
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
    function closeModal() { /* ... Bu fonksiyonun içeriği aynı ... */ modal.style.display = 'none'; modalAddForm.reset(); }
    async function handleDeleteItem(id) { /* ... Bu fonksiyonun içeriği aynı ... */
        if (!confirm('Bu öğeyi silmek istediğinizden emin misiniz?')) return;
        const isKisi = currentManagementType === 'kisi';
        const endpoint = isKisi ? 'kisiler' : 'icecekler';
        await deleteData(endpoint, id);
        await openModal(currentManagementType);
        await initDropdowns();
    }
    document.getElementById('yonetimKisiBtn').addEventListener('click', () => openModal('kisi'));
    document.getElementById('yonetimIcecekBtn').addEventListener('click', () => openModal('icecek'));
    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    modalAddForm.addEventListener('submit', async (e) => { /* ... Bu fonksiyonun içeriği aynı ... */
        e.preventDefault();
        const value = modalInput.value.trim();
        const isKisi = currentManagementType === 'kisi';
        const endpoint = isKisi ? 'kisiler' : 'icecekler';
        const body = isKisi ? { ad_soyad: value } : { ad: value };
        await postData(endpoint, body);
        modalInput.value = '';
        await openModal(currentManagementType);
        await initDropdowns();
    });
    cezaFormu.addEventListener('submit', async (e) => { /* ... Bu fonksiyonun içeriği aynı ... */
        e.preventDefault();
        await postData('cezalar', { kisi: kisiSelect.value, icecek: icecekSelect.value });
        renderCezalar();
        cezaFormu.reset();
    });
    async function initDropdowns() { /* ... Bu fonksiyonun içeriği aynı ... */
        const [{ data: kisiler }, { data: icecekler }] = await Promise.all([fetchData('kisiler'), fetchData('icecekler')]);
        populateSelect(kisiSelect, kisiler, 'ad_soyad', 'ad_soyad');
        populateSelect(icecekSelect, icecekler, 'ad', 'ad');
    }
    async function init() { /* ... Bu fonksiyonun içeriği aynı ... */
        await initDropdowns();
        renderCezalar();
    }
    init();
});
