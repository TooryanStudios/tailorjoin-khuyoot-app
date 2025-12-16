import React, { useState, useEffect } from 'react';
import { Plus, Package, Scissors, Palette, Edit, Trash2, X, Upload, Check } from 'lucide-react';
import { FabricMaterial, MaterialType, FabricCategory } from '../types';
import { Button } from '../components/Button';
import { useApp } from '../context/AppContext';

export const TailorMaterials = () => {
  const { user } = useApp();
  const [materials, setMaterials] = useState<FabricMaterial[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<FabricMaterial | null>(null);
  const [filterType, setFilterType] = useState<MaterialType | 'all'>('all');

  useEffect(() => {
    loadMaterials();
  }, [user]);

  const loadMaterials = () => {
    if (!user) return;
    // Load from localStorage or Firebase
    const saved = localStorage.getItem(`materials_${user.id}`);
    if (saved) {
      setMaterials(JSON.parse(saved));
    }
  };

  const saveMaterials = (updatedMaterials: FabricMaterial[]) => {
    if (!user) return;
    localStorage.setItem(`materials_${user.id}`, JSON.stringify(updatedMaterials));
    setMaterials(updatedMaterials);
  };

  const handleDeleteMaterial = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
      const updated = materials.filter(m => m.id !== id);
      saveMaterials(updated);
    }
  };

  const filteredMaterials = filterType === 'all' 
    ? materials 
    : materials.filter(m => m.type === filterType);

  return (
    <div className="pb-20 pt-4 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">الأقمشة والمواد</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">إدارة الأقمشة والخيوط والملحقات المتوفرة</p>
          </div>
          <Button 
            onClick={() => {
              setEditingMaterial(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus size={20} />
            إضافة جديد
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'all', label: 'الكل', icon: Package },
            { id: 'fabric', label: 'الأقمشة', icon: Palette },
            { id: 'thread', label: 'الخيوط', icon: Scissors },
            { id: 'accessory', label: 'الملحقات', icon: Package }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as MaterialType | 'all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                filterType === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Materials Grid */}
        {filteredMaterials.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 dark:bg-slate-800 rounded-2xl">
            <Package size={48} className="mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">لا توجد مواد</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">ابدأ بإضافة الأقمشة والمواد المتوفرة لديك</p>
            <Button onClick={() => setShowAddModal(true)}>
              إضافة أول عنصر
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMaterials.map(material => (
              <MaterialCard
                key={material.id}
                material={material}
                onEdit={() => {
                  setEditingMaterial(material);
                  setShowAddModal(true);
                }}
                onDelete={() => handleDeleteMaterial(material.id)}
              />
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <MaterialModal
            material={editingMaterial}
            onClose={() => {
              setShowAddModal(false);
              setEditingMaterial(null);
            }}
            onSave={(material) => {
              if (editingMaterial) {
                const updated = materials.map(m => m.id === material.id ? material : m);
                saveMaterials(updated);
              } else {
                saveMaterials([...materials, material]);
              }
              setShowAddModal(false);
              setEditingMaterial(null);
            }}
            userId={user?.id || ''}
          />
        )}
      </div>
    </div>
  );
};

// Material Card Component
const MaterialCard: React.FC<{
  material: FabricMaterial;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ material, onEdit, onDelete }) => {
  const getTypeLabel = (type: MaterialType) => {
    switch(type) {
      case 'fabric': return 'قماش';
      case 'thread': return 'خيط';
      case 'accessory': return 'ملحق';
    }
  };

  const getTypeColor = (type: MaterialType) => {
    switch(type) {
      case 'fabric': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'thread': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'accessory': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden group">
      {/* Image */}
      <div className="aspect-square bg-slate-100 dark:bg-slate-900 relative">
        <img 
          src={material.image} 
          alt={material.name}
          className="w-full h-full object-cover"
        />
        {!material.inStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              غير متوفر
            </span>
          </div>
        )}
        <span className={`absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-bold ${getTypeColor(material.type)}`}>
          {getTypeLabel(material.type)}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-slate-900 dark:text-white mb-1">{material.name}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">{material.description}</p>
        
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{material.price} ر.س</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">/{material.unit === 'meter' ? 'متر' : material.unit === 'spool' ? 'بكرة' : 'قطعة'}</span>
          </div>
          {material.quantity && (
            <span className="text-sm text-slate-600 dark:text-slate-400">
              الكمية: {material.quantity}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-medium"
          >
            <Edit size={16} />
            تعديل
          </button>
          <button
            onClick={onDelete}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-medium"
          >
            <Trash2 size={16} />
            حذف
          </button>
        </div>
      </div>
    </div>
  );
};

// Material Modal Component
const MaterialModal: React.FC<{
  material: FabricMaterial | null;
  onClose: () => void;
  onSave: (material: FabricMaterial) => void;
  userId: string;
}> = ({ material, onClose, onSave, userId }) => {
  const [formData, setFormData] = useState<Partial<FabricMaterial>>({
    type: 'fabric',
    name: '',
    description: '',
    price: 0,
    unit: 'meter',
    image: 'https://placehold.co/400x400?text=صورة+المادة',
    inStock: true,
    ...material
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newMaterial: FabricMaterial = {
      id: material?.id || `mat_${Date.now()}`,
      tailorId: userId,
      type: formData.type as MaterialType,
      name: formData.name || '',
      description: formData.description || '',
      price: formData.price || 0,
      unit: formData.unit || 'meter',
      image: formData.image || '',
      inStock: formData.inStock ?? true,
      quantity: formData.quantity,
      category: formData.category,
      color: formData.color,
      width: formData.width,
      weight: formData.weight,
      origin: formData.origin,
      createdAt: material?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(newMaterial);
  };

  const fabricCategories: { id: FabricCategory, label: string }[] = [
    { id: 'cotton', label: 'قطن' },
    { id: 'silk', label: 'حرير' },
    { id: 'wool', label: 'صوف' },
    { id: 'linen', label: 'كتان' },
    { id: 'polyester', label: 'بوليستر' },
    { id: 'mixed', label: 'مخلوط' },
    { id: 'other', label: 'أخرى' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {material ? 'تعديل المادة' : 'إضافة مادة جديدة'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">نوع المادة *</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'fabric', label: 'قماش', icon: Palette },
                { id: 'thread', label: 'خيط', icon: Scissors },
                { id: 'accessory', label: 'ملحق', icon: Package }
              ].map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.id as MaterialType })}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                    formData.type === type.id
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <type.icon size={24} />
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Basic Info */}
          <div>
            <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">اسم المادة *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              placeholder="مثال: قماش قطن فاخر"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">الوصف *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              placeholder="وصف تفصيلي للمادة..."
              rows={3}
              required
            />
          </div>

          {/* Fabric Category - Only for fabrics */}
          {formData.type === 'fabric' && (
            <div>
              <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">نوع القماش</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as FabricCategory })}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="">اختر النوع</option>
                {fabricCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Price and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">السعر (ر.س) *</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">وحدة البيع *</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="meter">متر</option>
                <option value="piece">قطعة</option>
                <option value="spool">بكرة</option>
              </select>
            </div>
          </div>

          {/* Additional Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">الكمية المتوفرة</label>
              <input
                type="number"
                value={formData.quantity || ''}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || undefined })}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">اللون</label>
              <input
                type="text"
                value={formData.color || ''}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                placeholder="مثال: أزرق غامق"
              />
            </div>
          </div>

          {/* Fabric Specific Fields */}
          {formData.type === 'fabric' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">العرض (سم)</label>
                <input
                  type="number"
                  value={formData.width || ''}
                  onChange={(e) => setFormData({ ...formData, width: parseFloat(e.target.value) || undefined })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  placeholder="150"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">الوزن (جم/م²)</label>
                <input
                  type="number"
                  value={formData.weight || ''}
                  onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || undefined })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  placeholder="200"
                  step="0.1"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">بلد المنشأ</label>
            <input
              type="text"
              value={formData.origin || ''}
              onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              placeholder="مثال: تركيا"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">رابط الصورة *</label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              placeholder="https://example.com/image.jpg"
              required
            />
            {formData.image && (
              <img src={formData.image} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-lg" />
            )}
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="inStock"
              checked={formData.inStock}
              onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
              className="w-5 h-5 rounded border-slate-300 dark:border-slate-600"
            />
            <label htmlFor="inStock" className="text-sm font-medium text-slate-900 dark:text-white">
              متوفر في المخزون
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              <Check size={20} />
              {material ? 'حفظ التعديلات' : 'إضافة المادة'}
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
