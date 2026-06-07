// Savatchaning global holati (Massiv)
let shoppingCartState = [];

// Kategoriyalarni almashtirish funksiyasi
function switchCategory(categoryName, clickTarget) {
    // Aktiv klassni tab tugmalaridan o'chirish va bosilganiga qo'shish
    document.querySelectorAll('.nav-tabs-custom .nav-link').forEach(btn => btn.classList.remove('active'));
    clickTarget.classList.add('active');

    // Sarlavhani o'zgartirish
    const headingMap = {
        'milliy': 'Milliy taomlar',
        'fastfood': 'Fast Foodlar',
        'ichimliklar': 'Muzdek Ichimliklar',
        'shirinliklar': 'Lazzatli Shirinliklar'
    };
    document.getElementById('current-category-heading').innerText = headingMap[categoryName] || 'Menyu';

    // Kerakli bo'limni ko'rsatib qolganlarini yashirish
    document.querySelectorAll('.category-pane').forEach(pane => pane.classList.remove('active-pane'));
    const targetedPane = document.getElementById(`pane-${categoryName}`);
    if (targetedPane) {
        targetedPane.classList.add('active-pane');
    }
}

// Savatchani boshqaruvchi obyekt (Object-Oriented yondashuv)
const cartManager = {
    // Savatga mahsulot qo'shish
    add: function(id, name, price) {
        const existingProduct = shoppingCartState.find(item => item.id === id);
        if (existingProduct) {
            existingProduct.quantity += 1;
        } else {
            shoppingCartState.push({
                id: id,
                name: name,
                price: price,
                quantity: 1
            });
        }
        this.syncDOM();
    },
    
    // Savatdagi sonni o'zgartirish (+ yoki - bosilganda)
    alterQty: function(id, direction) {
        const targetProduct = shoppingCartState.find(item => item.id === id);
        if (!targetProduct) return;

        if (direction === 'plus') {
            targetProduct.quantity += 1;
        } else if (direction === 'minus') {
            targetProduct.quantity -= 1;
            if (targetProduct.quantity <= 0) {
                shoppingCartState = shoppingCartState.filter(item => item.id !== id);
            }
        }
        this.syncDOM();
    },

    // HTML sahifadagi savat ko'rinishini yangilash
    syncDOM: function() {
        const counterElement = document.getElementById('cart-counter');
        const itemsContainer = document.getElementById('cart-items-wrapper');
        const totalSumElement = document.getElementById('cart-total-sum');
        const checkoutBtn = document.getElementById('btn-go-checkout');

        // Savatdagi umumiy taomlar soni
        const absoluteCount = shoppingCartState.reduce((acc, current) => acc + current.quantity, 0);
        counterElement.innerText = absoluteCount;

        // Agar savat bo'sh bo'lsa
        if (shoppingCartState.length === 0) {
            itemsContainer.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <i class="fa-solid fa-basket-shopping fs-1 d-block mb-3 text-light"></i>
                    Savatchangiz bo'sh. Menudan biror nima qo'shing!
                </div>`;
            totalSumElement.innerText = "0 so'm";
            checkoutBtn.disabled = true;
            return;
        }

        // Savatda narsa bo'lsa tugmani faollashtirish
        checkoutBtn.disabled = false;
        itemsContainer.innerHTML = '';
        let grandTotalSum = 0;

        // Har bir mahsulotni chiroyli qator qilib chiqarish
        shoppingCartState.forEach(product => {
            const combinedPrice = product.price * product.quantity;
            grandTotalSum += combinedPrice;

            itemsContainer.innerHTML += `
                <div class="cart-item-row">
                    <div>
                        <h6 class="fw-bold mb-1 text-dark">${product.name}</h6>
                        <span class="text-primary fw-bold small">${product.price.toLocaleString('uz-UZ')} so'm</span>
                    </div>
                    <div class="qty-controls">
                        <button class="btn-qty" onclick="cartManager.alterQty(${product.id}, 'minus')">-</button>
                        <span class="qty-value">${product.quantity}</span>
                        <button class="btn-qty" onclick="cartManager.alterQty(${product.id}, 'plus')">+</button>
                    </div>
                </div>
            `;
        });

        totalSumElement.innerText = grandTotalSum.toLocaleString('uz-UZ') + " so'm";
    }
};

// Buyurtma berish jarayoni va formalar boshqaruvi
const checkoutFlow = {

    // GPS orqali avtomatik lokatsiya olish
    getLocation: function() {
        const btn = document.getElementById('btn-get-location');
        const status = document.getElementById('location-status');
        const input = document.getElementById('input-location');

        if (!navigator.geolocation) {
            status.innerHTML = `<span class="text-danger"><i class="fa-solid fa-circle-xmark me-1"></i>Brauzeringiz GPS ni qo'llab-quvvatlamaydi.</span>`;
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        status.innerHTML = `<span class="text-muted"><i class="fa-solid fa-spinner fa-spin me-1"></i>Lokatsiya aniqlanmoqda...</span>`;

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                input.dataset.mapsLink = `https://maps.google.com/?q=${lat},${lon}`;
                input.dataset.lat = lat;
                input.dataset.lon = lon;
                input.value = `${lat},${lon}`;

                btn.innerHTML = '<i class="fa-solid fa-circle-check me-2 text-success"></i>Lokatsiya olindi ✓';
                btn.classList.remove('btn-outline-primary');
                btn.classList.add('btn-success', 'text-white');
                status.innerHTML = `<span class="text-success"><i class="fa-solid fa-circle-check me-1"></i>Lokatsiya muvaffaqiyatli aniqlandi!</span>`;

                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-crosshairs"></i>';
            },
            (error) => {
                const msgs = {
                    1: "Lokatsiya ruxsati rad etildi. Brauzer sozlamalaridan ruxsat bering.",
                    2: "Lokatsiya aniqlanmadi. Internetni tekshiring.",
                    3: "Vaqt tugadi. Qayta urinib ko'ring."
                };
                status.innerHTML = `<span class="text-danger"><i class="fa-solid fa-circle-xmark me-1"></i>${msgs[error.code] || "Noma'lum xato."}</span>`;
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-crosshairs"></i>';
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    },

    // Buyurtma berish formasini ochish
    openOrderModal: function() {
        const cartModalInstance = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
        if (cartModalInstance) cartModalInstance.hide();
        
        const checkoutModal = new bootstrap.Modal(document.getElementById('orderModal'));
        checkoutModal.show();
    },

    // To'lov turiga qarab chek yuklash joyini yashirish yoki ko'rsatish
    togglePaymentSection: function() {
        const isOnlineChosen = document.getElementById('pay-online').checked;
        const uploadBox = document.getElementById('receipt-upload-box');
        
        if (isOnlineChosen) {
            uploadBox.style.display = 'block';
        } else {
            uploadBox.style.display = 'none';
        }
    },

    // Formani tasdiqlash va Adminga yuborish
    submitOrder: async function(event) {
        event.preventDefault();

        const BOT_TOKEN = '8792621213:AAFxz0IML9PlmUayxtjwn-IHdQe_Ho6GgKI';
        const ADMIN_CHAT_ID = '5774691559';

        const clientName = document.getElementById('input-fullname').value;
        const clientPhone = document.getElementById('input-phone').value;
        const locationInput = document.getElementById('input-location');
        const clientLoc = locationInput.value;
        const mapsLink = locationInput.dataset.mapsLink || null;
        const paymentOption = document.querySelector('input[name="paymentMethod"]:checked').value;
        const receiptFile = document.getElementById('file-receipt').files[0];

        // Jami summani hisoblash
        const totalSum = shoppingCartState.reduce((acc, p) => acc + p.price * p.quantity, 0);

        // Buyurtma tarkibini chiroyli ko'rinishda yozish
        const orderLines = shoppingCartState.map(p =>
            `  • ${p.name} x${p.quantity} — ${(p.price * p.quantity).toLocaleString('uz-UZ')} so'm`
        ).join('\n');

        const paymentLabel = paymentOption === 'online' ? '💳 Onlayn (Karta)' : '💵 Eshik oldida (Naqd/Karta)';
        const locationLine = mapsLink
            ? `📍 *Lokatsiya:* [Xaritada ko'rish](${mapsLink})`
            : `📍 *Manzil:* ${clientLoc}`;

        // Telegram xabar matni
        const message =
`🛎 *YANGI BUYURTMA KELDI!*

👤 *Ism:* ${clientName}
📞 *Telefon:* ${clientPhone}
${locationLine}

🧾 *Buyurtma tarkibi:*
${orderLines}

💰 *Jami to'lov:* ${totalSum.toLocaleString('uz-UZ')} so'm
💳 *To'lov usuli:* ${paymentLabel}`;

        // GPS olinganligini tekshirish
        if (!locationInput.dataset.lat) {
            document.getElementById('location-status').innerHTML = 
                `<span class="text-danger"><i class="fa-solid fa-circle-xmark me-1"></i>Iltimos, avval GPS orqali lokatsiyangizni oling!</span>`;
            document.getElementById('btn-get-location').classList.add('border-danger');
            return;
        }

        // Tugmani bloklash va yuborilmoqda ko'rsatish
        const submitBtn = document.querySelector('#mainOrderForm [type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Yuborilmoqda...';

        try {
            // 1. Matnli xabar yuborish
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: ADMIN_CHAT_ID,
                    text: message,
                    parse_mode: 'Markdown'
                })
            });

            // 2. GPS lokatsiya yuborish (Telegram native xarita)
            if (locationInput.dataset.lat && locationInput.dataset.lon) {
                await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendLocation`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: ADMIN_CHAT_ID,
                        latitude: parseFloat(locationInput.dataset.lat),
                        longitude: parseFloat(locationInput.dataset.lon)
                    })
                });
            }

            // 3. Agar chek fayli yuklangan bo'lsa — uni ham yuborish
            if (receiptFile) {
                const formData = new FormData();
                formData.append('chat_id', ADMIN_CHAT_ID);
                formData.append('photo', receiptFile);
                formData.append('caption', `📎 ${clientName} ning to'lov cheki`);

                await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
                    method: 'POST',
                    body: formData
                });
            }

            // Mijozga muvaffaqiyat xabari
            alert(`✅ Rahmat, ${clientName}!\nBuyurtmangiz adminga muvaffaqiyatli yuborildi.\n\nTaom tayyor bo'lgach kuryerimiz tezda yetkazib beradi!`);

            // Savatni va formalarni tozalash
            shoppingCartState = [];
            cartManager.syncDOM();
            document.getElementById('mainOrderForm').reset();
            this.togglePaymentSection();

            const checkoutModalInstance = bootstrap.Modal.getInstance(document.getElementById('orderModal'));
            if (checkoutModalInstance) checkoutModalInstance.hide();

        } catch (err) {
            console.error('Telegram xato:', err);
            alert('❌ Xatolik yuz berdi! Internet aloqasini tekshiring va qayta urinib ko\'ring.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-check-double me-2"></i>Tasdiqlash';
        }
    }
};
