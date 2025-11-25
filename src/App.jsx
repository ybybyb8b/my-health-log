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
  LayoutDashboard,
  Calendar,
  MoreHorizontal
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
      timestamp: newLog.timestamp || new Date().toISOString(), // 优先使用传入的时间戳
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

  // 支持多个活跃病程
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
            {/* 多病程展示区域 - 横向滚动 */}
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
    recordDate: getLocalTodayDate() // 改为日期，默认今天
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

      {/* 核心修改：改为 type="date" */}
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
          // 智能构建时间戳
          let finalDate = new Date(formData.recordDate.replace(/-/g, '/')); 
          const today = new Date();
          
          // 如果选的是今天，加上现在的具体时间（保证顺序）
          if (finalDate.toDateString() === today.toDateString()) {
             finalDate = today;
          } else {
             // 如果是补录以前，默认设为中午12点，避免时区导致跳天
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
    recordDate: getLocalTodayDate() // 改为日期
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

      {/* 核心修改：改为 type="date" */}
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
          
          // 智能构建时间戳
          let finalDate = new Date(formData.recordDate.replace(/-/g, '/')); 
          const today = new Date();
          
          if (finalDate.toDateString() === today.toDateString()) {
             finalDate = today; // 如果是今天，使用当前时间
          } else {
             finalDate.setHours(12, 0, 0, 0); // 如果是补录，设为中午12点
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
