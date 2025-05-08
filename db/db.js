const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "app.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // ตารางรายรับ
  db.run(`
    CREATE TABLE IF NOT EXISTS income_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      cost_price INTEGER NOT NULL,
      sell_price INTEGER NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // ตารางสินค้า
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sell_price INTEGER NOT NULL,
      cost_price INTEGER NOT NULL
    )
  `, () => {
    console.log("✅ Table created (if not exists)");
  });

  // เพิ่ม mock data ถ้ายังไม่มี
  db.get("SELECT COUNT(*) AS count FROM products", (err, row) => {
    if (err) return console.error(err);

    console.log("🧮 row products:", row.count);

    if (row.count === 0) {
      db.run("INSERT INTO products (name, sell_price, cost_price) VALUES (?, ?, ?)", ["โค้ก", 25, 15]);
      db.run("INSERT INTO products (name, sell_price, cost_price) VALUES (?, ?, ?)", ["น้ำเปล่า", 10, 5], () => {
        console.log("🥤 Mock data added");
      });
    }
  });
});

module.exports = db;
