window.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('cost-form');
    const monthInput = document.getElementById('month');
    const costInput = document.getElementById('cost');
    const toast = document.getElementById('toast');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const month = monthInput.value;
        const cost = parseFloat(costInput.value);
        if (!month || isNaN(cost)) {
            showToast('❌ กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        try {
            await window.api.saveMonthlyCost(month, cost);
            showToast("✅ บันทึกเรียบร้อย");
            form.reset();
            loadCosts();
        } catch (err) {
            alert('❌ บันทึกล้มเหลว');
            console.error(err);
        }
    });

    function showToast(message) {
        toast.textContent = message;
        toast.style.display = 'block';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 2000);
    }
    async function loadCosts(filterText = '') {
        const rows = await window.api.getSummaryByMonth();
        const body = document.getElementById('cost-table-body');
        body.innerHTML = '';

        rows.forEach(row => {
            if (!filterText || row.month.includes(filterText)) {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                        <td>${row.month}</td>
                        <td>${row.cost_total}</td>
                        <td>${row.created_at}</td>
                        <td><button class="delete-btn" data-id="${row.id}">ลบ</button></td>
                    `;
                body.appendChild(tr);
                const deleteBtn = tr.querySelector('.delete-btn');
                deleteBtn.addEventListener('click', async () => {
                    const id = deleteBtn.getAttribute('data-id');
                    try {
                        await window.api.deleteMonthlyCost(Number(id));
                        showToast('🗑️ ลบเรียบร้อย');
                        loadCosts();
                    } catch (err) {
                        alert('ลบไม่สำเร็จ');
                        console.error(err);
                    }

                });
            }
        });
    }

    document.getElementById('filterText').addEventListener('input', (e) => {
        loadCosts(e.target.value.trim());
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            if (confirm('คุณแน่ใจว่าต้องการลบข้อมูลนี้?')) {
                try {
                    await window.api.deleteMonthlyCost(Number(id));
                    showToast('🗑️ ลบเรียบร้อย');
                    loadCosts();
                } catch (err) {
                    alert('ลบไม่สำเร็จ');
                    console.error(err);
                }
            }
        });
    });

    loadCosts();

});
