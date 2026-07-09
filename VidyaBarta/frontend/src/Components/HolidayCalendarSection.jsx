import React, { useState, useContext } from 'react';
import { SiteDataContext } from '../context/SiteDataContext';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaSun, FaMoon, FaStar, FaShareAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const holidays = [
  { date: 'Jan 14', name: 'Magh Bihu & Tusu Puja', type: 'Public' },
  { date: 'Jan 15', name: 'Magh Bihu & Tusu Puja', type: 'Public' },
  { date: 'Jan 23', name: 'Netaji\'s Birthday', type: 'Public' },
  { date: 'Jan 26', name: 'Republic Day', type: 'National' },
  { date: 'Jan 27', name: 'Gwthar Bathou San', type: 'Public' },
  { date: 'Jan 31', name: 'Me-Dam-Me-Phi', type: 'Public' },
  { date: 'Feb 01', name: 'Bir Chilaray Divas', type: 'Public' },
  { date: 'Mar 03', name: 'Dol Jatra', type: 'Public' },
  { date: 'Mar 21', name: 'Id-Ul-Fitr', type: 'Provisional' },
  { date: 'Apr 03', name: 'Good Friday', type: 'Public' },
  { date: 'Apr 14', name: 'Bohag Bihu', type: 'Regional' },
  { date: 'Apr 15', name: 'Bohag Bihu', type: 'Regional' },
  { date: 'Apr 16', name: 'Bohag Bihu', type: 'Regional' },
  { date: 'Apr 18', name: 'Tithi of Damodar Deva', type: 'Public' },
  { date: 'Apr 21', name: 'Sati Sadhini Divas', type: 'Public' },
  { date: 'May 01', name: 'May Day & Buddha Purnima', type: 'Public' },
  { date: 'May 27', name: 'Id-ul-Zuha', type: 'Provisional' },
  { date: 'Jun 01', name: 'Sri Sri Madhabdeva Janmotsav', type: 'Public' },
  { date: 'Aug 15', name: 'Independence Day', type: 'National' },
  { date: 'Oct 18', name: 'Kati Bihu & Durga Puja', type: 'Public' },
  { date: 'Nov 08', name: 'Diwali / Kali Puja', type: 'Public' },
  { date: 'Nov 24', name: 'Guru Nanak Jayanti & Lachit Divas', type: 'Public' },
  { date: 'Dec 02', name: 'Asom Divas (Su-Ka-Pha Divas)', type: 'Public' },
  { date: 'Dec 25', name: 'Christmas Day', type: 'Public' },
];

export default function HolidayCalendarSection() {
  const { schoolProfile } = useContext(SiteDataContext);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateInfo, setSelectedDateInfo] = useState(null);

  const handleShare = async (e) => {
    e?.preventDefault();
    try {
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${apiBase}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: 'Holiday List & Academic Calendar', 
          desc: `Check out the upcoming holidays and academic schedule for ${schoolProfile?.name || 'Our School'}.`, 
          image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=2068&auto=format&fit=crop", 
          page: '/#calendar' 
        }),
      });
      const { url } = await res.json();
      const shareUrl = url || window.location.href;
      if (navigator.share) { 
        await navigator.share({ title: `${schoolProfile?.name || 'Our School'} - Holiday List`, text: 'Check out the holiday list and academic calendar!', url: shareUrl }); 
      } else { 
        await navigator.clipboard.writeText(shareUrl); 
        alert('Link copied to clipboard!'); 
      }
    } catch (err) { if (err.name !== 'AbortError') console.warn('Share failed', err); }
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = new Date().toDateString() === new Date(year, month, i).toDateString();
      const formattedDate = `${monthNames[month]} ${String(i).padStart(2, '0')}`;
      const holiday = holidays.find(h => h.date === formattedDate);
      
      let baseClasses = 'p-2 text-center rounded-lg text-sm font-medium transition-all cursor-pointer hover:scale-110 ';
      if (isToday) {
        baseClasses += 'bg-primary text-white shadow-lg';
      } else if (holiday) {
        if (holiday.type === 'Regional' || holiday.type === 'State') {
          baseClasses += 'bg-purple-100 text-purple-700 border border-purple-200';
        } else {
          baseClasses += 'bg-red-100 text-red-700 border border-red-200';
        }
      } else {
        baseClasses += 'hover:bg-primary/10 text-gray-700';
      }

      days.push(
        <div 
          key={i} 
          onClick={() => setSelectedDateInfo({ date: formattedDate, info: holiday ? holiday.name : 'No holiday scheduled.' })}
          className={baseClasses}
        >
          {i}
        </div>
      );
    }
    
    return days;
  };

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)));

  return (
    <section id="calendar" className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <h2 className="text-primary font-black text-xl tracking-widest uppercase mb-2 border-l-4 border-amber-500 pl-4">Schedule</h2>
            <h1 className="font-serif text-3xl md:text-6xl font-black text-gray-900 leading-tight">
              Academic <span className="text-amber-600 italic">Calendar</span>
            </h1>
          </div>
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 px-6 py-3 bg-primary/5 text-primary rounded-2xl font-bold hover:bg-primary hover:text-white transition-all border border-primary/10 shadow-sm"
          >
            <FaShareAlt size={14} /> Share Calendar
          </button>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Calendar UI */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-100 shadow-xl shadow-slate-200/50"
          >
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <FaCalendarAlt className="text-white text-xl" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">
                  {currentMonth.toLocaleString('default', { month: 'long' })} {currentMonth.getFullYear()}
                </h3>
              </div>
              <div className="flex gap-2">
                <button onClick={prevMonth} className="p-3 bg-slate-50 hover:bg-primary hover:text-white text-slate-400 rounded-xl transition-all border border-slate-100">
                  <FaChevronLeft size={14} />
                </button>
                <button onClick={nextMonth} className="p-3 bg-slate-50 hover:bg-primary hover:text-white text-slate-400 rounded-xl transition-all border border-slate-100">
                  <FaChevronRight size={14} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-black text-slate-400 uppercase tracking-widest py-2">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {renderCalendar()}
            </div>

            <div className="mt-10 pt-8 border-t border-slate-50">
              {selectedDateInfo && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between"
                >
                  <div>
                    <span className="text-sm font-bold text-slate-800 block">{selectedDateInfo.date}</span>
                    <span className="text-slate-600 text-sm">{selectedDateInfo.info}</span>
                  </div>
                  <button onClick={() => setSelectedDateInfo(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                </motion.div>
              )}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded-full shadow-sm"></div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Day</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-400 rounded-full shadow-sm"></div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scheduled Event</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full shadow-sm"></div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">School Holiday</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-400 rounded-full shadow-sm"></div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">State Holiday</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
