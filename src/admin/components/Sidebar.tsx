
import React from 'react';
import { Shield, Activity, ShoppingCart, Scissors, Package, Layers, Ruler, Users, Cpu, Settings, FileText, LogOut, X, Store, Building2, Moon, Sun, CheckCircle, ImagePlus, Bell, Megaphone, DollarSign, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  activeSection: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onLogout: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  tailorsCount?: number;
  boutiquesCount?: number;
  shopsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeSection, 
  isOpen, 
  setIsOpen, 
  onLogout,
  theme = 'dark',
  onToggleTheme,
  tailorsCount = 0,
  boutiquesCount = 0,
  shopsCount = 0
}) => {
  const navigate = useNavigate();
  
  const SidebarItem = ({ id, icon: Icon, label, count }: { id: string, icon: any, label: string, count?: number }) => (
    <button 
      onClick={() => { navigate(`/admin/${id}`); setIsOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 ${
        activeSection === id 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={16} />
      <span className="font-medium text-xs flex-1 text-right">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
          {count}
        </span>
      )}
    </button>
  );

  return (
    <aside
      className={`fixed top-0 right-0 h-full w-64 bg-[#050817] text-slate-300 flex flex-col border-l border-white/5 z-[999] transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      role="complementary"
      aria-hidden={!isOpen}
    >
        <div className="h-16 flex items-center px-6 border-b border-white/10 justify-between">
          <div className="flex items-center gap-2">
            <Shield className="text-blue-500" size={24} />
            <h1 className="text-lg font-bold text-white tracking-wider">KHUYOOT</h1>
          </div>
          <button 
            onClick={() => setIsOpen(false)} 
            className="text-slate-400 hover:text-white transition-colors"
            title="إخفاء الشريط الجانبي"
          >
            <X size={20}/>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-3" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 128px)' }}>
          <p className="px-4 text-[9px] font-bold text-slate-500 mb-2 uppercase tracking-wider">الرئيسية</p>
          <SidebarItem id="dashboard" icon={Activity} label="لوحة المعلومات" />
          <SidebarItem id="orders" icon={ShoppingCart} label="جدول الطلبات" />
          <SidebarItem id="approvals" icon={CheckCircle} label="موافقات التجار" count={tailorsCount + boutiquesCount + shopsCount} />
          
          <p className="px-4 text-[9px] font-bold text-slate-500 mt-6 mb-2 uppercase tracking-wider">المحلات التجارية</p>
          <SidebarItem id="tailors" icon={Scissors} label="جميع محلات الخياطة" count={tailorsCount} />
          <SidebarItem id="boutiques" icon={Store} label="البوتيكات" count={boutiquesCount} />
          <SidebarItem id="shops" icon={Building2} label="المحلات الأخرى" count={shopsCount} />
          
          <p className="px-4 text-[9px] font-bold text-slate-500 mt-6 mb-2 uppercase tracking-wider">الإدارة</p>
          <SidebarItem id="users" icon={Users} label="إدارة المستخدمين" />
          <SidebarItem id="products" icon={Package} label="المنتجات" />
          <SidebarItem id="store" icon={Store} label="إدارة المتجر" />
          
          <p className="px-4 text-[9px] font-bold text-slate-500 mt-6 mb-2 uppercase tracking-wider">الأصول</p>
          <SidebarItem id="images" icon={ImagePlus} label="مكتبة الصور" />
          <SidebarItem id="fabrics" icon={Layers} label="مكتبة الأقمشة" />
          <SidebarItem id="measurements" icon={Ruler} label="مكتبة المقاسات" />
          <SidebarItem id="family" icon={Users} label="ملفات العائلة" />
          
          <p className="px-4 text-[9px] font-bold text-slate-500 mt-6 mb-2 uppercase tracking-wider">النظام</p>
          <SidebarItem id="ai" icon={Cpu} label="نماذج AI & Prompts" />
          <SidebarItem id="notifications" icon={Bell} label="إرسال الإشعارات" />
          <SidebarItem id="ads" icon={Megaphone} label="إدارة الإعلانات" />
          <SidebarItem id="regions" icon={MapPin} label="المناطق الشائعة" />
          <SidebarItem id="financial" icon={DollarSign} label="الإدارة المالية" />
          <SidebarItem id="config" icon={Settings} label="الإعدادات العامة" />
          <SidebarItem id="logs" icon={FileText} label="System Logs" />
        </div>

        <div className="p-4 border-t border-white/10">
          <button onClick={onLogout} className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut size={16} />
            <span className="font-medium text-xs">تسجيل الخروج</span>
          </button>
        </div>
      </aside>
  );
};
