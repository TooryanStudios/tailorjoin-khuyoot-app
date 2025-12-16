import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, MapPin, Star, CheckCircle2, Search, Filter, Grid, List } from 'lucide-react';
import { Tailor, Region } from '../types';
import { getTailors } from '../services/mockService';
import { getSpecializationLabel } from '../utils/specializationHelper';

const REGIONS: { id: Region | 'All', name: string }[] = [
  { id: 'All', name: 'الكل' },
  { id: 'Muscat', name: 'مسقط' },
  { id: 'Sohar', name: 'صحار' },
  { id: 'Salalah', name: 'صلالة' },
  { id: 'Nizwa', name: 'نزوى' },
  { id: 'Sur', name: 'صور' },
];

export const TailorList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const specializationFilter = searchParams.get('specialization');
  const regionFilter = searchParams.get('region');
  
  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [activeRegion, setActiveRegion] = useState<Region | 'All'>('All');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    getTailors().then(setTailors);
  }, []);

  // Set initial search if specialization filter is provided
  useEffect(() => {
    if (specializationFilter) {
      setSearch(specializationFilter);
    }
  }, [specializationFilter]);

  // Set initial region if region filter is provided from URL
  useEffect(() => {
    if (regionFilter) {
      // Try to match region from REGIONS list, otherwise set to 'All'
      const matchedRegion = REGIONS.find(r => r.name === regionFilter || r.id === regionFilter);
      if (matchedRegion && matchedRegion.id !== 'All') {
        setActiveRegion(matchedRegion.id);
      }
    }
  }, [regionFilter]);

  const filteredTailors = tailors.filter(t => {
    const matchesRegion = activeRegion === 'All' || t.region === activeRegion;
    const matchesSearch = t.name.includes(search) || t.specialization.includes(search);
    return matchesRegion && matchesSearch;
  });

  return (
    <div className="pb-24 pt-4 px-4 md:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
           <button 
             onClick={() => navigate(-1)}
             className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
           >
             <ArrowRight size={20} />
           </button>
           <h1 className="text-2xl font-bold text-slate-900 dark:text-white">نخبة الخياطين</h1>
        </div>

        {/* Active Filter Banner */}
        {specializationFilter && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <Filter size={18} className="text-blue-600 dark:text-blue-400" />
              <div className="flex-1">
                <p className="text-sm font-bold text-blue-900 dark:text-blue-300">
                  البحث عن خياطين متخصصين في: {specializationFilter}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                  يمكنك تعديل البحث أو اختيار أي خياط مناسب
                </p>
              </div>
              <button
                onClick={() => {
                  setSearch('');
                  navigate('/tailors');
                }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                إلغاء الفلترة
              </button>
            </div>
          </div>
        )}
        
        {/* Region Filter Banner */}
        {regionFilter && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-purple-600 dark:text-purple-400" />
              <div className="flex-1">
                <p className="text-sm font-bold text-purple-900 dark:text-purple-300">
                  الخياطون في منطقة: {regionFilter}
                </p>
                <p className="text-xs text-purple-700 dark:text-purple-400 mt-0.5">
                  يمكنك اختيار أي منطقة أخرى من الأسفل
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveRegion('All');
                  navigate('/tailors');
                }}
                className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
              >
                إلغاء الفلترة
              </button>
            </div>
          </div>
        )}
        
        {/* Search */}
        <div className="relative max-w-xl mx-auto mb-6">
           <input 
              type="text" 
              placeholder="ابحث باسم الخياط أو التخصص..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-std pl-12"
           />
           <Search size={18} className="absolute top-1/2 -translate-y-1/2 left-4 text-slate-400" />
        </div>

        {/* Region Filter */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 flex-1">
            {REGIONS.map(region => (
              <button
                key={region.id}
                onClick={() => setActiveRegion(region.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeRegion === region.id 
                  ? 'bg-amber-500 text-white shadow-md' 
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {region.name}
              </button>
            ))}
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mr-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              aria-label="عرض شبكي"
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              aria-label="عرض قائمة"
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'grid grid-cols-1 gap-4'}>
        {filteredTailors.map(tailor => (
           <div 
             key={tailor.id}
             onClick={() => navigate(`/tailor/${tailor.id}`)}
             className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all cursor-pointer flex gap-4"
           >
              {tailor.image ? (
                <img 
                  src={tailor.image} 
                  alt={tailor.name} 
                  className="w-20 h-20 rounded-xl object-cover border border-slate-100 dark:border-slate-700"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                  <span className="text-2xl font-bold text-slate-400 dark:text-slate-500">
                    {tailor.name.charAt(0)}
                  </span>
                </div>
              )}
              <div className="flex-1">
                 <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-white">{tailor.name}</h3>
                      {tailor.tailorGender && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          tailor.tailorGender === 'male' 
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' 
                            : 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400'
                        }`}>
                          {tailor.tailorGender === 'male' ? '👔' : '👗'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-bold bg-amber-50 dark:bg-amber-900/10 px-1.5 py-0.5 rounded">
                       <Star size={10} fill="currentColor" /> {tailor.rating}
                    </div>
                 </div>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{getSpecializationLabel(tailor.specialization)}</p>
                 
                 <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                       <MapPin size={12} /> {tailor.location}
                    </div>
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                       <CheckCircle2 size={12} /> {tailor.experience} خبرة
                    </div>
                 </div>
              </div>
           </div>
        ))}
        {filteredTailors.length === 0 && (
           <div className="col-span-full text-center py-12 text-slate-400">
             لا يوجد خياطين مطابقين للبحث
           </div>
        )}
      </div>
    </div>
  );
};
