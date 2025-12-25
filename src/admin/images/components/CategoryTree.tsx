import React, { useState } from 'react';
import { ChevronDown, ChevronLeft, Folder, FolderOpen, Image as ImageIcon, MoreVertical, Trash2 } from 'lucide-react';
import { ImageLibraryCategory } from '../../../../types';

export interface CategoryTreeNode extends ImageLibraryCategory {
  children: CategoryTreeNode[];
}

interface CategoryTreeItemProps {
  node: CategoryTreeNode;
  level: number;
  expanded: boolean;
  selected: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onMove?: () => void;
  onDelete: () => void;
}

const CategoryTreeItem: React.FC<CategoryTreeItemProps> = ({ 
  node, 
  level, 
  expanded, 
  selected, 
  onToggle, 
  onSelect,
  onMove,
  onDelete
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const canHaveImages = node.level === 1 || !hasChildren;

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-colors ${
          selected
            ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500'
            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
        }`}
        style={{ paddingRight: `${level * 1.5 + 0.75}rem` }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition"
          >
            {expanded ? (
              <ChevronDown size={16} className="text-slate-600 dark:text-slate-400" />
            ) : (
              <ChevronLeft size={16} className="text-slate-600 dark:text-slate-400" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}

        <div className="flex-shrink-0">
          {hasChildren ? (
            expanded ? (
              <FolderOpen size={18} className="text-amber-500" />
            ) : (
              <Folder size={18} className="text-amber-600" />
            )
          ) : (
            <ImageIcon size={18} className="text-blue-500" />
          )}
        </div>

        <div 
          className="flex-1 min-w-0"
          onClick={canHaveImages ? onSelect : undefined}
        >
          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
            {node.name}
          </p>
          {node.nameEn && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {node.nameEn}
            </p>
          )}
        </div>

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition"
          >
            <MoreVertical size={14} className="text-slate-400" />
          </button>
          {showMenu && (
            <div className="absolute left-0 top-full mt-1 bg-white dark:bg-slate-700 rounded-lg shadow-xl border border-slate-200 dark:border-slate-600 z-20 min-w-[120px]">
              {onMove && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onMove();
                  }}
                  className="w-full px-3 py-2 text-xs text-right text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600/30 flex items-center gap-2 rounded-lg transition"
                >
                  نقل القسم
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onDelete();
                }}
                className="w-full px-3 py-2 text-xs text-right text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 rounded-lg transition"
              >
                <Trash2 size={12} />
                حذف القسم
              </button>
            </div>
          )}
        </div>
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children.map(child => (
            <CategoryTreeItemWrapper
              key={child.id}
              node={child}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const CategoryTreeContext = React.createContext<{
  expandedCategories: Set<string>;
  selectedCategory: ImageLibraryCategory | null;
  toggleCategory: (id: string) => void;
  setSelectedCategory: (cat: ImageLibraryCategory) => void;
  handleDeleteCategory: (id: string) => void;
  requestMoveCategory?: (cat: ImageLibraryCategory) => void;
} | null>(null);

export const CategoryTreeItemWrapper: React.FC<{ node: CategoryTreeNode; level: number }> = ({ node, level }) => {
  const parent = React.useContext(CategoryTreeContext);
  if (!parent) return null;
  
  const expanded = parent.expandedCategories.has(node.id);
  const selected = parent.selectedCategory?.id === node.id;
  
  return (
    <CategoryTreeItem
      node={node}
      level={level}
      expanded={expanded}
      selected={selected}
      onToggle={() => parent.toggleCategory(node.id)}
      onSelect={() => (node.level === 1 || !node.hasChildren) && parent.setSelectedCategory(node)}
      onMove={parent.requestMoveCategory ? () => parent.requestMoveCategory!(node) : undefined}
      onDelete={() => parent.handleDeleteCategory(node.id)}
    />
  );
};
