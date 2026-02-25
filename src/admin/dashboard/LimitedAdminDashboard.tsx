import React from 'react';
import { ShoppingCart, Users, CheckCircle, ArrowRight } from 'lucide-react';
import { User, Order, Tailor } from '../../../types';
import { useNavigate } from 'react-router-dom';

interface LimitedAdminDashboardProps {
  users: User[];
  orders: Order[];
  tailors: Tailor[];
}

export const LimitedAdminDashboard: React.FC<LimitedAdminDashboardProps> = ({
  users,
  orders,
  tailors,
}) => {
  const navigate = useNavigate();

  const activeOrdersCount = orders.filter(
    (order) => order.status !== 'delivered' && order.status !== 'cancelled' && order.status !== 'rejected'
  ).length;

  const pendingTailorsCount = tailors.filter(
    (tailor) => tailor.approvalStatus === 'pending'
  ).length;

  const totalUsersCount = users.length;

  const QuickStatCard = ({
    title,
    value,
    icon: Icon,
    color,
    onClick,
  }: {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    onClick: () => void;
  }) => (
    <div
      onClick={onClick}
      className="group bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">
            {title}
          </p>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
            {value}
          </h3>
        </div>
        <div className={`p-3 rounded-xl ${color} bg-opacity-20 group-hover:scale-110 transition-transform`}>
          {Icon}
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-theme-primary font-medium group-hover:gap-3 transition-all">
        <span>عرض التفاصيل</span>
        <ArrowRight size={16} />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-theme-primary/5 to-theme-primary/10 dark:from-slate-800 dark:to-slate-900 rounded-2xl border border-theme-primary/20 p-6">
        <h1 className="text-2xl font-normal text-slate-900 dark:text-white mb-2">
          لوحة التحكم المحدودة
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          عرض سريع للبيانات الأساسية والطلبات المهمة
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <QuickStatCard
          title="الطلبات النشطة"
          value={activeOrdersCount}
          icon={
            <ShoppingCart
              size={24}
              className="text-emerald-600 dark:text-emerald-400"
            />
          }
          color="bg-emerald-600"
          onClick={() => navigate('/admin/orders')}
        />

        <QuickStatCard
          title="محلات بانتظار الموافقة"
          value={pendingTailorsCount}
          icon={
            <CheckCircle
              size={24}
              className="text-amber-600 dark:text-amber-400"
            />
          }
          color="bg-amber-600"
          onClick={() => navigate('/admin/approvals')}
        />

        <QuickStatCard
          title="إجمالي المستخدمين"
          value={totalUsersCount}
          icon={
            <Users
              size={24}
              className="text-blue-600 dark:text-blue-400"
            />
          }
          color="bg-blue-600"
          onClick={() => navigate('/admin/users')}
        />
      </div>

      {/* Quick Links */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
        <h2 className="text-lg font-normal text-slate-900 dark:text-white mb-4">
          الروابط السريعة
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/admin/orders')}
            className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-theme-primary/30 hover:bg-theme-primary/5 dark:hover:bg-slate-700/50 transition-all text-left"
          >
            <span className="font-medium text-slate-900 dark:text-white">
              إدارة الطلبات النشطة
            </span>
            <ArrowRight size={18} className="text-slate-400" />
          </button>

          <button
            onClick={() => navigate('/admin/approvals')}
            className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-theme-primary/30 hover:bg-theme-primary/5 dark:hover:bg-slate-700/50 transition-all text-left"
          >
            <span className="font-medium text-slate-900 dark:text-white">
              الموافقات المعلقة
            </span>
            <ArrowRight size={18} className="text-slate-400" />
          </button>

          <button
            onClick={() => navigate('/admin/users')}
            className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-theme-primary/30 hover:bg-theme-primary/5 dark:hover:bg-slate-700/50 transition-all text-left"
          >
            <span className="font-medium text-slate-900 dark:text-white">
              قائمة المستخدمين
            </span>
            <ArrowRight size={18} className="text-slate-400" />
          </button>

          <button
            onClick={() => navigate('/admin/config/general')}
            className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-theme-primary/30 hover:bg-theme-primary/5 dark:hover:bg-slate-700/50 transition-all text-left"
          >
            <span className="font-medium text-slate-900 dark:text-white">
              الإعدادات العامة
            </span>
            <ArrowRight size={18} className="text-slate-400" />
          </button>
        </div>
      </div>

    </div>
  );
};
