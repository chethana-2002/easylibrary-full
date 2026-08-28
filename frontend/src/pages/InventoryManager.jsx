import { useState, useEffect } from 'react';
import { Plus, Trash2, Library, AlertCircle, AlertTriangle } from 'lucide-react';

export default function InventoryManager() {
  const [books, setBooks] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [notification, setNotification] = useState('');
  const [formData, setFormData] = useState({
    title: '', author: '', category: 'Maths', cover: '', floor: '1', section: 'A', shelf: '1', row: '1', total_copies: 1
  });

  useEffect(() => {
    fetchBooks();
    fetchAlerts();
  }, []);

  const fetchBooks = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/books');
      setBooks(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/alerts');
      setAlerts(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        showNotification('Book added successfully!');
        setFormData({ title: '', author: '', category: 'Maths', cover: '', floor: '1', section: 'A', shelf: '1', row: '1', total_copies: 1 });
        fetchBooks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if(!confirm("Are you sure you want to remove this resource?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/books/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('Book removed from inventory.');
        fetchBooks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReturn = async (record_id, book_id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record_id, book_id })
      });
      if (res.ok) {
        showNotification('Book returned successfully.');
        fetchBooks();
        fetchAlerts();
      }
    } catch (err) {
      console.error(err);
    }
  }

  const categories = ['Maths', 'English', 'Engineering', 'History', 'Arts', 'Commerce'];
  const overdueAlerts = alerts.filter(a => a.isOverdue);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {notification && (
        <div className="fixed top-24 right-8 bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded-xl shadow-lg z-50">
          {notification}
        </div>
      )}

      {/* OVERDUE ALERTS WIDGET */}
      {overdueAlerts.length > 0 && (
        <div className="bg-red-950/40 border border-red-500/50 rounded-xl p-5 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
          <h3 className="text-red-400 font-bold flex items-center gap-2 mb-4">
            <AlertTriangle size={24} className="animate-pulse" /> Critical Overdue Alerts ({overdueAlerts.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overdueAlerts.map(alert => (
              <div key={alert.id} className="bg-black/40 border border-red-500/20 p-3 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="text-white font-bold text-sm truncate">{alert.title}</h4>
                  <p className="text-slate-400 text-xs">Patron: <span className="text-white">{alert.borrower_name}</span></p>
                  <p className="text-red-400 text-xs font-bold mt-1">Due: {new Date(alert.due_date).toLocaleDateString()}</p>
                </div>
                <button onClick={() => handleReturn(alert.id, alert.book_id)} className="bg-red-900/50 hover:bg-red-800 text-red-200 px-3 py-1.5 rounded text-xs font-bold transition-colors">
                  Force Return
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Add Book Form */}
        <div className="col-span-1 glass-panel p-6 h-fit sticky top-32">
          <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4 flex items-center gap-2">
            <Plus className="text-primary" /> Add Resource
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white" placeholder="Book Title" />
            <input required type="text" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white" placeholder="Author Name" />
            <div className="flex gap-2">
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white">
                {categories.map(c => <option key={c} value={c} className="bg-black">{c}</option>)}
              </select>
              <input required type="number" min="1" value={formData.total_copies} onChange={e => setFormData({...formData, total_copies: e.target.value})} className="w-24 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white" placeholder="Copies" title="Total Copies" />
            </div>
            <input type="text" value={formData.cover} onChange={e => setFormData({...formData, cover: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white" placeholder="Cover Image URL" />
            
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
              <input required type="text" value={formData.floor} onChange={e => setFormData({...formData, floor: e.target.value})} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" placeholder="Floor (e.g. 1)" />
              <input required type="text" value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" placeholder="Section (e.g. A)" />
              <input required type="text" value={formData.shelf} onChange={e => setFormData({...formData, shelf: e.target.value})} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" placeholder="Shelf" />
              <input required type="text" value={formData.row} onChange={e => setFormData({...formData, row: e.target.value})} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" placeholder="Row" />
            </div>

            <button type="submit" className="w-full mt-4 bg-primary/20 hover:bg-primary/40 text-white font-bold py-3 rounded-xl border border-primary/40 transition-all shadow-[0_0_15px_rgba(217,119,6,0.2)]">
              Add Inventory
            </button>
          </form>
        </div>

        {/* Inventory List */}
        <div className="col-span-1 lg:col-span-2 glass-panel p-6">
          <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4 flex items-center gap-2">
            <Library className="text-secondary" /> Master Inventory ({books.length})
          </h3>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {books.map(book => (
              <div key={book.id} className="bg-black/30 border border-white/5 p-3 rounded-xl flex items-center justify-between hover:border-primary/30 transition-all">
                <div className="flex gap-4">
                  <div className="w-12 h-16 bg-black rounded overflow-hidden flex-shrink-0">
                    {book.cover && <img src={book.cover} className="w-full h-full object-cover" alt="" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-white line-clamp-1">{book.title}</h4>
                    <p className="text-xs text-slate-400">{book.author} &bull; {book.category}</p>
                    <div className="text-xs mt-1">
                      <span className="text-primary font-bold">{book.available_copies}</span> / {book.total_copies} Available
                    </div>
                  </div>
                </div>
                <button onClick={() => handleDelete(book.id)} className="p-2 text-secondary hover:bg-secondary hover:text-white rounded transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
