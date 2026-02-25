
import React from 'react';
import { Users, ShoppingCart, Scissors, Cpu, UserCheck } from 'lucide-react';
import { User, Order, Tailor, SystemLog } from '../../../types';

interface DashboardProps {
  users: User[];
  orders: Order[];
  tailors: Tailor[];
  logs: SystemLog[];
}

export const DashboardOverview: React.FC<DashboardProps> = ({ users, orders, tailors, logs }) => {
  const activeOrdersCount = orders.filter(
    (order) => order.status !== 'delivered' && order.status !== 'cancelled' && order.status !== 'rejected'
  ).length;
  const pendingTailorsCount = tailors.filter((tailor) => tailor.approvalStatus === 'pending').length;
  // 'customer' is the normalized role from applyUserDefaults; also match legacy 'user'
  const regularUsersCount = users.filter((u: any) => u.role === 'customer' || u.role === 'user').length;
  
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard title="إجمالي المستخدمين" value={users.length} icon={Users} color="bg-blue-500 text-blue-500" subtext="جميع الحسابات" />
        <StatCard title="مستخدمون عاديون" value={regularUsersCount} icon={UserCheck} color="bg-green-500 text-green-500" subtext={`${Math.round((regularUsersCount / Math.max(users.length, 1)) * 100)}% من الإجمالي`} />
        <StatCard title="الطلبات النشطة" value={activeOrdersCount} icon={ShoppingCart} color="bg-orange-500 text-orange-500" subtext={`من أصل ${orders.length} طلب`} />
        <StatCard title="الخياطين" value={tailors.length} icon={Scissors} color="bg-amber-500 text-amber-500" subtext={`${pendingTailorsCount} بانتظار الموافقة`} />
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
};
