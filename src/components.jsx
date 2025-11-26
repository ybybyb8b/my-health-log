import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Activity, Pill, Trash2, X, ChevronLeft, ChevronRight,
  Clock, CheckCircle2, Stethoscope, Clipboard, BarChart3,
  AlertTriangle, GitCommit, Search, Cloud, RefreshCw,
  Download, Upload, Pencil, History, Home, LayoutDashboard, BookOpen, ArrowUpDown
} from 'lucide-react';
import { 
  formatDate, getDaysSince, safeDate, getLocalTodayDate, toInputDateTime, formatTimeOnly,
  MEDICATION_METHODS, DEFAULT_BODY_PARTS 
} from './utils';

// --- ErrorBoundary ---
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("App crashed:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center font-sans">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 max-w-sm w-full">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">糟糕，应用崩溃了</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">请尝试刷新，数据已安全保存。</p>
            <button onClick={() => window.location.reload()} className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg">
              <RefreshCw className="w-5 h-5" /> 重新加载
            </button>
          </div>
        </div>
      );
    }
    return this.props.children; 
  }
}

// --- Views ---

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

export function LogItem({ log, onDelete, onEdit, simple = false }) {
  const isSymptom = log.type === 'symptom';
  const isProgression = log.isProgression; 
  return (
    <div className={`group bg-white dark:bg-slate-900 rounded-[1.5rem] border transition-all flex justify-between items-start ${simple ? 'p-3' : 'p-5'} ${isProgression ? 'border-orange-300 bg-orange-50/50 dark:bg-orange-900/20 dark:border-orange-700' : 'border-slate-100 dark:border-slate-800 hover:shadow-md'}`}>
      <div className="flex gap-4 items-start">
        <div className={`mt-0.5 p-2 rounded-xl h-fit ${isSymptom ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400'}`}>{isSymptom ? <Activity className="w-5 h-5"/> : <Pill className="w-5 h-5"/>}</div>
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {isProgression && <span className="bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 font-bold"><AlertTriangle className="w-3 h-3" /> 病情演变</span>}
            <h4 className="font-bold text-slate-700 dark:text-slate-200 text-base">{isSymptom ? log.bodyPart : log.name}</h4>
            {isSymptom && <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${log.severity > 7 ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>{log.severity}级</span>}
            {!isSymptom && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">{log.method === 'other' ? log.methodLabel : MEDICATION_METHODS.find(m => m.id === log.method)?.label}</span>}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-snug break-all">{isSymptom ? (log.note || '') : `${log.dosage} ${log.reason ? `• ${log.reason}` : ''}`}</p>
          {!simple && <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-mono">{formatDate(log.timestamp)}</p>}
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && <button onClick={() => onEdit(log)} className="p-1.5 text-slate-300 hover:text-blue-500 transition-colors"><Pencil className="w-4 h-4" /></button>}
          <button onClick={() => onDelete(log.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
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

export function NewCourseForm({ onSubmit }) {
  const [data, setData] = useState({ name: '', startDate: new Date().toISOString().slice(0, 10), symptoms: '', hasDoctorVisit: false, visitDate: new Date().toISOString().slice(0, 10), department: '', diagnosis: '', prescription: '' });
  return (
    <div className="space-y-5 pb-10">
      <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">病程名称</label><input autoFocus type="text" value={data.name} onChange={(e) => setData({...data, name: e.target.value})} placeholder="例如：2024冬季甲流、急性肠胃炎..." className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition-all text-slate-800 dark:text-white" /></div>
      <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">开始日期</label><input type="date" value={data.startDate} onChange={(e) => setData({...data, startDate: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition-all text-slate-800 dark:text-white" /></div>
      <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">主要症状描述</label><textarea value={data.symptoms} onChange={(e) => setData({...data, symptoms: e.target.value})} placeholder="发烧、咳嗽、全身酸痛..." className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none h-24 text-sm resize-none transition-all text-slate-800 dark:text-white" /></div>
      <div className="border-t border-slate-100 dark:border-slate-800 pt-4"><div className="flex items-center gap-3 mb-4"><input type="checkbox" id="doctorVisit" checked={data.hasDoctorVisit} onChange={(e) => setData({...data, hasDoctorVisit: e.target.checked})} className="w-5 h-5 accent-indigo-600 rounded" /><label htmlFor="doctorVisit" className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Stethoscope className="w-4 h-4 text-blue-500" /> 是否就医？</label></div>{data.hasDoctorVisit && <div className="bg-blue-50/50 dark:bg-blue-900/20 p-5 rounded-2xl space-y-4 animate-fade-in border border-blue-100 dark:border-blue-800"><div><label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">就诊日期</label><input type="date" value={data.visitDate} onChange={(e) => setData({...data, visitDate: e.target.value})} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-blue-400 text-slate-800 dark:text-white" /></div><div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">就诊科室</label><input type="text" placeholder="如：呼吸内科" value={data.department} onChange={(e) => setData({...data, department: e.target.value})} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-blue-400 text-slate-800 dark:text-white" /></div><div><label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">医生诊断</label><input type="text" placeholder="确诊结果" value={data.diagnosis} onChange={(e) => setData({...data, diagnosis: e.target.value})} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-blue-400 text-slate-800 dark:text-white" /></div></div><div><label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">处方/医嘱/用药方案</label><textarea placeholder="记录医生开的药或建议..." value={data.prescription} onChange={(e) => setData({...data, prescription: e.target.value})} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none h-20 focus:border-blue-400 resize-none text-slate-800 dark:text-white" /></div></div>}</div>
      <button onClick={() => { if (!data.name) return alert('请输入名称'); onSubmit(data); }} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-transform active:scale-[0.98]">开启病程档案</button>
    </div>
  );
}

export function SymptomForm({ onSubmit, defaultParts, customParts, onAddPart, activeCourses, editingLog }) {
  const [formData, setFormData] = useState(() => {
    const initialDate = editingLog ? toInputDateTime(editingLog.timestamp).split('T')[0] : getLocalTodayDate();
    return {
      bodyPart: '', severity: 3, note: '', 
      courseId: activeCourses.length > 0 ? activeCourses[0].id : '', 
      isProgression: false, 
      ...editingLog,
      recordDate: initialDate
    };
  });

  // Sync form data when editingLog changes
  useEffect(() => {
    if (editingLog) {
        const datePart = new Date(editingLog.timestamp).toISOString().split('T')[0];
        setFormData({
            ...editingLog,
            recordDate: datePart
        });
    } else {
        // Reset to defaults if not editing
        setFormData({
            bodyPart: '', severity: 3, note: '', 
            courseId: activeCourses.length > 0 ? activeCourses[0].id : '', 
            isProgression: false, 
            recordDate: getLocalTodayDate()
        });
    }
  }, [editingLog, activeCourses]);

  const [newPart, setNewPart] = useState('');
  const [isAddingPart, setIsAddingPart] = useState(false);
  const handleAddPart = () => { if (onAddPart(newPart)) { setFormData({...formData, bodyPart: newPart}); setIsAddingPart(false); setNewPart(''); } else { alert('无效或已存在'); } };
  const allParts = [...defaultParts, ...customParts];

  return (
    <div className="space-y-6">
      {activeCourses.length > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl space-y-3">
          <label className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase">关联病程</label>
          <div className="flex flex-col gap-2">
            {activeCourses.map(course => (
              <div key={course.id} className="flex items-center gap-2">
                <input type="radio" name="courseSelector" id={`c-${course.id}`} checked={formData.courseId === course.id} onChange={() => setFormData({...formData, courseId: course.id})} className="w-4 h-4 accent-indigo-600" />
                <label htmlFor={`c-${course.id}`} className="text-sm text-slate-700 dark:text-slate-300">{course.name}</label>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <input type="radio" name="courseSelector" id="c-none" checked={formData.courseId === ''} onChange={() => setFormData({...formData, courseId: ''})} className="w-4 h-4 accent-indigo-600" />
              <label htmlFor="c-none" className="text-sm text-slate-500 dark:text-slate-400">不关联 (日常记录)</label>
            </div>
          </div>
          {formData.courseId && <div className="ml-6 flex items-center gap-2 bg-white/50 dark:bg-white/5 p-2 rounded-lg border border-indigo-100 dark:border-indigo-800 mt-2"><input type="checkbox" id="progression" checked={formData.isProgression} onChange={(e) => setFormData({...formData, isProgression: e.target.checked})} className="w-4 h-4 accent-orange-500 rounded" /><label htmlFor="progression" className="text-xs text-indigo-800 dark:text-indigo-300 flex items-center gap-1 font-medium"><GitCommit className="w-4 h-4 text-orange-500" /> 标记为病情变化/转折</label></div>}
        </div>
      )}
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">不适部位</label>
        <div className="flex flex-wrap gap-2">
          {allParts.map(part => (
            <button key={part} onClick={() => setFormData({...formData, bodyPart: part})} className={`px-4 py-2.5 rounded-xl text-sm transition-all border ${formData.bodyPart === part ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-500 text-rose-700 dark:text-rose-300 shadow-sm font-medium' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'}`}>{part}</button>
          ))}
          {isAddingPart ? <div className="flex items-center gap-2 animate-fade-in"><input autoFocus type="text" value={newPart} onChange={(e) => setNewPart(e.target.value)} placeholder="部位..." className="w-24 px-3 py-2 text-sm border border-indigo-300 rounded-xl outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-white" /><button onClick={handleAddPart} className="p-2 bg-indigo-600 text-white rounded-xl"><Plus className="w-4 h-4"/></button></div> : <button onClick={() => setIsAddingPart(true)} className="px-4 py-2.5 rounded-xl text-sm border border-dashed border-slate-300 dark:border-slate-600 text-slate-400 hover:text-indigo-600 flex items-center gap-1 hover:border-indigo-300 transition-colors"><Plus className="w-4 h-4" /> 自定义</button>}
        </div>
      </div>
      <div>
        <div className="flex justify-between mb-2"><label className="text-sm font-semibold text-slate-700 dark:text-slate-300">严重程度</label><span className="text-sm font-mono text-slate-500 dark:text-slate-400">{formData.severity} / 10</span></div>
        <input type="range" min="1" max="10" value={formData.severity} onChange={(e) => setFormData({...formData, severity: parseInt(e.target.value)})} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none accent-rose-500 cursor-pointer" />
        <div className="flex justify-between mt-2 text-xs text-slate-400 dark:text-slate-500 font-medium"><span>😊 轻微</span><span>😫 剧烈</span></div>
      </div>
      <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">详细描述</label><textarea value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none text-sm min-h-[100px] resize-none transition-all text-slate-800 dark:text-white" placeholder={formData.isProgression ? "请详细描述病情发生了什么变化..." : "例如：刺痛、持续时间..."} /></div>
      <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">记录日期</label><input type="date" value={formData.recordDate} onChange={(e) => setFormData({...formData, recordDate: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none text-sm text-slate-800 dark:text-white" /></div>
      <button onClick={() => { 
          if(!formData.bodyPart) return alert('请选择部位'); 
          let finalDate = new Date(formData.recordDate.replace(/-/g, '/')); 
          if (!editingLog) {
               const today = new Date(); 
               if (finalDate.toDateString() === today.toDateString()) { finalDate = today; } else { finalDate.setHours(12, 0, 0, 0); } 
          } else {
               const originalTime = new Date(editingLog.timestamp);
               finalDate.setHours(originalTime.getHours(), originalTime.getMinutes());
          }
          
          const timestamp = finalDate.toISOString(); 
          onSubmit({ type: 'symptom', ...formData, timestamp }); 
      }} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-transform active:scale-[0.98]">{editingLog ? '更新记录' : '保存记录'}</button>
    </div>
  );
}

export function MedicationForm({ onSubmit, activeCourses, editingLog }) {
  const [formData, setFormData] = useState(() => {
    const initialDate = editingLog ? toInputDateTime(editingLog.timestamp).split('T')[0] : getLocalTodayDate();
    return {
        name: '', method: 'oral', customMethod: '', dosage: '', reason: '', 
        courseId: activeCourses.length > 0 ? activeCourses[0].id : '', 
        ...editingLog,
        recordDate: initialDate
    };
  });
  
  useEffect(() => {
    if (editingLog) {
        const datePart = new Date(editingLog.timestamp).toISOString().split('T')[0];
        setFormData({ ...editingLog, recordDate: datePart });
    } else {
        setFormData({ 
            name: '', method: 'oral', customMethod: '', dosage: '', reason: '', 
            courseId: activeCourses.length > 0 ? activeCourses[0].id : '', 
            recordDate: getLocalTodayDate() 
        });
    }
  }, [editingLog, activeCourses]);

  return (
    <div className="space-y-6">
      {activeCourses.length > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl space-y-3">
          <label className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase">关联病程</label>
          <div className="flex flex-col gap-2">
            {activeCourses.map(course => (
              <div key={course.id} className="flex items-center gap-2">
                <input type="radio" name="courseSelectorMed" id={`cm-${course.id}`} checked={formData.courseId === course.id} onChange={() => setFormData({...formData, courseId: course.id})} className="w-4 h-4 accent-indigo-600" />
                <label htmlFor={`cm-${course.id}`} className="text-sm text-slate-700 dark:text-slate-300">{course.name}</label>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <input type="radio" name="courseSelectorMed" id="cm-none" checked={formData.courseId === ''} onChange={() => setFormData({...formData, courseId: ''})} className="w-4 h-4 accent-indigo-600" />
              <label htmlFor="cm-none" className="text-sm text-slate-500 dark:text-slate-400">不关联 (日常记录)</label>
            </div>
          </div>
        </div>
      )}
      <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">药品/治疗名称</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition-all text-slate-800 dark:text-white" placeholder="例如：奥司他韦..." /></div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">给药方式</label>
        <div className="grid grid-cols-5 gap-2">
          {MEDICATION_METHODS.map(m => (
            <button key={m.id} onClick={() => setFormData({...formData, method: m.id})} className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border transition-all ${formData.method === m.id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>{m.icon}</button>
          ))}
        </div>
        {formData.method === 'other' ? <input autoFocus type="text" value={formData.customMethod} onChange={(e) => setFormData({...formData, customMethod: e.target.value})} placeholder="请输入具体方式" className="mt-3 w-full p-3 bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm text-center outline-none focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white" /> : <p className="text-center text-xs text-slate-400 mt-2 font-medium">{MEDICATION_METHODS.find(m=>m.id===formData.method)?.label}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">用量</label><input type="text" value={formData.dosage} onChange={(e) => setFormData({...formData, dosage: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none text-sm text-slate-800 dark:text-white" placeholder="如：75mg" /></div>
        <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">原因</label><input type="text" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none text-sm text-slate-800 dark:text-white" placeholder="如：发热" /></div>
      </div>
      <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">用药日期</label><input type="date" value={formData.recordDate} onChange={(e) => setFormData({...formData, recordDate: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none text-sm text-slate-800 dark:text-white" /></div>
      <button onClick={() => { 
          if(!formData.name) return alert('请输入名称'); 
          const finalData = { ...formData }; 
          if (formData.method === 'other') { if (!formData.customMethod) return alert('请输入具体方式'); finalData.methodLabel = formData.customMethod; } 
          let finalDate = new Date(formData.recordDate.replace(/-/g, '/')); 
          if (!editingLog) {
             const today = new Date(); 
             if (finalDate.toDateString() === today.toDateString()) { finalDate = today; } else { finalDate.setHours(12, 0, 0, 0); } 
          } else {
             const originalTime = new Date(editingLog.timestamp);
             finalDate.setHours(originalTime.getHours(), originalTime.getMinutes());
          }
          const timestamp = finalDate.toISOString(); 
          onSubmit({ type: 'medication', ...finalData, timestamp }); 
      }} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-transform active:scale-[0.98]">{editingLog ? '更新记录' : '保存记录'}</button>
    </div>
  );
}
