import React from 'react';
import { 
  Activity, Pill, Trash2, AlertTriangle, RefreshCw, Pencil
} from 'lucide-react';
import { formatDate, MEDICATION_METHODS } from './utils.jsx';

// --- ErrorBoundary (防崩溃) ---
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
          <div className="bg-white dark:bg-ios-card p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-white/10 max-w-sm w-full">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">糟糕，应用崩溃了</h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 mb-8">请尝试刷新，数据已安全保存。</p>
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

// --- LogItem (单条记录卡片) ---
export function LogItem({ log, onDelete, onEdit, simple = false }) {
  const isSymptom = log.type === 'symptom';
  const isProgression = log.isProgression; 
  
  // 颜色配置提取出来，方便管理
  const symptomColors = "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300";
  const medColors = "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300";
  const progressionColors = "border-orange-300 bg-orange-50/50 dark:bg-orange-500/10 dark:border-orange-500/30 dark:text-orange-200";

  return (
    <div className={`group relative flex justify-between items-start transition-all
      ${simple ? 'p-3' : 'p-5'} 
      ${/* 卡片基础样式优化：圆角，深色下边框变淡 */ ''}
      rounded-[1.5rem] border 
      ${isProgression 
        ? progressionColors 
        : 'bg-white border-zinc-100 dark:bg-ios-card dark:border-white/5 hover:shadow-md'
      }
    `}>
      <div className="flex gap-4 items-start">
        {/* 图标容器：背景透明度优化 */}
        <div className={`mt-0.5 p-2.5 rounded-xl h-fit shrink-0 ${isSymptom ? symptomColors : medColors}`}>
          {isSymptom ? <Activity className="w-5 h-5"/> : <Pill className="w-5 h-5"/>}
        </div>
        
        <div className="flex-1 min-w-0"> {/* min-w-0 防止文字溢出 */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {isProgression && (
               <span className="text-orange-600 dark:text-orange-300 text-[10px] font-bold flex items-center gap-1">
                 <AlertTriangle className="w-3 h-3" /> 病情演变
               </span>
            )}
            
            {/* 标题文字颜色优化 */}
            <h4 className="font-bold text-zinc-800 dark:text-zinc-100 text-base">
              {isSymptom ? log.bodyPart : log.name}
            </h4>

            {/* 严重程度/方式 Pill 优化 */}
            {isSymptom && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold 
                ${log.severity > 7 
                  ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300' 
                  : 'bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-400'
                }`}>
                {log.severity}级
              </span>
            )}
            {!isSymptom && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-400 font-medium">
                {log.method === 'other' ? log.methodLabel : MEDICATION_METHODS.find(m => m.id === log.method)?.label}
              </span>
            )}
          </div>
          
          {/* 详情文字颜色优化: zinc-500 -> zinc-400 */}
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-snug break-all">
            {isSymptom ? (log.note || '') : `${log.dosage} ${log.reason ? `• ${log.reason}` : ''}`}
          </p>
          
          {!simple && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2 font-mono">
              {formatDate(log.timestamp)}
            </p>
          )}
        </div>
      </div>
      
      {/* 操作按钮：优化深色下的 hover 状态 */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pl-2">
          {onEdit && <button onClick={() => onEdit(log)} className="p-2 text-zinc-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/20 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>}
          <button onClick={() => onDelete(log.id)} className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
