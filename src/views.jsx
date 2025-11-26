import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Activity, Pill, ChevronLeft, ChevronRight, CheckCircle2, Stethoscope, Clipboard, BarChart3,
  Search, Cloud, RefreshCw, Download, Upload, History, Home, LayoutDashboard, BookOpen, ArrowUpDown, X
} from 'lucide-react';
import { 
  formatDate, getDaysSince, safeDate, formatTimeOnly, MEDICATION_METHODS 
} from './utils';
import { LogItem } from './components';

export function CourseDetailView({ course, logs, onUpdateStatus, onDeleteLog, onEditLog }) {
  if (!course) return <div>病程不存在</div>;
  const isRecovered = course.status === 'recovered';
  const timelineData = useMemo(() => {
    const grouped = {};
    const start = safeDate(course.startDate);
    start.setHours(0,0,0,0);
    logs.forEach(log => {
      const logDate = safeDate(log.timestamp);
      logDate.setHours(0,0,0,0);
      const diffTime = Math.abs(logDate - start);
      const dayNum = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
      if (!grouped[dayNum]) grouped[dayNum] = [];
      grouped[dayNum].push(log);
    });
    return Object.keys(grouped).sort((a,b) => b - a).map(day => ({ day, logs: grouped[day].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)) }));
  }, [logs, course.startDate]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-start mb-6 relative z-10">
           <div>
             <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{course.name}</h2>
             <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${isRecovered ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'}`}>{isRecovered ? '已康复归档' : '正在进行治疗'}</span>
           </div>
           {!isRecovered && <button onClick={(e) => { e.stopPropagation(); if(window.confirm('确认已康复并结束此病程？')) onUpdateStatus(course.id, 'recovered'); }} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg shadow-green-200 dark:shadow-none transition-colors flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> 标记康复</button>}
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 space-y-4 border border-slate-100 dark:border-slate-700">
           <div className="flex items-start gap-3"><Clipboard className="w-4 h-4 text-slate-400 mt-1 shrink-0" /><div><span className="text-xs text-slate-400 block mb-1">症状综述</span><p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{course.symptoms || '未填写'}</p></div></div>
           {course.hasDoctorVisit && (
             <div className="flex items-start gap-3 pt-4 border-t border-slate-200 dark:border-slate-700"><Stethoscope className="w-4 h-4 text-blue-500 mt-1 shrink-0" /><div className="flex-1"><span className="text-xs text-slate-400 block mb-1">就诊记录 ({course.department} {course.visitDate})</span><p className="text-sm font-semibold text-slate-700 dark:text-slate-200">诊断：{course.diagnosis || '未填写'}</p>{course.prescription && <div className="mt-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 leading-relaxed"><span className="font-bold block mb-1 text-slate-700 dark:text-slate-300">处方/医嘱：</span>{course.prescription}</div>}</div></div>
           )}
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm mt-4">
           <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl"><span className="text-slate-400 text-xs block mb-1">开始日期</span><span className="font-mono text-slate-700 dark:text-slate-200">{course.startDate}</span></div>
           <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl"><span className="text-slate-400 text-xs block mb-1">持续天数</span><span className="font-mono text-slate-700 dark:text-slate-200">{isRecovered && course.endDate ? Math.ceil((safeDate(course.endDate) - safeDate(course.startDate)) / (1000 * 60 * 60 * 24)) + 1 : getDaysSince(course.startDate)} 天</span></div>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 px-2">病程时间轴</h3>
        <div className="space-y-8 relative pl-4 border-l-2 border-slate-100 dark:border-slate-800 ml-4">
          {timelineData.length === 0 ? <p className="text-slate-400 text-sm pl-4">暂无记录。</p> : timelineData.map(({ day, logs }) => (
              <div key={day} className="relative pl-6">
                <div className="absolute -left-[29px] top-0 p-1"><div className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">Day {day}</div></div>
                <div className="space-y-3">{logs.map(log => <LogItem key={log.id} log={log} onDelete={onDeleteLog} onEdit={onEditLog} simple />)}</div>
              </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HistoryView({ logs, courses = [], onDelete, onEdit, autoFocus = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef(null);
  useEffect(() => { if (autoFocus && inputRef.current) inputRef.current.focus(); }, [autoFocus]);

  const filteredLogs = useMemo(() => {
    if (!searchTerm.trim()) return logs;
    const lowerTerm = searchTerm.toLowerCase();
    return logs.filter(log => {
      const matchName = log.name?.toLowerCase().includes(lowerTerm);
      const matchPart = log.bodyPart?.toLowerCase().includes(lowerTerm);
      const matchNote = log.note?.toLowerCase().includes(lowerTerm);
      const dateStr = formatDate(log.timestamp).toLowerCase();
      const matchDate = dateStr.includes(lowerTerm);
      let matchCourse = false;
      if (log.courseId && courses.length > 0) {
        const course = courses.find(c => c.id === log.courseId);
        if (course && course.name.toLowerCase().includes(lowerTerm)) matchCourse = true;
      }
      return matchName || matchPart || matchNote || matchDate || matchCourse;
    });
  }, [logs, searchTerm, courses]);

  const sortedLogs = [...filteredLogs].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="space-y-4 animate-fade-in">
       <div className="sticky top-0 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-sm pt-2 pb-4 z-10">
         <div className="relative"><Search className="absolute left-4 top-4 w-5 h-5 text-slate-400" /><input ref={inputRef} type="text" placeholder="搜索症状、药品、病程、日期..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 focus:border-indigo-300 dark:focus:border-indigo-700 transition-all text-slate-800 dark:text-slate-100" />{searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>}</div>
       </div>
       <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 px-2">{searchTerm ? `找到 ${sortedLogs.length} 条记录` : '全部历史记录'}</h3>
       {sortedLogs.length === 0 && <div className="text-center py-10 text-slate-400">{searchTerm ? '没有找到相关记录' : '暂无记录'}</div>}
       {sortedLogs.map(log => <LogItem key={log.id} log={log} onDelete={onDelete} onEdit={onEdit} />)}
    </div>
  );
}

export function SettingsView({ onExport, onImport, fileInputRef, handleImport, webdavConfig, setWebdavConfig, onSync }) {
  const [showWebDav, setShowWebDav] = useState(false);
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-indigo-600 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-200 dark:shadow-none"><h3 className="font-bold text-lg mb-2">数据管理</h3><p className="text-indigo-100 text-xs leading-relaxed mb-0">数据默认存储在本地浏览器。为了防止丢失，建议定期备份。</p></div>
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden p-5">
        <button onClick={() => setShowWebDav(!showWebDav)} className="w-full flex justify-between items-center mb-2"><div className="flex items-center gap-3 font-bold text-slate-700 dark:text-slate-200"><Cloud className="w-5 h-5 text-blue-500" /> WebDAV 云同步 (Beta)</div><ChevronRight className={`w-4 h-4 text-slate-300 transition-transform ${showWebDav ? 'rotate-90' : ''}`} /></button>
        {showWebDav && <div className="mt-4 space-y-4 bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl text-sm animate-fade-in"><div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-800 text-xs leading-relaxed">⚠️ 注意：浏览器由于安全策略(CORS)，可能无法直接连接网盘。</div><div><label className="block text-slate-500 dark:text-slate-400 mb-1.5 text-xs font-bold uppercase">服务器 URL</label><input type="text" value={webdavConfig.url} onChange={(e) => setWebdavConfig({...webdavConfig, url: e.target.value})} className="w-full p-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl outline-none focus:border-indigo-400 transition-colors text-slate-800 dark:text-slate-100" /></div><div><label className="block text-slate-500 dark:text-slate-400 mb-1.5 text-xs font-bold uppercase">账号</label><input type="text" value={webdavConfig.username} onChange={(e) => setWebdavConfig({...webdavConfig, username: e.target.value})} className="w-full p-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl outline-none focus:border-indigo-400 transition-colors text-slate-800 dark:text-slate-100" /></div><div><label className="block text-slate-500 dark:text-slate-400 mb-1.5 text-xs font-bold uppercase">密码</label><input type="password" value={webdavConfig.password} onChange={(e) => setWebdavConfig({...webdavConfig, password: e.target.value})} className="w-full p-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl outline-none focus:border-indigo-400 transition-colors text-slate-800 dark:text-slate-100" /></div><button onClick={onSync} className="w-full py-3 bg-blue-600 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors font-bold"><RefreshCw className="w-4 h-4" /> 立即同步上传</button></div>}
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden"><button onClick={onExport} className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 transition-colors"><span className="flex items-center gap-3 font-bold text-sm text-slate-700 dark:text-slate-200"><Download className="w-5 h-5 text-emerald-500"/> 导出备份 (JSON)</span><ChevronRight className="w-4 h-4 text-slate-300" /></button><button onClick={onImport} className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"><span className="flex items-center gap-3 font-bold text-sm text-slate-700 dark:text-slate-200"><Upload className="w-5 h-5 text-amber-500"/> 恢复数据</span><ChevronRight className="w-4 h-4 text-slate-300" /></button><input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json"/></div>
    </div>
  );
}

export function StatsView({ logs }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay(); 
    const blanks = Array(startingDay).fill(null);
    const days = Array.from({length: daysInMonth}, (_, i) => i + 1);
    const dayMap = {};
    logs.forEach(log => {
      const logDate = safeDate(log.timestamp);
      if (logDate.getFullYear() === year && logDate.getMonth() === month) {
        const day = logDate.getDate();
        if (!dayMap[day]) dayMap[day] = { hasSymptom: false, hasMed: false };
        if (log.type === 'symptom') dayMap[day].hasSymptom = true;
        if (log.type === 'medication') dayMap[day].hasMed = true;
      }
    });
    return { blanks, days, dayMap };
  }, [currentDate, logs]);

  const partStats = useMemo(() => {
    const counts = {};
    logs.filter(l => l.type === 'symptom').forEach(l => { counts[l.bodyPart] = (counts[l.bodyPart] || 0) + 1; });
    return Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 5);
  }, [logs]);

  const changeMonth = (offset) => { const newDate = new Date(currentDate); newDate.setMonth(newDate.getMonth() + offset); setCurrentDate(newDate); };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-800 dark:text-white text-lg">{currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月</h3>
          <div className="flex gap-2"><button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400"/></button><button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400"/></button></div>
        </div>
        <div className="grid grid-cols-7 gap-2 text-center mb-2">{['日','一','二','三','四','五','六'].map(d => <span key={d} className="text-xs font-medium text-slate-400 dark:text-slate-500">{d}</span>)}</div>
        <div className="grid grid-cols-7 gap-2">
          {calendarData.blanks.map((_, i) => <div key={`blank-${i}`} className="h-10"></div>)}
          {calendarData.days.map(day => {
             const status = calendarData.dayMap[day];
             let bgClass = "bg-slate-50 dark:bg-slate-800";
             let textClass = "text-slate-400 dark:text-slate-500";
             let borderClass = "border-transparent";
             if (status) {
               if (status.hasSymptom && status.hasMed) { bgClass = "bg-purple-100 dark:bg-purple-900/30"; textClass = "text-purple-700 dark:text-purple-300 font-bold"; borderClass = "border-purple-200 dark:border-purple-800"; } 
               else if (status.hasSymptom) { bgClass = "bg-rose-100 dark:bg-rose-900/30"; textClass = "text-rose-700 dark:text-rose-300 font-bold"; borderClass = "border-rose-200 dark:border-rose-800"; } 
               else if (status.hasMed) { bgClass = "bg-indigo-100 dark:bg-indigo-900/30"; textClass = "text-indigo-700 dark:text-indigo-300 font-bold"; borderClass = "border-indigo-200 dark:border-indigo-800"; }
             }
             return <div key={day} className={`h-10 rounded-xl flex items-center justify-center text-sm border ${bgClass} ${textClass} ${borderClass}`}>{day}</div>;
          })}
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-rose-500" /> 高频不适部位</h3>
        <div className="space-y-4">{partStats.length === 0 ? <p className="text-sm text-slate-400">暂无数据</p> : partStats.map(([part, count], index) => (<div key={part} className="flex items-center gap-4"><span className="text-xs font-mono text-slate-400 w-4">{index+1}</span><div className="flex-1"><div className="flex justify-between text-sm mb-2"><span className="font-medium text-slate-700 dark:text-slate-300">{part}</span><span className="text-slate-500 dark:text-slate-400 font-medium">{count}次</span></div><div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden"><div className="bg-rose-400 h-full rounded-full" style={{ width: `${Math.min(100, (count / partStats[0][1]) * 100)}%` }}></div></div></div></div>))}</div>
      </div>
    </div>
  );
}
