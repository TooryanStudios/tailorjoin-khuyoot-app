import React from 'react';
import { ChevronRight, Edit, Trash2, Plus, MoreVertical } from 'lucide-react';
import { CategoryTreeNode } from '../types';

interface CategoryTreeItemProps {
  node: CategoryTreeNode;
  level: number;
  onEdit: (category: CategoryTreeNode) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
}

export const CategoryTreeItem: React.FC<CategoryTreeItemProps> = ({
  node,
  level,
  onEdit,
  onDelete,
  onAddChild
}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [showMenu, setShowMenu] = React.useState(false);

  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="select-none relative">
      {/* خط التفرع الرأسي */}
      {level > 0 && (
        <div 
          className="absolute top-0 bottom-0 border-r-2 border-slate-300 dark:border-slate-600"
          style={{ right: `${level * 24 - 12}px` }}
        />
      )}
      
      <div className="group flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors relative">
        {/* خط التفرع الأفقي */}
        {level > 0 && (
          <div 
            className="absolute top-1/2 border-t-2 border-slate-300 dark:border-slate-600"
            style={{ 
              right: `${level * 24 - 12}px`,
              width: '20px'
            }}
          />
        )}
        
        {/* مساحة للمحاذاة */}
        <div style={{ width: `${level * 24}px` }} className="flex-shrink-0" />
        
        {/* Toggle Arrow */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-transform z-10 ${
            hasChildren ? 'visible' : 'invisible'
          } ${isExpanded ? 'rotate-90' : ''}`}
        >
          <ChevronRight size={16} />
        </button>

        {/* الصورة */}
        {node.image && (
          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-600">
            <img
              src={node.image}
              alt={node.nameAr}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* المعلومات */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-slate-800 dark:text-white truncate">
              {node.nameAr}
            </h4>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {node.nameEn}
            </span>
          </div>
          {node.productsCount !== undefined && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {node.productsCount} منتج
            </p>
          )}
        </div>

        {/* الحالة */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold ${
          node.isActive 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
        }`}>
          <div className={`w-2 h-2 rounded-full ${node.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
          {node.isActive ? 'مفعل' : 'معطل'}
        </div>

        {/* زر التعديل */}
        <button
          onClick={() => onEdit(node)}
          className="opacity-0 group-hover:opacity-100 p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-all"
          title="تعديل"
        >
          <Edit size={16} />
        </button>

        {/* القائمة المنسدلة */}
        <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
          >
            <MoreVertical size={16} />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute left-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-20 overflow-hidden">
                <button
                  onClick={() => {
                    onEdit(node);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm text-right transition-colors"
                >
                  <Edit size={16} />
                  تعديل
                </button>
                <button
                  onClick={() => {
                    onAddChild(node.id);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm text-right transition-colors"
                >
                  <Plus size={16} />
                  إضافة تصنيف فرعي
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    
                    const confirmMessage = `هل أنت متأكد من حذف التصنيف "${node.nameAr}" (${node.nameEn})؟\n\nملاحظة: لا يمكن التراجع عن هذا الإجراء.`;
                    if (confirm(confirmMessage)) {
                      onDelete(node.id);
                    }
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm text-right text-red-600 dark:text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                  حذف
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* الأطفال */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child, index) => (
            <div key={child.id} className="relative">
              <CategoryTreeItem
                node={child}
                level={level + 1}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddChild={onAddChild}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
