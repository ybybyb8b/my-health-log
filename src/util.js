import { Pill, Droplet, Syringe, Wind, FileText } from 'lucide-react';

// --- 基础配置 ---
export const DEFAULT_BODY_PARTS = ['头部', '眼部', '呼吸道', '心脏', '胃肠', '皮肤', '关节', '肌肉', '睡眠/精神', '体温'];

export const MEDICATION_METHODS = [
  { id: 'oral', label: '口服', icon: <Pill className="w-4 h-4"/> },
  { id: 'external', label: '外用', icon: <Droplet className="w-4 h-4"/> },
  { id: 'injection', label: '注射', icon: <Syringe className="w-4 h-4"/> },
  { id: 'inhalation', label: '吸入', icon: <Wind className="w-4 h-4"/> },
  { id: 'other', label: '其他', icon: <FileText className="w-4 h-4"/> },
];

// --- 工具函数 ---

export const safeDate = (dateInput) => {
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

export const formatDate = (isoString) => {
  if (!isoString) return '';
  const date = safeDate(isoString);
  if (isNaN(date.getTime())) return '时间错误';
  return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

export const formatDateOnly = (isoString) => {
  if (!isoString) return '';
  const date = safeDate(isoString);
  if (isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
};

export const formatTimeOnly = (isoString) => {
    if (!isoString) return '';
    const date = safeDate(isoString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const getDaysSince = (startDate) => {
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

export const getLocalTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const toInputDateTime = (isoString) => {
  if (!isoString) return '';
  const date = safeDate(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const isToday = (isoString) => {
    if (!isoString) return false;
    const date = safeDate(isoString);
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
};

export const safeParseArray = (key) => {
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
