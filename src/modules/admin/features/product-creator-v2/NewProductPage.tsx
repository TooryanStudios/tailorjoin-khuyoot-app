import React, { useState } from 'react';
import { Plus, Package } from 'lucide-react';
import { ProductFormProvider } from './context/ProductFormContext';
import { Tabs, Tab } from './components/ui';
import { AddProductTab } from './components/AddProductTab';
import { ProductsManager } from './components/ProductsManager';

const tabs: Tab[] = [
  { id: 'manage', label: 'إدارة المنتجات', icon: <Package size={14} />, badge: 3 },
  { id: 'add', label: 'إضافة منتج', icon: <Plus size={14} /> },
];

export const NewProductPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('manage');

  return (
    <ProductFormProvider>
      <div className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto max-w-none px-3 py-4 lg:px-5 lg:py-6">
          {/* Header with Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6" dir="rtl">
            <div>
              <h1 className="text-xl font-semibold">المنتجات</h1>
              <p className="mt-0.5 text-xs text-slate-400">إدارة وإضافة منتجاتك</p>
            </div>
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>

          {/* Tab Content */}
          <div dir="rtl">
            {activeTab === 'manage' && <ProductsManager />}
            {activeTab === 'add' && <AddProductTab />}
          </div>
        </div>
      </div>
    </ProductFormProvider>
  );
};
