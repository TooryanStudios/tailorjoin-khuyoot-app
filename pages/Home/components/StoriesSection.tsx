import React from 'react';
import { Plus } from 'lucide-react';
import { Story } from '../../../types';

interface StoriesSectionProps {
  stories: Story[];
  userRole?: string;
}

export const StoriesSection: React.FC<StoriesSectionProps> = ({ stories, userRole }) => {
  if (stories.length === 0) return null;

  return (
    <div className="mb-6 mt-4">
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
        {/* Add Story Button (For Tailors) */}
        {userRole === 'tailor' && (
          <div className="min-w-[70px] flex flex-col items-center gap-1 cursor-pointer">
            <div className="w-[70px] h-[70px] rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center relative bg-slate-50 dark:bg-slate-800">
              <Plus size={24} className="text-slate-400" />
              <div className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-0.5 border-2 border-white dark:border-[#050817]">
                <Plus size={12} />
              </div>
            </div>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">قصتي</span>
          </div>
        )}
        
        {/* Stories List */}
        {stories.map((story) => (
          <div key={story.id} className="min-w-[70px] flex flex-col items-center gap-1 cursor-pointer group">
            <div className="relative w-[70px] h-[70px] rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500">
              <img 
                src={story.tailorImage} 
                alt={story.tailorName} 
                className="w-full h-full rounded-full object-cover border-2 border-white dark:border-[#050817]" 
              />
            </div>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium truncate max-w-[70px]">
              {story.tailorName}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
