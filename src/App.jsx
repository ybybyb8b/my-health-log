import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Activity, 
  Plus, 
  Settings, 
  Download, 
  Upload, 
  Trash2, 
  X, 
  ChevronLeft,
  ChevronRight, 
  Droplet, 
  Pill,    
  Syringe, 
  Wind,    
  FileText,
  Clock,
  BookOpen, 
  CheckCircle2,
  Stethoscope, 
  Clipboard,
  BarChart3,
  AlertTriangle,
  GitCommit,
  Search,
  Cloud,
  RefreshCw,
  History,
  Home, // ✅ 替换回最稳妥的 Home 图标
  Calendar
} from 'lucide-react';

// --- 基础配置 ---
const DEFAULT_BODY_PARTS = ['头部', '眼部', '呼吸道', '心脏', '胃肠', '皮肤', '关节', '肌肉', '睡眠/精神', '体温'];

const MEDICATION_METHODS = [
  { id: 'oral', label: '口服', icon: <Pill className="w-4 h-4"/> },
  { id: 'external', label: '外用', icon: <Droplet className="w-4 h-4"/> },
  { id: 'injection', label: '注射', icon: <Syringe className="w-4 h-4"/> },
  { id: 'inhalation', label: '吸入', icon: <Wind className="w-4 h-4"/> },
  { id: 'other', label: '其他', icon: <FileText className="w-4 h-4"/> },
];

// --- iOS 安全日期转换 ---
const safeDate = (dateInput) => {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;
  if (typeof dateInput === 'string') {
    if (dateInput.includes('-') && !dateInput.includes('T')) {
        return new Date(dateInput.replace(/-/g, '/'));
    }
    return new Date(dateInput);
  }
  return new Date();
};

// --- 辅助函数 ---
const formatDate = (isoString) => {
  if (!isoString) return '';
  const date = safeDate(isoString);
  if (isNaN(date.getTime())) return '时间错误';
  return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const formatDateOnly = (isoString) => {
  if (!isoString) return '';
  const date = safeDate(isoString);
  if (isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
};

const getDaysSince = (startDate) => {
  if (!startDate) return 0;
  const start = safeDate(startDate);
  if (isNaN(start.getTime())) return 0;
  
  start.setHours(0,0,0,0);
  const now = new Date();
  now.setHours(0,0,0,0);
  
  const diffTime = now - start; 
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays + 1; 
};

const getLocalTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- 数据安全读取 (防止白屏的核心) ---
const safeParseArray = (key) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return [];
    const parsed = JSON.parse(item);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error(`Error parsing ${key}:`, e);
    return [];
  }
};

