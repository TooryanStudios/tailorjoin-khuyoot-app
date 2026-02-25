import React from 'react';
import { ChevronRight, Edit, Trash2, Plus, MoreVertical } from 'lucide-react';
import { CategoryTreeNode } from '../types';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';

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
  onAddChild,
}) => {
  const { confirm, confirmDialog } = useConfirmDialog();
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [showMenu, setShowMenu] = React.useState(false);

  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="select-none relative font-['Tajawal'] font-normal">
      {/* خط التفرع الرأسي */}
      {level > 0 && (
        <div 
          className="absolute top-0 bottom-0 border-r border-zinc-200 dark:border-zinc-700"
          style={{ right: `${level * 24 - 12}px` }}
        />
      )}
      
      <div className="group flex items-center gap-2 py-1.5 px-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors relative border-b border-zinc-300 dark:border-zinc-700">
        {/* خط التفرع الأفقي */}
        {level > 0 && (
          <div 
            className="absolute top-1/2 border-t border-zinc-200 dark:border-zinc-700"
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
          className={`p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-transform z-10 ${
            hasChildren ? 'visible' : 'invisible'
          } ${isExpanded ? 'rotate-90' : ''}`}
        >
          <ChevronRight size={14} />
        </button>

        {/* الصورة */}
        {node.image && (
          <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 border border-zinc-200 dark:border-zinc-700">
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
            <h4 className="font-normal text-zinc-900 dark:text-white truncate">
              {node.nameAr}
            </h4>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {node.nameEn}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
            ID: {node.id} • Level: {node.level}
          </p>
          {node.productsCount !== undefined && (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {node.productsCount} منتج
            </p>
          )}
        </div>

        {/* الحالة */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-2xl text-[11px] font-normal ${
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
          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl transition-all"
          title="تعديل"
        >
          <Edit size={14} />
        </button>

        {/* القائمة المنسدلة */}
        <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"
          >
            <MoreVertical size={14} />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute left-0 top-full mt-1 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 z-20 overflow-hidden">
                <button
                  onClick={() => {
                    onEdit(node);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs text-right transition-colors"
                >
                  <Edit size={14} />
                  تعديل
                </button>
                <button
                  onClick={() => {
                    onAddChild(node.id);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs text-right transition-colors"
                >
                  <Plus size={14} />
                  إضافة تصنيف فرعي
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    
                    const confirmMessage = `هل أنت متأكد من حذف التصنيف "${node.nameAr}" (${node.nameEn})؟\n\nملاحظة: لا يمكن التراجع عن هذا الإجراء.`;
                    const shouldDelete = await confirm({
                      title: 'حذف التصنيف',
                      message: confirmMessage,
                      confirmText: 'حذف',
                      cancelText: 'إلغاء',
                      danger: true,
                    });
                    if (shouldDelete) {
                      onDelete(node.id);
                    }
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs text-right text-red-600 dark:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
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
      {confirmDialog}
    </div>
  );
};
