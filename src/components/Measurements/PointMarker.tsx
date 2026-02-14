import React from 'react';

export const PointMarker = ({ point, order, value, onChange }: { point: any, order: number, value?: number, onChange?: (val: string) => void, key?: any }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const hasValue = value !== undefined && value > 0;
  
  React.useEffect(() => {
    if (ref.current) {
      ref.current.style.left = (point.x * 100) + '%';
      ref.current.style.top = (point.y * 100) + '%';
    }
  }, [point.x, point.y]);

  return (
    <div 
       ref={ref}
       className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 pointer-events-auto cursor-pointer"
    >
       {/* Label & Input Container */}
       <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
          <div className="px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[9px] sm:text-[10px] font-normal text-white whitespace-nowrap mb-1 shadow-xl border border-white/10">
            {point.label || point.name}
          </div>
          
          <div className="relative group/input" onClick={(e) => e.stopPropagation()}>
            <input
              type="number"
              step="0.5"
              min="0"
              value={value || ''}
              onChange={(e) => onChange?.(e.target.value)}
              placeholder="0"
              className={`w-12 h-8 px-1 text-[10px] sm:text-xs text-center border-2 rounded-lg shadow-2xl transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:w-16 bg-white/95 backdrop-blur-md font-black ${
                hasValue ? 'border-emerald-500 text-emerald-600' : 'border-gray-200 text-gray-800'
              }`}
            />
            <span className="absolute -right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-500 group-focus-within/input:opacity-100 opacity-0 transition-opacity">سم</span>
          </div>
       </div>
    </div>
  );
};
