window.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('income-form');
    const dateInput = document.getElementById('date');
    const itemsContainer = document.getElementById('items-container');
    const addBtn = document.getElementById('add-item-btn');

    const products = await window.api.getProducts();

    function createItemRow() {
        const item = document.createElement('div');
        item.classList.add('item-row');

        const options = products.map(p =>
            `<option value="${p.name}" data-sell="${p.sell_price}">
                ${p.name} (ขาย ${p.sell_price})
            </option>`).join('');

        item.innerHTML = `
            <select class="product-select" required>${options}</select>
            <input type="number" class="qty" placeholder="จำนวน" required>
            <input type="number" class="sell-price" placeholder="ราคาขาย" required>
            <button type="button" class="remove-item-btn">🗑</button>
        `;

        setupItemEvents(item);
        return item;
    }

    function setupItemEvents(item) {
        const select = item.querySelector('.product-select');
        const sellInput = item.querySelector('.sell-price');

        const selected = select.options[select.selectedIndex];
        if (selected && selected.dataset.sell) {
            sellInput.value = selected.dataset.sell;
        }

        select.addEventListener('change', () => {
            const selected = select.options[select.selectedIndex];
            sellInput.value = selected.dataset.sell || '';
        });

        item.querySelector('.remove-item-btn').addEventListener('click', () => {
            const rows = itemsContainer.querySelectorAll('.item-row');
            if (rows.length > 1) {
                item.remove();
            } else {
                alert('ต้องมีอย่างน้อย 1 รายการ');
            }
        });
    }

    function clearForm() {
        dateInput.value = '';
        itemsContainer.innerHTML = '';
        itemsContainer.appendChild(createItemRow());
    }

    clearForm();

    addBtn.addEventListener('click', () => {
        itemsContainer.appendChild(createItemRow());
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const date = dateInput.value;
        if (!date) {
            alert('กรุณาเลือกวันที่');
            return;
        }

        const entries = [];
        const rows = itemsContainer.querySelectorAll('.item-row');

        rows.forEach(item => {
            const product_name = item.querySelector('.product-select').value;
            const quantity = parseInt(item.querySelector('.qty').value);
            const sell_price = parseInt(item.querySelector('.sell-price').value);

            if (product_name && quantity > 0 && !isNaN(sell_price)) {
                entries.push({ date, product_name, quantity, sell_price });
            }
        });

        if (entries.length === 0) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        try {
            await window.api.addIncome(entries);
            showToast("✅ บันทึกเรียบร้อย");
            clearForm();
        } catch (err) {
            console.error('❌ เกิดข้อผิดพลาดในการบันทึก:', err);
            alert('❌ เกิดข้อผิดพลาดในการบันทึก');
        }
    });

    function showToast(message) {
        toast.textContent = message;
        toast.style.display = 'block';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 2000);
    }

    async function loadIncomeHistory(month = null) {
        const rows = await window.api.getIncomeEntries(month);
        const table = document.getElementById("history-table");
        table.innerHTML = "";

        rows.forEach(row => {
            const total = row.quantity * row.sell_price;
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${row.date}</td>
                <td>${row.product_name}</td>
                <td>${row.quantity}</td>
                <td>${row.sell_price}</td>
                <td>${total}</td>
            `;
            table.appendChild(tr);
        });
    }

    document.getElementById("month-filter").addEventListener("change", (e) => {
        const value = e.target.value;
        loadIncomeHistory(value);
    });

    loadIncomeHistory();

});
