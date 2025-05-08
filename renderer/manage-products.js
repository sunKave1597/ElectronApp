window.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('product-form');
    const nameInput = document.getElementById('name');
    const sellInput = document.getElementById('sell');
    const costInput = document.getElementById('cost');
    const list = document.getElementById('product-list');
    const searchInput = document.getElementById('search');

    let allProducts = [];

    async function loadProducts() {
        allProducts = await window.api.getProducts(); // เก็บไว้ทั้งหมด
        renderProducts(allProducts);
    }

    function renderProducts(products) {
        list.innerHTML = '';
        products.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
        <td>${p.name}</td>
        <td>${p.sell_price} ฿</td>
        <td>${p.cost_price} ฿</td>
        <td><button class="remove-item-btn">🗑 ลบ</button></td>
      `;
            tr.querySelector('.remove-item-btn').addEventListener('click', async () => {
                await window.api.deleteProduct(p.id);
                loadProducts();
            });
            list.appendChild(tr);
        });
    }

    searchInput.addEventListener('input', () => {
        const keyword = searchInput.value.toLowerCase();
        const filtered = allProducts.filter(p => p.name.toLowerCase().includes(keyword));
        renderProducts(filtered);
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = nameInput.value.trim();
        const sell = parseFloat(sellInput.value);
        const cost = parseFloat(costInput.value);

        if (!name || isNaN(sell) || isNaN(cost) || sell < 0 || cost < 0) {
            alert('กรุณากรอกข้อมูลให้ถูกต้อง (ราคาต้องไม่ติดลบ)');
            return;
        }

        await window.api.addProduct(name, sell, cost);
        form.reset();
        loadProducts();
    });

    loadProducts();
});
