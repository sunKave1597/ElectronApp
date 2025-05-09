let currentChartType = 'income'; // 'income', 'cost', 'profit'

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

  // ตั้งเดือนปัจจุบันให้กับทั้งสอง picker
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const monthPicker = document.getElementById('monthPicker');
  monthPicker.value = currentMonth;
  loadCharts(currentMonth);

  const topProductPicker = document.getElementById('topProductMonthPicker');
  topProductPicker.value = currentMonth;
  loadTopProductChart(currentMonth);
});

function toggleChartType() {
  if (currentChartType === 'income') currentChartType = 'cost';
  else if (currentChartType === 'cost') currentChartType = 'profit';
  else currentChartType = 'income';

  const month = document.getElementById('monthPicker').value;
  loadCharts(month);
}

document.getElementById('monthPicker').addEventListener('change', (e) => {
  loadCharts(e.target.value);
});

async function loadCharts(month) {
  const { monthlySummary, dailySummary } = await window.api.getDashboardData(month);
  drawChart('monthlyChart', monthlySummary, 'รายเดือน');
  drawChart('dailyChart', dailySummary, 'รายวัน');
}

function drawChart(canvasId, data, label) {
  const ctx = document.getElementById(canvasId).getContext('2d');

  if (window[canvasId] && typeof window[canvasId].destroy === 'function') {
    window[canvasId].destroy();
  }

  const labels = data.map(row => row.label);
  const values = data.map(row => row[currentChartType]);

  window[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: `${label} (${currentChartType})`,
        data: values,
        backgroundColor: 'rgba(46, 204, 113, 0.5)',
        borderColor: 'rgba(46, 204, 113, 1)',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { font: { size: 14 } }
        },
        x: {
          ticks: { font: { size: 14 } }
        }
      }
    }
  });
}
document.getElementById('topProductMonthPicker').addEventListener('change', (e) => {
  loadTopProductChart(e.target.value);
});

async function loadTopProductChart(month) {
  const data = await window.api.getTopProducts(month);
  drawTopProductPie('topProductChart', data);
}

function drawTopProductPie(canvasId, data) {
  const ctx = document.getElementById(canvasId).getContext('2d');

  if (window[canvasId] && typeof window[canvasId].destroy === 'function') {
    window[canvasId].destroy();
  }

  const labels = data.map(row => row.label);
  const values = data.map(row => row.quantity);

  window[canvasId] = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        label: 'สินค้าขายดี',
        data: values,
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56',
          '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.raw || 0;
              return `${label}: ${value} ชิ้น`;
            }
          }
        }
      }
    }
  });
}
