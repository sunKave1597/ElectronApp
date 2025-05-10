window.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('income-form');
    const dateInput = document.getElementById('date');
    const itemsContainer = document.getElementById('items-container');
    const addBtn = document.getElementById('add-item-btn');
    const toast = document.getElementById('toast');

    function showToast(message, focusElement = null) {
        if (!toast) {
            console.warn("Toast element not found!");
            return;
        }

        toast.textContent = message;
        toast.style.display = 'block';
        setTimeout(() => {
            toast.style.display = 'none';
            if (focusElement) focusElement.focus();
        }, 2000);
    }

    let products = [];
    try {
        products = await window.api.getProducts();
    } catch (err) {
        console.error('❌ Failed to load products:', err);
        showToast('โหลดข้อมูลสินค้าล้มเหลว');
        return;
    }



    function getProductOptions() {
        return products.map(p => `
            <option value="${p.name}" data-sell="${p.sell_price}">
                ${p.name} (ขาย ${p.sell_price})
            </option>
        `).join('');
    }

    function createItemRow() {
        const item = document.createElement('div');
        item.classList.add('item-row');
        item.innerHTML = `
            <select class="product-select" required>${getProductOptions()}</select>
            <input type="number" class="qty" placeholder="จำนวน" min="1" required>
            <input type="number" class="sell-price" placeholder="ราคาขาย" required>
            <button type="button" class="remove-item-btn">🗑</button>
        `;

        setupItemEvents(item);

        const qtyInput = item.querySelector('.qty');
        qtyInput.addEventListener('input', () => {
            if (qtyInput.value <= 0) {
                showToast('จำนวนต้องมากกว่า 0', qtyInput);
            }
        });

        return item;
    }

    function setupItemEvents(item) {
        const select = item.querySelector('.product-select');
        const sellInput = item.querySelector('.sell-price');

        const selectedOption = select.options[select.selectedIndex];
        if (selectedOption && selectedOption.dataset.sell) {
            sellInput.value = selectedOption.dataset.sell;
        }

        select.addEventListener('change', () => {
            const selectedOption = select.options[select.selectedIndex];
            sellInput.value = selectedOption?.dataset.sell || '';
        });

        item.querySelector('.remove-item-btn').addEventListener('click', () => {
            const rows = itemsContainer.querySelectorAll('.item-row');
            if (rows.length > 1) {
                item.remove();
            } else {
                showToast('ต้องมีอย่างน้อย 1 รายการ');
            }
        });
    }

    function resetForm() {
        dateInput.value = '';
        itemsContainer.innerHTML = '';
        itemsContainer.appendChild(createItemRow());
    }

    resetForm();

    addBtn.addEventListener('click', () => {
        itemsContainer.appendChild(createItemRow());
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const date = dateInput.value;
        if (!date) {
            showToast('กรุณาเลือกวันที่');
            return;
        }

        const entries = [];
        const rows = itemsContainer.querySelectorAll('.item-row');

        rows.forEach(row => {
            const productName = row.querySelector('.product-select').value;
            const quantity = parseInt(row.querySelector('.qty').value);
            const sellPrice = parseInt(row.querySelector('.sell-price').value);

            if (productName && quantity > 0 && !isNaN(sellPrice)) {
                entries.push({ date, product_name: productName, quantity, sell_price: sellPrice });
            }
        });

        if (entries.length === 0) {
            showToast('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        try {
            await window.api.addIncome(entries);
            showToast('✅ บันทึกรายการเรียบร้อย');
            resetForm();
        } catch (err) {
            console.error('❌ เกิดข้อผิดพลาดในการบันทึก:', err);
            showToast('❌ เกิดข้อผิดพลาดในการบันทึก');
        }
    });
});