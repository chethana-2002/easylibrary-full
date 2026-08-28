const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('library.db');

db.all('SELECT * FROM borrow_records WHERE status = "active" LIMIT 1', (err, rows) => {
    if (err) throw err;
    if (rows.length === 0) {
        console.log("No active records");
        return;
    }
    const recordId = rows[0].id;
    console.log("Found record:", recordId);

    fetch("http://localhost:5000/api/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ record_id: recordId })
    })
    .then(res => res.json())
    .then(data => console.log("Return API response:", data))
    .catch(err => console.error("Error calling Return API:", err));
});
