import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { firebaseService } from '../services/firebase';
import { useApp } from '../context/AppContext';

interface DraftItem {
  id: string;
  userId?: string;
  productId?: string;
  productTitle?: string;
  measurements?: any;
  customizationData?: any;
  createdAt?: string;
  updatedAt?: string;
}

const formatDate = (iso?: string) => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString(); } catch { return iso || ''; }
};

const Drafts: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useApp();
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const uid = user?.id || 'guest';

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const items = await firebaseService.loadOrderDrafts(uid);
        if (mounted) setDrafts(items as DraftItem[]);
      } catch (e) {
        console.warn('Failed to load drafts', e);
      }
    })();
    return () => { mounted = false; };
  }, [uid]);

  const resumeDraft = (draft: DraftItem) => {
    // Prefer navigating to order-summary with state; also support route param navigation
    const statePayload = {
      measurementData: draft.measurements,
      customizationData: draft.customizationData,
      productId: draft.productId,
      orderDraftId: draft.id,
    };
    // Navigate with state for full hydration
    navigate('/order-summary', { state: statePayload });
  };

  const rows = useMemo(() => drafts.map(d => ({
    id: d.id,
    title: d.productTitle || 'طلب بدون عنوان',
    when: formatDate(d.updatedAt || d.createdAt),
    hasMeasurements: !!d.measurements,
    hasCustomization: !!d.customizationData,
  })), [drafts]);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">مسوداتي</h1>

      {drafts.length === 0 ? (
        <div className="rounded border p-6 text-center text-gray-600">
          لا توجد مسودات محفوظة حالياً.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(r => (
            <div key={r.id} className="flex items-center justify-between rounded border p-4">
              <div>
                <div className="font-medium">{r.title}</div>
                <div className="text-sm text-gray-600">آخر تحديث: {r.when}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {r.hasMeasurements ? 'قياسات موجودة' : 'بدون قياسات'} • {r.hasCustomization ? 'تخصيصات موجودة' : 'بدون تخصيصات'}
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={() => resumeDraft(drafts.find(x => x.id === r.id)!)}>متابعة</button>
                <button className="px-3 py-2 rounded bg-gray-200" onClick={() => navigate(`/order-summary/${r.id}`)}>فتح بالرابط</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Drafts;