export default function App() {
  // --- State ---
  const [activeView, setActiveView] = useState('dashboard'); 
  const [viewParams, setViewParams] = useState({}); 
  
  const [logs, setLogs] = useState([]);
  const [courses, setCourses] = useState([]); 
  const [customParts, setCustomParts] = useState([]);
  
  const [webdavConfig, setWebdavConfig] = useState({
    url: '',
    username: '',
    password: '',
    enabled: false
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('symptom'); 
  const [isFabOpen, setIsFabOpen] = useState(false);
  
  // 用于控制是否自动聚焦搜索框
  const [autoFocusSearch, setAutoFocusSearch] = useState(false);
  
  const fileInputRef = useRef(null);

  // --- Effects: 增加数据读取的健壮性 ---
  useEffect(() => {
    setLogs(safeParseArray('hl_logs'));
    setCourses(safeParseArray('hl_courses'));
    setCustomParts(safeParseArray('hl_custom_parts'));
    
    try {
      const savedWebdav = localStorage.getItem('hl_webdav');
      if (savedWebdav) setWebdavConfig(JSON.parse(savedWebdav));
    } catch (e) {}
  }, []);

  useEffect(() => { localStorage.setItem('hl_logs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('hl_custom_parts', JSON.stringify(customParts)); }, [customParts]);
  useEffect(() => { localStorage.setItem('hl_courses', JSON.stringify(courses)); }, [courses]);
  useEffect(() => { localStorage.setItem('hl_webdav', JSON.stringify(webdavConfig)); }, [webdavConfig]);

  // --- Actions ---
  const handleAddLog = (newLog) => {
    const logEntry = {
      id: Date.now().toString(36),
      timestamp: newLog.timestamp || new Date().toISOString(),
      ...newLog
    };
    setLogs([logEntry, ...logs]);
    setIsModalOpen(false);
    setIsFabOpen(false); 
  };

  const handleAddCourse = (courseData) => {
    const newCourse = {
      id: Date.now().toString(36),
      status: 'active', 
      ...courseData
    };
    setCourses([newCourse, ...courses]);
    setIsModalOpen(false);
    setIsFabOpen(false);
  };

  const handleUpdateCourseStatus = (courseId, status) => {
    setCourses(prevCourses => prevCourses.map(c => {
      if (c.id === courseId) {
        return { 
          ...c, 
          status, 
          endDate: status === 'recovered' ? new Date().toISOString() : null 
        };
      }
      return c;
    }));
    if(activeView === 'courseDetail') {
        setViewParams({ ...viewParams, _ts: Date.now() });
    }
  };

  const handleDeleteLog = (id) => {
    if (window.confirm('确认删除这条记录吗？')) {
      setLogs(logs.filter(l => l.id !== id));
    }
  };

  const handleAddCustomPart = (partName) => {
    if (partName && !customParts.includes(partName) && !DEFAULT_BODY_PARTS.includes(partName)) {
      setCustomParts([...customParts, partName]);
      return true;
    }
    return false;
  };

  const navigateToCourse = (courseId) => {
    setViewParams({ courseId });
    setActiveView('courseDetail');
  };

  const handleGlobalSearch = () => {
    setActiveView('history');
    setAutoFocusSearch(true);
    setTimeout(() => setAutoFocusSearch(false), 500);
  };

  // 防御性检查: 确保 courses 是数组
  const safeCourses = Array.isArray(courses) ? courses : [];
  const activeCourses = useMemo(() => safeCourses.filter(c => c.status === 'active'), [safeCourses]);

  const stats = useMemo(() => {
    const symptomLogs = logs.filter(l => l.type === 'symptom');
    const medLogs = logs.filter(l => l.type === 'medication');
    return { symptomCount: symptomLogs.length, medCount: medLogs.length };
  }, [logs]);

  const exportData = () => {
    const dataStr = JSON.stringify({ logs, customParts, courses }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health_backup_${formatDateOnly(new Date())}.json`;
    a.click();
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (Array.isArray(data.logs)) setLogs(data.logs);
        if (Array.isArray(data.customParts)) setCustomParts(data.customParts);
        if (Array.isArray(data.courses)) setCourses(data.courses);
        alert('数据恢复成功！');
      } catch (err) { alert('文件格式错误'); }
    };
    reader.readAsText(file);
  };

  const handleWebDavSync = async () => {
    alert('网页版受浏览器安全限制可能无法直接连接网盘。建议使用“导出备份”功能保存 JSON 文件。');
  };

  return (
    <div className="min-h-screen bg-gray-100/80 text-slate-800 font-sans flex flex-col max-w-lg mx-auto shadow-2xl border-x border-slate-200 relative overflow-hidden">
      {/* 顶部栏 */}
      <header className="px-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-4 bg-white/80 backdrop-blur-md sticky top-0 z-20 flex justify-between items-center border-b border-slate-50">
        {activeView === 'courseDetail' ? (
           <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-1 text-slate-500 hover:text-black transition-colors font-medium">
             <ChevronLeft className="w-5 h-5" /> 返回
           </button>
        ) : (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="w-6 h-6 text-indigo-600"/> 健康日志
            </h1>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <button onClick={handleGlobalSearch} className="p-2.5 rounded-full text-slate-400 hover:bg-slate-50 active:bg-slate-100 transition-all">
            <Search className="w-6 h-6" strokeWidth={2} />
          </button>
          <button onClick={() => setActiveView(activeView === 'settings' ? 'dashboard' : 'settings')} className={`p-2.5 rounded-full transition-all active:scale-95 ${activeView === 'settings' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:bg-slate-50'}`}>
            <Settings className="w-6 h-6" strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide pb-36">
        {activeView === 'settings' && (
           <SettingsView 
             onExport={exportData} 
             onImport={() => fileInputRef.current.click()} 
             fileInputRef={fileInputRef} 
             handleImport={importData}
             webdavConfig={webdavConfig}
             setWebdavConfig={setWebdavConfig}
             onSync={handleWebDavSync}
           />
        )}
        {activeView === 'history' && <HistoryView logs={logs} courses={courses} onDelete={handleDeleteLog} autoFocus={autoFocusSearch} />}
        {activeView === 'stats' && <StatsView logs={logs} />}
        {activeView === 'courseDetail' && (
          <CourseDetailView 
            course={safeCourses.find(c => c.id === viewParams.courseId)} 
            logs={logs.filter(l => l.courseId === viewParams.courseId)}
            onUpdateStatus={handleUpdateCourseStatus}
            onDeleteLog={handleDeleteLog}
          />
        )}
        {activeView === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            {/* 多病程展示 */}
            {activeCourses.length > 0 ? (
              <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-5 px-5 scrollbar-hide">
                {activeCourses.map(course => (
                  <div 
                    key={course.id}
                    onClick={() => navigateToCourse(course.id)}
                    className="min-w-[85%] snap-center bg-gradient-to-br from-indigo-600 to-violet-600 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-200 cursor-pointer relative overflow-hidden group transition-transform active:scale-[0.98]"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                       <Activity className="w-32 h-32" />
                    </div>
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div>
                        <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase backdrop-blur-sm">进行中</span>
                        <h2 className="text-xl font-bold mt-3 mb-1 truncate max-w-[180px]">{course.name}</h2>
                        <p className="text-indigo-100 text-sm opacity-90 truncate max-w-[200px]">
                            {course.diagnosis || course.description || '无详细描述'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="block text-5xl font-bold tracking-tighter">{getDaysSince(course.startDate)}</span>
                        <span className="text-xs text-indigo-200 font-medium uppercase tracking-widest">Days</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono bg-black/20 w-fit px-3 py-1.5 rounded-lg backdrop-blur-sm">
                       <Clock className="w-3 h-3" />
                       开始于 {course.startDate}
                    </div>
                  </div>
                ))}
                
                <div 
                  onClick={() => { setModalType('newCourse'); setIsModalOpen(true); }}
                  className="min-w-[20%] snap-center flex items-center justify-center bg-white border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-300 cursor-pointer active:bg-slate-50"
                >
                   <Plus className="w-8 h-8" />
                </div>
              </div>
            ) : (
              <div 
                onClick={() => { setModalType('newCourse'); setIsModalOpen(true); }}
                className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] p-8 text-center hover:border-indigo-400 hover:bg-indigo-50/50 transition-all cursor-pointer group"
              >
                <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-100 transition-colors shadow-sm">
                  <BookOpen className="w-7 h-7 text-slate-400 group-hover:text-indigo-600" />
                </div>
                <h3 className="font-bold text-slate-700 text-lg">开启新病程</h3>
                <p className="text-xs text-slate-400 mt-2">记录一次完整的生病周期（如：甲流、慢性病）</p>
              </div>
            )}

            {/* 概览统计 */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-rose-50 text-rose-500 rounded-xl"><Activity className="w-5 h-5"/></div>
                    <span className="text-xs font-bold text-slate-400 uppercase">累计不适</span>
                  </div>
                  <p className="text-3xl font-bold text-slate-800 tracking-tight">{stats.symptomCount}</p>
               </div>
               <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-blue-50 text-blue-500 rounded-xl"><Pill className="w-5 h-5"/></div>
                    <span className="text-xs font-bold text-slate-400 uppercase">累计用药</span>
                  </div>
                  <p className="text-3xl font-bold text-slate-800 tracking-tight">{stats.medCount}</p>
               </div>
            </div>

            {/* 最新动态 */}
            <div>
              <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">最新动态</h3>
              </div>
              <div className="space-y-3">
                {logs.length === 0 ? (
                    <p className="text-center text-slate-300 text-sm py-4">暂无记录</p>
                ) : (
                    logs.slice(0, 5).map(log => <LogItem key={log.id} log={log} onDelete={handleDeleteLog} />)
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- 底部悬浮操作区 --- */}
      <div className="fixed bottom-8 left-0 right-0 px-6 max-w-lg mx-auto flex items-end justify-between gap-4 pointer-events-none z-50">
         
         {/* 左侧：灵动岛导航 */}
         <div className="flex-1 bg-[#1c1c1e]/90 backdrop-blur-xl shadow-2xl rounded-[2.5rem] p-1.5 pl-2 pr-2 h-[4.5rem] flex items-center justify-between pointer-events-auto border border-white/10 relative">
            <button 
              onClick={() => setActiveView('dashboard')}
              className={`flex-1 h-full rounded-[2rem] flex flex-col items-center justify-center gap-1 transition-all duration-300 relative z-10 ${activeView === 'dashboard' ? 'text-white font-semibold' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {activeView === 'dashboard' && <div className="absolute inset-0 bg-blue-600 rounded-[2rem] shadow-lg -z-10 animate-fade-in" />}
              <Home className="w-6 h-6" strokeWidth={activeView === 'dashboard' ? 2.5 : 2} />
              <span className="text-[10px] tracking-wide">概览</span>
            </button>
            <button 
              onClick={() => setActiveView('stats')}
              className={`flex-1 h-full rounded-[2rem] flex flex-col items-center justify-center gap-1 transition-all duration-300 relative z-10 ${activeView === 'stats' ? 'text-white font-semibold' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {activeView === 'stats' && <div className="absolute inset-0 bg-blue-600 rounded-[2rem] shadow-lg -z-10 animate-fade-in" />}
              <BarChart3 className="w-6 h-6" strokeWidth={activeView === 'stats' ? 2.5 : 2} />
              <span className="text-[10px] tracking-wide">统计</span>
            </button>
            <button 
              onClick={() => setActiveView('history')}
              className={`flex-1 h-full rounded-[2rem] flex flex-col items-center justify-center gap-1 transition-all duration-300 relative z-10 ${activeView === 'history' ? 'text-white font-semibold' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {activeView === 'history' && <div className="absolute inset-0 bg-blue-600 rounded-[2rem] shadow-lg -z-10 animate-fade-in" />}
              <History className="w-6 h-6" strokeWidth={activeView === 'history' ? 2.5 : 2} />
              <span className="text-[10px] tracking-wide">历史</span>
            </button>
         </div>

         {/* 右侧：竖向菜单 */}
         <div className="relative pointer-events-auto flex flex-col items-center">
            <div className={`absolute bottom-0 w-full flex flex-col items-end gap-3 mb-[5.5rem] transition-all duration-300 ${isFabOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
               
               <button 
                 onClick={() => { setModalType('symptom'); setIsModalOpen(true); }}
                 className="flex items-center gap-3 group"
               >
                 <span className="bg-white/90 backdrop-blur text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm whitespace-nowrap border border-white/20">记不适</span>
                 <div className="w-12 h-12 bg-rose-500 text-white rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95 border-2 border-[#f0f0f0]">
                    <Activity className="w-5 h-5" />
                 </div>
               </button>

               <button 
                 onClick={() => { setModalType('medication'); setIsModalOpen(true); }}
                 className="flex items-center gap-3 group"
               >
                 <span className="bg-white/90 backdrop-blur text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm whitespace-nowrap border border-white/20">记用药</span>
                 <div className="w-12 h-12 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95 border-2 border-[#f0f0f0]">
                    <Pill className="w-5 h-5" />
                 </div>
               </button>

               <button 
                 onClick={() => { setModalType('newCourse'); setIsModalOpen(true); }}
                 className="flex items-center gap-3 group"
               >
                 <span className="bg-white/90 backdrop-blur text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm whitespace-nowrap border border-white/20">新病程</span>
                 <div className="w-12 h-12 bg-white text-slate-800 rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95 border-2 border-slate-200">
                     <BookOpen className="w-5 h-5" />
                 </div>
               </button>
            </div>

            <button 
              onClick={() => setIsFabOpen(!isFabOpen)}
              className={`w-[4.5rem] h-[4.5rem] rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 z-50 relative border border-white/10 ${isFabOpen ? 'bg-[#2c2c2e] rotate-45' : 'bg-[#1c1c1e] hover:scale-105 active:scale-95'}`}
            >
              <Plus className="w-8 h-8 text-white" strokeWidth={3} />
            </button>
         </div>
      </div>
      
      {isFabOpen && <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-40 transition-opacity duration-300" onClick={() => setIsFabOpen(false)} />}

      {/* 模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm sm:p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg h-[90vh] sm:h-auto sm:max-h-[90vh] sm:rounded-[2rem] rounded-t-[2rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">
                {modalType === 'symptom' && '记录身体不适'}
                {modalType === 'medication' && '记录用药治疗'}
                {modalType === 'newCourse' && '开启新病程档案'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {modalType === 'newCourse' && <NewCourseForm onSubmit={handleAddCourse} />}
              {modalType === 'symptom' && (
                <SymptomForm 
                  onSubmit={handleAddLog} 
                  defaultParts={DEFAULT_BODY_PARTS} 
                  customParts={customParts} 
                  onAddPart={handleAddCustomPart}
                  activeCourses={activeCourses}
                />
              )}
              {modalType === 'medication' && (
                <MedicationForm 
                  onSubmit={handleAddLog} 
                  activeCourses={activeCourses}
                />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// --- HistoryView 组件 ---
function HistoryView({ logs, courses = [], onDelete, autoFocus = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // 智能搜索逻辑
  const filteredLogs = useMemo(() => {
    if (!searchTerm.trim()) return logs;
    const lowerTerm = searchTerm.toLowerCase();
    
    return logs.filter(log => {
      // 1. 基础字段搜索
      const matchName = log.name?.toLowerCase().includes(lowerTerm);
      const matchPart = log.bodyPart?.toLowerCase().includes(lowerTerm);
      const matchNote = log.note?.toLowerCase().includes(lowerTerm);
      const matchReason = log.reason?.toLowerCase().includes(lowerTerm);
      const matchDosage = log.dosage?.toLowerCase().includes(lowerTerm);
      
      // 2. 日期搜索 (如搜 "11月" 或 "2023")
      const dateStr = formatDate(log.timestamp).toLowerCase();
      const matchDate = dateStr.includes(lowerTerm);

      // 3. 病程名称搜索 (如搜 "甲流")
      let matchCourse = false;
      if (log.courseId && courses.length > 0) {
        const course = courses.find(c => c.id === log.courseId);
        if (course && course.name.toLowerCase().includes(lowerTerm)) {
          matchCourse = true;
        }
      }
      
      return matchName || matchPart || matchNote || matchReason || matchDosage || matchDate || matchCourse;
    });
  }, [logs, searchTerm, courses]);

  const sortedLogs = [...filteredLogs].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="space-y-4 animate-fade-in">
       <div className="sticky top-0 bg-slate-50/95 backdrop-blur-sm pt-2 pb-4 z-10">
         <div className="relative">
           <Search className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
           <input 
             ref={inputRef}
             type="text" 
             placeholder="搜索症状、药品、病程、日期..." 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
           />
           {searchTerm && (
             <button onClick={() => setSearchTerm('')} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
               <X className="w-5 h-5" />
             </button>
           )}
         </div>
       </div>

       <h3 className="text-lg font-bold text-slate-800 mb-2 px-2">
         {searchTerm ? `找到 ${sortedLogs.length} 条记录` : '全部历史记录'}
       </h3>
       
       {sortedLogs.length === 0 && (
         <div className="text-center py-10 text-slate-400">
           {searchTerm ? '没有找到相关记录' : '暂无记录'}
         </div>
       )}
       
       {sortedLogs.map(log => <LogItem key={log.id} log={log} onDelete={onDelete} />)}
    </div>
  );
}

// --- Common Components (LogItem) ---
function LogItem({ log, onDelete, simple = false }) {
  const isSymptom = log.type === 'symptom';
  const isProgression = log.isProgression; 
  
  return (
    <div className={`group bg-white rounded-[1.5rem] border transition-all flex justify-between items-start 
      ${simple ? 'p-3' : 'p-5'} 
      ${isProgression ? 'border-orange-300 bg-orange-50/50' : 'border-slate-100 hover:shadow-md'}
    `}>
      <div className="flex gap-4 items-start">
        <div className={`mt-0.5 p-2 rounded-xl h-fit ${isSymptom ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-500'}`}>
          {isSymptom ? <Activity className="w-5 h-5"/> : <Pill className="w-5 h-5"/>}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {isProgression && (
               <span className="bg-orange-100 text-orange-700 text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 font-bold">
                 <AlertTriangle className="w-3 h-3" /> 病情演变
               </span>
            )}
            
            <h4 className="font-bold text-slate-700 text-base">
              {isSymptom ? log.bodyPart : log.name}
            </h4>
            
            {isSymptom && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                log.severity > 7 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'
              }`}>
                {log.severity}级
              </span>
            )}
            {!isSymptom && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                {log.method === 'other' ? log.methodLabel : MEDICATION_METHODS.find(m => m.id === log.method)?.label}
              </span>
            )}
          </div>
          
          <p className="text-sm text-slate-500 leading-snug break-all">
            {isSymptom ? (log.note || '') : `${log.dosage} ${log.reason ? `• ${log.reason}` : ''}`}
          </p>
          
          {/* --- 核心修复：简单模式(时间轴)下完全移除时间显示，普通模式下只显示日期 --- */}
          {!simple && (
            <p className="text-xs text-slate-400 mt-2 font-mono">
              {formatDate(log.timestamp)}
            </p>
          )}
        </div>
      </div>
      
      <button onClick={() => onDelete(log.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 p-2 transition-opacity">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// --- CourseDetailView ---
function CourseDetailView({ course, logs, onUpdateStatus, onDeleteLog }) {
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
    
    return Object.keys(grouped).sort((a,b) => b - a).map(day => ({
      day,
      logs: grouped[day].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))
    }));
  }, [logs, course.startDate]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-start mb-6 relative z-10">
           <div>
             <h2 className="text-2xl font-bold text-slate-800">{course.name}</h2>
             <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${isRecovered ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'}`}>
               {isRecovered ? '已康复归档' : '正在进行治疗'}
             </span>
           </div>
           {!isRecovered && (
              <button 
                onClick={(e) => {
                  e.stopPropagation(); 
                  if(window.confirm('确认已康复并结束此病程？')) {
                      onUpdateStatus(course.id, 'recovered');
                  }
                }}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg shadow-green-200 transition-colors flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> 标记康复
              </button>
           )}
        </div>

        <div className="bg-slate-50 rounded-2xl p-5 space-y-4 border border-slate-100">
           <div className="flex items-start gap-3">
              <Clipboard className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
              <div>
                 <span className="text-xs text-slate-400 block mb-1">症状综述</span>
                 <p className="text-sm text-slate-700 leading-relaxed">{course.symptoms || '未填写'}</p>
              </div>
           </div>
           
           {course.hasDoctorVisit && (
             <>
               <div className="flex items-start gap-3 pt-4 border-t border-slate-200">
                  <Stethoscope className="w-4 h-4 text-blue-500 mt-1 shrink-0" />
                  <div className="flex-1">
                     <span className="text-xs text-slate-400 block mb-1">就诊记录 ({course.department} {course.visitDate})</span>
                     <p className="text-sm font-semibold text-slate-700">诊断：{course.diagnosis || '未填写'}</p>
                     {course.prescription && (
                       <div className="mt-3 bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                         <span className="font-bold block mb-1 text-slate-700">处方/医嘱：</span>
                         {course.prescription}
                       </div>
                     )}
                  </div>
               </div>
             </>
           )}
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm mt-4">
           <div className="bg-slate-50 p-4 rounded-2xl">
             <span className="text-slate-400 text-xs block mb-1">开始日期</span>
             <span className="font-mono text-slate-700">{course.startDate}</span>
           </div>
           <div className="bg-slate-50 p-4 rounded-2xl">
             <span className="text-slate-400 text-xs block mb-1">持续天数</span>
             <span className="font-mono text-slate-700">
               {isRecovered && course.endDate 
                 ? Math.ceil((safeDate(course.endDate) - safeDate(course.startDate)) / (1000 * 60 * 60 * 24)) + 1 
                 : getDaysSince(course.startDate)} 天
             </span>
           </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">病程时间轴</h3>
        <div className="space-y-8 relative pl-4 border-l-2 border-slate-100 ml-4">
          {timelineData.length === 0 ? (
            <p className="text-slate-400 text-sm pl-4">暂无记录，请添加不适或用药记录。</p>
          ) : (
            timelineData.map(({ day, logs }) => (
              <div key={day} className="relative pl-6">
                <div className="absolute -left-[29px] top-0 p-1">
                  <div className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    Day {day}
                  </div>
                </div>
                
                <div className="space-y-3">
                  {logs.map(log => <LogItem key={log.id} log={log} onDelete={onDeleteLog} simple />)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
