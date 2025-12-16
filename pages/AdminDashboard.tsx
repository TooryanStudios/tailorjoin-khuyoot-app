
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Shield, Activity, Settings, Save, PenTool, ShoppingCart, 
  Users, BarChart3, Layers, LogOut, Search, Bell, Menu, X, PlayCircle, Lock,
  Scissors, Package, FileText, Cpu, Ruler, Archive, ChevronLeft, ChevronRight, Database, Star
} from 'lucide-react';
import { Button } from '../components/Button';
import { firebaseService, storage } from '../services/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { AppSettings, User, Order, SystemLog, Fabric, AIModelConfig, Tailor, MeasurementProfile } from '../types';
import { getUsers, getTailors, MOCK_ORDERS } from '../services/mockService';
import { useNavigate } from 'react-router-dom';
import { getRootImageCategories, createCategoryWithParent, reassignCategoryParent, resetCategoryParent } from '../services/imageLibraryService';

type AdminSection = 
  | 'dashboard' 
  | 'orders' 
  | 'tailors' 
  | 'products' 
  | 'fabrics' 
  | 'measurements' 
  | 'family' 
  | 'ai' 
  | 'config' 
  | 'logs'
  | 'imageLibrary';

export const AdminDashboard = () => {
  const { appSettings, saveAppSettings, user, logout } = useApp();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [localSettings, setLocalSettings] = useState<AppSettings>(appSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  // Data States
  const [users, setUsers] = useState<User[]>([]);
  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  
  // New Mock Data for CMS
  const [logs] = useState<SystemLog[]>([
    { id: '1', action: 'Update', adminName: 'Admin', timestamp: '10:30 AM', details: 'Updated AI model v2.1', type: 'info' },
    { id: '2', action: 'Ban', adminName: 'Admin', timestamp: 'Yesterday', details: 'Banned user ID u102', type: 'warning' },
    { id: '3', action: 'Error', adminName: 'System', timestamp: '2 days ago', details: 'Payment gateway timeout', type: 'error' },
  ]);

  const [fabrics] = useState<Fabric[]>([
    { id: 'f1', name: 'كتان ياباني فاخر', code: 'LIN-001', type: 'Linen', color: 'White', stock: 150, pricePerMeter: 4.5, image: '' },
    { id: 'f2', name: 'قطن مصري 100%', code: 'COT-099', type: 'Cotton', color: 'Cream', stock: 80, pricePerMeter: 3.2, image: '' },
    { id: 'f3', name: 'صوف كشميري', code: 'WOL-X10', type: 'Wool', color: 'Black', stock: 25, pricePerMeter: 12.0, image: '' },
  ]);

  const [measurements] = useState<MeasurementProfile[]>([
    { id: 'm1', name: 'قياسات دشداشة قياسية', type: 'dishdasha', metrics: { length: 145, chest: 50, shoulder: 42 } },
    { id: 'm2', name: 'قياسات عباية واسعة', type: 'abaya', metrics: { length: 150, chest: 55, sleeve: 60 } },
  ]);

  const [aiModels] = useState<AIModelConfig[]>([
    { id: 'ai1', name: 'Sketch-to-Realism v2', version: '2.4.1', status: 'active', accuracy: 94.5, lastUpdated: '2023-10-20' },
    { id: 'ai2', name: 'Fabric-Texture-Mapper', version: '1.0.8', status: 'training', accuracy: 88.2, lastUpdated: '2023-10-25' },
    { id: 'ai3', name: 'Body-Measurement-Est', version: '0.9.5', status: 'inactive', accuracy: 76.0, lastUpdated: '2023-09-15' },
  ]);

  useEffect(() => {
    setLocalSettings(appSettings);
    getUsers().then(setUsers);
    getTailors().then(setTailors);
  }, [appSettings]);

  const handleToggle = (key: keyof AppSettings) => {
    setLocalSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    await saveAppSettings(localSettings);
    setIsSaving(false);
  };

  const handleLogout = async () => {
      await logout();
      navigate('/');
  };

  // --- COMPONENTS ---

  const SidebarItem = ({ id, icon: Icon, label }: { id: AdminSection, icon: any, label: string }) => (
    <button 
      onClick={() => setActiveSection(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 ${
        activeSection === id 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={18} />
      <span className="font-medium text-sm">{label}</span>
    </button>
  );

  const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${color} bg-opacity-20`}>
          <Icon size={20} className={color.replace('bg-', 'text-')} />
        </div>
      </div>
      {subtext && <p className="text-xs text-slate-400">{subtext}</p>}
    </div>
  );

  // --- VIEWS ---

  const DashboardView = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="إجمالي المستخدمين" value={users.length} icon={Users} color="bg-blue-500 text-blue-500" subtext="+12% هذا الشهر" />
        <StatCard title="الطلبات النشطة" value={orders.filter(o => o.status !== 'delivered').length} icon={ShoppingCart} color="bg-green-500 text-green-500" subtext="إجمالي 450 ر.ع" />
        <StatCard title="الخياطين" value={tailors.length} icon={Scissors} color="bg-amber-500 text-amber-500" subtext="3 بانتظار الموافقة" />
        <StatCard title="حالة الذكاء الاصطناعي" value="Online" icon={Cpu} color="bg-purple-500 text-purple-500" subtext="v2.4.1 Active" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 h-80 flex flex-col">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4">تحليل المبيعات</h3>
            <div className="flex-1 flex items-end justify-between gap-2 px-2 pb-2">
               {[40, 60, 35, 80, 55, 90, 70, 65, 45, 85, 95, 75].map((h, i) => (
                 <div key={i} className="w-full bg-blue-500/20 hover:bg-blue-500 rounded-t-sm transition-all duration-300 relative group" style={{height: `${h}%`}}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {h * 10} ر.ع
                    </div>
                 </div>
               ))}
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-2">
               <span>يناير</span><span>ديسمبر</span>
            </div>
         </div>

         <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 h-80 overflow-y-auto">
             <h3 className="font-bold text-slate-800 dark:text-white mb-4">أحدث سجلات النظام</h3>
             <div className="space-y-4">
                {logs.map(log => (
                  <div key={log.id} className="flex gap-3 text-sm">
                     <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${log.type === 'error' ? 'bg-red-500' : log.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                     <div>
                        <p className="text-slate-800 dark:text-slate-200 font-medium">{log.action}</p>
                        <p className="text-xs text-slate-500">{log.details}</p>
                        <span className="text-[10px] text-slate-400">{log.timestamp} • {log.adminName}</span>
                     </div>
                  </div>
                ))}
             </div>
         </div>
      </div>
    </div>
  );

  const OrdersView = () => (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
         <h2 className="text-xl font-bold text-slate-800 dark:text-white">جدول الطلبات</h2>
         <Button size="sm">تصدير CSV</Button>
       </div>
       <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
         <table className="w-full text-right text-sm">
           <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500">
             <tr>
               <th className="p-4">رقم الطلب</th>
               <th className="p-4">المنتج</th>
               <th className="p-4">الخياط</th>
               <th className="p-4">السعر</th>
               <th className="p-4">الحالة</th>
               <th className="p-4">التاريخ</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
             {orders.map(order => (
               <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                 <td className="p-4 font-mono text-slate-500">#{order.id}</td>
                 <td className="p-4 font-bold text-slate-800 dark:text-white">{order.productName}</td>
                 <td className="p-4 text-slate-500">{order.tailorName}</td>
                 <td className="p-4 text-blue-500 font-bold">{order.price.toFixed(3)} ر.ع</td>
                 <td className="p-4">
                   <span className={`px-2 py-1 rounded text-xs font-bold ${
                     order.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                     order.status === 'delivered' ? 'bg-green-100 text-green-600' :
                     'bg-blue-100 text-blue-600'
                   }`}>
                     {order.status}
                   </span>
                 </td>
                 <td className="p-4 text-slate-500">{order.orderDate}</td>
               </tr>
             ))}
           </tbody>
         </table>
       </div>
    </div>
  );

  const FabricsView = () => (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
         <h2 className="text-xl font-bold text-slate-800 dark:text-white">مكتبة الأقمشة (Fabric Library)</h2>
         <Button size="sm">إضافة قماش</Button>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fabrics.map(fabric => (
             <div key={fabric.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
                <div className="pl-4">
                   <div className="flex justify-between items-start">
                      <h3 className="font-bold text-slate-800 dark:text-white">{fabric.name}</h3>
                      <span className="text-xs font-mono bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">{fabric.code}</span>
                   </div>
                   <p className="text-sm text-slate-500 mt-1">{fabric.type} • {fabric.color}</p>
                   <div className="mt-4 flex items-center justify-between">
                      <div className="text-center">
                         <p className="text-xs text-slate-400">المخزون</p>
                         <p className="font-bold text-blue-600">{fabric.stock}م</p>
                      </div>
                      <div className="text-center">
                         <p className="text-xs text-slate-400">سعر المتر</p>
                         <p className="font-bold text-green-600">{fabric.pricePerMeter} ر.ع</p>
                      </div>
                   </div>
                </div>
             </div>
          ))}
       </div>
    </div>
  );

  // --- TAILORS / USERS MANAGEMENT WITH PRODUCT CONTROL ---
  const TailorsView = () => {
    const [loading, setLoading] = useState(false);
    const [list, setList] = useState<User[]>([]);
    const [filter, setFilter] = useState('');
    const [selected, setSelected] = useState<User | null>(null);
    const [showProducts, setShowProducts] = useState(false);

    const load = async () => {
      setLoading(true);
      try {
        const users = await firebaseService.getAllUsers();
        // Shops/tailors only
        const merchants = (users || []).filter((u: any) => ['tailor','shop','boutique','fabric_store','sewing_supplies'].includes(u.role || u.shopType));
        setList(merchants as any);
      } catch (e) {
        setList([]);
      } finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const filtered = list.filter(u => {
      if (!filter.trim()) return true;
      const f = filter.trim().toLowerCase();
      return (
        (u.name || '').toLowerCase().includes(f) ||
        (u.phone || '').toLowerCase().includes(f) ||
        (u.id || '').toLowerCase().includes(f) ||
        (u.location || '').toLowerCase().includes(f)
      );
    });

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">إدارة المتاجر والخياطين</h2>
          <div className="flex items-center gap-2">
            <input
              value={filter}
              onChange={e=>setFilter(e.target.value)}
              placeholder="بحث بالاسم/الهاتف/المعرف"
              className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
            />
            <Button onClick={load} variant="outline">تحديث</Button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500">
              <tr>
                <th className="p-3">الاسم</th>
                <th className="p-3">الهاتف</th>
                <th className="p-3">النوع</th>
                <th className="p-3">الموقع</th>
                <th className="p-3">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="p-3 font-medium text-slate-800 dark:text-white">{u.name || u.id}</td>
                  <td className="p-3 text-slate-500">{(u as any).phone || '-'}</td>
                  <td className="p-3 text-slate-500">{(u as any).shopType || u.role}</td>
                  <td className="p-3 text-slate-500">{u.location || '-'}</td>
                  <td className="p-3">
                    <Button onClick={() => { setSelected(u); setShowProducts(false); }} size="sm" className="bg-blue-600 text-white">تعديل</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Editor Drawer */}
        {selected && (
          <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black/50" onClick={() => setSelected(null)} />
            <div className="w-full max-w-2xl h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">تعديل المتجر</h3>
                <button onClick={() => setSelected(null)} className="text-slate-500"><X size={18} /></button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col">
                    <span className="text-slate-500">الاسم <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">key: name</span></span>
                    <input defaultValue={selected.name} className="px-2 py-1 border rounded bg-slate-50 dark:bg-slate-800" readOnly />
                  </label>
                  <label className="flex flex-col">
                    <span className="text-slate-500">المعرف (UID) <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">key: id (docId)</span></span>
                    <input value={selected.id} className="px-2 py-1 border rounded bg-slate-50 dark:bg-slate-800" readOnly />
                  </label>
                  <label className="flex flex-col">
                    <span className="text-slate-500">الهاتف <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">key: phone</span></span>
                    <input defaultValue={(selected as any).phone || ''} className="px-2 py-1 border rounded bg-slate-50 dark:bg-slate-800" readOnly />
                  </label>
                  <label className="flex flex-col">
                    <span className="text-slate-500">الموقع <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">key: location</span></span>
                    <input defaultValue={selected.location || ''} className="px-2 py-1 border rounded bg-slate-50 dark:bg-slate-800" readOnly />
                  </label>
                  <label className="flex flex-col">
                    <span className="text-slate-500">الدور <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">key: role</span></span>
                    <input defaultValue={(selected as any).role || ''} className="px-2 py-1 border rounded bg-slate-50 dark:bg-slate-800" readOnly />
                  </label>
                  <label className="flex flex-col">
                    <span className="text-slate-500">نوع المتجر <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">key: shopType</span></span>
                    <input defaultValue={(selected as any).shopType || ''} className="px-2 py-1 border rounded bg-slate-50 dark:bg-slate-800" readOnly />
                  </label>
                </div>
                <div className="pt-2">
                  <Button onClick={() => setShowProducts(true)} className="bg-green-600 text-white">إدارة المنتجات</Button>
                </div>
              </div>

              {showProducts && (
                <ManageProductsForTailor tailor={selected} onClose={() => setShowProducts(false)} />
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const ManageProductsForTailor = ({ tailor, onClose }: { tailor: User, onClose: () => void }) => {
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [saving, setSaving] = useState<Record<string, boolean>>({});
    const [msg, setMsg] = useState<string | null>(null);
    const [newUrl, setNewUrl] = useState<Record<string, string>>({});
    const dragRef = React.useRef<{ productId: string; index: number } | null>(null);
    const [uploading, setUploading] = useState<Record<string, boolean>>({});

    const load = async () => {
      setLoading(true); setMsg(null);
      try {
        const list = await firebaseService.getProductsByTailorId(tailor.id);
        setProducts(list);
      } catch (e: any) {
        setMsg(e?.message || 'تعذر تحميل منتجات المتجر');
      } finally { setLoading(false); }
    };

    useEffect(() => { load(); }, [tailor?.id]);

    const needsNormalization = (p: any) => {
      const hasImageUrls = Array.isArray(p.imageUrls) && p.imageUrls.length > 0;
      const hasImages = Array.isArray(p.images) && p.images.length > 0;
      const missingImage = !p.image;
      const missingCategoryId = !p.categoryId;
      const missingCoverIndex = typeof p.coverImageIndex !== 'number';
      return (hasImageUrls && !hasImages) || missingImage || missingCategoryId || missingCoverIndex;
    };

    const buildUpdate = (p: any) => {
      const images: string[] = Array.isArray(p.images) && p.images.length > 0
        ? p.images
        : (Array.isArray(p.imageUrls) ? p.imageUrls.filter(Boolean) : []);
      const image = images[0] || p.image || '';
      const categoryId = (p.categoryId || (typeof p.category === 'string' ? p.category : '') || 'dishdasha').trim();
      return { images, image, coverImageIndex: 0, categoryId, updatedAt: new Date().toISOString() } as Partial<any>;
    };

    const normalizedImages = (p: any): string[] => {
      if (Array.isArray(p.images) && p.images.length > 0) return p.images.filter(Boolean);
      if (Array.isArray(p.imageUrls) && p.imageUrls.length > 0) return p.imageUrls.filter(Boolean);
      if (p.image) return [p.image];
      return [];
    };

    const arrayMove = (arr: string[], from: number, to: number) => {
      const a = arr.slice();
      const start = from < 0 ? a.length + from : from;
      if (start < 0 || start >= a.length) return a;
      const end = to < 0 ? a.length + to : to;
      if (end < 0 || end >= a.length) return a;
      const [item] = a.splice(start, 1);
      a.splice(end, 0, item);
      return a;
    };

    const reorderImages = async (p: any, fromIndex: number, toIndex: number) => {
      const imgs = normalizedImages(p);
      if (imgs.length === 0) return;
      const newImages = arrayMove(imgs, fromIndex, toIndex);
      let newCoverIndex = typeof p.coverImageIndex === 'number' ? p.coverImageIndex : 0;
      if (fromIndex === newCoverIndex) newCoverIndex = toIndex;
      else if (fromIndex < newCoverIndex && toIndex >= newCoverIndex) newCoverIndex -= 1;
      else if (fromIndex > newCoverIndex && toIndex <= newCoverIndex) newCoverIndex += 1;

      // Optimistic update
      setProducts(prev => prev.map(x => x.id === p.id ? { ...x, images: newImages, image: newImages[newCoverIndex] || '', coverImageIndex: newCoverIndex } : x));
      await saveEdits(p, { images: newImages, image: newImages[newCoverIndex] || '', coverImageIndex: newCoverIndex });
    };

    const setAsCover = async (p: any, index: number) => {
      const imgs = normalizedImages(p);
      const newImage = imgs[index] || '';
      // Optimistic update
      setProducts(prev => prev.map(x => x.id === p.id ? { ...x, image: newImage, coverImageIndex: index, images: imgs } : x));
      await saveEdits(p, { image: newImage, coverImageIndex: index, images: imgs });
    };

    const addImageUrl = async (p: any) => {
      const url = (newUrl[p.id] || '').trim();
      if (!url) return;
      const imgs = normalizedImages(p);
      const newImages = [...imgs, url];
      let coverIndex = typeof p.coverImageIndex === 'number' ? p.coverImageIndex : 0;
      if (!p.image) coverIndex = 0;
      // optimistic
      setProducts(prev => prev.map(x => x.id === p.id ? { ...x, images: newImages, image: newImages[coverIndex] || '', coverImageIndex: coverIndex } : x));
      await saveEdits(p, { images: newImages, image: newImages[coverIndex] || '', coverImageIndex: coverIndex });
      setNewUrl(prev => ({ ...prev, [p.id]: '' }));
    };

    const removeImageAt = async (p: any, idx: number) => {
      const imgs = normalizedImages(p);
      if (idx < 0 || idx >= imgs.length) return;
      const newImages = imgs.filter((_, i) => i !== idx);
      let coverIndex = typeof p.coverImageIndex === 'number' ? p.coverImageIndex : 0;
      if (idx < coverIndex) coverIndex -= 1;
      else if (idx === coverIndex) coverIndex = 0;
      const newImage = newImages[coverIndex] || '';
      // optimistic
      setProducts(prev => prev.map(x => x.id === p.id ? { ...x, images: newImages, image: newImage, coverImageIndex: coverIndex } : x));
      await saveEdits(p, { images: newImages, image: newImage, coverImageIndex: coverIndex });
    };

    const uploadImageFile = async (p: any, file: File) => {
      if (!file) return;
      setUploading(prev => ({ ...prev, [p.id]: true }));
      try {
        const fileId = `${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
        const path = `users/${tailor.id}/products/${p.id}/${fileId}.jpg`;
        const r = storageRef(storage, path);
        await uploadBytes(r, file);
        const url = await getDownloadURL(r);
        const imgs = normalizedImages(p);
        const newImages = [...imgs, url];
        const coverIndex = typeof p.coverImageIndex === 'number' ? p.coverImageIndex : 0;
        const newImage = newImages[coverIndex] || '';
        // optimistic
        setProducts(prev => prev.map(x => x.id === p.id ? { ...x, images: newImages, image: newImage, coverImageIndex: coverIndex } : x));
        await saveEdits(p, { images: newImages, image: newImage, coverImageIndex: coverIndex });
      } catch (e: any) {
        setMsg(e?.message || 'تعذر رفع الصورة');
      } finally {
        setUploading(prev => ({ ...prev, [p.id]: false }));
      }
    };

    const transferImages = async (p: any) => {
      setSaving(prev => ({ ...prev, [p.id]: true })); setMsg(null);
      try {
        const updates = buildUpdate(p);
        await firebaseService.updateProduct(p.id, { tailorId: tailor.id, ...updates } as any);
        setProducts(prev => prev.map(x => x.id === p.id ? { ...x, ...updates } : x));
      } catch (e: any) {
        setMsg(e?.message || 'تعذر تحويل الصور');
      } finally { setSaving(prev => ({ ...prev, [p.id]: false })); }
    };

    const saveEdits = async (p: any, edits: Partial<any>) => {
      setSaving(prev => ({ ...prev, [p.id]: true })); setMsg(null);
      try {
        const update: any = { ...edits, updatedAt: new Date().toISOString() };
        // Ensure consistency if images were cleared
        if (Array.isArray(update.images) && update.images.length > 0) {
          update.image = update.image || update.images[0];
          if (typeof update.coverImageIndex !== 'number') update.coverImageIndex = 0;
        }
        await firebaseService.updateProduct(p.id, { tailorId: tailor.id, ...update } as any);
        setProducts(prev => prev.map(x => x.id === p.id ? { ...x, ...update } : x));
      } catch (e: any) {
        setMsg(e?.message || 'تعذر حفظ التعديلات');
      } finally { setSaving(prev => ({ ...prev, [p.id]: false })); }
    };

    return (
      <div className="mt-4 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold">منتجات المتجر</h4>
          <div className="flex items-center gap-2">
            <Button onClick={load} variant="outline">تحديث</Button>
            <Button onClick={onClose} variant="outline">إغلاق</Button>
          </div>
        </div>

        {msg && <div className="text-sm p-2 rounded bg-yellow-100 text-yellow-900 mb-2">{msg}</div>}

        {loading ? (
          <div className="text-sm text-slate-500">جارٍ التحميل...</div>
        ) : (
          <div className="space-y-3">
            {products.map(p => {
              const need = needsNormalization(p);
              return (
                <div key={p.id} className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-800 dark:text-white truncate max-w-[60%]" title={p.name}>{p.name || p.id}</div>
                    <div className="text-xs text-slate-500">{p.id}</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-sm">
                    <label className="flex flex-col">
                      <span className="text-slate-500">الاسم</span>
                      <input defaultValue={p.name} onBlur={(e)=>{ if(e.target.value!==p.name) saveEdits(p, { name: e.target.value }); }} className="px-2 py-1 border rounded bg-slate-50 dark:bg-slate-900" />
                    </label>
                    <label className="flex flex-col">
                      <span className="text-slate-500">السعر</span>
                      <input type="number" step="0.001" defaultValue={p.price} onBlur={(e)=>{ const v=parseFloat(e.target.value||'0'); if(v!==p.price) saveEdits(p, { price: v }); }} className="px-2 py-1 border rounded bg-slate-50 dark:bg-slate-900" />
                    </label>
                    <label className="flex flex-col">
                      <span className="text-slate-500">التصنيف</span>
                      <select defaultValue={p.categoryId || p.category || ''} onChange={(e)=> saveEdits(p, { categoryId: e.target.value })} className="px-2 py-1 border rounded bg-slate-50 dark:bg-slate-900">
                        <option value="">—</option>
                        {(appSettings.productCategories || []).map((c: any)=> (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-xs text-slate-600 dark:text-slate-300">
                    <span>images: {Array.isArray(p.images)? p.images.length : 0}</span>
                    <span>imageUrls: {Array.isArray(p.imageUrls)? p.imageUrls.length : 0}</span>
                    <span>image: {p.image ? '✓' : '—'}</span>
                    <span>coverIndex: {typeof p.coverImageIndex==='number' ? p.coverImageIndex : '—'}</span>
                    {need && <span className="text-orange-600 font-bold">(بحاجة لتحويل)</span>}
                  </div>
                  {/* Image preview and reorder */}
                  <div className="mt-3">
                    <div className="flex gap-2 overflow-x-auto py-1">
                      {normalizedImages(p).map((url, idx) => (
                        <div
                          key={`${p.id}_${idx}`}
                          className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900"
                          draggable
                          onDragStart={() => { dragRef.current = { productId: p.id, index: idx }; }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => {
                            if (dragRef.current && dragRef.current.productId === p.id) {
                              reorderImages(p, dragRef.current.index, idx);
                            }
                            dragRef.current = null;
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="img" className="w-full h-full object-cover" />
                          <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between">
                            <button
                              className="w-6 h-6 rounded-full bg-white/90 dark:bg-slate-800/90 flex items-center justify-center shadow"
                              onClick={() => reorderImages(p, idx, Math.max(0, idx - 1))}
                              title="يسار"
                            >
                              <ChevronLeft size={14} />
                            </button>
                            <button
                              className="w-6 h-6 rounded-full bg-white/90 dark:bg-slate-800/90 flex items-center justify-center shadow"
                              onClick={() => reorderImages(p, idx, Math.min(normalizedImages(p).length - 1, idx + 1))}
                              title="يمين"
                            >
                              <ChevronRight size={14} />
                            </button>
                          </div>
                          <button
                            className={`absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center ${p.coverImageIndex===idx ? 'bg-yellow-200 text-yellow-700' : 'bg-white/90 dark:bg-slate-800/90 text-slate-700'}`}
                            onClick={() => setAsCover(p, idx)}
                            title="تعيين كغلاف"
                          >
                            <Star size={14} className={p.coverImageIndex===idx ? 'fill-yellow-500 text-yellow-500' : ''} />
                          </button>
                          <button
                            className="absolute top-1 left-1 w-6 h-6 rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-700 flex items-center justify-center shadow"
                            onClick={() => removeImageAt(p, idx)}
                            title="حذف"
                          >
                            <X size={12} />
                          </button>
                          {p.coverImageIndex===idx && (
                            <div className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white">غلاف</div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        value={newUrl[p.id] || ''}
                        onChange={(e)=> setNewUrl(prev => ({ ...prev, [p.id]: e.target.value }))}
                        placeholder="رابط صورة جديد"
                        className="flex-1 px-2 py-1 border rounded bg-slate-50 dark:bg-slate-900"
                      />
                      <Button onClick={() => addImageUrl(p)} size="sm" className="bg-green-600 text-white">إضافة</Button>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button onClick={()=>transferImages(p)} disabled={saving[p.id]} className="bg-blue-600 text-white">
                      {saving[p.id] ? '...'
                        : (need ? 'تحويل الصور للطريقة الجديدة' : 'إعادة ضبط الصور')}
                    </Button>
                    <label className="relative inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm cursor-pointer">
                      <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e)=> { const f = e.target.files && e.target.files[0]; if (f) uploadImageFile(p, f); e.currentTarget.value = ''; }} />
                      <span>{uploading[p.id] ? 'جارٍ الرفع...' : 'رفع صورة'}</span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Admin: Products Management & Normalization
  const ProductsAdminView = () => {
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [filter, setFilter] = useState('');
    const [normalizing, setNormalizing] = useState<Record<string, boolean>>({});
    const [message, setMessage] = useState<string | null>(null);

    const load = async () => {
      setLoading(true);
      setMessage(null);
      try {
        const all = await firebaseService.getAllProducts();
        setProducts(all);
      } catch (e: any) {
        setMessage(e?.message || 'تعذر تحميل المنتجات');
      } finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const needsNormalization = (p: any) => {
      const hasImageUrls = Array.isArray(p.imageUrls) && p.imageUrls.length > 0;
      const hasImages = Array.isArray(p.images) && p.images.length > 0;
      const missingImage = !p.image;
      const missingCategoryId = !p.categoryId;
      const missingCoverIndex = typeof p.coverImageIndex !== 'number';
      return (hasImageUrls && !hasImages) || missingImage || missingCategoryId || missingCoverIndex;
    };

    const buildUpdate = (p: any) => {
      const images: string[] = Array.isArray(p.images) && p.images.length > 0
        ? p.images
        : (Array.isArray(p.imageUrls) ? p.imageUrls.filter(Boolean) : []);
      const image = images[0] || p.image || '';
      const categoryId = (p.categoryId || (typeof p.category === 'string' ? p.category : '') || 'dishdasha').trim();
      return {
        images,
        image,
        coverImageIndex: 0,
        categoryId,
        updatedAt: new Date().toISOString()
      } as Partial<any>;
    };

    const normalizeOne = async (p: any) => {
      if (!p?.tailorId) { setMessage(`المنتج ${p?.id} يفتقد tailorId`); return; }
      setNormalizing(prev => ({ ...prev, [p.id]: true }));
      try {
        const updates = buildUpdate(p);
        await firebaseService.updateProduct(p.id, { tailorId: p.tailorId, ...updates } as any);
        setProducts(prev => prev.map(x => x.id === p.id ? { ...x, ...updates } : x));
      } catch (e: any) {
        setMessage(e?.message || 'تعذر تحديث المنتج');
      } finally {
        setNormalizing(prev => ({ ...prev, [p.id]: false }));
      }
    };

    const normalizeAll = async () => {
      setMessage(null);
      const targets = products.filter(needsNormalization);
      if (targets.length === 0) { setMessage('لا توجد منتجات بحاجة للتنظيم'); return; }
      setLoading(true);
      try {
        for (const p of targets) {
          if (!p?.tailorId) continue;
          const updates = buildUpdate(p);
          await firebaseService.updateProduct(p.id, { tailorId: p.tailorId, ...updates } as any);
        }
        await load();
        setMessage(`تم تنظيم ${targets.length} منتج`);
      } catch (e: any) {
        setMessage(e?.message || 'فشل إجراء التنظيم الشامل');
      } finally { setLoading(false); }
    };

    const filtered = products.filter(p => {
      if (!filter.trim()) return true;
      const f = filter.trim().toLowerCase();
      return (
        (p.name || '').toLowerCase().includes(f) ||
        (p.tailorName || '').toLowerCase().includes(f) ||
        (p.tailorId || '').toLowerCase().includes(f) ||
        (p.category || '').toLowerCase().includes(f)
      );
    });

    const totalNeeding = products.filter(needsNormalization).length;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">إدارة المنتجات</h2>
          <div className="flex items-center gap-2">
            <input
              value={filter}
              onChange={e=>setFilter(e.target.value)}
              placeholder="بحث بالاسم/الخياط/المعرف"
              className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
            />
            <Button onClick={normalizeAll} disabled={loading || totalNeeding === 0} className="bg-green-600 text-white">
              {loading ? 'جارٍ التنظيم...' : `تنظيم الكل (${totalNeeding})`}
            </Button>
            <Button onClick={load} variant="outline">تحديث</Button>
          </div>
        </div>

        {message && (
          <div className="text-sm p-2 rounded bg-yellow-100 text-yellow-900">{message}</div>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500">
              <tr>
                <th className="p-3">الاسم</th>
                <th className="p-3">الخياط</th>
                <th className="p-3">التصنيف</th>
                <th className="p-3">صور</th>
                <th className="p-3">imageUrls</th>
                <th className="p-3">بحاجة لتنظيم؟</th>
                <th className="p-3">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filtered.map(p => {
                const imgs = Array.isArray(p.images) ? p.images.length : 0;
                const urls = Array.isArray(p.imageUrls) ? p.imageUrls.length : 0;
                const need = needsNormalization(p);
                return (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="p-3 font-medium text-slate-800 dark:text-white truncate max-w-[240px]" title={p.name}>{p.name || p.id}</td>
                    <td className="p-3 text-slate-500">
                      <div className="text-xs">{p.tailorName || '-'}</div>
                      <div className="text-[10px] text-slate-400">{p.tailorId}</div>
                    </td>
                    <td className="p-3 text-slate-500">{p.categoryId || p.category || '-'}</td>
                    <td className="p-3 text-slate-500">{imgs}</td>
                    <td className="p-3 text-slate-500">{urls}</td>
                    <td className="p-3">{need ? <span className="text-orange-600 font-bold">نعم</span> : <span className="text-green-600">لا</span>}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button onClick={() => normalizeOne(p)} disabled={normalizing[p.id] || !need} size="sm" className="bg-blue-600 text-white">
                          {normalizing[p.id] ? '...' : 'تنظيم'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Image Library Categories Management
  const ImageLibraryView = () => {
    const [roots, setRoots] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);

    const [nameAr, setNameAr] = useState('');
    const [nameEn, setNameEn] = useState('');
    const [parentId, setParentId] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

    const [targetId, setTargetId] = useState('');
    const [newParentId, setNewParentId] = useState<string | null>(null);
    const [moving, setMoving] = useState(false);

    useEffect(() => {
      setLoading(true);
      getRootImageCategories()
        .then(setRoots)
        .catch(() => setRoots([]))
        .finally(() => setLoading(false));
    }, []);

    const handleCreate = async () => {
      setMsg(null); setErr(null);
      if (!nameAr.trim()) { setErr('الاسم العربي مطلوب'); return; }
      try {
        setCreating(true);
        const id = await createCategoryWithParent(nameAr.trim(), { nameEn: nameEn.trim() || undefined, parentId });
        setMsg(`تم إنشاء القسم (${id})`);
        setNameAr(''); setNameEn(''); setParentId(null);
        const updated = await getRootImageCategories();
        setRoots(updated);
      } catch (e: any) {
        setErr(e?.message || 'خطأ أثناء الإنشاء');
      } finally { setCreating(false); }
    };

    const handleMove = async () => {
      setMsg(null); setErr(null);
      if (!targetId.trim()) { setErr('أدخل معرف القسم'); return; }
      try {
        setMoving(true);
        await reassignCategoryParent(targetId.trim(), newParentId);
        setMsg('تم نقل القسم');
      } catch (e: any) {
        setErr(e?.message || 'تعذر النقل');
      } finally { setMoving(false); }
    };

    const handleReset = async () => {
      setMsg(null); setErr(null);
      if (!targetId.trim()) { setErr('أدخل معرف القسم'); return; }
      try {
        setMoving(true);
        await resetCategoryParent(targetId.trim());
        setMsg('تمت إعادة التعيين لمستوى 0');
      } catch (e: any) {
        setErr(e?.message || 'تعذر إعادة التعيين');
      } finally { setMoving(false); }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">مكتبة الصور — الأقسام</h2>
        </div>

        <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
          <h3 className="font-semibold">إنشاء قسم</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex flex-col">
              <span>الاسم العربي</span>
              <input value={nameAr} onChange={e=>setNameAr(e.target.value)} className="border rounded px-2 py-1" />
            </label>
            <label className="flex flex-col">
              <span>الاسم الإنجليزي (اختياري)</span>
              <input value={nameEn} onChange={e=>setNameEn(e.target.value)} className="border rounded px-2 py-1" />
            </label>
            <label className="flex flex-col md:col-span-2">
              <span>الأب (اختياري)</span>
              <select value={parentId ?? ''} onChange={e=>setParentId(e.target.value || null)} className="border rounded px-2 py-1">
                <option value="">بدون أب — مستوى 0</option>
                {loading ? <option>جاري التحميل...</option> : roots.map(r=> (
                  <option key={r.id} value={r.id}>{r.nameAr || r.name || r.id}</option>
                ))}
              </select>
            </label>
          </div>
          <Button onClick={handleCreate} disabled={creating}>{creating ? 'جارٍ الإنشاء...' : 'إنشاء'}</Button>
        </section>

        <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
          <h3 className="font-semibold">إدارة الأب</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex flex-col">
              <span>معرف القسم</span>
              <input value={targetId} onChange={e=>setTargetId(e.target.value)} className="border rounded px-2 py-1" placeholder="مثال: abc123" />
            </label>
            <label className="flex flex-col">
              <span>الأب الجديد (اختياري)</span>
              <select value={newParentId ?? ''} onChange={e=>setNewParentId(e.target.value || null)} className="border rounded px-2 py-1">
                <option value="">بدون أب — مستوى 0</option>
                {loading ? <option>جاري التحميل...</option> : roots.map(r=> (
                  <option key={r.id} value={r.id}>{r.nameAr || r.name || r.id}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleMove} disabled={moving} className="bg-green-600 text-white">{moving ? 'جارٍ النقل...' : 'نقل إلى الأب'}</Button>
            <Button onClick={handleReset} disabled={moving} className="bg-orange-600 text-white">{moving ? 'جارٍ التعيين...' : 'إعادة تعيين الأب'}</Button>
          </div>
        </section>

        {(msg || err) && (
          <div className={err ? 'text-red-700' : 'text-green-700'}>{err || msg}</div>
        )}
      </div>
    );
  };

  const AIView = () => (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
         <h2 className="text-xl font-bold text-slate-800 dark:text-white">نماذج الذكاء الاصطناعي (AI Models)</h2>
         <Button size="sm">تحديث النماذج</Button>
       </div>
       <div className="grid grid-cols-1 gap-4">
          {aiModels.map(model => (
             <div key={model.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className={`p-3 rounded-lg ${model.status === 'active' ? 'bg-green-100 text-green-600' : model.status === 'training' ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-500'}`}>
                      <Cpu size={24} />
                   </div>
                   <div>
                      <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        {model.name}
                        <span className="text-xs font-normal text-slate-400 px-2 py-0.5 border border-slate-200 dark:border-slate-600 rounded-full">{model.version}</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">آخر تحديث: {model.lastUpdated}</p>
                   </div>
                </div>
                <div className="flex items-center gap-8 text-right">
                   <div>
                      <p className="text-xs text-slate-400">الحالة</p>
                      <p className={`font-bold text-sm ${model.status === 'active' ? 'text-green-500' : model.status === 'training' ? 'text-yellow-500' : 'text-slate-500'}`}>
                         {model.status.toUpperCase()}
                      </p>
                   </div>
                   <div>
                      <p className="text-xs text-slate-400">الدقة (Accuracy)</p>
                      <p className="font-bold text-blue-500">{model.accuracy}%</p>
                   </div>
                   <Button variant="outline" size="sm">Configure</Button>
                </div>
             </div>
          ))}
       </div>
    </div>
  );

  const ConfigView = () => (
    <div className="space-y-6 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">إعدادات النظام العامة</h2>
        <Button onClick={handleSaveSettings} disabled={isSaving} className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all disabled:shadow-none disabled:from-slate-400 disabled:to-slate-400">
          {isSaving ? <Activity className="animate-spin" size={16} /> : <Save size={16} />}
          <span>حفظ التغييرات</span>
        </Button>
      </div>

      <div className="p-4 rounded-xl border border-dashed border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-sm text-blue-700 dark:text-blue-200">
        🔍 Debug: تم تحميل مكوّن الإعدادات العامة بنجاح ({new Date().toLocaleString('ar-SA')})
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
          {[
            { key: 'storiesEnabled', label: 'القصص (Stories)', desc: 'تفعيل ميزة القصص للخياطين في الصفحة الرئيسية', icon: PlayCircle, color: 'text-pink-500' },
            { key: 'designerEnabled', label: 'المصمم الذكي', desc: 'تفعيل أدوات التصميم بالذكاء الاصطناعي', icon: PenTool, color: 'text-purple-500' },
            { key: 'cartEnabled', label: 'نظام السلة والطلبات', desc: 'إتاحة عمليات الشراء وإدارة الطلبات', icon: ShoppingCart, color: 'text-orange-500' },
            { key: 'allowNewRegistrations', label: 'التسجيل الجديد', desc: 'السماح للمستخدمين الجدد بإنشاء حسابات', icon: Users, color: 'text-blue-500' },
            { key: 'maintenanceMode', label: 'وضع الصيانة', desc: 'إغلاق الموقع مؤقتاً لجميع المستخدمين', icon: Lock, color: 'text-red-500' },
          ].map((item: any) => (
            <div key={item.key} className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg bg-slate-50 dark:bg-slate-900 ${item.color}`}>
                    <item.icon size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white text-sm">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
              </div>
              <button 
                onClick={() => handleToggle(item.key)}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${localSettings[item.key as keyof AppSettings] ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${localSettings[item.key as keyof AppSettings] ? 'translate-x-0' : '-translate-x-6'}`}></div>
              </button>
            </div>
          ))}
      </div>

      {/* Users General Settings - Tailor Login Access */}
      <div id="users-general-settings" className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-amber-200 dark:border-amber-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            إعدادات المستخدمين العامة — وصول تسجيل الخياطين
          </h3>
          <a href="#users-general-settings" className="text-xs text-amber-700 dark:text-amber-300">رابط مباشر</a>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">تُستخدم كلمة المرور الافتراضية عند انضمام الخياطين من صفحة الانضمام. لا يتم عرضها للمستخدمين.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">كلمة المرور الافتراضية للخياطين (مخفي)</label>
            <input
              type="password"
              value={(localSettings as any).tailorDefaultPassword || ''}
              onChange={(e) => setLocalSettings(prev => ({
                ...prev,
                tailorDefaultPassword: e.target.value
              } as any))}
              placeholder="********"
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">اتركها فارغة لاستخدام القيمة الافتراضية 123456.</p>
          </div>
        </div>
        <div className="text-xs text-slate-500">
          المسار: لوحة التحكم → الإعدادات → إعدادات المستخدمين العامة — وصول تسجيل الخياطين
        </div>
      </div>

      {/* Help Video Settings (placed right under general toggles) */}
      <div id="help-video-settings" className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-blue-200 dark:border-blue-800 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">جديد</span>
            إعدادات فيديو المساعدة
          </h3>
          <a href="#help-video-settings" className="text-xs text-blue-600">رابط مباشر</a>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-700 dark:text-slate-300">تفعيل زر المساعدة</p>
            <p className="text-xs text-slate-500">إظهار زر "شاهد" في الصفحات الداعمة</p>
          </div>
          <button 
            onClick={() => setLocalSettings(prev => ({
              ...prev,
              helpVideo: { ...(prev.helpVideo || {}), enabled: !(prev.helpVideo?.enabled) }
            }))}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${localSettings.helpVideo?.enabled ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${localSettings.helpVideo?.enabled ? 'translate-x-0' : '-translate-x-6'}`}></div>
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">رابط الفيديو (YouTube)</label>
          <input
            type="text"
            value={localSettings.helpVideo?.url || ''}
            onChange={(e) => setLocalSettings(prev => ({
              ...prev,
              helpVideo: { ...(prev.helpVideo || {}), url: e.target.value }
            }))}
            placeholder="مثال: https://youtu.be/XXXXXXXX أو https://www.youtube.com/watch?v=XXXXXXX"
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">نص الزر</label>
          <input
            type="text"
            value={localSettings.helpVideo?.buttonText || 'شاهد'}
            onChange={(e) => setLocalSettings(prev => ({
              ...prev,
              helpVideo: { ...(prev.helpVideo || {}), buttonText: e.target.value }
            }))}
            placeholder="شاهد"
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="pt-2">
          <p className="text-xs text-slate-500">نقوم تلقائياً بتحويل رابط YouTube إلى صيغة مدمجة (embed) آمنة.</p>
        </div>
      </div>

      {/* Home Sections Control */}
      <div className="mt-8">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">مقاطع الصفحة الرئيسية</h3>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
          {[
            { key: 'heroBanner', label: 'البانر الرئيسي', desc: 'عرض بانر العيد الترويجي في أعلى الصفحة' },
            { key: 'featuredTailors', label: 'الخياطون المميزون', desc: 'عرض قائمة الخياطين المعتمدين' },
            { key: 'searchBar', label: 'شريط البحث', desc: 'إظهار خانة البحث في الصفحة الرئيسية' },
            { key: 'designSection', label: 'قسم المصمم', desc: 'عرض كارت "صمّم تشكيلة خاصة"' },
            { key: 'adsSection', label: 'قسم الإعلانات', desc: 'عرض كارت الإعلانات الترويجية' },
            { key: 'categoriesFilter', label: 'تصنيفات المنتجات', desc: 'عرض أزرار التصنيفات (دشاديش، جاكيت، إلخ)' },
            { key: 'productsGrid', label: 'شبكة المنتجات', desc: 'عرض المنتجات الرئيسية' },
            { key: 'browseShopsButton', label: 'زر تصفح المحلات', desc: 'عرض زر التصفح السريع للمحلات' },
            { key: 'installButton', label: 'زر تثبيت التطبيق', desc: 'إظهار زر تثبيت PWA' },
            { key: 'notificationButton', label: 'زر الإشعارات', desc: 'إظهار زر تفعيل الإشعارات' },
            { key: 'contactFooter', label: 'تذييل التواصل', desc: 'عرض معلومات التواصل في أسفل الصفحة' },
          ].map((item) => (
            <div key={item.key} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <div>
                <p className="font-medium text-slate-800 dark:text-white text-sm">{item.label}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
              <button 
                onClick={() => {
                  setLocalSettings(prev => ({
                    ...prev,
                    homeSections: {
                      ...prev.homeSections,
                      [item.key]: !prev.homeSections?.[item.key as keyof typeof prev.homeSections]
                    }
                  }));
                }}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${
                  localSettings.homeSections?.[item.key as keyof typeof localSettings.homeSections] !== false
                    ? 'bg-green-500' 
                    : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                  localSettings.homeSections?.[item.key as keyof typeof localSettings.homeSections] !== false
                    ? 'translate-x-0' 
                    : '-translate-x-6'
                }`}></div>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Hero Banner Content */}
      <div className="mt-8">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">محتوى البانر الرئيسي</h3>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              رابط الصورة
            </label>
            <input
              type="text"
              value={localSettings.heroBanner?.image || ''}
              onChange={(e) => setLocalSettings(prev => ({
                ...prev,
                heroBanner: { ...prev.heroBanner, image: e.target.value }
              }))}
              placeholder="https://example.com/banner.jpg"
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                الشارة (Badge)
              </label>
              <input
                type="text"
                value={localSettings.heroBanner?.badge || ''}
                onChange={(e) => setLocalSettings(prev => ({
                  ...prev,
                  heroBanner: { ...prev.heroBanner, badge: e.target.value }
                }))}
                placeholder="موسم مميز"
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                العنوان الرئيسي
              </label>
              <input
                type="text"
                value={localSettings.heroBanner?.title || ''}
                onChange={(e) => setLocalSettings(prev => ({
                  ...prev,
                  heroBanner: { ...prev.heroBanner, title: e.target.value }
                }))}
                placeholder="تشكيلة العيد"
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              العنوان الفرعي
            </label>
            <input
              type="text"
              value={localSettings.heroBanner?.subtitle || ''}
              onChange={(e) => setLocalSettings(prev => ({
                ...prev,
                heroBanner: { ...prev.heroBanner, subtitle: e.target.value }
              }))}
              placeholder="بين يديك"
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              الوصف
            </label>
            <textarea
              value={localSettings.heroBanner?.description || ''}
              onChange={(e) => setLocalSettings(prev => ({
                ...prev,
                heroBanner: { ...prev.heroBanner, description: e.target.value }
              }))}
              placeholder="أرقى التصاميم العمانية والعصرية..."
              rows={3}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                نص الزر
              </label>
              <input
                type="text"
                value={localSettings.heroBanner?.buttonText || ''}
                onChange={(e) => setLocalSettings(prev => ({
                  ...prev,
                  heroBanner: { ...prev.heroBanner, buttonText: e.target.value }
                }))}
                placeholder="استكشف جاكيتات العيد"
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                رابط الزر (صفحة داخلية)
              </label>
              <input
                type="text"
                value={localSettings.heroBanner?.buttonLink || ''}
                onChange={(e) => setLocalSettings(prev => ({
                  ...prev,
                  heroBanner: { ...prev.heroBanner, buttonLink: e.target.value }
                }))}
                placeholder="/products أو /tailors"
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500">
              💡 نصيحة: يمكنك استخدام روابط داخلية مثل: /products, /tailors, /collections, /account
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const PlaceholderView = ({ title, icon: Icon }: any) => (
    <div className="flex flex-col items-center justify-center h-96 text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
       <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
          <Icon size={40} className="opacity-50" />
       </div>
       <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300">{title}</h3>
       <p className="text-sm">هذه الوحدة قيد التطوير حالياً</p>
    </div>
  );

  // --- RENDERER ---

  const renderContent = () => {
    switch(activeSection) {
      case 'dashboard': return <DashboardView />;
      case 'orders': return <OrdersView />;
      case 'tailors': return <TailorsView />;
      case 'products': return <ProductsAdminView />;
      case 'fabrics': return <FabricsView />;
      case 'imageLibrary': return <ImageLibraryView />;
      case 'measurements': return <PlaceholderView title="مكتبة المقاسات" icon={Ruler} />;
      case 'family': return <PlaceholderView title="ملفات العائلة" icon={Users} />;
      case 'ai': return <AIView />;
      case 'config': return <ConfigView />;
      case 'logs': return <PlaceholderView title="سجلات النظام" icon={FileText} />;
      default: return <DashboardView />;
    }
  };

  // --- ACCESS CONTROL ---

  if (user?.role !== 'admin') {
     return (
        <div className="h-screen w-screen bg-[#050817] flex items-center justify-center text-center p-4" dir="rtl">
           <div className="max-w-md">
             <Shield size={64} className="mx-auto text-red-500 mb-4" />
             <h1 className="text-3xl font-bold text-white mb-2">منطقة محظورة</h1>
             <p className="text-slate-400 mb-6">يجب عليك تسجيل الدخول بحساب مسؤول (Admin) للوصول إلى لوحة التحكم.</p>
             <Button onClick={() => navigate('/')}>العودة للرئيسية</Button>
           </div>
        </div>
     );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0b1121] text-slate-900 dark:text-slate-100 font-sans overflow-hidden dir-rtl">
      
      {/* Sidebar */}
      <aside className={`w-64 bg-[#050817] text-slate-300 flex-col transition-all duration-300 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full absolute z-50 h-full'} md:relative md:translate-x-0 md:flex border-l border-white/5`}>
        <div className="h-16 flex items-center px-6 border-b border-white/10 justify-between">
          <div className="flex items-center gap-2">
            <Shield className="text-blue-500" size={24} />
            <h1 className="text-lg font-bold text-white tracking-wider">KHUYOOT</h1>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-500"><X size={20}/></button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-3 no-scrollbar">
          <p className="px-4 text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">الرئيسية</p>
          <SidebarItem id="dashboard" icon={Activity} label="لوحة المعلومات" />
          <SidebarItem id="orders" icon={ShoppingCart} label="جدول الطلبات" />
          
          <p className="px-4 text-[10px] font-bold text-slate-500 mt-6 mb-2 uppercase tracking-wider">الإدارة</p>
          <SidebarItem id="tailors" icon={Scissors} label="الخياطين" />
          <SidebarItem id="products" icon={Package} label="المنتجات" />
          
          <p className="px-4 text-[10px] font-bold text-slate-500 mt-6 mb-2 uppercase tracking-wider">الأصول</p>
          <SidebarItem id="fabrics" icon={Layers} label="مكتبة الأقمشة" />
          <SidebarItem id="imageLibrary" icon={Archive} label="مكتبة الصور — الأقسام" />
          <SidebarItem id="measurements" icon={Ruler} label="مكتبة المقاسات" />
          <SidebarItem id="family" icon={Users} label="ملفات العائلة" />
          
          <p className="px-4 text-[10px] font-bold text-slate-500 mt-6 mb-2 uppercase tracking-wider">النظام</p>
          <SidebarItem id="ai" icon={Cpu} label="نماذج AI & Prompts" />
          <SidebarItem id="config" icon={Settings} label="الإعدادات العامة" />
          <SidebarItem id="logs" icon={FileText} label="System Logs" />
        </div>

        <div className="p-4 border-t border-white/10">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut size={18} />
            <span className="font-medium text-sm">تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 shadow-sm z-10">
           <div className="flex items-center gap-4">
             <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="md:hidden text-slate-500">
               <Menu size={24} />
             </button>
             <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200 capitalize">
               {activeSection === 'ai' ? 'AI Configuration' : activeSection}
             </h2>
           </div>

           <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                 <input type="text" placeholder="بحث سريع..." className="pl-4 pr-10 py-1.5 bg-slate-100 dark:bg-slate-800 border-none rounded-full text-xs w-64 focus:ring-1 focus:ring-blue-500" />
                 <Search size={14} className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400" />
              </div>
              <button className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                 <Bell size={20} />
                 <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-2 border-r border-slate-200 dark:border-slate-700 pr-4">
                 <div className="text-left hidden md:block">
                    <p className="text-xs font-bold text-slate-700 dark:text-white">Admin User</p>
                    <p className="text-[10px] text-slate-400">Super Admin</p>
                 </div>
                 <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">A</div>
              </div>
           </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <div className="mb-4 p-4 rounded-xl bg-yellow-100 text-yellow-800 font-bold text-sm text-right">
            DEBUG: بيرة
          </div>
           {renderContent()}
        </main>
      </div>
    </div>
  );
};
