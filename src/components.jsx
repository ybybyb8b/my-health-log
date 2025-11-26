import React from 'react';
import { 
  Activity, Pill, Trash2, AlertTriangle, RefreshCw, Pencil
} from 'lucide-react';
import { formatDate, MEDICATION_METHODS } from './utils';

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

// --- LogItem (单条记录卡片) ---
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
