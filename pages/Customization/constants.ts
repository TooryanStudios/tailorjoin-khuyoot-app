import { Palette, Ruler, Check } from 'lucide-react';
import { Step } from './types';

export const STEPS: Step[] = [
  { number: 1, title: 'خيارات التفصيل', subtitle: 'اختر المواصفات', icon: Palette, color: 'from-violet-500 to-purple-600' },
  { number: 2, title: 'المقاسات', subtitle: 'أدخل قياساتك', icon: Ruler, color: 'from-blue-500 to-cyan-600' },
  { number: 3, title: 'التأكيد', subtitle: 'راجع طلبك', icon: Check, color: 'from-emerald-500 to-teal-600' }
];

export const MEASUREMENT_MARKERS = [
  { key: 'neck', label: 'الرقبة', top: '12%', left: '50%', align: 'right' },
  { key: 'shoulder', label: 'الكتف', top: '20%', left: '30%', align: 'left' },
  { key: 'chest', label: 'الصدر', top: '28%', left: '72%', align: 'right' },
  { key: 'waist', label: 'الخصر', top: '42%', left: '52%', align: 'right' },
  { key: 'sleeve', label: 'الكم', top: '34%', left: '20%', align: 'left' },
  { key: 'length', label: 'الطول', top: '68%', left: '55%', align: 'right' },
  { key: 'thigh', label: 'الفخذ', top: '62%', left: '78%', align: 'right' },
  { key: 'shoe', label: 'المقاس (حذاء)', top: '88%', left: '40%', align: 'left' },
] as const;

export const MEASUREMENT_FIELDS = [
  { key: 'neck', label: 'الرقبة', icon: '🔹' },
  { key: 'shoulder', label: 'الكتف', icon: '🔹' },
  { key: 'chest', label: 'الصدر', icon: '🔹' },
  { key: 'waist', label: 'الخصر', icon: '🔹' },
  { key: 'sleeve', label: 'الكم', icon: '🔹' },
  { key: 'length', label: 'الطول', icon: '🔹' },
  { key: 'thigh', label: 'الفخذ', icon: '🔹' },
  { key: 'shoe', label: 'المقاس (الحذاء)', icon: '🔹' }
] as const;
