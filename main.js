const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./db/db');

function createWindow() {
    const win = new BrowserWindow({
        width: 1600,
        height: 900,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    win.setMenu(null);
    win.loadFile('pages/index.html');
    win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

ipcMain.handle('get-products', async () => {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM products", (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
});

ipcMain.handle('add-product', async (e, name, sellPrice) => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run("INSERT INTO products (name, sell_price) VALUES (?, ?)",
                [name, sellPrice],
                function (err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID });
                });
        });
    });
});

ipcMain.handle('delete-product', async (e, id) => {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM products WHERE id = ?", [id], (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
});

ipcMain.handle('add-income', async (event, entries) => {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(`INSERT INTO income_entries (date, product_name, quantity, sell_price) VALUES (?, ?, ?, ?)`);

        db.serialize(() => {
            for (const e of entries) {
                stmt.run(e.date, e.product_name, e.quantity, e.sell_price);
            }
            stmt.finalize((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });
});

ipcMain.handle('save-monthly-cost', async (event, { month, cost_total }) => {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO monthly_costs (month, cost_total)
                VALUES (?, ?)
                ON CONFLICT(month) DO UPDATE SET cost_total = excluded.cost_total`,
            [month, cost_total],
            (err) => {
                if (err) reject(err);
                else resolve();
            });
    });
});

ipcMain.handle('get-summary', async () => {
    return new Promise((resolve, reject) => {
        db.all(`SELECT month, cost_total FROM monthly_costs ORDER BY month DESC`, (err, costRows) => {
            if (err) return reject(err);
            const costMap = Object.fromEntries(costRows.map(r => [r.month, r.cost_total]));
            db.all(`
                SELECT strftime('%Y-%m', date) as month, 
                       SUM(quantity * sell_price) as total_revenue
                FROM income_entries
                GROUP BY strftime('%Y-%m', date)
            `, (err, incomeRows) => {
                if (err) return reject(err);
                const incomeMap = Object.fromEntries(incomeRows.map(r => [r.month, r.total_revenue]));
                const allMonths = [...new Set([...Object.keys(costMap), ...Object.keys(incomeMap)])];
                const result = allMonths.sort((a, b) => b.localeCompare(a)).map(month => ({
                    month,
                    total_cost: costMap[month] || 0,
                    total_revenue: incomeMap[month] || 0,
                    profit: (incomeMap[month] || 0) - (costMap[month] || 0)
                }));

                resolve(result);
            });
        });
    });
});
ipcMain.handle('get-dashboard-data', async (event, { month }) => {
    const [year, mon] = month.split('-');
    const startOfMonth = `${month}-01`;
    const endOfMonth = new Date(year, parseInt(mon), 0 + 1).toISOString().split('T')[0];
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT strftime('%Y-%m', date) AS label,
                   SUM(quantity * sell_price) AS income
            FROM income_entries
            GROUP BY label
            ORDER BY label
        `, (err, monthlyRowsRaw) => {
            if (err) return reject(err);
            db.get(`
                SELECT cost_total FROM monthly_costs WHERE month = ?
            `, [month], (err, costRow) => {
                if (err) return reject(err);
                const costTotal = costRow ? Number(costRow.cost_total) : 0;
                const monthlyRows = monthlyRowsRaw.map(row => ({
                    label: row.label,
                    income: Number(row.income),
                    cost: costTotal,
                    profit: Number(row.income) - costTotal
                }));
                db.all(`
                    SELECT strftime('%d', date) AS label,
                           SUM(quantity * sell_price) AS income
                    FROM income_entries
                    WHERE date BETWEEN ? AND ?
                    GROUP BY label
                    ORDER BY label
                `, [startOfMonth, endOfMonth], (err, dailyRows) => {
                    if (err) return reject(err);
                    const completeDaily = Array.from({ length: 31 }, (_, i) => {
                        const day = i + 1;
                        const found = dailyRows.find(r => Number(r.label) === day);
                        const income = found ? Number(found.income) : 0;
                        return {
                            label: String(day).padStart(2, '0'),
                            income,
                            profit: income
                        };
                    });
                    resolve({
                        monthlySummary: monthlyRows,
                        dailySummary: completeDaily
                    });
                });
            });
        });
    });
});

ipcMain.handle('get-top-products', async (event, { month }) => {
    const start = `${month}-01`;
    const end = new Date(...month.split('-'), 0 + 1).toISOString().split('T')[0]; // ครอบคลุมสิ้นเดือน

    return new Promise((resolve, reject) => {
        db.all(`
      SELECT product_name AS label, SUM(quantity) AS quantity
      FROM income_entries
      WHERE date BETWEEN ? AND ?
      GROUP BY product_name
      ORDER BY quantity DESC
    `, [start, end], (err, rows) => {
            if (err) reject(err);
            else {
                console.log("📦 top-products rows:", rows); // เช็กตรงนี้
                resolve(rows);
            }
        });
    });
});


