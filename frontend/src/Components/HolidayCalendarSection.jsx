import React, { useState } from 'react';
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
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleShare = async (e) => {
    e?.preventDefault();
    try {
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${apiBase}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: 'Holiday List & Academic Calendar', 
          desc: 'Check out the upcoming holidays and academic schedule for Holy Name School.', 
          image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=2068&auto=format&fit=crop", 
          page: '/#calendar' 
        }),
      });
      const { url } = await res.json();
      const shareUrl = url || window.location.href;
      if (navigator.share) { 
        await navigator.share({ title: 'Holy Name School - Holiday List', text: 'Check out the holiday list and academic calendar!', url: shareUrl }); 
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
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = new Date().toDateString() === new Date(year, month, i).toDateString();
      days.push(
        <div 
          key={i} 
          className={`p-2 text-center rounded-lg text-sm font-medium transition-all ${
            isToday ? 'bg-primary text-white shadow-lg scale-110' : 'hover:bg-primary/10 text-gray-700'
          }`}
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

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Holiday List */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2 bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <FaSun className="text-white text-xl" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">Upcoming Holidays</h3>
            </div>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {holidays.map((holiday, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:shadow-md transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary/5 rounded-xl flex flex-col items-center justify-center text-primary font-bold border border-primary/10 group-hover:bg-primary group-hover:text-white transition-colors">
                      <span className="text-xs uppercase leading-none opacity-70 mb-1">{holiday.date.split(' ')[0]}</span>
                      <span className="text-lg leading-none">{holiday.date.split(' ')[1]}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 group-hover:text-primary transition-colors">{holiday.name}</h4>
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{holiday.type}</p>
                    </div>
                  </div>
                  <FaStar className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Calendar UI */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-3 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50"
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
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
