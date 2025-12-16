import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PackageOpen, ShoppingBag, Calendar, Package, Filter, Search, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';

type OrderType = 'purchase' | 'rental';
type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface Order {
  id: string;
  customerName: string;
  customerAvatar?: string;
  type: OrderType;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  status: OrderStatus;
  date: string;
  rentalPeriod?: {
    start: string;
    end: string;
  };
}

// بيانات تجريبية
const mockOrders: Order[] = [
  {
    id: 'BO-001',
    customerName: 'فاطمة الشامسية',
    type: 'purchase',
    items: [
      { name: 'عباية فخمة - أسود', quantity: 1, price: 85.000 },
      { name: 'شيلة حريرية', quantity: 2, price: 25.000 }
    ],
    totalAmount: 135.000,
    status: 'pending',
    date: '2025-12-06'
  },
  {
    id: 'BO-002',
    customerName: 'نورة المعمرية',
    type: 'rental',
    items: [
      { name: 'فستان سهرة - ذهبي', quantity: 1, price: 45.000 }
    ],
    totalAmount: 45.000,
    status: 'confirmed',
    date: '2025-12-05',
    rentalPeriod: {
      start: '2025-12-15',
      end: '2025-12-17'
    }
  },
  {
    id: 'BO-003',
    customerName: 'مريم الحبسية',
    type: 'rental',
    items: [
      { name: 'طقم عرس كامل', quantity: 1, price: 120.000 }
    ],
    totalAmount: 120.000,
    status: 'completed',
    date: '2025-12-01',
    rentalPeriod: {
      start: '2025-12-03',
      end: '2025-12-04'
    }
  },
  {
    id: 'BO-004',
    customerName: 'عائشة البلوشية',
    type: 'purchase',
    items: [
      { name: 'عباية مطرزة', quantity: 1, price: 95.000 }
    ],
    totalAmount: 95.000,
    status: 'confirmed',
    date: '2025-12-04'
  },
  {
    id: 'BO-005',
    customerName: 'خديجة الرواحية',
    type: 'rental',
    items: [
      { name: 'فستان حفلة - أحمر', quantity: 1, price: 40.000 }
    ],
    totalAmount: 40.000,
    status: 'pending',
    date: '2025-12-06',
    rentalPeriod: {
      start: '2025-12-20',
      end: '2025-12-21'
    }
  }
];

export const BoutiqueOrders = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<'all' | OrderType>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | OrderStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = mockOrders.filter(order => {
    const matchesType = selectedType === 'all' || order.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const matchesSearch = order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          order.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'confirmed': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'completed': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'cancelled': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'قيد الانتظار';
      case 'confirmed': return 'مؤكد';
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغي';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return <Clock size={14} />;
      case 'confirmed': return <CheckCircle size={14} />;
      case 'completed': return <CheckCircle size={14} />;
      case 'cancelled': return <XCircle size={14} />;
    }
  };

  const stats = {
    total: mockOrders.length,
    purchase: mockOrders.filter(o => o.type === 'purchase').length,
    rental: mockOrders.filter(o => o.type === 'rental').length,
    pending: mockOrders.filter(o => o.status === 'pending').length
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050817] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
            <PackageOpen className="text-purple-600 dark:text-purple-400" size={36} />
            طلبات البوتيك
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            إدارة طلبات الشراء والإيجار من العملاء
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">إجمالي الطلبات</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
              </div>
              <Package className="text-slate-400" size={32} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">طلبات الشراء</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.purchase}</p>
              </div>
              <ShoppingBag className="text-blue-400" size={32} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">طلبات الإيجار</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.rental}</p>
              </div>
              <Calendar className="text-purple-400" size={32} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">قيد الانتظار</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
              </div>
              <Clock className="text-yellow-400" size={32} />
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
                placeholder="بحث برقم الطلب أو اسم العميل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Type Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedType === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setSelectedType('purchase')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  selectedType === 'purchase'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                <ShoppingBag size={16} />
                شراء
              </button>
              <button
                onClick={() => setSelectedType('rental')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  selectedType === 'rental'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                <Calendar size={16} />
                إيجار
              </button>
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">قيد الانتظار</option>
              <option value="confirmed">مؤكد</option>
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                    {order.customerName[0]}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{order.customerName}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">رقم الطلب: {order.id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    {getStatusText(order.status)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    order.type === 'purchase'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                  }`}>
                    {order.type === 'purchase' ? '🛍️ شراء' : '📅 إيجار'}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="mb-4 space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-slate-700 dark:text-slate-300">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {item.price.toFixed(3)} ر.ع
                    </span>
                  </div>
                ))}
              </div>

              {/* Rental Period */}
              {order.rentalPeriod && (
                <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-sm text-purple-900 dark:text-purple-300 flex items-center gap-2">
                    <Calendar size={14} />
                    <strong>فترة الإيجار:</strong> من {order.rentalPeriod.start} إلى {order.rentalPeriod.end}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">تاريخ الطلب: {order.date}</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    المجموع: {order.totalAmount.toFixed(3)} ر.ع
                  </p>
                </div>

                <button
                  onClick={() => navigate(`/order/${order.id}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Eye size={18} />
                  عرض التفاصيل
                </button>
              </div>
            </div>
          ))}

          {filteredOrders.length === 0 && (
            <div className="text-center py-16">
              <PackageOpen className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={64} />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">لا توجد طلبات</h3>
              <p className="text-slate-600 dark:text-slate-400">لم يتم العثور على طلبات تطابق البحث</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
