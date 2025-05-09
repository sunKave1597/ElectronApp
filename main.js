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

ipcMain.handle('add-product', async (e, name, sellPrice, costPrice) => {
    return new Promise((resolve, reject) => {
        db.run("INSERT INTO products (name, sell_price, cost_price) VALUES (?, ?, ?)",
            [name, sellPrice, costPrice],
            function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
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
        const stmt = db.prepare(`INSERT INTO income_entries (date, product_id, quantity, sell_price, cost_price) VALUES (?, ?, ?, ?, ?)`);

        db.serialize(() => {
            for (const e of entries) {
                stmt.run(e.date, e.product_id, e.quantity, e.sell_price, e.cost_price);
            }
            stmt.finalize((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });
});


ipcMain.handle('get-summary', async () => {
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT 
                strftime('%Y-%m', date) as month,
                SUM(quantity * sell_price) as total_revenue,
                SUM(quantity * cost_price) as total_cost,
                SUM((sell_price - cost_price) * quantity) as profit
            FROM income_entries
            GROUP BY strftime('%Y-%m', date)
            ORDER BY month DESC
        `, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
});

ipcMain.handle('get-dashboard-data', async (event, { month }) => {
    const startOfMonth = `${month}-01`;
    const endOfMonth = `${month}-31`;

    return new Promise((resolve, reject) => {
        db.all(`
            SELECT strftime('%Y-%m', date) AS label,
                SUM(quantity * sell_price) AS income,
                SUM(quantity * cost_price) AS cost,
                SUM((sell_price - cost_price) * quantity) AS profit
            FROM income_entries
            GROUP BY label
            ORDER BY label
        `, (err, monthlyRows) => {
            if (err) return reject(err);

            db.all(`
                SELECT strftime('%d', date) AS label,
                    SUM(quantity * sell_price) AS income,
                    SUM(quantity * cost_price) AS cost,
                    SUM((sell_price - cost_price) * quantity) AS profit
                FROM income_entries
                WHERE date BETWEEN ? AND ?
                GROUP BY label
                ORDER BY label
            `, [startOfMonth, endOfMonth], (err, dailyRows) => {
                if (err) return reject(err);

                resolve({
                    monthlySummary: monthlyRows,
                    dailySummary: dailyRows
                });
            });
        });
    });
});
ipcMain.handle('get-top-products', async (event, { month }) => {
    const start = `${month}-01`;
    const end = `${month}-31`;

    return new Promise((resolve, reject) => {
        db.all(`
            SELECT p.name AS label, SUM(e.quantity) AS quantity
            FROM income_entries e
            JOIN products p ON e.product_id = p.id
            WHERE date BETWEEN ? AND ?
            GROUP BY e.product_id
            ORDER BY quantity DESC
        `, [start, end], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
});




