const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Components', 'HolidayCalendarSection.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add state for selectedDateInfo
content = content.replace(
  `  const [currentMonth, setCurrentMonth] = useState(new Date());`,
  `  const [currentMonth, setCurrentMonth] = useState(new Date());\n  const [selectedDateInfo, setSelectedDateInfo] = useState(null);`
);

// 2. Update renderCalendar
const renderCalendarOld = `  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={\`empty-\${i}\`} className="p-2"></div>);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = new Date().toDateString() === new Date(year, month, i).toDateString();
      days.push(
        <div 
          key={i} 
          className={\`p-2 text-center rounded-lg text-sm font-medium transition-all \${
            isToday ? 'bg-primary text-white shadow-lg scale-110' : 'hover:bg-primary/10 text-gray-700'
          }\`}
        >
          {i}
        </div>
      );
    }
    
    return days;
  };`;

const renderCalendarNew = `  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={\`empty-\${i}\`} className="p-2"></div>);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = new Date().toDateString() === new Date(year, month, i).toDateString();
      const formattedDate = \`\${monthNames[month]} \${String(i).padStart(2, '0')}\`;
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
  };`;

content = content.replace(renderCalendarOld, renderCalendarNew);

// 3. Add Legend Item
const legendOld = `<div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full shadow-sm"></div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">School Holiday</span>
                </div>`;

const legendNew = `<div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full shadow-sm"></div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">School Holiday</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-400 rounded-full shadow-sm"></div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">State Holiday</span>
                </div>`;

content = content.replace(legendOld, legendNew);

// 4. Add display area for selectedDateInfo
const displayAreaOld = `              <div className="flex flex-wrap gap-4">`;
const displayAreaNew = `              {selectedDateInfo && (
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
              <div className="flex flex-wrap gap-4">`;

content = content.replace(displayAreaOld, displayAreaNew);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Update successful!');
