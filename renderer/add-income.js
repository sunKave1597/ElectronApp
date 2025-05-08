window.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('income-form');
    const dateInput = document.getElementById('date');
    const itemsContainer = document.getElementById('items-container');
    const addBtn = document.getElementById('add-item-btn');

    const products = await window.api.getProducts();

    function createItemRow() {
        const item = document.createElement('div');
        item.classList.add('item-row');

        item.innerHTML = `
            <select class="product-select" required>
                ${products.map(p =>
            `<option value="${p.id}" data-sell="${p.sell_price}" data-cost="${p.cost_price}">
                        ${p.name} (ขาย ${p.sell_price} / ทุน ${p.cost_price})
                    </option>`).join('')}
            </select>

            <input type="number" class="qty" placeholder="จำนวน" required>
            <input type="number" class="sell-price" placeholder="ราคาขาย" required>
            <input type="number" class="cost-price" placeholder="ราคาทุน" required>
            <button type="button" class="remove-item-btn">🗑</button>
        `;

        setupItemEvents(item);
        return item;
    }

    function setupItemEvents(item) {
        const select = item.querySelector('.product-select');
        const sellInput = item.querySelector('.sell-price');
        const costInput = item.querySelector('.cost-price');

        // Autofill ตอนเลือก
        select.addEventListener('change', () => {
            const selected = select.options[select.selectedIndex];
            sellInput.value = selected.dataset.sell;
            costInput.value = selected.dataset.cost;
        });

        // Autofill ทันทีตอนสร้าง
        const selected = select.options[select.selectedIndex];
        if (selected) {
            sellInput.value = selected.dataset.sell;
            costInput.value = selected.dataset.cost;
        }

        // ปุ่มลบ
        const removeBtn = item.querySelector('.remove-item-btn');
        removeBtn.addEventListener('click', () => {
            const allRows = itemsContainer.querySelectorAll('.item-row');
            if (allRows.length > 1) {
                item.remove();
            } else {
                alert('ต้องมีอย่างน้อย 1 รายการ');
            }
        });
    }

    // โหลดเริ่มต้น
    itemsContainer.innerHTML = '';
    itemsContainer.appendChild(createItemRow());

    // เพิ่มแถว
    addBtn.addEventListener('click', () => {
        itemsContainer.appendChild(createItemRow());
    });

    // บันทึก
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const date = dateInput.value;
        const entries = [];

        document.querySelectorAll('.item-row').forEach(item => {
            const product_id = parseInt(item.querySelector('.product-select').value);
            const quantity = parseInt(item.querySelector('.qty').value);
            const sell_price = parseInt(item.querySelector('.sell-price').value);
            const cost_price = parseInt(item.querySelector('.cost-price').value);

            if (!isNaN(product_id) && quantity > 0) {
                entries.push({ date, product_id, quantity, sell_price, cost_price });
            }
        });

        if (entries.length === 0) {
            alert('⚠️ ยังไม่มีรายการที่กรอกถูกต้อง');
            return;
        }

        await window.api.addIncome(entries);


        alert('✅ บันทึกรายรับเรียบร้อย');

        form.reset();
        itemsContainer.innerHTML = '';
        itemsContainer.appendChild(createItemRow());
    });
});
