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
  ChevronRight, // 👈 核心修复：补回了这个丢失的图标
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
  LayoutDashboard
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

// 获取本地今天日期字符串 (YYYY-MM-DD)
const getLocalTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  
  const fileInputRef = useRef(null);

  // --- Effects ---
  useEffect(() => {
    try {
      const savedLogs = localStorage.getItem('hl_logs');
      const savedParts = localStorage.getItem('hl_custom_parts');
      const savedCourses = localStorage.getItem('hl_courses');
      const savedWebdav = localStorage.getItem('hl_webdav');
      
      if (savedLogs) setLogs(JSON.parse(savedLogs));
      if (savedParts) setCustomParts(JSON.parse(savedParts));
      if (savedCourses) setCourses(JSON.parse(savedCourses));
      if (savedWebdav) setWebdavConfig(JSON.parse(savedWebdav));
    } catch (e) {
      console.error("读取缓存失败", e);
    }
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

  const activeCourses = useMemo(() => courses.filter(c => c.status === 'active'), [courses]);

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
        if (data.logs) setLogs(data.logs);
        if (data.customParts) setCustomParts(data.customParts);
        if (data.courses) setCourses(data.courses);
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
        <button 
          onClick={() => setActiveView(activeView === 'settings' ? 'dashboard' : 'settings')}
          className={`p-2.5 rounded-full transition-all active:scale-95 ${activeView === 'settings' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <Settings className="w-6 h-6" strokeWidth={2} />
        </button>
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
        {activeView === 'history' && <HistoryView logs={logs} onDelete={handleDeleteLog} />}
        {activeView === 'stats' && <StatsView logs={logs} />}
        {activeView === 'courseDetail' && (
          <CourseDetailView 
            course={courses.find(c => c.id === viewParams.courseId)} 
            logs={logs.filter(l => l.courseId === viewParams.courseId)}
            onUpdateStatus={handleUpdateCourseStatus}
            onDeleteLog={handleDeleteLog}
          />
        )}
        {activeView === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            {/* 多病程展示区域 */}
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
         
         {/* 左侧：黑色灵动岛导航 */}
         <div className="flex-1 bg-[#1c1c1e]/90 backdrop-blur-xl shadow-2xl rounded-[2.5rem] p-1.5 pl-2 pr-2 h-[4.5rem] flex items-center justify-between pointer-events-auto border border-white/10 relative">
            <button 
              onClick={() => setActiveView('dashboard')}
              className={`flex-1 h-full rounded-[2rem] flex flex-col items-center justify-center gap-1 transition-all duration-300 relative z-10 ${activeView === 'dashboard' ? 'text-white font-semibold' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {activeView === 'dashboard' && <div className="absolute inset-0 bg-blue-600 rounded-[2rem] shadow-lg -z-10 animate-fade-in" />}
              <LayoutDashboard className="w-6 h-6" strokeWidth={activeView === 'dashboard' ? 2.5 : 2} />
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

// --- SymptomForm 组件 ---
function SymptomForm({ onSubmit, defaultParts, customParts, onAddPart, activeCourses }) {
  const [formData, setFormData] = useState({
    bodyPart: '',
    severity: 3,
    note: '',
    courseId: activeCourses.length > 0 ? activeCourses[0].id : '',
    isProgression: false,
    recordDate: getLocalTodayDate() 
  });
  const [newPart, setNewPart] = useState('');
  const [isAddingPart, setIsAddingPart] = useState(false);

  const handleAddPart = () => {
    if (onAddPart(newPart)) {
      setFormData({...formData, bodyPart: newPart});
      setIsAddingPart(false);
      setNewPart('');
    } else { alert('无效或已存在'); }
  };

  const allParts = [...defaultParts, ...customParts];

  return (
    <div className="space-y-6">
      {activeCourses.length > 0 && (
        <div className="bg-indigo-50 p-4 rounded-2xl space-y-3">
          <label className="text-xs font-bold text-indigo-900 uppercase">关联病程</label>
          <div className="flex flex-col gap-2">
            {activeCourses.map(course => (
              <div key={course.id} className="flex items-center gap-2">
                <input 
                  type="radio" 
                  name="courseSelector"
                  id={`c-${course.id}`}
                  checked={formData.courseId === course.id}
                  onChange={() => setFormData({...formData, courseId: course.id})}
                  className="w-4 h-4 accent-indigo-600"
                />
                <label htmlFor={`c-${course.id}`} className="text-sm text-slate-700">{course.name}</label>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <input 
                type="radio" 
                name="courseSelector"
                id="c-none"
                checked={formData.courseId === ''}
                onChange={() => setFormData({...formData, courseId: ''})}
                className="w-4 h-4 accent-indigo-600"
              />
              <label htmlFor="c-none" className="text-sm text-slate-500">不关联 (日常记录)</label>
            </div>
          </div>
          
          {formData.courseId && (
            <div className="ml-6 flex items-center gap-2 bg-white/50 p-2 rounded-lg border border-indigo-100 mt-2">
               <input 
                  type="checkbox" 
                  id="progression"
                  checked={formData.isProgression}
                  onChange={(e) => setFormData({...formData, isProgression: e.target.checked})}
                  className="w-4 h-4 accent-orange-500 rounded"
               />
               <label htmlFor="progression" className="text-xs text-indigo-800 flex items-center gap-1 font-medium">
                  <GitCommit className="w-4 h-4 text-orange-500" />
                  标记为病情变化/转折
               </label>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-3">不适部位</label>
        <div className="flex flex-wrap gap-2">
          {allParts.map(part => (
            <button
              key={part}
              onClick={() => setFormData({...formData, bodyPart: part})}
              className={`px-4 py-2.5 rounded-xl text-sm transition-all border ${
                formData.bodyPart === part 
                  ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm font-medium' 
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {part}
            </button>
          ))}
          {isAddingPart ? (
            <div className="flex items-center gap-2 animate-fade-in">
              <input 
                autoFocus
                type="text" 
                value={newPart} 
                onChange={(e) => setNewPart(e.target.value)}
                placeholder="部位..."
                className="w-24 px-3 py-2 text-sm border border-indigo-300 rounded-xl outline-none"
              />
              <button onClick={handleAddPart} className="p-2 bg-indigo-600 text-white rounded-xl"><Plus className="w-4 h-4"/></button>
            </div>
          ) : (
            <button 
              onClick={() => setIsAddingPart(true)}
              className="px-4 py-2.5 rounded-xl text-sm border border-dashed border-slate-300 text-slate-400 hover:text-indigo-600 flex items-center gap-1 hover:border-indigo-300 transition-colors"
            >
              <Plus className="w-4 h-4" /> 自定义
            </button>
          )}
        </div>
      </div>

      <div>
        <div className="flex justify-between mb-2">
          <label className="text-sm font-semibold text-slate-700">严重程度</label>
          <span className="text-sm font-mono text-slate-500">{formData.severity} / 10</span>
        </div>
        <input 
          type="range" min="1" max="10" value={formData.severity}
          onChange={(e) => setFormData({...formData, severity: parseInt(e.target.value)})}
          className="w-full h-2 bg-slate-200 rounded-full appearance-none accent-rose-500 cursor-pointer"
        />
        <div className="flex justify-between mt-2 text-xs text-slate-400 font-medium">
          <span>😊 轻微</span>
          <span>😫 剧烈</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">详细描述</label>
        <textarea 
          value={formData.note}
          onChange={(e) => setFormData({...formData, note: e.target.value})}
          className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm min-h-[100px] resize-none transition-all"
          placeholder={formData.isProgression ? "请详细描述病情发生了什么变化..." : "例如：刺痛、持续时间..."}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">记录日期 (默认今天)</label>
        <input 
          type="date"
          value={formData.recordDate}
          onChange={(e) => setFormData({...formData, recordDate: e.target.value})}
          className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
        />
      </div>

      <button 
        onClick={() => {
          if(!formData.bodyPart) return alert('请选择部位');
          let finalDate = new Date(formData.recordDate.replace(/-/g, '/')); 
          const today = new Date();
          
          if (finalDate.toDateString() === today.toDateString()) {
             finalDate = today;
          } else {
             finalDate.setHours(12, 0, 0, 0);
          }
          
          const timestamp = finalDate.toISOString();
          onSubmit({ type: 'symptom', ...formData, timestamp });
        }}
        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-transform active:scale-[0.98]"
      >
        保存记录
      </button>
    </div>
  );
}

// --- MedicationForm 组件 ---
function MedicationForm({ onSubmit, activeCourses }) {
  const [formData, setFormData] = useState({
    name: '',
    method: 'oral',
    customMethod: '', 
    dosage: '',
    reason: '',
    courseId: activeCourses.length > 0 ? activeCourses[0].id : '',
    recordDate: getLocalTodayDate()
  });

  return (
    <div className="space-y-6">
      {activeCourses.length > 0 && (
        <div className="bg-indigo-50 p-4 rounded-2xl space-y-3">
          <label className="text-xs font-bold text-indigo-900 uppercase">关联病程</label>
          <div className="flex flex-col gap-2">
            {activeCourses.map(course => (
              <div key={course.id} className="flex items-center gap-2">
                <input 
                  type="radio" 
                  name="courseSelectorMed"
                  id={`cm-${course.id}`}
                  checked={formData.courseId === course.id}
                  onChange={() => setFormData({...formData, courseId: course.id})}
                  className="w-4 h-4 accent-indigo-600"
                />
                <label htmlFor={`cm-${course.id}`} className="text-sm text-slate-700">{course.name}</label>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <input 
                type="radio" 
                name="courseSelectorMed"
                id="cm-none"
                checked={formData.courseId === ''}
                onChange={() => setFormData({...formData, courseId: ''})}
                className="w-4 h-4 accent-indigo-600"
              />
              <label htmlFor="cm-none" className="text-sm text-slate-500">不关联 (日常记录)</label>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">药品/治疗名称</label>
        <input 
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
          placeholder="例如：奥司他韦..."
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-3">给药方式</label>
        <div className="grid grid-cols-5 gap-2">
          {MEDICATION_METHODS.map(m => (
            <button
              key={m.id}
              onClick={() => setFormData({...formData, method: m.id})}
              className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border transition-all ${
                formData.method === m.id 
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {m.icon}
            </button>
          ))}
        </div>
        
        {formData.method === 'other' ? (
           <input 
             autoFocus
             type="text"
             value={formData.customMethod}
             onChange={(e) => setFormData({...formData, customMethod: e.target.value})}
             placeholder="请输入具体方式 (如：纳肛、理疗)"
             className="mt-3 w-full p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl text-sm text-center outline-none focus:bg-white transition-all"
           />
        ) : (
           <p className="text-center text-xs text-slate-400 mt-2 font-medium">{MEDICATION_METHODS.find(m=>m.id===formData.method)?.label}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">用量</label>
          <input 
            type="text"
            value={formData.dosage}
            onChange={(e) => setFormData({...formData, dosage: e.target.value})}
            className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
            placeholder="如：75mg"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">原因</label>
          <input 
            type="text"
            value={formData.reason}
            onChange={(e) => setFormData({...formData, reason: e.target.value})}
            className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
            placeholder="如：发热"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">用药日期 (默认今天)</label>
        <input 
          type="date"
          value={formData.recordDate}
          onChange={(e) => setFormData({...formData, recordDate: e.target.value})}
          className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
        />
      </div>

      <button 
        onClick={() => {
          if(!formData.name) return alert('请输入名称');
          const finalData = { ...formData };
          if (formData.method === 'other') {
             if (!formData.customMethod) return alert('请输入具体方式');
             finalData.methodLabel = formData.customMethod;
          }
          
          let finalDate = new Date(formData.recordDate.replace(/-/g, '/')); 
          const today = new Date();
          
          if (finalDate.toDateString() === today.toDateString()) {
             finalDate = today;
          } else {
             finalDate.setHours(12, 0, 0, 0);
          }

          const timestamp = finalDate.toISOString();
          onSubmit({ type: 'medication', ...finalData, timestamp });
        }}
        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-transform active:scale-[0.98]"
      >
        保存记录
      </button>
    </div>
  );
}

// ... (LogItem, HistoryView, SettingsView, StatsView) ...
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
          {!simple && (
            <p className="text-xs text-slate-400 mt-2 font-mono">
              {formatDate(log.timestamp)}
            </p>
          )}
          {simple && (
             <p className="text-xs text-slate-300 mt-1 font-mono">{new Date(log.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
          )}
        </div>
      </div>
      
      <button onClick={() => onDelete(log.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 p-2 transition-opacity">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function HistoryView({ logs, onDelete }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = useMemo(() => {
    if (!searchTerm.trim()) return logs;
    const lowerTerm = searchTerm.toLowerCase();
    
    return logs.filter(log => {
      const matchName = log.name?.toLowerCase().includes(lowerTerm);
      const matchPart = log.bodyPart?.toLowerCase().includes(lowerTerm);
      const matchNote = log.note?.toLowerCase().includes(lowerTerm);
      const matchReason = log.reason?.toLowerCase().includes(lowerTerm);
      const matchDosage = log.dosage?.toLowerCase().includes(lowerTerm);
      
      return matchName || matchPart || matchNote || matchReason || matchDosage;
    });
  }, [logs, searchTerm]);

  const sortedLogs = [...filteredLogs].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="space-y-4 animate-fade-in">
       <div className="sticky top-0 bg-slate-50/95 backdrop-blur-sm pt-2 pb-4 z-10">
         <div className="relative">
           <Search className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
           <input 
             type="text" 
             placeholder="搜索症状、药品、备注..." 
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
         {searchTerm ? `搜索结果 (${sortedLogs.length})` : '全部历史记录'}
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

function SettingsView({ onExport, onImport, fileInputRef, handleImport, webdavConfig, setWebdavConfig, onSync }) {
  const [showWebDav, setShowWebDav] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-indigo-600 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-200">
        <h3 className="font-bold text-lg mb-2">数据管理</h3>
        <p className="text-indigo-100 text-xs leading-relaxed mb-0">
          数据默认存储在本地浏览器。为了防止丢失，建议定期备份。
        </p>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden p-5">
        <button 
          onClick={() => setShowWebDav(!showWebDav)} 
          className="w-full flex justify-between items-center mb-2"
        >
          <div className="flex items-center gap-3 font-bold text-slate-700">
            <Cloud className="w-5 h-5 text-blue-500" /> WebDAV 云同步 (Beta)
          </div>
          <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform ${showWebDav ? 'rotate-90' : ''}`} />
        </button>
        
        {showWebDav && (
          <div className="mt-4 space-y-4 bg-slate-50 p-5 rounded-2xl text-sm animate-fade-in">
             <div className="p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 text-xs leading-relaxed">
                ⚠️ 注意：浏览器由于安全策略(CORS)，直接连接坚果云/Nextcloud可能会失败。建议将此应用安装为 PWA 或使用原生 App 壳运行。
             </div>
             <div>
               <label className="block text-slate-500 mb-1.5 text-xs font-bold uppercase">服务器 URL</label>
               <input 
                 type="text" 
                 placeholder="https://dav.jianguoyun.com/dav/"
                 value={webdavConfig.url}
                 onChange={(e) => setWebdavConfig({...webdavConfig, url: e.target.value})}
                 className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-400 transition-colors"
               />
             </div>
             <div>
               <label className="block text-slate-500 mb-1.5 text-xs font-bold uppercase">账号 (Email)</label>
               <input 
                 type="text" 
                 value={webdavConfig.username}
                 onChange={(e) => setWebdavConfig({...webdavConfig, username: e.target.value})}
                 className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-400 transition-colors"
               />
             </div>
             <div>
               <label className="block text-slate-500 mb-1.5 text-xs font-bold uppercase">应用密码</label>
               <input 
                 type="password" 
                 value={webdavConfig.password}
                 onChange={(e) => setWebdavConfig({...webdavConfig, password: e.target.value})}
                 className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-400 transition-colors"
               />
             </div>
             <button 
               onClick={onSync}
               className="w-full py-3 bg-blue-600 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors font-bold"
             >
               <RefreshCw className="w-4 h-4" /> 立即同步上传
             </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <button onClick={onExport} className="w-full flex items-center justify-between p-5 hover:bg-slate-50 border-b border-slate-100 transition-colors">
          <span className="flex items-center gap-3 font-bold text-sm text-slate-700"><Download className="w-5 h-5 text-emerald-500"/> 导出备份 (JSON)</span>
          <ChevronRight className="w-4 h-4 text-slate-300" />
        </button>
        <button onClick={onImport} className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
          <span className="flex items-center gap-3 font-bold text-sm text-slate-700"><Upload className="w-5 h-5 text-amber-500"/> 恢复数据</span>
          <ChevronRight className="w-4 h-4 text-slate-300" />
        </button>
        <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json"/>
      </div>
    </div>
  );
}

function StatsView({ logs }) {
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
    logs.filter(l => l.type === 'symptom').forEach(l => {
        counts[l.bodyPart] = (counts[l.bodyPart] || 0) + 1;
    });
    return Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 5);
  }, [logs]);

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate); 
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-800 text-lg">
            {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
          </h3>
          <div className="flex gap-2">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ChevronLeft className="w-5 h-5"/></button>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ChevronRight className="w-5 h-5"/></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center mb-2">
           {['日','一','二','三','四','五','六'].map(d => (
             <span key={d} className="text-xs font-medium text-slate-400">{d}</span>
           ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {calendarData.blanks.map((_, i) => <div key={`blank-${i}`} className="h-10"></div>)}
          {calendarData.days.map(day => {
             const status = calendarData.dayMap[day];
             let bgClass = "bg-slate-50";
             let textClass = "text-slate-400";
             let borderClass = "border-transparent";
             
             if (status) {
               if (status.hasSymptom && status.hasMed) {
                 bgClass = "bg-purple-100";
                 textClass = "text-purple-700 font-bold";
                 borderClass = "border-purple-200";
               } else if (status.hasSymptom) {
                 bgClass = "bg-rose-100";
                 textClass = "text-rose-700 font-bold";
                 borderClass = "border-rose-200";
               } else if (status.hasMed) {
                 bgClass = "bg-indigo-100";
                 textClass = "text-indigo-700 font-bold";
                 borderClass = "border-indigo-200";
               }
             }

             return (
               <div key={day} className={`h-10 rounded-xl flex items-center justify-center text-sm border ${bgClass} ${textClass} ${borderClass}`}>
                 {day}
               </div>
             );
          })}
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-rose-500" /> 高频不适部位
        </h3>
        <div className="space-y-4">
          {partStats.length === 0 ? <p className="text-sm text-slate-400">暂无数据</p> : 
           partStats.map(([part, count], index) => (
             <div key={part} className="flex items-center gap-4">
               <span className="text-xs font-mono text-slate-400 w-4">{index+1}</span>
               <div className="flex-1">
                 <div className="flex justify-between text-sm mb-2">
                   <span className="font-medium text-slate-700">{part}</span>
                   <span className="text-slate-500 font-medium">{count}次</span>
                 </div>
                 <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                   <div className="bg-rose-400 h-full rounded-full" style={{ width: `${Math.min(100, (count / partStats[0][1]) * 100)}%` }}></div>
                 </div>
               </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}

// --- CourseDetailView 组件 (补全) ---
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
                <div className="absolute -left-[29px] top-0 bg-slate-50 p-1">
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

// --- NewCourseForm 组件 (补全) ---
function NewCourseForm({ onSubmit }) {
  const [data, setData] = useState({ 
    name: '', 
    startDate: new Date().toISOString().slice(0, 10), 
    symptoms: '',
    hasDoctorVisit: false,
    visitDate: new Date().toISOString().slice(0, 10),
    department: '',
    diagnosis: '',
    prescription: ''
  });

  return (
    <div className="space-y-5 pb-10">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">病程名称</label>
        <input 
          autoFocus
          type="text" 
          value={data.name}
          onChange={(e) => setData({...data, name: e.target.value})}
          placeholder="例如：2024冬季甲流、急性肠胃炎..." 
          className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
        />
      </div>

      <div>
         <label className="block text-sm font-semibold text-slate-700 mb-2">开始日期</label>
         <input 
           type="date" 
           value={data.startDate}
           onChange={(e) => setData({...data, startDate: e.target.value})}
           className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
         />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">主要症状描述</label>
        <textarea 
          value={data.symptoms}
          onChange={(e) => setData({...data, symptoms: e.target.value})}
          placeholder="发烧、咳嗽、全身酸痛..."
          className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none h-24 text-sm resize-none transition-all"
        />
      </div>

      <div className="border-t border-slate-100 pt-4">
        <div className="flex items-center gap-3 mb-4">
          <input 
             type="checkbox" 
             id="doctorVisit" 
             checked={data.hasDoctorVisit}
             onChange={(e) => setData({...data, hasDoctorVisit: e.target.checked})}
             className="w-5 h-5 accent-indigo-600 rounded"
          />
          <label htmlFor="doctorVisit" className="font-semibold text-slate-700 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-blue-500" />
            是否就医？
          </label>
        </div>

        {data.hasDoctorVisit && (
          <div className="bg-blue-50/50 p-5 rounded-2xl space-y-4 animate-fade-in border border-blue-100">
             <div>
               <label className="block text-xs font-semibold text-slate-500 mb-1">就诊日期</label>
               <input 
                 type="date" 
                 value={data.visitDate}
                 onChange={(e) => setData({...data, visitDate: e.target.value})}
                 className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"
               />
             </div>
             <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">就诊科室</label>
                  <input 
                    type="text" 
                    placeholder="如：呼吸内科"
                    value={data.department}
                    onChange={(e) => setData({...data, department: e.target.value})}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"
                  />
               </div>
               <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">医生诊断</label>
                  <input 
                    type="text" 
                    placeholder="确诊结果"
                    value={data.diagnosis}
                    onChange={(e) => setData({...data, diagnosis: e.target.value})}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"
                  />
               </div>
             </div>
             <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">处方/医嘱/用药方案</label>
                <textarea 
                  placeholder="记录医生开的药或建议..."
                  value={data.prescription}
                  onChange={(e) => setData({...data, prescription: e.target.value})}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm outline-none h-20 focus:border-blue-400 resize-none"
                />
             </div>
          </div>
        )}
      </div>

      <button 
        onClick={() => {
          if (!data.name) return alert('请输入名称');
          onSubmit(data);
        }}
        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-transform active:scale-[0.98]"
      >
        开启病程档案
      </button>
    </div>
  );
}
