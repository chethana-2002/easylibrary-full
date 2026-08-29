const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, 'library.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error(err);
  else console.log('Connected to SQLite Database.');
});

// Initialize Schema
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL, 
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    student_id TEXT UNIQUE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS library_config (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    name TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT NOT NULL,
    cover TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS book_copies (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    floor TEXT,
    section TEXT,
    shelf TEXT,
    row TEXT,
    status TEXT DEFAULT 'available',
    FOREIGN KEY (book_id) REFERENCES books(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS borrow_records (
    id TEXT PRIMARY KEY,
    copy_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    borrow_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    return_date TEXT,
    fine_amount INTEGER DEFAULT 0,
    fine_paid BOOLEAN DEFAULT 0,
    status TEXT DEFAULT 'active',
    FOREIGN KEY (copy_id) REFERENCES book_copies(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS reservations (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    reserve_date TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    FOREIGN KEY (book_id) REFERENCES books(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    receiver_role TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    sent_date TEXT NOT NULL,
    read BOOLEAN DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS student_notes (
    student_id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);

  // Seed default Admin & Librarian
  db.get('SELECT count(*) as count FROM users', (err, row) => {
    if (row && row.count === 0) {
      console.log('Seeding initial data...');
      
      const users = [
        ['u1', 'librarian', 'librarian', 'EasyLib@2026!', null, 'Head Librarian', null, null]
      ];
      const stmtUser = db.prepare('INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      users.forEach(u => stmtUser.run(u));
      stmtUser.finalize();

      const configs = [
        ['c1', 'category', 'ENG'], ['c2', 'category', 'COM'], ['c3', 'category', 'ARTS'],
        ['f1', 'floor', '1'], ['s1', 'section', 'A'], ['sh1', 'shelf', '1']
      ];
      const stmtConf = db.prepare('INSERT INTO library_config VALUES (?, ?, ?)');
      configs.forEach(c => stmtConf.run(c));
      stmtConf.finalize();

      }
    });
  });

/* =========================================
   API ROUTES
========================================= */

// --- AUTH & USERS ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: 'Invalid credentials' });
    res.json(row);
  });
});

app.post('/api/signup', (req, res) => {
  const { username, password, student_id, name, phone, email } = req.body;
  const id = 'u' + Date.now();
  db.run('INSERT INTO users VALUES (?, "student", ?, ?, ?, ?, ?, ?)', 
    [id, username, password, student_id, name, phone, email], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- CATALOG / BOOKS ---
app.get('/api/books', (req, res) => {
  const query = `
    SELECT b.*, 
           COUNT(c.id) as total_copies,
           COALESCE(SUM(CASE WHEN c.status = 'available' THEN 1 ELSE 0 END), 0) as available_copies
    FROM books b
    LEFT JOIN book_copies c ON b.id = c.book_id
    GROUP BY b.id
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/books', (req, res) => {
  let { title, author, category, cover, copies_count, floor, section, shelf } = req.body;
  const id = 'b' + Date.now();
  
  if (!cover || cover.trim() === '') {
    if (category === 'ENG') cover = 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=300';
    else if (category === 'COM') cover = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=300';
    else if (category === 'ARTS') cover = 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?q=80&w=300';
    else cover = 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=300'; // Generic book
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    db.run('INSERT INTO books VALUES (?, ?, ?, ?, ?)', [id, title, author, category, cover]);
    
    if (copies_count && parseInt(copies_count) > 0) {
      for (let i = 1; i <= parseInt(copies_count); i++) {
        const copyId = 'cp' + id + '_' + i;
        db.run('INSERT INTO book_copies VALUES (?, ?, ?, ?, ?, ?, ?)', [copyId, id, floor, section, shelf, i.toString(), 'available']);
      }
    }
    
    db.run('COMMIT', (err) => {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, id });
    });
  });
});

app.delete('/api/books/:id', (req, res) => {
  db.run('DELETE FROM books WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    db.run('DELETE FROM book_copies WHERE book_id = ?', [req.params.id]);
    res.json({ success: true });
  });
});

// --- COPIES ---
app.get('/api/books/:id/copies', (req, res) => {
  db.all('SELECT * FROM book_copies WHERE book_id = ?', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/copies', (req, res) => {
  const { book_id, floor, section, shelf, row } = req.body;
  const id = 'cp' + Date.now();
  db.run('INSERT INTO book_copies VALUES (?, ?, ?, ?, ?, ?, ?)', [id, book_id, floor, section, shelf, row, 'available'], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id });
  });
});

app.delete('/api/copies/:id', (req, res) => {
  db.run('DELETE FROM book_copies WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- BORROW & RETURN ---
  app.post('/api/checkout', (req, res) => {
    const { book_id, student_id, email, custom_date } = req.body;
    const borrow_id = 'br' + Date.now();
    const borrowDate = custom_date ? new Date(custom_date) : new Date();
    const dueDate = new Date(borrowDate.getTime());
    dueDate.setDate(dueDate.getDate() + 14);

  db.get('SELECT id FROM users WHERE student_id = ? AND email = ?', [student_id, email], (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'Student ID and Email combination not found.' });
    
    // Find an available copy of this book
    db.get('SELECT id FROM book_copies WHERE book_id = ? AND status = "available" LIMIT 1', [book_id], (err, copy) => {
      if (err || !copy) return res.status(400).json({ error: 'No available copies for this book currently.' });

      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.run('UPDATE book_copies SET status = "borrowed" WHERE id = ?', [copy.id]);
        db.run('INSERT INTO borrow_records VALUES (?, ?, ?, ?, ?, null, 0, 0, "active")',
          [borrow_id, copy.id, user.id, borrowDate.toISOString(), dueDate.toISOString()], (err) => {
            if (err) { db.run('ROLLBACK'); return res.status(500).json({ error: err.message }); }
            db.run('COMMIT');
            res.json({ success: true, due_date: dueDate.toISOString(), copy_id: copy.id });
          });
      });
    });
  });
});

const calculateWeeklyFine = (dueDateStr) => {
  const now = new Date();
  const dueDate = new Date(dueDateStr);
  if (now > dueDate) {
    const diffTime = Math.abs(now - dueDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const weeksLate = Math.ceil(diffDays / 7);
    return weeksLate * 250;
  }
  return 0;
};

app.post('/api/return', (req, res) => {
  const { record_id, custom_date } = req.body;
  db.get('SELECT id, copy_id, due_date FROM borrow_records WHERE id = ? AND status = "active"', [record_id], (err, record) => {
    if (err || !record) return res.status(404).json({ error: 'Active borrow record not found.' });
    
    const returnDate = custom_date ? new Date(custom_date) : new Date();
    let fine = 0;
    const diffTime = returnDate.getTime() - new Date(record.due_date).getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 0) fine = Math.ceil(diffDays / 7) * 250;

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      db.run('UPDATE borrow_records SET status = "returned", return_date = ?, fine_amount = ? WHERE id = ?', 
        [returnDate.toISOString(), fine, record.id]);
      db.run('UPDATE book_copies SET status = "available" WHERE id = ?', [record.copy_id], (err) => {
        if (err) { db.run('ROLLBACK'); return res.status(500).json({ error: err.message }); }
        db.run('COMMIT');
        res.json({ success: true, fine_amount: fine });
      });
    });
  });
});

app.post('/api/pay-fine', (req, res) => {
  const { record_id } = req.body;
  db.run('UPDATE borrow_records SET fine_paid = 1 WHERE id = ?', [record_id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- ALERTS & HISTORY ---
app.get('/api/history', (req, res) => {
  const query = `
    SELECT br.*, bc.book_id, b.title, b.cover, u.name, u.student_id, u.email 
    FROM borrow_records br
    JOIN book_copies bc ON br.copy_id = bc.id
    JOIN books b ON bc.book_id = b.id
    JOIN users u ON br.user_id = u.id
    ORDER BY br.borrow_date DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    rows.forEach(r => {
      if (r.status === 'active') {
        r.current_fine = calculateWeeklyFine(r.due_date);
        r.is_overdue = r.current_fine > 0;
      } else {
        r.current_fine = r.fine_amount;
        r.is_overdue = false;
      }
    });
    res.json(rows);
  });
});

// --- STUDENTS ---
app.get('/api/students', (req, res) => {
  db.all('SELECT id, student_id, name, phone, email, username FROM users WHERE role = "student"', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.delete('/api/students/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM users WHERE id = ? AND role = "student"', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- CONFIG ---
app.get('/api/config', (req, res) => {
  db.all('SELECT * FROM library_config', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const config = { category: [], floor: [], section: [], shelf: [] };
    rows.forEach(r => { if(config[r.type]) config[r.type].push(r); });
    res.json(config);
  });
});

app.post('/api/config', (req, res) => {
  const { type, name } = req.body;
  const id = 'c' + Date.now();
  db.run('INSERT INTO library_config VALUES (?, ?, ?)', [id, type, name], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id, type, name });
  });
});
app.delete('/api/config/:id', (req, res) => {
  db.run('DELETE FROM library_config WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- MESSAGES ---
app.get('/api/messages/:user_id', (req, res) => {
  const { user_id } = req.params;
  db.get('SELECT role FROM users WHERE id = ?', [user_id], (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'User not found' });
    
    if (user.role === 'librarian') {
      const query = `
        SELECT m.*, 
               CASE WHEN m.sender_id = ? THEN 'Me (Librarian)' ELSE u.name END as sender_name,
               CASE WHEN m.sender_id = ? THEN (SELECT name FROM users WHERE id = m.receiver_role) ELSE 'Me' END as display_receiver
        FROM messages m 
        LEFT JOIN users u ON m.sender_id = u.id 
        WHERE m.receiver_role = "librarian" OR m.sender_id = ?
        ORDER BY m.sent_date DESC
      `;
      db.all(query, [user_id, user_id, user_id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      });
    } else {
      const query = `
        SELECT m.*, 
               CASE WHEN m.sender_id = ? THEN 'Me' ELSE u.name END as sender_name
        FROM messages m 
        JOIN users u ON m.sender_id = u.id 
        WHERE m.receiver_role = ? OR m.sender_id = ? 
        ORDER BY m.sent_date DESC
      `;
      db.all(query, [user_id, user_id, user_id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      });
    }
  });
});

app.post('/api/messages', (req, res) => {
  const { sender_id, receiver_role, subject, content } = req.body;
  const id = 'm' + Date.now();
  db.run('INSERT INTO messages VALUES (?, ?, ?, ?, ?, ?, 0)', 
    [id, sender_id, receiver_role, subject, content, new Date().toISOString()], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- STUDENT NOTES ---
app.get('/api/notes/:student_id', (req, res) => {
  db.get('SELECT content FROM student_notes WHERE student_id = ?', [req.params.student_id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ content: row ? row.content : '' });
  });
});

app.post('/api/notes', (req, res) => {
  const { student_id, content } = req.body;
  db.run('INSERT OR REPLACE INTO student_notes (student_id, content, updated_at) VALUES (?, ?, ?)', 
    [student_id, content, new Date().toISOString()], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- RESERVATIONS ---
app.get('/api/reservations', (req, res) => {
  const query = `
    SELECT r.*, b.title as book_title, u.name as student_name, u.student_id
    FROM reservations r
    JOIN books b ON r.book_id = b.id
    JOIN users u ON r.user_id = u.id
    ORDER BY r.reserve_date DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/reservations', (req, res) => {
  const { book_id, user_id } = req.body;
  const id = 'res' + Date.now();
  db.run('INSERT INTO reservations VALUES (?, ?, ?, ?, "pending")', 
    [id, book_id, user_id, new Date().toISOString()], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.put('/api/reservations/:id', (req, res) => {
  const { status } = req.body;
  db.run('UPDATE reservations SET status = ? WHERE id = ?', [status, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- STATS ---
app.get('/api/stats', (req, res) => {
  db.serialize(() => {
    const stats = {};
    db.get('SELECT COUNT(*) as c FROM books', (e, r) => stats.totalBooks = r.c);
    db.get('SELECT COUNT(*) as c FROM book_copies', (e, r) => stats.totalCopies = r.c);
    db.get('SELECT COUNT(*) as c FROM book_copies WHERE status="available"', (e, r) => stats.availableCopies = r.c);
    db.get('SELECT COUNT(*) as c FROM users WHERE role="student"', (e, r) => stats.registeredStudents = r.c);
    db.all('SELECT due_date FROM borrow_records WHERE status="active"', (e, rows) => {
      stats.borrowedBooks = rows.length;
      stats.overdueBooks = rows.filter(r => new Date(r.due_date) < new Date()).length;
      res.json(stats);
    });
  });
});

app.listen(port, () => console.log('Backend running on port 5000'));
