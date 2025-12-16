import React, { useState } from 'react';
import { Package, Plus, Search, Edit, Trash2, AlertTriangle, TrendingUp, TrendingDown, Box } from 'lucide-react';

type ProductCategory = 'fabric' | 'accessory' | 'tool';

interface InventoryItem {
  id: string;
  name: string;
  category: ProductCategory;
  quantity: number;
  minQuantity: number;
  price: number;
  unit: string;
  lastRestocked: string;
}

// بيانات تجريبية
const mockInventory: InventoryItem[] = [
  {
    id: 'INV-001',
    name: 'قماش صوف - رمادي',
    category: 'fabric',
    quantity: 45,
    minQuantity: 20,
    price: 15.000,
    unit: 'متر',
    lastRestocked: '2025-12-01'
  },
  {
    id: 'INV-002',
    name: 'قماش قطن - أبيض',
    category: 'fabric',
    quantity: 15,
    minQuantity: 30,
    price: 8.000,
    unit: 'متر',
    lastRestocked: '2025-11-28'
  },
  {
    id: 'INV-003',
    name: 'قماش حرير - أزرق',
    category: 'fabric',
    quantity: 28,
    minQuantity: 15,
    price: 25.000,
    unit: 'متر',
    lastRestocked: '2025-12-03'
  },
  {
    id: 'INV-004',
    name: 'أزرار فضية',
    category: 'accessory',
    quantity: 250,
    minQuantity: 100,
    price: 0.500,
    unit: 'قطعة',
    lastRestocked: '2025-12-02'
  },
  {
    id: 'INV-005',
    name: 'خيوط ذهبية',
    category: 'accessory',
    quantity: 80,
    minQuantity: 50,
    price: 3.000,
    unit: 'بكرة',
    lastRestocked: '2025-11-30'
  },
  {
    id: 'INV-006',
    name: 'قماش كتان - بيج',
    category: 'fabric',
    quantity: 12,
    minQuantity: 25,
    price: 12.000,
    unit: 'متر',
    lastRestocked: '2025-11-25'
  },
  {
    id: 'INV-007',
    name: 'مقصات احترافية',
    category: 'tool',
    quantity: 8,
    minQuantity: 5,
    price: 45.000,
    unit: 'قطعة',
    lastRestocked: '2025-11-20'
  },
  {
    id: 'INV-008',
    name: 'قماش مخمل - بني',
    category: 'fabric',
    quantity: 5,
    minQuantity: 15,
    price: 20.000,
    unit: 'متر',
    lastRestocked: '2025-11-22'
  }
];

export const ShopInventory = () => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | ProductCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);

  const filteredInventory = mockInventory.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLowStock = !showLowStock || item.quantity < item.minQuantity;
    return matchesCategory && matchesSearch && matchesLowStock;
  });

  const getCategoryText = (category: ProductCategory) => {
    switch (category) {
      case 'fabric': return 'أقمشة';
      case 'accessory': return 'إكسسوارات';
      case 'tool': return 'أدوات';
    }
  };

  const getCategoryColor = (category: ProductCategory) => {
    switch (category) {
      case 'fabric': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'accessory': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
      case 'tool': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
    }
  };

  const isLowStock = (item: InventoryItem) => item.quantity < item.minQuantity;

  const stats = {
    total: mockInventory.length,
    lowStock: mockInventory.filter(item => isLowStock(item)).length,
    totalValue: mockInventory.reduce((sum, item) => sum + (item.quantity * item.price), 0),
    categories: {
      fabric: mockInventory.filter(i => i.category === 'fabric').length,
      accessory: mockInventory.filter(i => i.category === 'accessory').length,
      tool: mockInventory.filter(i => i.category === 'tool').length
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050817] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
              <Box className="text-green-600 dark:text-green-400" size={36} />
              مخزون المحل
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              إدارة الأقمشة والمواد والأدوات
            </p>
          </div>

          <button className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors shadow-lg">
            <Plus size={20} />
            إضافة منتج جديد
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">إجمالي المنتجات</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
              </div>
              <Package className="text-slate-400" size={32} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">مخزون منخفض</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.lowStock}</p>
              </div>
              <AlertTriangle className="text-red-400" size={32} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">قيمة المخزون</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalValue.toFixed(0)}</p>
              </div>
              <TrendingUp className="text-green-400" size={32} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">الفئات</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  🧵 {stats.categories.fabric} | ✨ {stats.categories.accessory} | 🔧 {stats.categories.tool}
                </p>
              </div>
              <Box className="text-slate-400" size={32} />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="بحث عن منتج..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setSelectedCategory('fabric')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === 'fabric'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                🧵 أقمشة
              </button>
              <button
                onClick={() => setSelectedCategory('accessory')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === 'accessory'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                ✨ إكسسوارات
              </button>
              <button
                onClick={() => setSelectedCategory('tool')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === 'tool'
                    ? 'bg-orange-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                🔧 أدوات
              </button>
            </div>

            {/* Low Stock Toggle */}
            <label className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={showLowStock}
                onChange={(e) => setShowLowStock(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
              />
              <span className="text-sm font-medium text-red-700 dark:text-red-400">مخزون منخفض فقط</span>
            </label>
          </div>
        </div>

        {/* Inventory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInventory.map((item) => (
            <div
              key={item.id}
              className={`bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border-2 transition-all hover:shadow-md ${
                isLowStock(item)
                  ? 'border-red-300 dark:border-red-700'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-1">{item.name}</h3>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                    {getCategoryText(item.category)}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <Edit size={16} className="text-slate-600 dark:text-slate-400" />
                  </button>
                  <button className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                  </button>
                </div>
              </div>

              {/* Stock Status */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-600 dark:text-slate-400">المخزون</span>
                  <span className={`text-lg font-bold ${
                    isLowStock(item)
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {item.quantity} {item.unit}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isLowStock(item)
                        ? 'bg-red-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((item.quantity / item.minQuantity) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  الحد الأدنى: {item.minQuantity} {item.unit}
                </p>
              </div>

              {/* Low Stock Warning */}
              {isLowStock(item) && (
                <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />
                  <span className="text-xs font-medium text-red-700 dark:text-red-400">
                    يحتاج إلى إعادة تخزين
                  </span>
                </div>
              )}

              {/* Price and Info */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">السعر</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {item.price.toFixed(3)} ر.ع
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-xs text-slate-500 dark:text-slate-400">آخر تخزين</p>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{item.lastRestocked}</p>
                </div>
              </div>
            </div>
          ))}

          {filteredInventory.length === 0 && (
            <div className="col-span-full text-center py-16">
              <Package className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={64} />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">لا توجد منتجات</h3>
              <p className="text-slate-600 dark:text-slate-400">لم يتم العثور على منتجات تطابق البحث</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
