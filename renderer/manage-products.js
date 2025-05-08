
window.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('product-form');
    const nameInput = document.getElementById('name');
    const sellInput = document.getElementById('sell');
    const costInput = document.getElementById('cost');
    const list = document.getElementById('product-list');

    async function loadProducts() {
        const products = await window.api.getProducts();
        list.innerHTML = '';
        products.forEach(p => {
            const li = document.createElement('li');
            li.textContent = `${p.name} | ขาย: ${p.sell_price} | ทุน: ${p.cost_price}`;

            const btn = document.createElement('button');
            btn.textContent = 'ลบ';
            btn.onclick = async () => {
                await window.api.deleteProduct(p.id);
                loadProducts();
            };

            li.appendChild(btn);
            list.appendChild(li);
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = nameInput.value;
        const sell = parseInt(sellInput.value);
        const cost = parseInt(costInput.value);

        if (!name || isNaN(sell) || isNaN(cost)) return;

        await window.api.addProduct(name, sell, cost);
        form.reset();
        loadProducts();
    });

    loadProducts();
});
