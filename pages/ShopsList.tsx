import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Star, Verified, Store, Scissors, Shirt, Package, ShoppingBag, Filter, X } from 'lucide-react';
import { Shop, ShopType } from '../types';

const MOCK_SHOPS: Shop[] = [
  {
    id: '1',
    name: 'خياط الأصالة',
    shopType: 'tailor',
    rating: 4.8,
    location: 'مسقط - الخوير',
    image: 'https://picsum.photos/400/300?random=1',
    coverImage: 'https://picsum.photos/800/400?random=1',
    description: 'متخصص في الخياطة الرجالية والعمانية التقليدية',
    followers: 1234,
    isVerified: true,
    region: 'Muscat',
    approvalStatus: 'approved',
    specialization: 'رجالي وعماني تقليدي',
    experience: '15 سنة',
    contactNumber: '+968 9123 4567',
    workingHours: '8 ص - 10 م',
    services: ['خياطة دشداشة', 'كمة عمانية', 'بدلة رسمية'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'بوتيك الأناقة',
    shopType: 'boutique',
    rating: 4.9,
    location: 'مسقط - القرم',
    image: 'https://picsum.photos/400/300?random=2',
    coverImage: 'https://picsum.photos/800/400?random=2',
    description: 'أزياء جاهزة راقية للرجال والنساء',
    followers: 2456,
    isVerified: true,
    region: 'Muscat',
    approvalStatus: 'approved',
    hasOnlineStore: true,
    deliveryAvailable: true,
    contactNumber: '+968 9234 5678',
    workingHours: '9 ص - 11 م',
    services: ['أزياء جاهزة', 'إكسسوارات', 'تفصيل خاص'],
    brands: ['Gucci', 'Armani', 'Local Brands'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'محل الأقمشة الفاخرة',
    shopType: 'fabric_store',
    rating: 4.7,
    location: 'مسقط - السيب',
    image: 'https://picsum.photos/400/300?random=3',
    coverImage: 'https://picsum.photos/800/400?random=3',
    description: 'أجود أنواع الأقمشة المحلية والمستوردة',
    followers: 987,
    isVerified: true,
    region: 'Muscat',
    approvalStatus: 'approved',
    hasOnlineStore: true,
    deliveryAvailable: true,
    contactNumber: '+968 9345 6789',
    workingHours: '8 ص - 9 م',
    services: ['أقمشة قطنية', 'حرير', 'صوف', 'أقمشة تقليدية'],
    brands: ['أقمشة تركية', 'أقمشة هندية', 'أقمشة صينية'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'مستلزمات الخياطة الشاملة',
    shopType: 'sewing_supplies',
    rating: 4.6,
    location: 'مسقط - روي',
    image: 'https://picsum.photos/400/300?random=4',
    coverImage: 'https://picsum.photos/800/400?random=4',
    description: 'كل ما يحتاجه الخياط من أدوات ومستلزمات',
    followers: 543,
    isVerified: false,
    region: 'Muscat',
    approvalStatus: 'approved',
    hasOnlineStore: false,
    deliveryAvailable: false,
    contactNumber: '+968 9456 7890',
    workingHours: '8 ص - 8 م',
    services: ['ماكينات خياطة', 'خيوط', 'أزرار', 'سحابات', 'مقصات'],
    brands: ['Singer', 'Brother', 'Janome'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const ShopsList = () => {
  const navigate = useNavigate();
  const [shops, setShops] = useState<Shop[]>(MOCK_SHOPS);
  const [filteredShops, setFilteredShops] = useState<Shop[]>(MOCK_SHOPS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ShopType | 'all'>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    filterShops();
  }, [searchQuery, selectedType, selectedRegion]);

  const filterShops = () => {
    let filtered = shops;

    // فلترة حسب البحث
    if (searchQuery) {
      filtered = filtered.filter(shop => 
        shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // فلترة حسب النوع
    if (selectedType !== 'all') {
      filtered = filtered.filter(shop => shop.shopType === selectedType);
    }

    // فلترة حسب المنطقة
    if (selectedRegion !== 'all') {
      filtered = filtered.filter(shop => shop.region === selectedRegion);
    }

    setFilteredShops(filtered);
  };

  const getShopTypeInfo = (type: ShopType) => {
    const types = {
      tailor: { label: 'خياط', icon: Scissors, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
      boutique: { label: 'بوتيك', icon: Shirt, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
      fabric_store: { label: 'محل أقمشة', icon: Package, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
      sewing_supplies: { label: 'مستلزمات خياطة', icon: ShoppingBag, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' }
    };
    return types[type];
  };

  return (
    <div className="pb-24 pt-4 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">جميع المحلات</h1>
          <p className="text-slate-600 dark:text-slate-400">اكتشف الخياطين، البوتيكات، ومحلات الأقمشة والمستلزمات</p>
        </div>

        {/* Search & Filter */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن محل، منطقة، أو خدمة..."
              className="w-full pr-12 pl-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Button */}
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showFilters || selectedType !== 'all' || selectedRegion !== 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Filter size={18} />
              <span className="font-medium">فلتر</span>
              {(selectedType !== 'all' || selectedRegion !== 'all') && (
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">نشط</span>
              )}
            </button>

            {/* Active Filters */}
            {selectedType !== 'all' && (
              <button
                onClick={() => setSelectedType('all')}
                className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm"
              >
                {getShopTypeInfo(selectedType).label}
                <X size={14} />
              </button>
            )}
            {selectedRegion !== 'all' && (
              <button
                onClick={() => setSelectedRegion('all')}
                className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm"
              >
                {selectedRegion}
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-4 animate-in slide-in-from-top-2">
              {/* Shop Type Filter */}
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">نوع المحل</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button
                    onClick={() => setSelectedType('all')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedType === 'all'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Store size={20} className="mx-auto mb-1" />
                    <p className="text-xs font-medium">الكل</p>
                  </button>
                  {(['tailor', 'boutique', 'fabric_store', 'sewing_supplies'] as ShopType[]).map(type => {
                    const info = getShopTypeInfo(type);
                    const Icon = info.icon;
                    return (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedType === type
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Icon size={20} className="mx-auto mb-1" />
                        <p className="text-xs font-medium">{info.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Region Filter */}
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">المنطقة</label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="all">جميع المناطق</option>
                  <option value="Muscat">مسقط</option>
                  <option value="Sohar">صحار</option>
                  <option value="Salalah">صلالة</option>
                  <option value="Nizwa">نزوى</option>
                  <option value="Sur">صور</option>
                  <option value="Other">أخرى</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            تم العثور على <span className="font-bold text-slate-900 dark:text-white">{filteredShops.length}</span> محل
          </p>
          <select className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
            <option>الأعلى تقييماً</option>
            <option>الأكثر متابعة</option>
            <option>الأقرب</option>
          </select>
        </div>

        {/* Shops Grid */}
        {filteredShops.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShops.map(shop => {
              const typeInfo = getShopTypeInfo(shop.shopType);
              const TypeIcon = typeInfo.icon;
              
              return (
                <div
                  key={shop.id}
                  onClick={() => navigate(`/shop/${shop.id}`)}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                >
                  {/* Cover Image */}
                  <div className="relative aspect-video bg-slate-100 dark:bg-slate-900">
                    <img 
                      src={shop.coverImage || shop.image} 
                      alt={shop.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className={`absolute top-3 right-3 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 ${typeInfo.color}`}>
                      <TypeIcon size={14} />
                      {typeInfo.label}
                    </div>
                    {shop.isVerified && (
                      <div className="absolute top-3 left-3 bg-blue-600 text-white p-1.5 rounded-full">
                        <Verified size={14} />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1 line-clamp-1">
                      {shop.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                      {shop.description}
                    </p>

                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-1">
                        <Star size={16} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{shop.rating}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                        <MapPin size={14} />
                        <span className="text-xs">{shop.location}</span>
                      </div>
                    </div>

                    {/* Services/Features */}
                    <div className="flex flex-wrap gap-1">
                      {shop.services?.slice(0, 2).map((service, idx) => (
                        <span key={idx} className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-1 rounded">
                          {service}
                        </span>
                      ))}
                      {(shop.services?.length || 0) > 2 && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 px-2 py-1">
                          +{(shop.services?.length || 0) - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-50 dark:bg-slate-900 rounded-2xl">
            <Store size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">لا توجد نتائج</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">جرب تعديل معايير البحث أو الفلاتر</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedType('all');
                setSelectedRegion('all');
              }}
              className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
            >
              إعادة تعيين الفلاتر
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
