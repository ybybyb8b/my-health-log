import React, { useState, useEffect } from 'react';
import { Stethoscope, GitCommit, Plus, X, Activity, Pill } from 'lucide-react';
import { getLocalTodayDate, toInputDateTime, MEDICATION_METHODS } from './utils.jsx';

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

  useEffect(() => {
    if (editingLog) {
        const datePart = new Date(editingLog.timestamp).toISOString().split('T')[0];
        setFormData({
            ...editingLog,
            recordDate: datePart
        });
    } else {
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

export function MedicationForm({ onSubmit, activeCourses, editingLog, customMeds = [], onDeleteCustomMed }) {
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
      
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">药品/治疗名称</label>
        <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition-all text-slate-800 dark:text-white" placeholder="例如：奥司他韦..." />
        {/* 智能联想标签 */}
        {customMeds && customMeds.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 animate-fade-in">
            {customMeds.map(medName => (
              <div key={medName} className="group flex items-center bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-lg overflow-hidden">
                 <button onClick={() => setFormData({...formData, name: medName})} className="px-3 py-1.5 text-xs text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">{medName}</button>
                 <button onClick={(e) => { e.stopPropagation(); onDeleteCustomMed && onDeleteCustomMed(medName); }} className="px-1.5 py-1.5 text-indigo-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-l border-indigo-100 dark:border-indigo-800" title="从常用列表中移除"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

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
