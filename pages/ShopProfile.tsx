import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Star, MapPin, Phone, Clock, Verified, Heart, Share2, ShoppingBag, Package, Truck, MessageCircle, Users, Store, Grid3x3, LayoutGrid, List } from 'lucide-react';
import { Shop, Product } from '../types';
import { Button } from '../components/Button';
import { ProductCard } from '../components/ProductCard';
import { firebaseService } from '../services/firebase';

type ViewMode = 'grid' | 'compact' | 'list';

export const ShopProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shop, setShop] = useState<Shop | null>(null);
  const [activeTab, setActiveTab] = useState<'about' | 'products' | 'reviews'>('about');
  const [isFollowing, setIsFollowing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (id) {
      loadShop(id);
      loadProducts(id);
    }
  }, [id]);

  const loadShop = async (shopId: string) => {
    try {
      const user = await firebaseService.getUserProfile(shopId);
      if (user) {
        // Convert User to Shop
        const shopData: Shop = {
          id: user.id,
          name: user.name,
          type: (user.shopType as any) || 'tailor',
          rating: user.rating || 0,
          location: user.location || user.region || '',
          image: user.profileImage || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop',
          coverImage: (user as any).coverImage || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop',
          description: user.bio || '',
          followers: (user as any).followers || 0,
          isVerified: user.approvalStatus === 'approved',
          region: user.region as any,
          approvalStatus: user.approvalStatus,
          specialization: user.specialization,
          experience: user.experience,
          contactNumber: user.phone,
          workingHours: (user as any).workingHours || '9:00 ص - 10:00 م',
          bio: user.bio,
          reviews: (user as any).reviews || []
        };
        setShop(shopData);
      }
    } catch (error) {
      console.error('Error loading shop:', error);
    }
  };

  const loadProducts = async (shopId: string) => {
    try {
      const shopProducts = await firebaseService.getProductsByTailorId(shopId);
      setProducts(shopProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const getShopTypeLabel = (type: string) => {
    const labels = {
      tailor: 'خياط',
      boutique: 'بوتيك',
      fabric_store: 'محل أقمشة',
      sewing_supplies: 'مستلزمات خياطة'
    };
    return labels[type];
  };

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Cover Image */}
      <div className="relative h-64 bg-slate-100 dark:bg-slate-900">
        <img 
          src={shop.coverImage} 
          alt={shop.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 right-4 w-10 h-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:bg-white dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowRight size={20} />
        </button>

        {/* Shop Type Badge */}
        <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur px-3 py-1.5 rounded-full text-sm font-bold">
          {getShopTypeLabel(shop.shopType)}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6">
        {/* Shop Header */}
        <div className="relative -mt-16 mb-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
            {/* Shop Image */}
            <div className="relative">
              <div className="w-32 h-32 rounded-2xl border-4 border-white dark:border-slate-900 shadow-xl overflow-hidden bg-white dark:bg-slate-800">
                <img 
                  src={shop.image} 
                  alt={shop.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {shop.isVerified && (
                <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full shadow-lg">
                  <Verified size={20} />
                </div>
              )}
            </div>

            {/* Shop Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{shop.name}</h1>
              <p className="text-slate-600 dark:text-slate-400 mb-3">{shop.description}</p>
              
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Star size={18} className="text-yellow-500 fill-yellow-500" />
                  <span className="font-bold text-slate-900 dark:text-white">{shop.rating}</span>
                  <span className="text-slate-500">({shop.reviews?.length || 0} تقييم)</span>
                </div>
                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                  <MapPin size={16} />
                  <span>{shop.location}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                  <Users size={16} />
                  <span>{shop.followers} متابع</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                onClick={() => setIsFollowing(!isFollowing)}
                variant={isFollowing ? 'outline' : 'primary'}
                className={isFollowing ? 'bg-white dark:bg-slate-800' : ''}
              >
                <Heart size={18} className={isFollowing ? 'fill-current' : ''} />
                {isFollowing ? 'متابع' : 'متابعة'}
              </Button>
              <button className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <Share2 size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <Phone size={20} className="text-blue-600 dark:text-blue-400 mb-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">الهاتف</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{shop.contactNumber}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <Clock size={20} className="text-green-600 dark:text-green-400 mb-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">ساعات العمل</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {typeof shop.workingHours === 'string' ? shop.workingHours : '9:00 ص - 10:00 م'}
            </p>
          </div>
          {shop.hasOnlineStore && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <ShoppingBag size={20} className="text-purple-600 dark:text-purple-400 mb-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">المتجر</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">متاح أونلاين</p>
            </div>
          )}
          {shop.deliveryAvailable && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <Truck size={20} className="text-orange-600 dark:text-orange-400 mb-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">التوصيل</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">متوفر</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
          <div className="flex gap-8">
            {['about', 'products', 'reviews'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`pb-4 font-bold text-sm transition-colors relative ${
                  activeTab === tab
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab === 'about' ? 'عن المحل' : tab === 'products' ? 'المنتجات' : 'التقييمات'}
                {activeTab === tab && (
                  <div className="absolute bottom-0 right-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'about' && (
          <div className="space-y-6">
            {/* Bio */}
            {shop.bio && (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-3">نبذة</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{shop.bio}</p>
              </div>
            )}

            {/* Services */}
            {shop.services && shop.services.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">الخدمات</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {shop.services.map((service, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      <Package size={16} className="text-blue-600 dark:text-blue-400" />
                      <span className="text-sm text-slate-900 dark:text-white">{service}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Brands (for shops) */}
            {shop.brands && shop.brands.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">العلامات التجارية</h3>
                <div className="flex flex-wrap gap-2">
                  {shop.brands.map((brand, idx) => (
                    <span key={idx} className="px-4 py-2 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white rounded-full text-sm font-medium">
                      {brand}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio */}
            {shop.portfolio && shop.portfolio.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">معرض الأعمال</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {shop.portfolio.map((img, idx) => (
                    <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900">
                      <img src={img} alt={`عمل ${idx + 1}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-4">
            {/* View Mode Toggle */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                المنتجات ({products.length})
              </h3>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                  title="عرض شبكي"
                >
                  <Grid3x3 size={16} />
                </button>
                <button
                  onClick={() => setViewMode('compact')}
                  className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
                    viewMode === 'compact'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                  title="عرض مضغوط"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                  title="عرض قائمة"
                >
                  <List size={16} />
                </button>
              </div>
            </div>

            {/* Products Display */}
            {products.length > 0 ? (
              <>
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} viewMode="grid" />
                    ))}
                  </div>
                )}

                {viewMode === 'compact' && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} viewMode="compact" />
                    ))}
                  </div>
                )}

                {viewMode === 'list' && (
                  <div className="space-y-4">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} viewMode="list" />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                <ShoppingBag size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">لا توجد منتجات</h3>
                <p className="text-slate-600 dark:text-slate-400">لم يتم إضافة منتجات بعد</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {shop.reviews && shop.reviews.length > 0 ? (
              shop.reviews.map(review => (
                <div key={review.id} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{review.userName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{review.date}</p>
                    </div>
                    <div className="flex gap-1">
                      {Array(5).fill(null).map((_, i) => (
                        <Star 
                          key={i} 
                          size={14} 
                          className={i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-slate-300 dark:text-slate-700'}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">{review.comment}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-16 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                <Star size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">لا توجد تقييمات بعد</h3>
                <p className="text-slate-600 dark:text-slate-400">كن أول من يقيّم هذا المحل</p>
              </div>
            )}
          </div>
        )}

        {/* Contact Button */}
        <div className="fixed bottom-20 left-0 right-0 px-4 md:px-6">
          <div className="max-w-5xl mx-auto">
            <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all">
              <MessageCircle size={20} />
              تواصل مع المحل
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
