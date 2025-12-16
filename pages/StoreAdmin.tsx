import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Package, Truck, ShoppingCart, BarChart3, Settings, ArrowLeft, Plus, Search, Filter, Edit2, Trash2, Eye } from 'lucide-react';
import { Button } from '../components/Button';

export const StoreAdmin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'inventory' | 'analytics' | 'settings'>('products');

  // بيانات تجريبية للمنتجات
  const [products] = useState([
    { id: 1, name: 'قماش حرير إيطالي', price: 45.0, stock: 120, category: 'أقمشة', image: 'https://picsum.photos/100/100?random=1' },
    { id: 2, name: 'خيوط قطن ملونة', price: 5.5, stock: 350, category: 'خيوط', image: 'https://picsum.photos/100/100?random=2' },
    { id: 3, name: 'مقص خياطة احترافي', price: 12.0, stock: 45, category: 'أدوات', image: 'https://picsum.photos/100/100?random=3' },
    { id: 4, name: 'قماش قطن مصري', price: 18.5, stock: 200, category: 'أقمشة', image: 'https://picsum.photos/100/100?random=4' },
  ]);

  const [orders] = useState([
    { id: '#ORD-001', customer: 'أحمد المعولي', total: 125.5, status: 'pending', date: '2024-01-05' },
    { id: '#ORD-002', customer: 'فاطمة السيابية', total: 89.0, status: 'shipped', date: '2024-01-04' },
    { id: '#ORD-003', customer: 'محمد الهنائي', total: 210.5, status: 'delivered', date: '2024-01-03' },
  ]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-amber-500/20 text-amber-400';
      case 'shipped': return 'bg-blue-500/20 text-blue-400';
      case 'delivered': return 'bg-green-500/20 text-green-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'pending': return 'قيد المعالجة';
      case 'shipped': return 'تم الشحن';
      case 'delivered': return 'تم التوصيل';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1121]" dir="rtl">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Store className="text-emerald-500" size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800 dark:text-white">إدارة متجر خيوط</h1>
                  <p className="text-sm text-slate-500">إدارة شاملة للمنتجات والطلبات</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-lg">
                <span className="text-sm text-slate-600 dark:text-slate-300">المبيعات اليوم:</span>
                <span className="font-bold text-emerald-600">425.0 ر.ع</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'products', label: 'المنتجات', icon: Package },
              { id: 'orders', label: 'الطلبات', icon: ShoppingCart },
              { id: 'inventory', label: 'المخزون', icon: Truck },
              { id: 'analytics', label: 'التقارير', icon: BarChart3 },
              { id: 'settings', label: 'الإعدادات', icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">إدارة المنتجات</h2>
              <Button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700">
                <Plus size={18} />
                إضافة منتج جديد
              </Button>
            </div>

            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-[250px]">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="البحث عن منتج..."
                    className="w-full pr-10 pl-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
                  />
                </div>
              </div>
              <Button className="flex items-center gap-2 bg-slate-600 hover:bg-slate-700">
                <Filter size={18} />
                تصفية
              </Button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="text-right px-6 py-3 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">المنتج</th>
                    <th className="text-right px-6 py-3 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">الفئة</th>
                    <th className="text-right px-6 py-3 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">السعر</th>
                    <th className="text-right px-6 py-3 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">المخزون</th>
                    <th className="text-right px-6 py-3 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                          <span className="font-medium text-slate-800 dark:text-white">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{product.category}</td>
                      <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">{product.price.toFixed(3)} ر.ع</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          product.stock > 100 ? 'bg-green-500/20 text-green-400' :
                          product.stock > 50 ? 'bg-amber-500/20 text-amber-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {product.stock} وحدة
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button className="p-2 hover:bg-blue-500/10 rounded-lg text-blue-500 transition-colors">
                            <Eye size={16} />
                          </button>
                          <button className="p-2 hover:bg-emerald-500/10 rounded-lg text-emerald-500 transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button className="p-2 hover:bg-red-500/10 rounded-lg text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">إدارة الطلبات</h2>
              <div className="flex gap-2">
                <Button className="bg-slate-600 hover:bg-slate-700">
                  تصدير التقرير
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">قيد المعالجة</span>
                  <ShoppingCart className="text-amber-500" size={20} />
                </div>
                <p className="text-2xl font-bold text-amber-600">15</p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">تم الشحن</span>
                  <Truck className="text-blue-500" size={20} />
                </div>
                <p className="text-2xl font-bold text-blue-600">8</p>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">تم التوصيل</span>
                  <Package className="text-green-500" size={20} />
                </div>
                <p className="text-2xl font-bold text-green-600">42</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="text-right px-6 py-3 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">رقم الطلب</th>
                    <th className="text-right px-6 py-3 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">العميل</th>
                    <th className="text-right px-6 py-3 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">المبلغ</th>
                    <th className="text-right px-6 py-3 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">الحالة</th>
                    <th className="text-right px-6 py-3 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">التاريخ</th>
                    <th className="text-right px-6 py-3 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">{order.id}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{order.customer}</td>
                      <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">{order.total.toFixed(3)} ر.ع</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{order.date}</td>
                      <td className="px-6 py-4">
                        <Button className="text-xs py-1 px-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/50 transition-all">
                          <Eye size={14} />
                          عرض
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="text-center py-12">
            <Truck className="mx-auto mb-4 text-slate-400" size={64} />
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">إدارة المخزون</h3>
            <p className="text-slate-500">هذه الوحدة قيد التطوير</p>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="text-center py-12">
            <BarChart3 className="mx-auto mb-4 text-slate-400" size={64} />
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">التقارير والإحصائيات</h3>
            <p className="text-slate-500">هذه الوحدة قيد التطوير</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="text-center py-12">
            <Settings className="mx-auto mb-4 text-slate-400" size={64} />
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">إعدادات المتجر</h3>
            <p className="text-slate-500">هذه الوحدة قيد التطوير</p>
          </div>
        )}
      </div>
    </div>
  );
};
