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
    submitOrder: function(event) {
        event.preventDefault();

        const clientName = document.getElementById('input-fullname').value;
        const clientPhone = document.getElementById('input-phone').value;
        const clientLoc = document.getElementById('input-location').value;
        const paymentOption = document.querySelector('input[name="paymentMethod"]:checked').value;
        const receiptFile = document.getElementById('file-receipt').files[0];

        // Adminga boradigan ma'lumotlar paketi (JSON simulyatsiyasi)
        const compiledPayload = {
            customer: {
                name: clientName,
                phone: clientPhone,
                address: clientLoc
            },
            orderItems: shoppingCartState,
            paymentStrategy: paymentOption === 'online' ? 'Karta orqali (Onlayn Chek)' : 'Eshik oldida (Naqd/Karta)',
            receiptAttached: receiptFile ? receiptFile.name : 'Yuklanmagan / Naqd to\'lov'
        };

        // Brauzer konsoliga (Admin boshqaruv pultiga) ma'lumotni uzatish
        console.log("%c--- ADMIN PANELGA BUYURTMA KELIB TUSHDI ---", "color: #ff6b35; font-size: 14px; font-weight: bold;", compiledPayload);

        // Mijozga chiroyli xabar ko'rsatish
        alert(`Rahmat, ${clientName}!\nBuyurtmangiz muvaffaqiyatli qabul qilindi va admin panelga uzatildi.\n\nTaom tayyor bo'lgach kuryerimiz uni tezda yetkazib beradi!`);

        // Savatni va formalarni tozalash, oynani yopish
        shoppingCartState = [];
        cartManager.syncDOM();
        document.getElementById('mainOrderForm').reset();
        this.togglePaymentSection(); // fayl yuklash joyini asl holatiga qaytarish
        
        const checkoutModalInstance = bootstrap.Modal.getInstance(document.getElementById('orderModal'));
        if (checkoutModalInstance) checkoutModalInstance.hide();
    }
};