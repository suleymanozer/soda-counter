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

    let currentManagementType = null; // 'kisi' or 'icecek'

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

        cezalar.forEach(ceza => {
            const cezaElementi = document.createElement('div');
            cezaElementi.className = 'ceza-item';
            const tarih = new Date(ceza.tarih).toLocaleDateString('tr-TR');
            cezaElementi.innerHTML = `
                <div class="ceza-info">
                    <strong>${ceza.kisi}</strong>
                    <span>${ceza.icecek} - <small>${tarih}</small></span>
                </div>
                <button class="ode-btn" data-id="${ceza.id}">Öde</button>
            `;
            cezaListesi.appendChild(cezaElementi);
        });
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
    
    function closeModal() {
        modal.style.display = 'none';
        modalAddForm.reset();
    }

    async function handleDeleteItem(id) {
        if (!confirm('Bu öğeyi silmek istediğinizden emin misiniz?')) return;
        
        const isKisi = currentManagementType === 'kisi';
        const endpoint = isKisi ? 'kisiler' : 'icecekler';
        await deleteData(endpoint, id);
        
        // Refresh modal list and main dropdown
        await openModal(currentManagementType);
        await initDropdowns();
    }

    // Event listeners for modal
    document.getElementById('yonetimKisiBtn').addEventListener('click', () => openModal('kisi'));
    document.getElementById('yonetimIcecekBtn').addEventListener('click', () => openModal('icecek'));
    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    modalAddForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const value = modalInput.value.trim();
        const isKisi = currentManagementType === 'kisi';
        const endpoint = isKisi ? 'kisiler' : 'icecekler';
        const body = isKisi ? { ad_soyad: value } : { ad: value };
        
        await postData(endpoint, body);
        
        // Refresh modal list and main dropdown
        modalInput.value = '';
        await openModal(currentManagementType);
        await initDropdowns();
    });

    // --- MAIN EVENT LISTENERS ---
    cezaFormu.addEventListener('submit', async (e) => {
        e.preventDefault();
        await postData('cezalar', { kisi: kisiSelect.value, icecek: icecekSelect.value });
        renderCezalar();
        cezaFormu.reset();
    });

    cezaListesi.addEventListener('click', async (e) => {
        if (e.target.classList.contains('ode-btn')) {
            const id = e.target.dataset.id;
            await updateData(`cezalar/${id}/odendi`);
            renderCezalar();
        }
    });

    // --- INITIALIZATION ---
    async function initDropdowns() {
        const [{ data: kisiler }, { data: icecekler }] = await Promise.all([fetchData('kisiler'), fetchData('icecekler')]);
        populateSelect(kisiSelect, kisiler, 'ad_soyad', 'ad_soyad');
        populateSelect(icecekSelect, icecekler, 'ad', 'ad');
    }
    
    async function init() {
        await initDropdowns();
        renderCezalar();
    }

    init();
});
