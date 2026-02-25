import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, MapPin, Star, CheckCircle2, Search, Filter, Grid, List } from 'lucide-react';
import { Tailor, Region } from '../types';
import { getSpecializationLabel } from '../utils/specializationHelper';
import { StableImage } from '../components/StableImage';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

const REGIONS: { id: Region | 'All', name: string }[] = [
  { id: 'All', name: 'الكل' },
  { id: 'Muscat', name: 'مسقط' },
  { id: 'Sohar', name: 'صحار' },
  { id: 'Salalah', name: 'صلالة' },
  { id: 'Nizwa', name: 'نزوى' },
  { id: 'Sur', name: 'صور' },
];

// Helper to translate common region names if they come in English
const translateRegion = (name: string): string => {
  const map: Record<string, string> = {
    'Muscat': 'مسقط', 'Sohar': 'صحار', 'Salalah': 'صلالة', 'Nizwa': 'نزوى', 'Sur': 'صور',
    'Buraimi': 'البريمي', 'Rustaq': 'الرستاق', 'Ibri': 'عبري', 'Khasab': 'خصب'
  };
  return map[name] || name;
};

export const TailorList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const specializationFilter = searchParams.get('specialization');
  const regionFilter = searchParams.get('region');
  
  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [availableRegions, setAvailableRegions] = useState(REGIONS as { id: string, name: string }[]);
  const [activeRegion, setActiveRegion] = useState('All');
  const [search, setSearch] = useState('');
  const [displayCount, setDisplayCount] = useState(6);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const fetchTailors = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('approvalStatus', '==', 'approved'));
        const snapshot = await getDocs(q);
        
        const fetchedTailors = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Tailor))
          .filter(user => {
              const role = user.role;
              const type = (user as any).type || (user as any).shopType;
              const shopTypes = ['tailor', 'boutique', 'shop', 'fabric_store'];
              return shopTypes.includes(role) || shopTypes.includes(type);
          });
          
        setTailors(fetchedTailors);

        // Extract unique regions from fetched tailors
        const uniqueRegions = new Set<string>();
        fetchedTailors.forEach(t => {
          if (t.region) uniqueRegions.add(t.region);
        });
        
        // Create dynamic region list
        const dynamicRegions = Array.from(uniqueRegions).map(r => ({
          id: r,
          name: translateRegion(r)
        })).sort((a, b) => a.name.localeCompare(b.name, 'ar')); // Sort alphabetically in Arabic

        // Merge with defaults if you want to ensure main cities are always visible, 
        // OR replace entirely. For "from existing tailor shops", replacement is better,
        // but we'll prepend 'All'.
        setAvailableRegions([{ id: 'All', name: 'الكل' }, ...dynamicRegions]);

      } catch (error) {
        console.error('Error fetching tailors:', error);
      }
    };
    fetchTailors();
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
      // Logic adjusted to work with dynamic availableRegions if needed, 
      // but activeRegion state is simple string now.
      setActiveRegion(regionFilter); 
    }
  }, [regionFilter]);

  const filteredTailors = tailors.filter(t => {
    const matchesRegion = activeRegion === 'All' || t.region === activeRegion;
    const nameMatch = (t.name || '').toLowerCase().includes(search.toLowerCase());
    const specMatch = (t.specialization || '').toLowerCase().includes(search.toLowerCase());
    return matchesRegion && (nameMatch || specMatch);
  });
  
  const displayedTailors = filteredTailors.slice(0, displayCount);

  return (
    <div className="h-full flex flex-col bg-[#ededed] font-['Cairo'] text-[#1a1a1a] selection:bg-[var(--theme-primary)] selection:text-white">
      <div className="flex-1 overflow-y-auto pb-24 custom-scrollbar pt-4" dir="rtl">
      <div className="max-w-[1400px] mx-auto px-2 md:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
           <button 
             onClick={() => navigate(-1)}
             aria-label="الرجوع"
             title="الرجوع"
             className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-black transition-colors"
           >
             <ArrowRight size={20} />
           </button>
           <h1 className="text-xl md:text-2xl font-bold text-black">نخبة الخياطين</h1>
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
        
        {/* Search removed as requested */}

        {/* Region Filter */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 flex-1">
            {availableRegions.map(region => (
              <button
                key={region.id}
                onClick={() => setActiveRegion(region.id)}
                className={`px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${
                  activeRegion === region.id 
                  ? 'bg-black text-white shadow-sm' 
                  : 'bg-white text-zinc-500 border border-zinc-200 hover:border-zinc-400 hover:text-black'
                }`}
              >
                {region.name}
              </button>
            ))}
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-lg p-1 mr-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-zinc-500 hover:text-black'
              }`}
              aria-label="عرض شبكي"
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-zinc-500 hover:text-black'
              }`}
              aria-label="عرض قائمة"
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-3xl p-4 md:p-6 shadow-sm">
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'grid grid-cols-1 gap-4'}>
        {displayedTailors.map(tailor => (
           <div 
             key={tailor.id}
             onClick={(e) => {
               e.stopPropagation();
               console.log('Navigating to tailor:', tailor.id);
               navigate(`/tailor/${tailor.id}`);
             }}
             className="bg-white rounded-xl p-4 border border-zinc-200 hover:shadow-md transition-all cursor-pointer flex gap-4 relative z-10"
           >
              {(tailor.image || tailor.profileImage || tailor.avatar) ? (
                <div className="w-20 h-20 shrink-0">
                  <StableImage
                    src={tailor.image || tailor.profileImage || tailor.avatar || ''}
                    alt={tailor.name}
                    aspectClass="aspect-square"
                    className="w-full h-full rounded-xl border border-zinc-200 overflow-hidden"
                    imgClassName="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 shrink-0 rounded-xl bg-zinc-100 flex items-center justify-center border border-zinc-200">
                  <span className="text-2xl font-bold text-zinc-400 uppercase">
                    {(tailor.name || '?').charAt(0)}
                  </span>
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                 <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] font-bold text-black truncate">{tailor.name}</h3>
                      {tailor.tailorGender && (
                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                          tailor.tailorGender === 'male' 
                            ? 'bg-blue-500/10 text-blue-600' 
                            : 'bg-pink-500/10 text-pink-600'
                        }`}>
                          {tailor.tailorGender === 'male' ? '👔' : '👗'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-bold bg-amber-500/10 px-1.5 py-0.5 rounded shrink-0">
                       <Star size={10} fill="currentColor" /> {tailor.rating}
                    </div>
                 </div>
                 <p className="text-[13px] text-zinc-500 mb-2">{getSpecializationLabel(tailor.specialization)}</p>
                 
                 <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-500">
                    <div className="flex items-center gap-1">
                       <MapPin size={12} /> {tailor.location}
                    </div>
                    <div className="flex items-center gap-1 text-green-600">
                       <CheckCircle2 size={12} /> {tailor.experience} خبرة
                    </div>
                 </div>
              </div>
           </div>
        ))}
        {filteredTailors.length === 0 && (
            <div className="col-span-full text-center py-12 text-zinc-500">
             لا يوجد خياطين مطابقين للبحث
           </div>
        )}
      </div>

      {filteredTailors.length > displayedTailors.length && (
        <div className="flex justify-center mt-8">
          <button 
            onClick={() => setDisplayCount(prev => prev + 6)}
            className="bg-zinc-900 text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-200"
          >
            عرض المزيد من الخياطين
          </button>
        </div>
      )}

      </div>
      </div>
      </div>
    </div>
  );
};
