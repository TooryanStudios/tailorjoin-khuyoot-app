
import React from 'react';
import { Shield, Activity, ShoppingCart, Scissors, Package, Layers, Ruler, Users, Cpu, Settings, FileText, LogOut, X, Store, Building2, Moon, Sun, CheckCircle, ImagePlus, Bell, Megaphone, DollarSign, MapPin, AlertTriangle, Star, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type SidebarItemProps = {
  id: string;
  icon: any;
  label: string;
  count?: number;
  to?: string;
  activeSection: string;
  showDevPrefixes: boolean;
  onNavigate: (to: string) => void;
  onAfterNavigate: () => void;
};

const SidebarItem = React.memo<SidebarItemProps>(function SidebarItem({
  id,
  icon: Icon,
  label,
  count,
  to,
  activeSection,
  showDevPrefixes,
  onNavigate,
  onAfterNavigate,
}) {
  const isActive = activeSection === id;

  return (
    <button
      onClick={() => {
        onNavigate(to || `/admin/${id}`);
        onAfterNavigate();
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 ${
        isActive
          ? 'bg-theme-primary text-white shadow-lg shadow-theme-primary/20'
          : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
      }`}
    >
      <Icon size={16} />
      <span className="font-medium text-xs flex-1 text-right">
        {showDevPrefixes ? `${id} · ` : ''}{label}
      </span>
      {count !== undefined && count > 0 && (
        <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
          {count}
        </span>
      )}
    </button>
  );
});

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

  const showDevPrefixes = Boolean((import.meta as any)?.env?.DEV);

  const onAfterNavigate = () => {
    // Keep the sidebar open on desktop so the user always sees the menu.
    try {
      const isSmallScreen = window.matchMedia('(max-width: 640px)').matches;
      if (isSmallScreen) setIsOpen(false);
    } catch {
      setIsOpen(false);
    }
  };

  return (
    <aside
      className={`fixed top-0 right-0 h-full w-64 bg-zinc-950 text-zinc-300 flex flex-col border-l border-zinc-800 z-[999] transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      role="complementary"
      aria-hidden={!isOpen}
    >
        <div className="h-16 flex items-center px-6 border-b border-zinc-800 justify-between">
          <div className="flex items-center gap-2">
            <Shield className="text-theme-primary" size={24} />
            <h1 className="text-lg font-bold text-white tracking-wider">KHUYOOT</h1>
          </div>
          <button 
            onClick={() => setIsOpen(false)} 
            className="text-zinc-400 hover:text-white transition-colors"
            title="إخفاء الشريط الجانبي"
          >
            <X size={20}/>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-3" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 128px)' }}>
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-3 w-full px-4 py-3 mb-6 rounded-xl bg-theme-primary/10 text-theme-primary hover:bg-theme-primary/20 transition-all border border-theme-primary/20 group"
          >
            <Home size={18} className="group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <p className="text-xs font-bold leading-none">عرض الموقع</p>
              <p className="text-[9px] opacity-60 mt-1">الخروج من لوحة الإدارة</p>
            </div>
          </button>

          <p className="px-4 text-[9px] font-bold text-zinc-500 mb-2 uppercase tracking-wider">الرئيسية</p>
          <SidebarItem id="dashboard" icon={Activity} label="لوحة المعلومات" activeSection={activeSection} showDevPrefixes={showDevPrefixes} onNavigate={navigate} onAfterNavigate={onAfterNavigate} />
          <SidebarItem id="orders" icon={ShoppingCart} label="جدول الطلبات" activeSection={activeSection} showDevPrefixes={showDevPrefixes} onNavigate={navigate} onAfterNavigate={onAfterNavigate} />
          <SidebarItem id="approvals" icon={CheckCircle} label="موافقات التجار" count={tailorsCount + boutiquesCount + shopsCount} activeSection={activeSection} showDevPrefixes={showDevPrefixes} onNavigate={navigate} onAfterNavigate={onAfterNavigate} />
          
          <p className="px-4 text-[9px] font-bold text-zinc-500 mt-6 mb-2 uppercase tracking-wider">المحلات التجارية</p>
          <SidebarItem id="tailors" icon={Scissors} label="جميع محلات الخياطة" count={tailorsCount} activeSection={activeSection} showDevPrefixes={showDevPrefixes} onNavigate={navigate} onAfterNavigate={onAfterNavigate} />
          <SidebarItem id="boutiques" icon={Store} label="البوتيكات" count={boutiquesCount} activeSection={activeSection} showDevPrefixes={showDevPrefixes} onNavigate={navigate} onAfterNavigate={onAfterNavigate} />
          <SidebarItem id="shops" icon={Building2} label="المحلات الأخرى" count={shopsCount} activeSection={activeSection} showDevPrefixes={showDevPrefixes} onNavigate={navigate} onAfterNavigate={onAfterNavigate} />
          
          <p className="px-4 text-[9px] font-bold text-zinc-500 mt-6 mb-2 uppercase tracking-wider">الإدارة</p>
          <SidebarItem id="users" icon={Users} label="إدارة المستخدمين" activeSection={activeSection} showDevPrefixes={showDevPrefixes} onNavigate={navigate} onAfterNavigate={onAfterNavigate} />
          <SidebarItem id="products" icon={Package} label="المنتجات" to="/admin/products/categories" activeSection={activeSection} showDevPrefixes={showDevPrefixes} onNavigate={navigate} onAfterNavigate={onAfterNavigate} />
          <SidebarItem id="orphaned-products" icon={AlertTriangle} label="منتجات يتيمة" activeSection={activeSection} showDevPrefixes={showDevPrefixes} onNavigate={navigate} onAfterNavigate={onAfterNavigate} />
          <SidebarItem id="store" icon={Store} label="إدارة المتجر" activeSection={activeSection} showDevPrefixes={showDevPrefixes} onNavigate={navigate} onAfterNavigate={onAfterNavigate} />
          
          <p className="px-4 text-[9px] font-bold text-zinc-500 mt-6 mb-2 uppercase tracking-wider">الأصول</p>
          <SidebarItem id="images" icon={ImagePlus} label="*++** مكتبة الصور" to="/admin/images/all" activeSection={activeSection} showDevPrefixes={showDevPrefixes} onNavigate={navigate} onAfterNavigate={onAfterNavigate} />
          <SidebarItem id="fabrics" icon={Layers} label="مكتبة الأقمشة" activeSection={activeSection} showDevPrefixes={showDevPrefixes} onNavigate={navigate} onAfterNavigate={onAfterNavigate} />
          <SidebarItem id="measurements" icon={Ruler} label="مكتبة المقاسات" activeSection={activeSection} showDevPrefixes={showDevPrefixes} onNavigate={navigate} onAfterNavigate={onAfterNavigate} />
          <SidebarItem id="family" icon={Users} label="ملفات العائلة" activeSection={activeSection} showDevPrefixes={showDevPrefixes} onNavigate={navigate} onAfterNavigate={onAfterNavigate} />
          
          <p className="px-4 text-[9px] font-bold text-zinc-500 mt-6 mb-2 uppercase tracking-wider">Try-On</p>
          <SidebarItem id="tryon-templates" icon={Star} label="قوالب Try‑On" to="/admin/tryon-templates/templates" activeSection={activeSection} showDevPrefixes={showDevPrefixes} onNavigate={navigate} onAfterNavigate={onAfterNavigate} />
          
          <p className="px-4 text-[9px] font-bold text-zinc-500 mt-6 mb-2 uppercase tracking-wider">النظام</p>
          <SidebarItem id="ai" icon={Cpu} label="نماذج AI & Prompts" activeSection={activeSection} showDevPrefixes={showDevPrefixes} onNavigate={navigate} onAfterNavigate={onAfterNavigate} />
          <SidebarItem id="notifications" icon={Bell} label="إرسال الإشعارات" activeSection={activeSection} showDevPrefixes={showDevPrefixes} onNavigate={navigate} onAfterNavigate={onAfterNavigate} />
          <SidebarItem id="ads" icon={Megaphone} label="إدارة الإعلانات" activeSection={activeSection} showDevPrefixes={showDevPrefixes} onNavigate={navigate} onAfterNavigate={onAfterNavigate} />
          <SidebarItem id="regions" icon={MapPin} label="المناطق الشائعة" activeSection={activeSection} showDevPrefixes={showDevPrefixes} onNavigate={navigate} onAfterNavigate={onAfterNavigate} />
          <SidebarItem id="financial" icon={DollarSign} label="الإدارة المالية" to="/admin/financial/dashboard" activeSection={activeSection} showDevPrefixes={showDevPrefixes} onNavigate={navigate} onAfterNavigate={onAfterNavigate} />
          <SidebarItem id="credits" icon={DollarSign} label="إدارة الرصيد" to="/admin/credits" activeSection={activeSection} showDevPrefixes={showDevPrefixes} onNavigate={navigate} onAfterNavigate={onAfterNavigate} />
          <SidebarItem id="settings" icon={FileText} label="إدارة الاستبيان" to="/admin/settings/surveys/khuyoot-validation" activeSection={activeSection} showDevPrefixes={showDevPrefixes} onNavigate={navigate} onAfterNavigate={onAfterNavigate} />
          <SidebarItem id="config" icon={Settings} label="الإعدادات العامة" to="/admin/config/general" activeSection={activeSection} showDevPrefixes={showDevPrefixes} onNavigate={navigate} onAfterNavigate={onAfterNavigate} />
          <SidebarItem id="debug-tools" icon={Activity} label="أدوات التشخيص" to="/admin/config/debug-tools" activeSection={activeSection} showDevPrefixes={showDevPrefixes} onNavigate={navigate} onAfterNavigate={onAfterNavigate} />
          <SidebarItem id="logs" icon={FileText} label="System Logs" activeSection={activeSection} showDevPrefixes={showDevPrefixes} onNavigate={navigate} onAfterNavigate={onAfterNavigate} />
        </div>

        <div className="p-4 border-t border-zinc-800">
          <button onClick={onLogout} className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut size={16} />
            <span className="font-medium text-xs">تسجيل الخروج</span>
          </button>
        </div>
      </aside>
  );
};
