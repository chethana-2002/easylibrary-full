const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('library.db');

db.get('SELECT id, copy_id, due_date FROM borrow_records WHERE id = ? AND status = "active"', ["br1"], (err, record) => {
    console.log(err, record);
});
