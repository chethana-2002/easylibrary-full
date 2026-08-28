import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { mockFloors } from '../data/mockData';
import { MapPin, Navigation2, ArrowLeft, Layers, Library } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function MapView() {
  const [searchParams] = useSearchParams();
  const bookId = searchParams.get('bookId');
  const navigate = useNavigate();
  
  const [activeFloor, setActiveFloor] = useState('1');
  const [targetBook, setTargetBook] = useState(null);
  const [books, setBooks] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/books')
      .then(res => res.json())
      .then(data => {
        setBooks(data);
        if (bookId) {
          const book = data.find(b => b.id === bookId);
          if (book) {
            setTargetBook(book);
            setActiveFloor(book.floor);
          }
        }
      })
      .catch(err => console.error("Error fetching books:", err));
  }, [bookId]);

  // Map Data Simulation
  const sections = ['A', 'B', 'C', 'D'];
  const shelvesPerSection = [1, 2, 3, 4, 5];
  
  const isTargetSection = (section) => targetBook?.section === section;
  const isTargetShelf = (section, shelf) => isTargetSection(section) && parseInt(targetBook?.shelf) === shelf;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Panel */}
      <div className="glass-panel p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 transition-colors border border-white/5"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold glow-text text-white flex items-center gap-2">
              <Layers className="text-accent" /> Interactive Mapping System
            </h2>
            <p className="text-sm text-slate-400">Real-time routing to physical archive locations.</p>
          </div>
        </div>
        
        {/* Floor Selector */}
        <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/5">
          {mockFloors.map(floor => (
            <button
              key={floor.id}
              onClick={() => setActiveFloor(floor.id)}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                activeFloor === floor.id 
                  ? "bg-secondary/30 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] border border-secondary/40" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              )}
            >
              {floor.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
        {/* Sidebar Info */}
        <div className="col-span-1 glass-panel p-6 flex flex-col h-full relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
          
          <h3 className="text-sm uppercase tracking-widest font-bold text-slate-400 mb-5 border-b border-white/10 pb-4">Target Resource</h3>
          
          {targetBook ? (
            <div className="flex flex-col flex-1 animate-in slide-in-from-left-4 duration-500">
              <div className="w-full h-56 rounded-xl overflow-hidden mb-5 border border-white/10 shadow-2xl relative">
                <img src={targetBook.cover} alt={targetBook.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-transparent to-transparent"></div>
              </div>
              
              <h4 className="text-xl font-bold text-white leading-tight mb-1">{targetBook.title}</h4>
              <p className="text-slate-400 text-sm mb-6">{targetBook.author}</p>
              
              <div className="mt-auto space-y-4">
                <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-3 shadow-inner">
                  <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                    <span className="text-slate-400">Floor</span>
                    <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded">{targetBook.floor}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                    <span className="text-slate-400">Section</span>
                    <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{targetBook.section}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                    <span className="text-slate-400">Shelf</span>
                    <span className="font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">{targetBook.shelf}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Row</span>
                    <span className="font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded">{targetBook.row}</span>
                  </div>
                </div>
                
                <div className="w-full py-3.5 bg-accent/10 border border-accent/30 rounded-xl flex items-center justify-center gap-2 text-accent font-semibold animated-pulse shadow-[0_0_20px_rgba(6,182,212,0.15)] relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-[shimmer_2s_infinite]"></div>
                  <Navigation2 size={18} className="animate-bounce" />
                  Routing Active
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-70">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                <MapPin size={32} className="text-slate-500" />
              </div>
              <p className="text-slate-400 text-sm px-4">Select a book from the catalog to view its physical location.</p>
              <button 
                onClick={() => navigate('/')}
                className="mt-6 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white transition-colors border border-white/10"
              >
                Browse Catalog
              </button>
            </div>
          )}
        </div>

        {/* The Map Interface */}
        <div className="col-span-1 lg:col-span-3 glass-panel p-8 relative overflow-hidden flex flex-col">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
            <h3 className="text-xl font-bold text-slate-200">Map Layout: {mockFloors.find(f => f.id === activeFloor)?.name}</h3>
            <div className="flex items-center gap-5 text-sm bg-black/40 px-4 py-2 rounded-xl border border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-md bg-slate-800 border border-slate-600"></div> 
                <span className="text-slate-400">Default Shelf</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-md bg-accent/40 border border-accent shadow-[0_0_10px_rgba(6,182,212,0.8)] animate-pulse"></div> 
                <span className="text-slate-200">Target Location</span>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-[#06090F]/80 rounded-2xl border border-white/5 p-8 grid grid-cols-2 gap-x-20 gap-y-12 overflow-y-auto shadow-inner relative">
            {sections.map(section => (
              <div 
                key={section} 
                className={cn(
                  "p-7 rounded-xl border-2 transition-all duration-500 relative",
                  isTargetSection(section) && activeFloor === targetBook?.floor
                    ? "border-primary/40 bg-primary/5 shadow-[0_0_30px_rgba(59,130,246,0.1)]" 
                    : "border-slate-800/80 bg-slate-900/40"
                )}
              >
                <div className="absolute -top-4 left-6 bg-[#0B0F19] px-4 py-1 rounded-lg border border-slate-700 font-bold text-slate-300 shadow-lg">
                  Section {section}
                </div>
                
                <div className="flex flex-col gap-3.5 mt-3">
                  {shelvesPerSection.map(shelf => {
                    const isTarget = isTargetShelf(section, shelf) && activeFloor === targetBook?.floor;
                    return (
                      <div 
                        key={shelf}
                        className={cn(
                          "h-11 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-300 relative overflow-hidden group",
                          isTarget 
                            ? "bg-accent/10 border border-accent text-accent shadow-[0_0_20px_rgba(6,182,212,0.25)]" 
                            : "bg-slate-800/50 border border-slate-700/50 text-slate-500 hover:bg-slate-700/50"
                        )}
                      >
                        {isTarget && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/20 to-transparent -skew-x-12 animate-[shimmer_2s_infinite]"></div>
                        )}
                        Shelf {shelf}
                        {isTarget && (
                          <div className="absolute right-3 flex items-center justify-center">
                            <div className="absolute w-6 h-6 bg-accent/30 rounded-full animate-ping"></div>
                            <MapPin size={16} className="text-accent relative z-10 animate-bounce" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          
        </div>
      </div>
    </div>
  );
}
