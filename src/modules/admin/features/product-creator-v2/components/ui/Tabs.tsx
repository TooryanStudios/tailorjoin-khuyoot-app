import React from 'react';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-1 p-1 rounded-lg bg-white/[0.02] border border-white/5 ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`
              relative flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-all
              ${isActive
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }
            `}
          >
            {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`
                  ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold
                  ${isActive ? 'bg-lime-400 text-slate-900' : 'bg-white/10 text-slate-400'}
                `}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
