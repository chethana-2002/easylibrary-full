import { useState, useEffect } from 'react';
import { Search, MapPin, Navigation, BookMarked, Filter, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [books, setBooks] = useState([]);
  const [checkoutBook, setCheckoutBook] = useState(null);
  const [patronName, setPatronName] = useState('');
  const [notification, setNotification] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = () => {
    fetch('http://localhost:5000/api/books')
      .then(res => res.json())
      .then(data => setBooks(data))
      .catch(err => console.error("Error fetching books:", err));
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/borrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_id: checkoutBook.id, borrower_name: patronName })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(`Checked out to ${patronName}. Due: ${new Date(data.due_date).toLocaleDateString()}`);
        setCheckoutBook(null);
        setPatronName('');
        fetchBooks();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const categories = ['All', 'Maths', 'English', 'Engineering', 'History', 'Arts', 'Commerce'];

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || book.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {notification && (
        <div className="fixed top-24 right-8 bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded-xl shadow-lg z-50">
          {notification}
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutBook && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a100b] border border-primary/30 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Checkout Resource</h3>
            <p className="text-slate-400 text-sm mb-6">You are checking out <strong className="text-primary">{checkoutBook.title}</strong>.</p>
            <form onSubmit={handleCheckout} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Patron Name</label>
                <input required autoFocus type="text" value={patronName} onChange={e => setPatronName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary outline-none" placeholder="Enter name..." />
              </div>
              <p className="text-xs text-secondary italic">Note: System will automatically set due date to 14 days from today.</p>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setCheckoutBook(null)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-primary hover:bg-primary/80 text-white font-bold py-3 rounded-xl transition-colors">Confirm Checkout</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="glass-panel p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight glow-text mb-1 text-white">Library Checkout System</h2>
          <p className="text-slate-400 text-sm">Search the catalog and manage patron checkouts.</p>
        </div>
        
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="w-full bg-black/40 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary text-white placeholder-slate-500 pl-12 pr-4 py-3 rounded-xl outline-none transition-all shadow-inner"
            placeholder="Search by title or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <div className="w-full lg:w-64 flex-shrink-0 space-y-2">
          <div className="glass-panel p-5 sticky top-32">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
              <Filter size={16} /> Categories
            </h3>
            <div className="space-y-1.5">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-300 font-medium ${activeCategory === cat ? 'bg-primary/20 text-white border border-primary/30 shadow-[0_0_10px_rgba(217,119,6,0.15)]' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Book Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredBooks.map((book) => {
              const isAvailable = book.available_copies > 0;
              return (
                <div key={book.id} className="glass-panel group relative overflow-hidden p-5 flex flex-col h-full hover:border-primary/40 hover:shadow-[0_0_30px_rgba(217,119,6,0.15)] transition-all duration-300 transform hover:-translate-y-1 bg-black/20">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="h-56 w-full rounded-xl mb-5 overflow-hidden relative border border-white/5 shadow-lg bg-[#0f0906]">
                    {book.cover ? (
                      <img src={book.cover} alt={book.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out opacity-90 group-hover:opacity-100" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                        <BookMarked size={48} className="mb-2 opacity-50" />
                        <span className="text-xs uppercase tracking-wider font-bold">No Cover</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0906]/90 via-[#0f0906]/20 to-transparent"></div>
                    <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-xs font-semibold border border-white/10 text-slate-200 shadow-xl">
                      {book.category}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-white mb-1.5 leading-snug line-clamp-2">{book.title}</h3>
                  <p className="text-sm text-slate-400 mb-4">{book.author}</p>
                  
                  {/* Availability Badge */}
                  <div className={`mb-5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold border ${isAvailable ? 'bg-green-900/30 text-green-400 border-green-500/30' : 'bg-red-900/30 text-red-400 border-red-500/30'}`}>
                    {isAvailable ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {isAvailable ? `${book.available_copies} of ${book.total_copies} Available` : '0 Copies - Checked Out'}
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                    <button 
                      onClick={() => navigate(`/map?bookId=${book.id}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition-all"
                    >
                      <MapPin size={14} /> Locate
                    </button>
                    <button 
                      onClick={() => setCheckoutBook(book)}
                      disabled={!isAvailable}
                      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${isAvailable ? 'bg-primary/20 text-primary hover:bg-primary hover:text-white border border-primary/30 shadow-[0_0_10px_rgba(217,119,6,0.1)]' : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-transparent'}`}
                    >
                      Checkout
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          {filteredBooks.length === 0 && (
            <div className="glass-panel p-16 text-center flex flex-col items-center justify-center border-dashed border-white/10 mt-2">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 shadow-inner">
                <Search size={32} className="text-slate-500" />
              </div>
              <h3 className="text-xl font-semibold text-slate-200">No resources found</h3>
              <p className="text-slate-500 mt-2">Try adjusting your search criteria or browse another category.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
