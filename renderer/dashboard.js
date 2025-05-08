window.addEventListener('DOMContentLoaded', async () => {
  const table = document.getElementById('summary-table');
  const rows = await window.api.getSummary();

  rows.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.month}</td>
      <td>${row.total_revenue} ฿</td>
      <td>${row.total_cost} ฿</td>
      <td>${row.profit} ฿</td>
    `;
    table.appendChild(tr);
  });
});
