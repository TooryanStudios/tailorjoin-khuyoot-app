import React, { useState, useEffect } from 'react';
import { useProductForm } from '../context/ProductFormContext';
import { Sparkles } from 'lucide-react';

// Import category data - using a temporary stub until we connect to real data
const getCategoryHierarchy = async () => {
  // This will be replaced with actual category loading
  return [
    { id: 'dishdasha', nameAr: 'دشداشة', nameEn: 'Dishdasha', isParent: false, image: '' },
    { id: 'thobe', nameAr: 'ثوب', nameEn: 'Thobe', isParent: false, image: '' },
    { id: 'abaya', nameAr: 'عباية', nameEn: 'Abaya', isParent: false, image: '' },
  ];
};

export const ProductDetailsPanel: React.FC = () => {
  const {
    name,
    categoryId,
    price,
    duration,
    description,
    tags,
    setName,
    setCategoryId,
    setCategory,
    setPrice,
    setDuration,
    setDescription,
    setTags
  } = useProductForm();

  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const hierarchy = await getCategoryHierarchy();
        setAvailableCategories(hierarchy);
        
        // Auto-select first child category if none selected
        if (!categoryId) {
          const firstChild = hierarchy.find((cat: any) => !cat.isParent);
          if (firstChild) {
            setCategoryId(firstChild.id);
            setCategory(firstChild.nameAr);
            setName(firstChild.nameAr); // Auto-fill name
          }
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    loadCategories();
  }, []);

  const handleCategorySelect = (cat: any) => {
    setCategoryId(cat.id);
    setCategory(cat.nameAr);
    setName(cat.nameAr); // Auto-fill name
    setShowCategoryModal(false);
  };

  const groupedCategories = React.useMemo(() => {
    const groups = new Map<string, any[]>();
    let currentGroupName = '';
    
    for (const cat of availableCategories) {
      if (cat.isParent) {
        currentGroupName = cat.nameAr;
        if (!groups.has(currentGroupName)) groups.set(currentGroupName, []);
        continue;
      }
      const groupName = cat.parentName || currentGroupName || 'تصنيفات';
      if (!groups.has(groupName)) groups.set(groupName, []);
      groups.get(groupName)!.push(cat);
    }

    const q = categorySearch.trim().toLowerCase();
    const result: any[] = [];
    
    for (const [groupName, children] of groups.entries()) {
      const filtered = children.filter((c: any) => 
        q === '' || c.nameAr.toLowerCase().includes(q) || c.nameEn?.toLowerCase().includes(q)
      );
      if (filtered.length > 0) {
        result.push({ groupName, children: filtered });
      }
    }
    
    return result;
  }, [availableCategories, categorySearch]);

  const selectedCategory = availableCategories.find(cat => cat.id === categoryId);

  return (
    <div className="border-t border-white/5 divide-y divide-white/5">
      {/* اسم المنتج */}
      <div className="px-3 py-2 flex items-center gap-3">
        <label className="w-24 shrink-0 text-[11px] font-medium text-slate-400">اسم المنتج</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="مثال: دشداشة عمانية تقليدية"
          className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-600 outline-none text-right"
        />
      </div>

      {/* الفئة */}
      <div className="px-3 py-2 flex items-center gap-3">
        <label className="w-24 shrink-0 text-[11px] font-medium text-slate-400">الفئة</label>
        <button
          type="button"
          onClick={() => setShowCategoryModal(true)}
          className="flex-1 flex items-center justify-between gap-2 bg-transparent text-right"
        >
          <span className={`text-xs ${selectedCategory ? 'text-slate-200' : 'text-slate-600'}`}>
            {selectedCategory?.nameAr || 'اختر التصنيف'}
          </span>
          {selectedCategory?.image && (
            <img src={selectedCategory.image} className="w-6 h-6 rounded object-cover" alt="" />
          )}
        </button>
      </div>

      {/* السعر */}
      <div className="px-3 py-2 flex items-center gap-3">
        <label className="w-24 shrink-0 text-[11px] font-medium text-slate-400">السعر (ر.ع)</label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="10.00"
          step="0.1"
          min="0"
          className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-600 outline-none text-left"
          dir="ltr"
        />
      </div>

      {/* مدة التسليم */}
      <div className="px-3 py-2 flex items-center gap-3">
        <label className="w-24 shrink-0 text-[11px] font-medium text-slate-400">مدة التسليم</label>
        <input
          type="text"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="3-5 أيام"
          className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-600 outline-none text-right"
        />
      </div>

      {/* الوصف */}
      <div className="px-3 py-2 flex items-start gap-3">
        <label className="w-24 shrink-0 pt-0.5 text-[11px] font-medium text-slate-400">الوصف</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="وصف تفصيلي للمنتج..."
          rows={2}
          className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-600 outline-none resize-none text-right"
        />
      </div>

      {/* الوسوم */}
      <div className="px-3 py-2 flex items-center gap-3">
        <label className="w-24 shrink-0 text-[11px] font-medium text-slate-400">الوسوم</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="عماني، تقليدي، فاخر (افصل بفاصلة)"
          className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-600 outline-none text-right"
        />
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1a1f] rounded-2xl border border-white/10 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white mb-4">اختر التصنيف</h3>
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="ابحث عن تصنيف..."
                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500/50 outline-none text-white placeholder-gray-500"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {groupedCategories.map(({ groupName, children }) => (
                <div key={groupName}>
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 px-2">
                    {groupName}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {children.map((cat: any) => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat)}
                        className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-white/10 transition-all text-right"
                      >
                        {cat.image && (
                          <div className="w-10 h-10 rounded bg-white/5 overflow-hidden shrink-0">
                            <img src={cat.image} className="w-full h-full object-cover" alt="" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-white truncate">
                          {cat.nameAr}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-white/10">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="w-full px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
