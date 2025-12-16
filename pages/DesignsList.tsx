import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { designService, PersistedDesign } from '../services/designService';
import { Button } from '../components/Button';
import { X, Trash2, Pencil, RefreshCcw } from 'lucide-react';

const DesignsList: React.FC = () => {
  const { user } = useApp();
  const [designs, setDesigns] = useState<PersistedDesign[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const list = await designService.listDesigns(user.id);
      setDesigns(list.sort((a,b) => b.updatedAt - a.updatedAt));
    } catch (e) {
      console.warn('Failed to list designs, using local fallback', e);
      try {
        const raw = localStorage.getItem(`designs_${user.id}`);
        const arr: PersistedDesign[] = raw ? JSON.parse(raw) : [];
        setDesigns(arr.sort((a,b) => b.updatedAt - a.updatedAt));
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user]);

  const handleDelete = async (d: PersistedDesign) => {
    if (!user) return;
    if (confirm('هل تريد حذف هذا التصميم؟')) {
      await designService.deleteDesign(user.id, d.id);
      await load();
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black">تصاميمي</h2>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCcw size={16} className="ml-2" /> تحديث
        </Button>
      </div>
      {!user ? (
        <p className="text-sm text-slate-500">يرجى تسجيل الدخول لعرض التصاميم.</p>
      ) : loading ? (
        <p className="text-sm">جارِ التحميل...</p>
      ) : designs.length === 0 ? (
        <p className="text-sm text-slate-500">لا توجد تصاميم محفوظة.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {designs.map(d => (
            <div key={d.id} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
              <div className="flex gap-3">
                <img src={d.fabricImage || d.generatedImage || 'https://picsum.photos/100/100'} alt="preview" className="w-20 h-20 rounded-xl object-cover" />
                <div className="flex-1 text-right">
                  <div className="text-sm font-bold">{d.selectedTemplate}</div>
                  <div className="text-[11px] text-slate-500">آخر تعديل: {new Date(d.updatedAt).toLocaleString('ar-OM')}</div>
                  <div className="mt-2 flex gap-2 justify-end">
                    <Button size="sm" onClick={() => window.location.hash = '#/designer'}>
                      <Pencil size={14} className="ml-2" /> تعديل
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(d)}>
                      <Trash2 size={14} className="ml-2" /> حذف
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DesignsList;
