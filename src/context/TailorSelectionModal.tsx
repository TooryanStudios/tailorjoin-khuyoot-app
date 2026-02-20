import React, { useState, useEffect } from 'react';
import { Order, Tailor } from '../../types';
import { X, Search, Star, MapPin, Loader } from 'lucide-react';
import { firebaseService } from '../../services/firebase';

interface TailorSelectionModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onTailorSelected: (tailor: Tailor) => Promise<void>;
  variant?: 'modal' | 'inline';
  hideHeader?: boolean;
}

export const TailorSelectionModal: React.FC<TailorSelectionModalProps> = ({
  isOpen,
  order,
  onClose,
  onTailorSelected,
  variant = 'modal',
  hideHeader
}) => {
  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [filteredTailors, setFilteredTailors] = useState<Tailor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState('');
  const [selectedTailorId, setSelectedTailorId] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (isOpen && order) {
      loadAndFilterTailors();
    }
  }, [isOpen, order]);

  const loadAndFilterTailors = async () => {
    if (!order) return;
    setLoading(true);
    try {
      // Get all approved tailors
      const allTailors = await firebaseService.getApprovedTailors();
      
      // Get current tailor info to match gender and specializations
      const currentTailor = await firebaseService.getUserProfile(order.tailorId);
      
      // Filter: Exclude current tailor, match gender and clothing types
      const filtered = allTailors.filter(tailor => {
        // Don't show current tailor
        if (tailor.id === order.tailorId) return false;
        
        // Match gender specialization
        if (currentTailor?.tailorGender && tailor.tailorGender !== currentTailor.tailorGender) {
          return false;
        }
        
        // Match clothing type specialization
        if (currentTailor?.specialization && tailor.specialization !== currentTailor.specialization) {
          return false;
        }
        
        return true;
      });

      setTailors(filtered);
      setFilteredTailors(filtered);
    } catch (error) {
      console.error('Error loading tailors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearching(query);
    if (!query) {
      setFilteredTailors(tailors);
    } else {
      const filtered = tailors.filter(tailor =>
        tailor.name?.toLowerCase().includes(query.toLowerCase()) ||
        tailor.location?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredTailors(filtered);
    }
  };

  const handleSelectTailor = async (tailor: Tailor) => {
    if (isAssigning || !order) return;
    setIsAssigning(true);
    try {
      await onTailorSelected(tailor);
      onClose();
    } catch (error) {
      console.error('Error assigning tailor:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  if (!isOpen || !order) return null;

  const showHeader = hideHeader === undefined ? variant === 'modal' : !hideHeader;
  const containerClassName =
    variant === 'modal'
      ? 'bg-white rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col animate-in zoom-in duration-300'
      : 'flex flex-col h-full';

  const content = (
    <div className={containerClassName} dir="rtl">
      {showHeader && (
        <div className="flex items-center justify-between p-6 border-b border-slate-200 shrink-0">
          <div>
            <h3 className="text-lg text-slate-900 font-bold">البحث عن خياط آخر</h3>
            <p className="text-xs text-slate-500 mt-1">اختر خياط متخصص بنفس نوع الملابس</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="p-4 border-b border-slate-100 shrink-0">
        <div className="relative">
          <input
            type="text"
            placeholder="ابحث عن الاسم أو الموقع..."
            value={searching}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full h-10 bg-white rounded-lg border border-slate-200 px-3 pr-9 text-sm focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="w-6 h-6 text-[var(--theme-primary)] animate-spin mb-2" />
            <p className="text-xs text-slate-500">جاري تحميل الخياطين...</p>
          </div>
        ) : filteredTailors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-3">
              <Search className="text-slate-300" size={20} />
            </div>
            <p className="text-sm text-slate-600">لم نجد خياطين مطابقين</p>
            <p className="text-xs text-slate-500 mt-1">حاول البحث عن اسم أو موقع آخر</p>
          </div>
        ) : (
          filteredTailors.map((tailor) => (
            <div
              key={tailor.id}
              onClick={() => setSelectedTailorId(tailor.id)}
              className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                selectedTailorId === tailor.id
                  ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                  {tailor.image ? (
                    <img
                      src={tailor.image}
                      alt={tailor.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      👤
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-medium text-slate-900 truncate">{tailor.name}</h4>
                    {selectedTailorId === tailor.id && (
                      <div className="w-5 h-5 rounded-full bg-[var(--theme-primary)] flex items-center justify-center text-white shrink-0">
                        ✓
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-1">
                    {tailor.rating && (
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-xs text-slate-600">{tailor.rating.toFixed(1)}</span>
                      </div>
                    )}
                    {tailor.location && (
                      <div className="flex items-center gap-1">
                        <MapPin size={12} className="text-slate-400" />
                        <span className="text-xs text-slate-600 truncate">{tailor.location}</span>
                      </div>
                    )}
                  </div>

                  {tailor.experience && (
                    <p className="text-xs text-slate-500 mt-1">خبرة: {tailor.experience}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-3 p-4 border-t border-slate-100 shrink-0">
        <button
          onClick={onClose}
          className="flex-1 h-10 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition-colors"
        >
          إلغاء
        </button>
        <button
          onClick={() => {
            if (selectedTailorId) {
              const selectedTailor = filteredTailors.find(t => t.id === selectedTailorId);
              if (selectedTailor) {
                handleSelectTailor(selectedTailor);
              }
            }
          }}
          disabled={!selectedTailorId || isAssigning}
          className="flex-1 h-10 bg-[var(--theme-primary)] text-white rounded-lg text-sm hover:bg-[var(--theme-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {isAssigning ? (
            <>
              <Loader size={14} className="animate-spin" />
              جاري التعيين...
            </>
          ) : (
            'تعيين الخياط'
          )}
        </button>
      </div>
    </div>
  );

  if (variant === 'inline') {
    return content;
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>{content}</div>
    </div>
  );
};
