import { useState, useEffect } from 'react';
import { Search, MapPin, Navigation, BookMarked, Filter, CheckCircle, XCircle, Mail, Clock, PenTool, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StudentPortal({ user }) {
  const [activeTab, setActiveTab] = useState('catalog');
  const [books, setBooks] = useState([]);
  const [history, setHistory] = useState([]);
  const [messages, setMessages] = useState([]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [categories, setCategories] = useState([]);
  
  // Message & Notes state
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [notification, setNotification] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchBooks();
    fetchHistory();
    fetchMessages();
    fetchConfig();
    fetchNotes();
  }, []);

  const fetchConfig = () => {
    fetch('http://localhost:5000/api/config')
      .then(res => res.json())
      .then(data => setCategories(data.category.map(c => c.name)));
  };

  const fetchBooks = () => {
    fetch('http://localhost:5000/api/books')
      .then(res => res.json())
      .then(data => setBooks(data));
  };

  const fetchHistory = () => {
    fetch('http://localhost:5000/api/history')
      .then(res => res.json())
      .then(data => {
        setHistory(data.filter(h => h.student_id === user.student_id));
      });
  };

  const fetchMessages = () => {
    fetch(`http://localhost:5000/api/messages/${user.id}`)
      .then(res => res.json())
      .then(data => setMessages(data));
  };

  const fetchNotes = () => {
    fetch(`http://localhost:5000/api/notes/${user.id}`)
      .then(res => res.json())
      .then(data => setNoteContent(data.content));
  };

  const saveNotes = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/notes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: user.id, content: noteContent })
      });
      if (res.ok) setNotification('Notes saved automatically.');
      setTimeout(() => setNotification(''), 2000);
    } catch (err) { console.error(err); }
  };

  // Auto-save notes hook
  useEffect(() => {
    const timer = setTimeout(() => {
      if(noteContent) saveNotes();
    }, 2000);
    return () => clearTimeout(timer);
  }, [noteContent]);

  const handleReserve = async (book_id) => {
    try {
      const res = await fetch('http://localhost:5000/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_id, user_id: user.id })
      });
      if (res.ok) setNotification('Reservation placed successfully! You will be notified when it is available.');
      setTimeout(() => setNotification(''), 4000);
    } catch (err) { alert('Error reserving book'); }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: user.id, receiver_role: 'librarian', subject, content })
      });
      if (res.ok) {
        setNotification('Message sent to Librarian.');
        setSubject(''); setContent('');
        setTimeout(() => setNotification(''), 3000);
        fetchMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || book.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-700 text-lg">
      {notification && (
        <div className="fixed top-24 right-8 bg-green-900/80 border border-green-500 text-green-200 px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 backdrop-blur-md">
          <CheckCircle size={24} /> {notification}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4 overflow-x-auto">
        <button onClick={() => setActiveTab('catalog')} className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'catalog' ? 'bg-primary text-white shadow-[0_0_15px_rgba(217,119,6,0.3)]' : 'bg-black/30 text-slate-400 hover:text-white'}`}><Search size={20}/> Search Catalog</button>
        <button onClick={() => setActiveTab('records')} className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'records' ? 'bg-secondary text-white shadow-[0_0_15px_rgba(153,27,27,0.3)]' : 'bg-black/30 text-slate-400 hover:text-white'}`}><Clock size={20}/> My Records</button>
        <button onClick={() => setActiveTab('inbox')} className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'inbox' ? 'bg-accent text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-black/30 text-slate-400 hover:text-white'}`}><Mail size={20}/> Email Librarian</button>
        <button onClick={() => setActiveTab('notes')} className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'notes' ? 'bg-green-600 text-white shadow-[0_0_15px_rgba(22,163,74,0.3)]' : 'bg-black/30 text-slate-400 hover:text-white'}`}><PenTool size={20}/> My Notes</button>
        <button onClick={() => setActiveTab('profile')} className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]' : 'bg-black/30 text-slate-400 hover:text-white'}`}><User size={20}/> My Profile</button>
      </div>

      <div className="glass-panel p-8">
        
        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="animate-in zoom-in-95 duration-300 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3"><User className="text-blue-500" size={32}/> Student Profile</h2>
            <div className="bg-black/40 border border-white/10 rounded-2xl p-8 shadow-xl">
              <div className="flex items-center gap-6 border-b border-white/10 pb-8 mb-8">
                <div className="w-24 h-24 bg-blue-600/30 rounded-full flex items-center justify-center border-4 border-blue-500/50">
                  <User size={48} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white tracking-wide">{user.name}</h3>
                  <p className="text-lg text-blue-300 font-mono mt-1">ID: {user.student_id}</p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">Username</label>
                  <p className="text-xl text-white font-medium">{user.username}</p>
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                  <p className="text-xl text-white font-medium">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">Phone Number</label>
                  <p className="text-xl text-white font-medium">{user.phone}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CATALOG TAB */}
        {activeTab === 'catalog' && (
          <div className="animate-in zoom-in-95 duration-300">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar */}
              <div className="w-full lg:w-72 flex-shrink-0 space-y-4">
                <input
                  type="text"
                  className="w-full bg-black/40 border border-white/10 focus:border-primary/50 text-white placeholder-slate-500 px-5 py-4 rounded-xl outline-none transition-all shadow-inner text-lg"
                  placeholder="Search title/author..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="bg-black/20 p-6 rounded-xl border border-white/5">
                  <h3 className="text-base font-bold uppercase tracking-wider text-slate-400 mb-5 flex items-center gap-2 border-b border-white/5 pb-3">
                    <Filter size={20} /> Filter Sections
                  </h3>
                  <div className="space-y-2">
                    <button
                        onClick={() => setActiveCategory('All')}
                        className={`w-full text-left px-5 py-3 rounded-lg text-base transition-all duration-300 font-bold ${activeCategory === 'All' ? 'bg-primary/20 text-white border border-primary/30 shadow-[0_0_10px_rgba(217,119,6,0.15)]' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'}`}
                      >
                        All Sections
                    </button>
                    {categories.map((cat, idx) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`w-full text-left px-5 py-3 rounded-lg text-base transition-all duration-300 font-bold ${activeCategory === cat ? 'bg-primary/20 text-white border border-primary/30 shadow-[0_0_10px_rgba(217,119,6,0.15)]' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'}`}
                      >
                        {idx + 1}. {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Grid */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredBooks.map((book) => {
                  const isAvailable = book.available_copies > 0;
                  return (
                    <div key={book.id} className="bg-black/40 border border-white/5 p-6 rounded-xl flex flex-col h-full hover:border-primary/40 transition-all shadow-lg">
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
                      
                      <div className="flex items-center justify-between gap-4 mt-auto">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-sm font-bold border ${isAvailable ? 'bg-green-900/30 text-green-400 border-green-500/30' : 'bg-red-900/30 text-red-400 border-red-500/30'}`}>
                          {isAvailable ? <CheckCircle size={18} /> : <XCircle size={18} />}
                          {isAvailable ? `${book.available_copies} of ${book.total_copies} Copies Available` : '0 Copies Available'}
                        </div>
                        {!isAvailable && (
                          <button onClick={() => handleReserve(book.id)} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-1.5 px-4 rounded transition-all text-sm shadow-[0_0_10px_rgba(147,51,234,0.3)]">
                            Reserve Book
                          </button>
                        )}
                      </div>
                      
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* RECORDS TAB */}
        {activeTab === 'records' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3"><Clock className="text-secondary" size={28}/> My Borrow History</h2>
            
            <div className="space-y-6">
              {history.map(record => (
                <div key={record.id} className="bg-black/40 border border-white/10 p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
                  <div className="flex gap-6 w-full md:w-auto">
                    <div className="w-24 h-32 bg-black rounded overflow-hidden flex-shrink-0 shadow-inner">
                      {record.cover && <img src={record.cover} className="w-full h-full object-cover" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-2xl text-white mb-2">{record.title}</h4>
                      <p className="text-base text-slate-400">Borrowed: {new Date(record.borrow_date).toLocaleDateString()}</p>
                      <p className="text-base font-bold text-primary mt-1">Due Date: {new Date(record.due_date).toLocaleDateString()}</p>
                      {record.status === 'returned' && (
                        <p className="text-base text-green-400 font-bold mt-1">Returned: {new Date(record.return_date).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-right w-full md:w-auto">
                    <span className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider ${record.status === 'returned' ? 'bg-green-900/30 text-green-400 border border-green-500/30' : record.is_overdue ? 'bg-red-900/30 text-red-400 border border-red-500/30' : 'bg-primary/20 text-primary border border-primary/30'}`}>
                      {record.status === 'active' ? (record.is_overdue ? 'OVERDUE' : 'ACTIVE') : 'RETURNED'}
                    </span>
                    
                    {(record.current_fine > 0) && (
                      <div className="mt-4 bg-red-950/50 px-4 py-3 rounded-xl border border-red-500/30">
                        <p className="text-xs text-red-300 uppercase font-bold tracking-wider mb-1">Unpaid Fine</p>
                        <p className="text-3xl font-bold text-white">Rs. {record.current_fine}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {history.length === 0 && <div className="text-center py-16 text-xl text-slate-500">You have no borrow history.</div>}
            </div>
          </div>
        )}

        {/* INBOX TAB */}
        {activeTab === 'inbox' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="bg-black/30 border border-white/10 p-8 rounded-xl h-fit shadow-lg">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3"><Mail className="text-accent" size={28}/> Email Librarian</h2>
              <form onSubmit={handleSendMessage} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Subject</label>
                  <input required type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3 text-white text-lg outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Message</label>
                  <textarea required rows={6} value={content} onChange={e => setContent(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white text-lg outline-none focus:border-accent resize-none"></textarea>
                </div>
                <button type="submit" className="w-full bg-accent hover:bg-accent/80 text-white font-bold py-4 rounded-xl text-lg transition-all shadow-lg">Send Email</button>
              </form>
            </div>

            <div className="bg-black/30 border border-white/10 p-8 rounded-xl shadow-lg flex flex-col h-full">
              <h2 className="text-2xl font-bold text-white mb-6">Chat History</h2>
              <div className="flex-1 overflow-y-auto pr-3 space-y-4 flex flex-col-reverse">
                {[...messages].map(m => {
                  const isMe = m.sender_name === 'Me';
                  return (
                    <div key={m.id} className={`flex flex-col max-w-[80%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                      <div className={`p-4 rounded-2xl ${isMe ? 'bg-accent/20 border border-accent/30 text-white rounded-br-none' : 'bg-white/10 border border-white/10 text-white rounded-bl-none'}`}>
                        {m.subject && m.subject !== 'Reply from Librarian' && <p className="text-xs font-bold opacity-70 mb-1">{m.subject}</p>}
                        <p className="text-base">{m.content}</p>
                      </div>
                      <span className="text-xs text-slate-500 mt-1">{new Date(m.sent_date).toLocaleString()}</span>
                    </div>
                  );
                })}
                {messages.length === 0 && <div className="text-center py-16 text-lg text-slate-500 w-full">No chat history.</div>}
              </div>
            </div>
          </div>
        )}

        {/* NOTES TAB */}
        {activeTab === 'notes' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3"><PenTool className="text-green-500" size={28}/> My Important Notes</h2>
            <p className="text-slate-400 mb-8 text-lg">Keep your library research notes here. Changes save automatically.</p>
            <div className="bg-[#111827] border border-white/10 p-2 rounded-xl shadow-2xl relative">
              <textarea 
                value={noteContent} 
                onChange={e => setNoteContent(e.target.value)} 
                className="w-full h-[600px] bg-transparent text-slate-200 text-xl font-serif p-6 outline-none resize-none leading-relaxed" 
                placeholder="Start typing your research notes here..."
              ></textarea>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
