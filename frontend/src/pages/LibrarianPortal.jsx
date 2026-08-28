import { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, AlertTriangle, BookDown, BookUp, Settings, Database, Mail, DollarSign, Trash2, MapPin, BookMarked, ClipboardList, Send, User, Activity, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LibrarianPortal({ user }) {
  const [activeTab, setActiveTab] = useState('checkout');
  const [notification, setNotification] = useState('');
  
  const [coStudentId, setCoStudentId] = useState('');
  const [coEmail, setCoEmail] = useState('');
  const [coBookId, setCoBookId] = useState('');
  const [coDate, setCoDate] = useState('');
  const [history, setHistory] = useState([]);
  const [returnDates, setReturnDates] = useState({});
  const [messages, setMessages] = useState([]);
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [config, setConfig] = useState({ category: [], floor: [], section: [], shelf: [] });
  const [books, setBooks] = useState([]);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [reservations, setReservations] = useState([]);

  const [newCopy, setNewCopy] = useState({ book_id: '', floor: '', section: '', shelf: '', row: '' });
  const [newConfig, setNewConfig] = useState({ type: 'category', name: '' });
  const [newBook, setNewBook] = useState({ title: '', author: '', category: 'ENG', cover: '', copies_count: 1, floor: '', section: '', shelf: '' });

  const navigate = useNavigate();

  useEffect(() => { fetchHistory(); fetchMessages(); fetchConfig(); fetchBooks(); fetchStudents(); fetchStats(); fetchReservations(); }, []);

  const fetchHistory = () => fetch('http://localhost:5000/api/history').then(res => res.json()).then(setHistory);
  const fetchMessages = () => fetch(`http://localhost:5000/api/messages/${user.id}`).then(res => res.json()).then(setMessages);
  const fetchConfig = () => fetch('http://localhost:5000/api/config').then(res => res.json()).then(setConfig);
  const fetchBooks = () => fetch('http://localhost:5000/api/books').then(res => res.json()).then(setBooks);
  const fetchStudents = () => fetch('http://localhost:5000/api/students').then(res => res.json()).then(setStudents);
  const fetchStats = () => fetch('http://localhost:5000/api/stats').then(res => res.json()).then(setStats);
  const fetchReservations = () => fetch('http://localhost:5000/api/reservations').then(res => res.json()).then(setReservations);

  const showNotification = (msg) => { setNotification(msg); setTimeout(() => setNotification(''), 4000); };

  const handleCheckout = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_id: coBookId, student_id: coStudentId, email: coEmail, custom_date: coDate })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(`Success! Physical Copy ID: ${data.copy_id} checked out. Due date: ${new Date(data.due_date).toLocaleDateString()}`);
        setCoBookId(''); setCoStudentId(''); setCoEmail(''); setCoDate(''); fetchHistory(); fetchBooks();
      } else alert(data.error);
    } catch (err) { alert("Error"); }
  };

  const handleReturnRecord = async (recordId) => {
    try {
      const custom_date = returnDates[recordId];
      const res = await fetch('http://localhost:5000/api/return', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record_id: recordId, custom_date })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.fine_amount > 0) {
          alert(`Returned! Fine calculated: Rs. ${data.fine_amount}. Mark as got in Funds tab when paid.`);
        } else {
          showNotification(`Book returned successfully on time.`);
        }
        fetchHistory(); fetchBooks();
      } else alert(data.error);
    } catch (err) { alert("Error"); }
  };

  const handlePayFine = async (id) => {
    const res = await fetch('http://localhost:5000/api/pay-fine', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ record_id: id })
    });
    if (res.ok) {
      showNotification('Fund marked as got!');
      setFineInfo(null);
      fetchHistory();
    }
  };

  const handleDeleteBook = async (id) => {
    if(confirm('Are you sure you want to delete this master book and all copies?')) {
      await fetch(`http://localhost:5000/api/books/${id}`, { method: 'DELETE' });
      showNotification('Book deleted completely.');
      fetchBooks();
    }
  };

  const handleRemoveStudent = async (id) => {
    if(confirm('Are you sure you want to permanently remove this student?')) {
      await fetch(`http://localhost:5000/api/students/${id}`, { method: 'DELETE' });
      showNotification('Student removed successfully.');
      fetchStudents();
    }
  };

  const handleSendOverdue = async (userId, title, fine) => {
    await fetch('http://localhost:5000/api/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        sender_id: user.id, 
        receiver_role: userId, 
        subject: `OVERDUE NOTICE: ${title}`, 
        content: `Your book "${title}" is overdue by 14 days. You have a fine of Rs. ${fine}. Please return immediately.` 
      })
    });
    showNotification('Email sent to student!');
    fetchMessages();
  };

  const handleAddConfig = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:5000/api/config', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newConfig)
    });
    showNotification('Layout Config added!');
    setNewConfig({ ...newConfig, name: '' });
    fetchConfig();
  };

  const handleDeleteConfig = async (id) => {
    await fetch(`http://localhost:5000/api/config/${id}`, { method: 'DELETE' });
    fetchConfig();
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:5000/api/books', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newBook)
    });
    showNotification('Master Book & Copies added successfully!');
    setNewBook({ title: '', author: '', category: 'ENG', cover: '', copies_count: 1, floor: '', section: '', shelf: '' });
    fetchBooks();
  };

  const overdues = history.filter(h => h.is_overdue && h.status === 'active');
  
  // Calculate collected funds
  const paidFines = history.filter(h => h.fine_paid === 1);
  const totalFunds = paidFines.reduce((acc, curr) => acc + curr.fine_amount, 0);
  const pendingFunds = history.filter(h => h.current_fine > 0 && !h.fine_paid).reduce((acc, curr) => acc + curr.current_fine, 0);

  // Group messages for chat
  const chats = {};
  messages.forEach(m => {
    const isMe = m.sender_id === user.id;
    const partnerId = isMe ? m.receiver_role : m.sender_id;
    const partnerName = isMe ? m.display_receiver : m.sender_name;
    if (!chats[partnerId]) chats[partnerId] = { id: partnerId, name: partnerName, messages: [] };
    chats[partnerId].messages.push(m);
  });
  Object.values(chats).forEach(c => c.messages.sort((a,b) => new Date(a.sent_date) - new Date(b.sent_date)));

  const handleSendReply = async (e) => {
    e.preventDefault();
    if(!replyContent.trim()) return;
    await fetch('http://localhost:5000/api/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender_id: user.id, receiver_role: selectedChatUser, subject: 'Reply from Librarian', content: replyContent })
    });
    setReplyContent('');
    fetchMessages();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 text-lg">
      
      {notification && (
        <div className="fixed top-24 right-8 bg-green-900/80 border border-green-500 text-green-200 px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 backdrop-blur-md">
          <CheckCircle size={24} /> {notification}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4 overflow-x-auto">
        <button onClick={() => setActiveTab('dashboard')} className={`whitespace-nowrap px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'bg-black/30 text-slate-400 hover:text-white'}`}><Activity size={20}/> Dashboard</button>
        <button onClick={() => setActiveTab('checkout')} className={`whitespace-nowrap px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'checkout' ? 'bg-primary text-white shadow-[0_0_15px_rgba(217,119,6,0.3)]' : 'bg-black/30 text-slate-400 hover:text-white'}`}><BookUp size={20}/> Checkouts</button>
        <button onClick={() => setActiveTab('records')} className={`whitespace-nowrap px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'records' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'bg-black/30 text-slate-400 hover:text-white'}`}><ClipboardList size={20}/> All Records</button>
        <button onClick={() => setActiveTab('reservations')} className={`whitespace-nowrap px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'reservations' ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]' : 'bg-black/30 text-slate-400 hover:text-white'}`}><Calendar size={20}/> Reservations</button>
        <button onClick={() => setActiveTab('catalog')} className={`whitespace-nowrap px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'catalog' ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(5,150,105,0.3)]' : 'bg-black/30 text-slate-400 hover:text-white'}`}><Search size={20}/> View Catalog</button>
        <button onClick={() => setActiveTab('inventory')} className={`whitespace-nowrap px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'inventory' ? 'bg-secondary text-white shadow-[0_0_15px_rgba(153,27,27,0.3)]' : 'bg-black/30 text-slate-400 hover:text-white'}`}><Database size={20}/> Add Books & Copies</button>
        <button onClick={() => setActiveTab('students')} className={`whitespace-nowrap px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'students' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]' : 'bg-black/30 text-slate-400 hover:text-white'}`}><User size={20}/> Student Details</button>
        <button onClick={() => setActiveTab('config')} className={`whitespace-nowrap px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'config' ? 'bg-accent text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-black/30 text-slate-400 hover:text-white'}`}><Settings size={20}/> Layout Settings</button>
        <button onClick={() => setActiveTab('funds')} className={`whitespace-nowrap px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'funds' ? 'bg-yellow-600 text-white shadow-[0_0_15px_rgba(202,138,4,0.3)]' : 'bg-black/30 text-slate-400 hover:text-white'}`}><DollarSign size={20}/> Collected Funds</button>
        <button onClick={() => setActiveTab('inbox')} className={`whitespace-nowrap px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'inbox' ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'bg-black/30 text-slate-400 hover:text-white'}`}><Mail size={20}/> Inbox & Emails</button>
      </div>

      <div className="glass-panel p-8">
        
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3"><Activity className="text-indigo-400" size={32}/> System Dashboard</h2>
            {stats ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-indigo-900/30 border border-indigo-500/30 p-6 rounded-2xl flex flex-col items-center justify-center shadow-lg">
                  <p className="text-indigo-200 font-bold tracking-wider uppercase text-sm mb-2">Total Master Books</p>
                  <p className="text-5xl font-black text-white">{stats.totalBooks}</p>
                </div>
                <div className="bg-blue-900/30 border border-blue-500/30 p-6 rounded-2xl flex flex-col items-center justify-center shadow-lg">
                  <p className="text-blue-200 font-bold tracking-wider uppercase text-sm mb-2">Total Physical Copies</p>
                  <p className="text-5xl font-black text-white">{stats.totalCopies}</p>
                </div>
                <div className="bg-emerald-900/30 border border-emerald-500/30 p-6 rounded-2xl flex flex-col items-center justify-center shadow-lg">
                  <p className="text-emerald-200 font-bold tracking-wider uppercase text-sm mb-2">Available Copies</p>
                  <p className="text-5xl font-black text-white">{stats.availableCopies}</p>
                </div>
                <div className="bg-primary/20 border border-primary/30 p-6 rounded-2xl flex flex-col items-center justify-center shadow-lg">
                  <p className="text-primary font-bold tracking-wider uppercase text-sm mb-2">Currently Borrowed</p>
                  <p className="text-5xl font-black text-white">{stats.borrowedBooks}</p>
                </div>
                <div className="bg-purple-900/30 border border-purple-500/30 p-6 rounded-2xl flex flex-col items-center justify-center shadow-lg">
                  <p className="text-purple-200 font-bold tracking-wider uppercase text-sm mb-2">Registered Students</p>
                  <p className="text-5xl font-black text-white">{stats.registeredStudents}</p>
                </div>
                <div className="bg-red-900/30 border border-red-500/30 p-6 rounded-2xl flex flex-col items-center justify-center shadow-lg">
                  <p className="text-red-200 font-bold tracking-wider uppercase text-sm mb-2">Overdue Returns</p>
                  <p className="text-5xl font-black text-red-500">{stats.overdueBooks}</p>
                </div>
              </div>
            ) : (
              <p className="text-slate-500">Loading statistics...</p>
            )}
          </div>
        )}

        {/* CHECKOUTS TAB */}
        {activeTab === 'checkout' && (
          <div className="max-w-3xl mx-auto animate-in zoom-in-95 duration-300">
            <div className="bg-black/30 border border-white/10 p-8 rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-3"><BookUp className="text-primary" size={28}/> Record Checkout</h2>
              <p className="text-slate-400 mb-8 text-base">Issue a book using the Master Book ID, Student details, and custom Borrow Date.</p>
              <form onSubmit={handleCheckout} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Student ID</label>
                    <input required type="text" value={coStudentId} onChange={e => setCoStudentId(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white text-lg focus:border-primary outline-none" placeholder="e.g. S001" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Student Email</label>
                    <input required type="email" value={coEmail} onChange={e => setCoEmail(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white text-lg focus:border-primary outline-none" placeholder="e.g. john@univ.edu" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Master Book ID</label>
                    <input required type="text" value={coBookId} onChange={e => setCoBookId(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white text-lg focus:border-primary outline-none" placeholder="e.g. b12345" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Borrow Date (Optional)</label>
                    <input type="date" value={coDate} onChange={e => setCoDate(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white text-lg focus:border-primary outline-none" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-primary hover:bg-primary/80 text-white font-bold py-4 text-lg rounded-xl transition-all shadow-lg">Checkout Available Copy</button>
              </form>
            </div>
          </div>
        )}

        {/* RESERVATIONS TAB */}
        {activeTab === 'reservations' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3"><Calendar className="text-purple-400" size={32}/> Book Reservations</h2>
            {reservations.map(res => (
              <div key={res.id} className="bg-black/40 border border-white/5 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg transition-all">
                <div className="flex items-center gap-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{res.book_title}</h3>
                    <p className="text-slate-400 font-mono text-sm">Res ID: {res.id}</p>
                  </div>
                </div>
                <div className="flex-1 bg-white/5 p-4 rounded-xl border border-white/5">
                  <p className="text-sm text-slate-300"><span className="text-slate-500">Student:</span> {res.student_name} ({res.student_id})</p>
                  <p className="text-sm text-slate-300"><span className="text-slate-500">Date:</span> {new Date(res.reserve_date).toLocaleString()}</p>
                  <p className="text-sm text-slate-300 mt-2">
                    <span className="text-slate-500">Status: </span>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${res.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' : res.status === 'fulfilled' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                      {res.status.toUpperCase()}
                    </span>
                  </p>
                </div>
                {res.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={async () => {
                      await fetch(`http://localhost:5000/api/reservations/${res.id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ status: 'fulfilled' }) });
                      showNotification('Reservation fulfilled');
                      fetchReservations();
                    }} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-all">Fulfill</button>
                    <button onClick={async () => {
                      await fetch(`http://localhost:5000/api/reservations/${res.id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ status: 'cancelled' }) });
                      showNotification('Reservation cancelled');
                      fetchReservations();
                    }} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-all">Cancel</button>
                  </div>
                )}
              </div>
            ))}
            {reservations.length === 0 && <p className="text-slate-500 py-16 text-center text-lg bg-black/20 rounded-xl">No reservations found.</p>}
          </div>
        )}

        {/* RECORDS TAB */}
        {activeTab === 'records' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3"><ClipboardList className="text-indigo-400" size={32}/> All Borrow & Return Records</h2>
            {history.map(record => (
              <div key={record.id} className="bg-black/40 border border-white/5 hover:border-indigo-500/30 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg transition-all">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-32 bg-[#0f0906] rounded-lg overflow-hidden flex-shrink-0 shadow-md border border-white/10">
                    {record.cover ? (
                      <img src={record.cover} alt={record.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600"><BookMarked size={32} /></div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-2xl text-white mb-1">{record.title}</h4>
                    <p className="text-base text-slate-300 mb-2">Student: <b className="text-indigo-300">{record.name}</b> ({record.student_id})</p>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                      <p className="text-slate-400">Borrowed: <span className="text-slate-200">{new Date(record.borrow_date).toLocaleDateString()}</span></p>
                      <p className="text-slate-400">Due: <span className="text-primary font-bold">{new Date(record.due_date).toLocaleDateString()}</span></p>
                      {record.status === 'returned' && <p className="text-slate-400 col-span-2">Returned: <span className="text-green-400 font-bold">{new Date(record.return_date).toLocaleDateString()}</span></p>}
                    </div>
                  </div>
                </div>
                  <div className="text-right flex flex-col items-end gap-3 w-full md:w-auto">
                    <span className={`px-4 py-1.5 rounded-lg text-sm font-black tracking-widest uppercase shadow-sm ${record.status === 'returned' ? 'bg-green-900/30 text-green-400 border border-green-500/20' : record.is_overdue ? 'bg-red-900/30 text-red-400 border border-red-500/20' : 'bg-primary/20 text-primary border border-primary/20'}`}>
                      {record.status === 'active' ? (record.is_overdue ? 'OVERDUE' : 'ACTIVE') : 'RETURNED'}
                    </span>
                    {record.current_fine > 0 && (
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-400">Fine Amount</p>
                        <p className="text-2xl font-black text-red-400">Rs. {record.current_fine}</p>
                        <p className="text-xs text-slate-500 mt-1">{record.fine_paid ? 'PAID' : 'UNPAID'}</p>
                      </div>
                    )}
                    {record.status === 'active' && (
                      <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center mt-3 bg-white/5 p-3 rounded-xl border border-white/10 shadow-inner w-full sm:w-auto">
                        <div className="flex flex-col text-left w-full sm:w-auto">
                          <label className="text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-wider">Return Date</label>
                          <input type="date" value={returnDates[record.id] || ''} onChange={(e) => setReturnDates({...returnDates, [record.id]: e.target.value})} className="bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-secondary w-full" />
                        </div>
                        <button onClick={() => handleReturnRecord(record.id)} className="bg-secondary hover:bg-secondary/80 text-white font-bold px-4 py-2 rounded-lg text-sm shadow-lg w-full sm:w-auto h-full mt-auto">
                          Mark Returned
                        </button>
                      </div>
                    )}
                  </div>
              </div>
            ))}
            {history.length === 0 && <p className="text-slate-500 py-16 text-center text-lg bg-black/20 rounded-xl">No records found.</p>}
          </div>
        )}

        {/* CATALOG TAB */}
        {activeTab === 'catalog' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3"><Search className="text-emerald-500" size={28}/> Library Catalog Viewer</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {books.map((book) => {
                const isAvailable = book.available_copies > 0;
                return (
                  <div key={book.id} className="bg-black/40 border border-white/5 p-6 rounded-xl flex flex-col h-full hover:border-emerald-500/40 transition-all shadow-lg relative group">
                    <button onClick={() => handleDeleteBook(book.id)} className="absolute top-4 right-4 bg-red-600/80 hover:bg-red-500 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10" title="Delete Book completely">
                      <Trash2 size={20} />
                    </button>
                    <div className="h-56 w-full rounded-lg mb-5 overflow-hidden relative bg-[#0f0906]">
                      {book.cover ? (
                        <img src={book.cover} alt={book.title} className="w-full h-full object-cover opacity-90" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600"><BookMarked size={64} /></div>
                      )}
                      <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/70 backdrop-blur-md rounded text-sm font-bold text-slate-200">
                        {book.category}
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-1 leading-snug line-clamp-2">{book.title}</h3>
                    <p className="text-sm font-mono text-emerald-400 mb-2">ID: {book.id}</p>
                    <p className="text-base text-slate-400 mb-5">{book.author}</p>
                    
                    <div className={`mb-5 inline-flex items-center gap-2 px-3 py-1.5 rounded text-sm font-bold border ${isAvailable ? 'bg-green-900/30 text-green-400 border-green-500/30' : 'bg-red-900/30 text-red-400 border-red-500/30'}`}>
                      {isAvailable ? <CheckCircle size={18} /> : <XCircle size={18} />}
                      {isAvailable ? `${book.available_copies} of ${book.total_copies} Copies Available` : '0 Copies Available'}
                    </div>
                    
                    <div className="mt-auto pt-5 border-t border-white/5 flex gap-3">
                      <button 
                        onClick={() => navigate(`/map?bookId=${book.id}`)}
                        className="flex-1 flex justify-center items-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg text-base font-bold transition-all"
                      >
                        <MapPin size={20} className="text-emerald-500" /> Locate
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* INVENTORY TAB */}
        {activeTab === 'inventory' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-black/30 border border-white/10 p-8 rounded-xl shadow-lg col-span-1 lg:col-span-2">
              <h2 className="text-2xl font-bold text-white mb-6">Add Master Book & Generate Copies</h2>
              <p className="text-slate-400 mb-6 text-sm">Create the book profile and automatically generate the requested number of barcoded copies.</p>
              <form onSubmit={handleAddBook} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Book Title</label>
                    <input required type="text" value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3 text-white text-lg outline-none focus:border-secondary" placeholder="Book Title" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Author</label>
                    <input required type="text" value={newBook.author} onChange={e => setNewBook({...newBook, author: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3 text-white text-lg outline-none focus:border-secondary" placeholder="Author Name" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Category Section</label>
                    <select value={newBook.category} onChange={e => setNewBook({...newBook, category: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3 text-white text-lg outline-none focus:border-secondary">
                      {config?.category?.map(c => <option key={c.id} value={c.name} className="bg-black">{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Cover Image URL (Optional)</label>
                    <input type="text" value={newBook.cover} onChange={e => setNewBook({...newBook, cover: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3 text-white text-lg outline-none focus:border-secondary" placeholder="Leave blank for auto-cover" />
                  </div>
                </div>

                <div className="bg-black/40 p-6 rounded-xl border border-white/5 space-y-4">
                  <h3 className="text-lg font-bold text-slate-300">Copy Generation</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">How Many Copies?</label>
                      <input required type="number" min="0" value={newBook.copies_count} onChange={e => setNewBook({...newBook, copies_count: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white text-lg outline-none focus:border-secondary" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Floor</label>
                      <select required value={newBook.floor} onChange={e => setNewBook({...newBook, floor: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white text-lg outline-none focus:border-secondary">
                        <option value="" className="bg-black">Select...</option>
                        {config?.floor?.map(c => <option key={c.id} value={c.name} className="bg-black">{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Shelf Area</label>
                      <select required value={newBook.section} onChange={e => setNewBook({...newBook, section: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white text-lg outline-none focus:border-secondary">
                        <option value="" className="bg-black">Select...</option>
                        {config?.section?.map(c => <option key={c.id} value={c.name} className="bg-black">{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Shelf No.</label>
                      <select required value={newBook.shelf} onChange={e => setNewBook({...newBook, shelf: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white text-lg outline-none focus:border-secondary">
                        <option value="" className="bg-black">Select...</option>
                        {config?.shelf?.map(c => <option key={c.id} value={c.name} className="bg-black">{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <button type="submit" className="w-full bg-secondary hover:bg-secondary/80 text-white font-bold py-4 text-lg rounded-xl shadow-lg mt-2">Create Book & Generate Copies</button>
              </form>
            </div>
          </div>
        )}

        {/* STUDENTS TAB */}
        {activeTab === 'students' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3"><User className="text-blue-500" size={32}/> Registered Student Details</h2>
            
            <div className="bg-black/30 border border-white/10 rounded-xl overflow-hidden shadow-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/60 border-b border-white/10">
                    <th className="p-4 font-bold text-slate-300 uppercase tracking-wider text-sm">Student ID</th>
                    <th className="p-4 font-bold text-slate-300 uppercase tracking-wider text-sm">Name</th>
                    <th className="p-4 font-bold text-slate-300 uppercase tracking-wider text-sm">Username</th>
                    <th className="p-4 font-bold text-slate-300 uppercase tracking-wider text-sm">Email</th>
                    <th className="p-4 font-bold text-slate-300 uppercase tracking-wider text-sm">Phone</th>
                    <th className="p-4 font-bold text-slate-300 uppercase tracking-wider text-sm text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {students.map(s => (
                    <tr key={s.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-mono text-blue-300">{s.student_id}</td>
                      <td className="p-4 font-bold text-white">{s.name}</td>
                      <td className="p-4 text-slate-300">{s.username}</td>
                      <td className="p-4 text-slate-300">{s.email}</td>
                      <td className="p-4 text-slate-300">{s.phone}</td>
                      <td className="p-4 text-center">
                        <button onClick={() => handleRemoveStudent(s.id)} className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-colors">
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-500 text-lg">No students registered.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CONFIG TAB */}
        {activeTab === 'config' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3"><Settings className="text-accent" size={28}/> Library Layout Configuration</h2>
            <div className="bg-black/30 border border-white/10 p-8 rounded-xl mb-10 shadow-lg">
              <form onSubmit={handleAddConfig} className="flex flex-col md:flex-row gap-6 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Config Type</label>
                  <select value={newConfig.type} onChange={e => setNewConfig({...newConfig, type: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white text-lg outline-none">
                    <option value="category">Category/Subject (e.g. ENG, ARTS)</option>
                    <option value="floor">Floor Level</option>
                    <option value="section">Section Identifier</option>
                    <option value="shelf">Shelf Number</option>
                  </select>
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Value/Name</label>
                  <input required type="text" value={newConfig.name} onChange={e => setNewConfig({...newConfig, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white text-lg outline-none" placeholder="e.g. ARTS or 1" />
                </div>
                <button type="submit" className="bg-accent hover:bg-accent/80 text-white font-bold px-10 py-4 text-lg rounded-xl w-full md:w-auto shadow-lg">Add to Layout</button>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
              {Object.keys(config).map(type => (
                <div key={type} className="bg-black/20 border border-white/5 p-6 rounded-xl shadow-inner">
                  <h3 className="text-base uppercase tracking-widest font-bold text-slate-400 mb-4 border-b border-white/5 pb-3">{type}s</h3>
                  <div className="space-y-3">
                    {config[type].map(item => (
                      <div key={item.id} className="flex justify-between items-center bg-black/40 px-4 py-3 rounded-lg text-base text-white">
                        <span className="font-bold">{item.name}</span>
                        <button onClick={() => handleDeleteConfig(item.id)} className="text-red-400 hover:text-red-300 font-bold bg-white/5 px-3 py-1 rounded">&times;</button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FUNDS TAB */}
        {activeTab === 'funds' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold text-yellow-500 flex items-center gap-3"><DollarSign size={32}/> Library Funds Management</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div className="bg-yellow-900/20 border border-yellow-500/30 p-8 rounded-2xl text-center shadow-[0_0_30px_rgba(202,138,4,0.15)]">
                <p className="text-yellow-400/80 uppercase tracking-widest font-bold text-sm mb-2">Total Revenue Collected</p>
                <h1 className="text-5xl font-black text-yellow-400">Rs. {totalFunds}</h1>
              </div>
              <div className="bg-red-900/20 border border-red-500/30 p-8 rounded-2xl text-center shadow-[0_0_30px_rgba(220,38,38,0.15)]">
                <p className="text-red-400/80 uppercase tracking-widest font-bold text-sm mb-2">Total Pending Fines</p>
                <h1 className="text-5xl font-black text-red-400">Rs. {pendingFunds}</h1>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* To Be Collected using Record Style */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-4">Funds to be Collected</h3>
                <div className="space-y-4">
                  {history.filter(h => h.current_fine > 0 && !h.fine_paid).map(f => (
                    <div key={f.id} className="bg-red-950/20 border border-red-500/30 p-5 rounded-2xl flex items-center gap-5 shadow-lg">
                      <div className="w-16 h-24 bg-black rounded overflow-hidden flex-shrink-0 border border-white/10">
                        {f.cover ? <img src={f.cover} className="w-full h-full object-cover" /> : <BookMarked size={24} className="m-auto h-full text-slate-600"/>}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-black text-red-400 mb-1">Rs. {f.current_fine}</h4>
                        <p className="text-slate-300 text-sm mb-1"><b className="text-white">{f.name}</b> ({f.student_id})</p>
                        <p className="text-slate-500 text-xs truncate max-w-[200px]">{f.title}</p>
                        <button onClick={() => handlePayFine(f.id)} className="mt-3 w-full bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-bold shadow-md transition-colors">
                          Mark Fund as Got
                        </button>
                      </div>
                    </div>
                  ))}
                  {history.filter(h => h.current_fine > 0 && !h.fine_paid).length === 0 && <p className="text-center text-slate-500 py-10 bg-black/20 rounded-xl">No outstanding funds.</p>}
                </div>
              </div>

              {/* Successfully Collected using Record Style */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-4">Successfully Collected</h3>
                <div className="space-y-4">
                  {paidFines.map(f => (
                    <div key={f.id} className="bg-black/40 border border-white/5 p-5 rounded-2xl flex items-center gap-5 shadow-lg">
                      <div className="w-16 h-24 bg-black rounded overflow-hidden flex-shrink-0 opacity-70 border border-white/10">
                        {f.cover ? <img src={f.cover} className="w-full h-full object-cover" /> : <BookMarked size={24} className="m-auto h-full text-slate-600"/>}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-black text-white mb-1">Rs. {f.fine_amount}</h4>
                        <p className="text-slate-400 text-sm mb-1"><b className="text-white">{f.name}</b> ({f.student_id})</p>
                        <p className="text-slate-500 text-xs truncate max-w-[200px]">{f.title}</p>
                        <div className="mt-3 w-full text-center bg-green-900/30 text-green-400 px-3 py-2 rounded-lg text-sm font-bold border border-green-500/30">
                          <CheckCircle size={16} className="inline mr-2" /> Got
                        </div>
                      </div>
                    </div>
                  ))}
                  {paidFines.length === 0 && <p className="text-center text-slate-500 py-10 bg-black/20 rounded-xl">No funds have been collected yet.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INBOX & ALERTS TAB */}
        {activeTab === 'inbox' && (
          <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8 animate-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto h-[800px]">
            
            {/* Left Sidebar: Contacts & Overdues */}
            <div className="flex flex-col gap-6 h-full overflow-hidden">
              <div className="bg-black/30 border border-white/10 rounded-2xl flex flex-col h-1/2 overflow-hidden shadow-lg">
                <h2 className="text-xl font-bold text-white p-5 border-b border-white/10 flex items-center gap-2"><Mail className="text-primary"/> Student Chats</h2>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {Object.values(chats).map(c => (
                    <button key={c.id} onClick={() => setSelectedChatUser(c.id)} className={`w-full text-left p-4 rounded-xl transition-all flex items-center gap-3 ${selectedChatUser === c.id ? 'bg-primary/20 border-primary text-white' : 'hover:bg-white/5 text-slate-300'}`}>
                      <div className="bg-white/10 p-2 rounded-full"><User size={20}/></div>
                      <span className="font-bold truncate">{c.name}</span>
                    </button>
                  ))}
                  {Object.keys(chats).length === 0 && <p className="text-slate-500 text-center p-4">No conversations yet.</p>}
                </div>
              </div>
              
              <div className="bg-red-950/20 border border-red-500/30 rounded-2xl flex flex-col h-1/2 overflow-hidden shadow-lg">
                <h2 className="text-xl font-bold text-red-400 p-5 border-b border-red-500/20 flex items-center gap-2"><AlertTriangle/> Quick Overdue Alerts</h2>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {overdues.map(record => (
                    <div key={record.id} className="bg-black/40 border border-red-500/20 p-4 rounded-xl">
                      <p className="text-sm text-slate-300 mb-1 truncate"><b>{record.name}</b></p>
                      <p className="text-xs text-red-400 font-bold mb-3">Owes: Rs. {record.current_fine}</p>
                      <button onClick={() => handleSendOverdue(record.user_id, record.title, record.current_fine)} className="bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-lg text-xs font-bold w-full transition-colors flex items-center justify-center gap-2 shadow">
                        <Mail size={14} /> Send Alert
                      </button>
                    </div>
                  ))}
                  {overdues.length === 0 && <p className="text-slate-500 text-center p-4">No active overdues.</p>}
                </div>
              </div>
            </div>

            {/* Right Panel: Chat Interface */}
            <div className="bg-black/30 border border-white/10 rounded-2xl flex flex-col h-full shadow-xl overflow-hidden">
              {selectedChatUser ? (
                <>
                  <div className="p-6 border-b border-white/10 bg-black/40 backdrop-blur-sm">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-3"><User className="text-primary"/> {chats[selectedChatUser]?.name}</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
                    {chats[selectedChatUser]?.messages.map(m => {
                      const isMe = m.sender_id === user.id;
                      return (
                        <div key={m.id} className={`flex flex-col max-w-[80%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                          <div className={`p-4 rounded-2xl shadow-md ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-slate-800 text-white rounded-tl-none'}`}>
                            {m.subject !== 'Reply from Librarian' && m.subject !== 'Message to Librarian' && <h4 className="font-bold text-sm mb-2 opacity-80 border-b border-white/20 pb-1">{m.subject}</h4>}
                            <p className="text-base whitespace-pre-wrap">{m.content}</p>
                          </div>
                          <span className="text-xs text-slate-500 mt-2 font-mono">{new Date(m.sent_date).toLocaleString()}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="p-5 border-t border-white/10 bg-black/40">
                    <form onSubmit={handleSendReply} className="flex gap-4">
                      <input type="text" value={replyContent} onChange={e => setReplyContent(e.target.value)} placeholder="Type a message..." className="flex-1 bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white text-lg focus:border-primary outline-none" />
                      <button type="submit" className="bg-primary hover:bg-primary/80 text-white px-8 py-4 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg">
                        Send <Send size={20}/>
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                  <Mail size={64} className="mb-4 opacity-20" />
                  <p className="text-xl">Select a student chat to view messages.</p>
                </div>
              )}
            </div>

          </div>
        )}


      </div>
    </div>
  );
}
