import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Activity, 
  Plus, 
  Settings, 
  Trash2, 
  X, 
  ChevronLeft,
  ChevronRight,
  Pill,    
  Clock,
  BookOpen, 
  BarChart3,
  Search,
  History,
  Home, 
  LayoutDashboard,
  Pencil,
  ArrowUpDown
} from 'lucide-react';

// 1. 引入工具箱 (显式 .jsx)
import { 
  safeParseArray, formatDateOnly, getDaysSince, isToday, formatTimeOnly, 
  MEDICATION_METHODS, DEFAULT_BODY_PARTS 
} from './utils.jsx';

// 2. 引入组件 (显式 .jsx)
import { 
  ErrorBoundary, LogItem 
} from './components.jsx';
// 3. 引入视图 (显式 .jsx)
import { 
  CourseDetailView, HistoryView, StatsView, SettingsView 
} from './views.jsx';
// 4. 引入表单 (显式 .jsx)
import { 
  NewCourseForm, SymptomForm, MedicationForm 
} from './forms.jsx';

// --- 主应用逻辑 ---
function HealthLogMain() {
  const [activeView, setActiveView] = useState('dashboard'); 
  const [viewParams, setViewParams] = useState({}); 
  
  const [logs, setLogs] = useState([]);
  const [courses, setCourses] = useState([]); 
  const [customParts, setCustomParts] = useState([]);
  
  const [customMeds, setCustomMeds] = useState([]);
  
  const [webdavConfig, setWebdavConfig] = useState({ url: '', username: '', password: '', enabled: false });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('symptom'); 
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [autoFocusSearch, setAutoFocusSearch] = useState(false);
  
  const [editingLog, setEditingLog] = useState(null);
  const [courseSortOrder, setCourseSortOrder] = useState('desc');

  const fileInputRef = useRef(null);

  // 初始化数据
  useEffect(() => {
    setLogs(safeParseArray('hl_logs'));
    setCourses(safeParseArray('hl_courses'));
    setCustomParts(safeParseArray('hl_custom_parts'));
    setCustomMeds(safeParseArray('hl_custom_meds'));
    
    try {
      const savedWebdav = localStorage.getItem('hl_webdav');
      if (savedWebdav) setWebdavConfig(JSON.parse(savedWebdav));
    } catch (e) {}
  }, []);

  // 持久化存储
  useEffect(() => { localStorage.setItem('hl_logs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('hl_custom_parts', JSON.stringify(customParts)); }, [customParts]);
  useEffect(() => { localStorage.setItem('hl_courses', JSON.stringify(courses)); }, [courses]);
  useEffect(() => { localStorage.setItem('hl_custom_meds', JSON.stringify(customMeds)); }, [customMeds]);
  useEffect(() => { localStorage.setItem('hl_webdav', JSON.stringify(webdavConfig)); }, [webdavConfig]);

  const handleAddLog = (newLog) => {
    const logEntry = { id: Date.now().toString(36), timestamp: newNewLog.timestamp || new Date().toISOString(), ...newLog };
    setLogs([logEntry, ...logs]);
    
    if (newLog.type === 'medication' && newNewLog.name) {
      handleAddCustomMed(newNewLog.name);
    }

    setIsModalOpen(false);
    setIsFabOpen(false); 
    setEditingLog(null);
  };

  const handleUpdateLog = (updatedLog) => {
    setLogs(logs.map(log => log.id === updatedLog.id ? { ...log, ...updatedLog } : log));
    
    if (updatedLog.type === 'medication' && updatedLog.name) {
      handleAddCustomMed(updatedLog.name);
    }
    
    setIsModalOpen(false);
    setEditingLog(null);
  };

  const handleAddCustomMed = (medName) => {
    const trimmedName = medName.trim();
    if (trimmedName && !customMeds.includes(trimmedName)) {
      setCustomMeds(prev => [trimmedName, ...prev].slice(0, 20));
    }
  };

  const handleDeleteCustomMed = (medName) => {
    if (window.confirm(`确定要从常用列表中移除 "${medName}" 吗？`)) {
      setCustomMeds(prev => prev.filter(m => m !== medName));
    }
  };

  const handleEditLog = (log) => {
    setEditingLog(log);
    setModalType(log.type);
    setIsModalOpen(true);
    setIsFabOpen(false);
  };

  const handleAddCourse = (courseData) => {
    const newCourse = { id: Date.now().toString(36), status: 'active', ...courseData };
    setCourses([newCourse, ...courses]);
    setIsModalOpen(false);
    setIsFabOpen(false);
  };

  const handleUpdateCourseStatus = (courseId, status) => {
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, status, endDate: status === 'recovered' ? new Date().toISOString() : null } : c));
    if(activeView === 'courseDetail') setViewParams({ ...viewParams, _ts: Date.now() });
  };

  const handleDeleteLog = (id) => {
    if (window.confirm('确认删除这条记录吗？')) setLogs(logs.filter(l => l.id !== id));
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

  const safeCourses = Array.isArray(courses) ? courses : [];
  
  const activeCourses = useMemo(() => {
    const active = safeCourses.filter(c => c.status === 'active');
    return active.sort((a, b) => {
      const dateA = new Date(a.startDate);
      const dateB = new Date(b.startDate);
      return courseSortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [safeCourses, courseSortOrder]);

  const stats = useMemo(() => {
    const symptomLogs = logs.filter(l => l.type === 'symptom');
    const medLogs = logs.filter(l => l.type === 'medication');
    return { symptomCount: symptomLogs.length, medCount: medLogs.length };
  }, [logs]);

  const todayLogs = useMemo(() => {
    return logs.filter(log => isToday(log.timestamp)).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [logs]);

  const exportData = () => {
    const dataStr = JSON.stringify({ logs, customParts, courses, customMeds }, null, 2);
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
        if (Array.isArray(data.customMeds)) setCustomMeds(data.customMeds);
        alert('数据恢复成功！');
      } catch (err) { alert('文件格式错误'); }
    };
    reader.readAsText(file);
  };

  const handleWebDavSync = async () => { alert('网页版受浏览器限制，请使用导出功能备份。'); };

  return (
    <div className="min-h-screen bg-gray-100/80 dark:bg-ios-bg text-slate-800 dark:text-gray-200 font-sans flex flex-col max-w-lg mx-auto shadow-2xl border-x border-slate-200 dark:border-ios-border relative overflow-hidden">
      {/* 顶部栏 */}
      <header className="px-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-4 bg-white/80 dark:bg-ios-card/80 backdrop-blur-md sticky top-0 z-20 flex justify-between items-center border-b border-slate-50 dark:border-ios-border">
        {activeView === 'courseDetail' ? (
           <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-1 text-slate-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors font-medium">
             <ChevronLeft className="w-5 h-5" /> 返回
           </button>
        ) : (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Activity className="w-6 h-6 text-indigo-600 dark:text-indigo-400"/> 健康日志
            </h1>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <button onClick={handleGlobalSearch} className="p-2.5 rounded-full text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 transition-all">
            <Search className="w-6 h-6" strokeWidth={2} />
          </button>
          <button onClick={() => setActiveView(activeView === 'settings' ? 'dashboard' : 'settings')} className={`p-2.5 rounded-full transition-all active:scale-95 ${activeView === 'settings' ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            <Settings className="w-6 h-6" strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide pb-36">
        {activeView === 'settings' && (
           <SettingsView onExport={exportData} onImport={() => fileInputRef.current.click()} fileInputRef={fileInputRef} handleImport={importData} webdavConfig={webdavConfig} setWebdavConfig={setWebdavConfig} onSync={handleWebDavSync} />
        )}
        {activeView === 'history' && <HistoryView logs={logs} courses={courses} onDelete={handleDeleteLog} onEdit={handleEditLog} autoFocus={autoFocusSearch} />}
        {activeView === 'stats' && <StatsView logs={logs} />}
        {activeView === 'courseDetail' && (
          <CourseDetailView 
            course={safeCourses.find(c => c.id === viewParams.courseId)} 
            logs={logs.filter(l => l.courseId === viewParams.courseId)}
            onUpdateStatus={handleUpdateCourseStatus}
            onDeleteLog={handleDeleteLog}
            onEditLog={handleEditLog}
          />
        )}
        
        {/* --- Dashboard View --- */}
        {activeView === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* 1. 统计概览 */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-ios-border shadow-sm flex items-center gap-3">
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 rounded-xl"><Activity className="w-5 h-5"/></div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase block">累计不适</span>
                    <span className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">{stats.symptomCount}</span>
                  </div>
               </div>
               <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-ios-border shadow-sm flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 rounded-xl"><Pill className="w-5 h-5"/></div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">累计用药</span>
                    <span className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">{stats.medCount}</span>
                  </div>
               </div>
            </div>

            {/* 2. 进行中的病程 (竖向平铺 + 排序) */}
            <div>
               <div className="flex justify-between items-center mb-3 px-1">
                 <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">进行中病程</h3>
                    {activeCourses.length > 1 && (
                      <button 
                        onClick={() => setCourseSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                        className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                        title="切换排序"
                      >
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </button>
                    )}
                 </div>
               </div>
               
               {activeCourses.length > 0 ? (
                 <div className="space-y-4">
                   {activeCourses.map(course => (
                     <div 
                       key={course.id}
                       onClick={() => navigateToCourse(course.id)}
                       className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-5 text-white shadow-lg shadow-indigo-200 dark:shadow-none cursor-pointer relative overflow-hidden group active:scale-[0.98] transition-transform"
                     >
                       <div className="absolute -right-4 -top-4 opacity-10"><Activity className="w-24 h-24" /></div>
                       <div className="relative z-10 flex justify-between items-center">
                         <div>
                           <div className="flex items-center gap-2 mb-1">
                             <h2 className="text-lg font-bold">{course.name}</h2>
                             <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-medium backdrop-blur-sm">进行中</span>
                           </div>
                           <p className="text-indigo-100 text-xs opacity-90 truncate max-w-[200px]">
                               {course.diagnosis || course.description || '无详细描述'}
                           </p>
                         </div>
                         <div className="text-center pl-4 border-l border-white/10">
                           <span className="block text-2xl font-bold">{getDaysSince(course.startDate)}</span>
                           <span className="text-[10px] text-indigo-200 font-medium uppercase">Days</span>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div onClick={() => { setModalType('newCourse'); setIsModalOpen(true); setEditingLog(null); }} className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-6 text-center cursor-pointer group">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400 dark:text-slate-500"><BookOpen className="w-6 h-6" /></div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">当前无进行中病程</p>
                 </div>
               )}
            </div>

            {/* 3. 今日时间轴 */}
            <div>
              <div className="flex items-center gap-2 mb-4 px-1">
                <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">今日概览</h3>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-mono">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
              
              <div className="relative pl-4 border-l-2 border-slate-100 dark:border-ios-border space-y-6 ml-2">
                {todayLogs.length === 0 ? (
                    <div className="pl-4 py-2">
                        <p className="text-sm text-slate-400 dark:text-gray-500 italic">今天还没有记录，身体感觉如何？</p>
                        <button onClick={() => { setModalType('symptom'); setIsModalOpen(true); setEditingLog(null); }} className="mt-2 text-xs text-indigo-600 font-bold hover:underline">记一笔</button>
                    </div>
                ) : (
                    todayLogs.map(log => (
                        <div key={log.id} className="relative pl-6">
                            <div className="absolute -left-[21px] top-1.5 w-3 h-3 bg-white dark:bg-ios-bg border-2 border-indigo-500 rounded-full z-10"></div>
                            <div className="flex items-start justify-between group">
                                <div>
                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono mb-0.5 block">
                                        {formatTimeOnly(log.timestamp)}
                                    </span>
                                    <h4 className="text-sm font-bold text-slate-700 dark:text-gray-200">
                                        {log.type === 'symptom' ? log.bodyPart : log.name}
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                                        {log.type === 'symptom' 
                                            ? `${log.severity}级 · ${log.note || ''}` 
                                            : `${log.dosage} · ${log.method === 'other' ? log.methodLabel : MEDICATION_METHODS.find(m => m.id === log.method)?.label}`
                                        }
                                    </p>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => handleEditLog(log)} className="p-1.5 text-slate-300 hover:text-blue-500 transition-colors">
                                      <Pencil className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDeleteLog(log.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
                                      <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
              </div>
            </div>

          </div>
        )}
      </main>

      {/* --- 底部悬浮操作区 --- */}
      <div className="fixed bottom-8 left-0 right-0 px-6 max-w-lg mx-auto flex items-end justify-between gap-4 pointer-events-none z-50">
         <div className="flex-1 bg-[#1c1c1e]/90 backdrop-blur-xl shadow-2xl rounded-[2.5rem] p-1.5 pl-2 pr-2 h-[4.5rem] flex items-center justify-between pointer-events-auto border border-white/10 relative">
            <button onClick={() => setActiveView('dashboard')} className={`flex-1 h-full rounded-[2rem] flex flex-col items-center justify-center gap-1 transition-all duration-300 relative z-10 ${activeView === 'dashboard' ? 'text-white font-semibold' : 'text-gray-500 hover:text-gray-300'}`}>
              {activeView === 'dashboard' && <div className="absolute inset-0 bg-blue-600 rounded-[2rem] shadow-lg -z-10 animate-fade-in" />}
              <Home className="w-6 h-6" strokeWidth={activeView === 'dashboard' ? 2.5 : 2} /><span className="text-[10px] tracking-wide">概览</span>
            </button>
            <button onClick={() => setActiveView('stats')} className={`flex-1 h-full rounded-[2rem] flex flex-col items-center justify-center gap-1 transition-all duration-300 relative z-10 ${activeView === 'stats' ? 'text-white font-semibold' : 'text-gray-500 hover:text-gray-300'}`}>
              {activeView === 'stats' && <div className="absolute inset-0 bg-blue-600 rounded-[2rem] shadow-lg -z-10 animate-fade-in" />}
              <BarChart3 className="w-6 h-6" strokeWidth={activeView === 'stats' ? 2.5 : 2} /><span className="text-[10px] tracking-wide">统计</span>
            </button>
            <button onClick={() => setActiveView('history')} className={`flex-1 h-full rounded-[2rem] flex flex-col items-center justify-center gap-1 transition-all duration-300 relative z-10 ${activeView === 'history' ? 'text-white font-semibold' : 'text-gray-500 hover:text-gray-300'}`}>
              {activeView === 'history' && <div className="absolute inset-0 bg-blue-600 rounded-[2rem] shadow-lg -z-10 animate-fade-in" />}
              <History className="w-6 h-6" strokeWidth={activeView === 'history' ? 2.5 : 2} /><span className="text-[10px] tracking-wide">历史</span>
            </button>
         </div>

         <div className="relative pointer-events-auto flex flex-col items-center">
            <div className={`absolute bottom-0 w-full flex flex-col items-end gap-3 mb-[5.5rem] transition-all duration-300 ${isFabOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
               <button onClick={() => { setModalType('symptom'); setIsModalOpen(true); setEditingLog(null); }} className="flex items-center gap-3 group">
                 <span className="bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur text-gray-800 dark:text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm whitespace-nowrap border border-gray-200 dark:border-white/10">记不适</span>
                 <div className="w-12 h-12 bg-rose-500 text-white rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95 border-2 border-[#f0f0f0] dark:border-[#2c2c2e]"><Activity className="w-5 h-5" /></div>
               </button>
               <button onClick={() => { setModalType('medication'); setIsModalOpen(true); setEditingLog(null); }} className="flex items-center gap-3 group">
                 <span className="bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur text-gray-800 dark:text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm whitespace-nowrap border border-gray-200 dark:border-white/10">记用药</span>
                 <div className="w-12 h-12 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95 border-2 border-[#f0f0f0] dark:border-[#2c2c2e]"><Pill className="w-5 h-5" /></div>
               </button>
               <button onClick={() => { setModalType('newCourse'); setIsModalOpen(true); setEditingLog(null); }} className="flex items-center gap-3 group">
                 <span className="bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur text-gray-800 dark:text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm whitespace-nowrap border border-gray-200 dark:border-white/10">新病程</span>
                 <div className="w-12 h-12 bg-white dark:bg-[#1c1c1e] text-gray-800 dark:text-white rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95 border-2 border-gray-200 dark:border-white/10"><BookOpen className="w-5 h-5" /></div>
               </button>
            </div>
            <button onClick={() => setIsFabOpen(!isFabOpen)} className={`w-[4.5rem] h-[4.5rem] rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 z-50 relative border border-white/10 ${isFabOpen ? 'bg-[#2c2c2e] rotate-45' : 'bg-[#1c1c1e] hover:scale-105 active:scale-95'}`}>
              <Plus className="w-8 h-8 text-white" strokeWidth={3} />
            </button>
         </div>
      </div>
      
      {isFabOpen && <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-[2px] z-40 transition-opacity duration-300" onClick={() => setIsFabOpen(false)} />}

      {/* 模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-gray-900/40 backdrop-blur-sm sm:p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-lg h-[90vh] sm:h-auto sm:max-h-[90vh] sm:rounded-[2rem] rounded-t-[2rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-white/10">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                {editingLog ? '编辑记录' : (modalType === 'symptom' ? '记录身体不适' : (modalType === 'medication' ? '记录用药治疗' : '开启新病程档案'))}
              </h2>
              <button onClick={() => { setIsModalOpen(false); setEditingLog(null); }} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {modalType === 'newCourse' && <NewCourseForm onSubmit={handleAddCourse} />}
              
              {modalType === 'symptom' && <SymptomForm 
                onSubmit={editingLog ? handleUpdateLog : handleAddLog} 
                defaultParts={DEFAULT_BODY_PARTS} 
                customParts={customParts} 
                onAddPart={handleAddCustomPart} 
                activeCourses={activeCourses} 
                editingLog={editingLog} 
              />}
              
              {modalType === 'medication' && <MedicationForm 
                onSubmit={editingLog ? handleUpdateLog : handleAddLog} 
                activeCourses={activeCourses} 
                editingLog={editingLog} 
                customMeds={customMeds}               
                onDeleteCustomMed={handleDeleteCustomMed} 
              />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 包装组件，挂载 ErrorBoundary ---
export default function App() {
  return (
    <ErrorBoundary>
      <HealthLogMain />
    </ErrorBoundary>
  );
}
