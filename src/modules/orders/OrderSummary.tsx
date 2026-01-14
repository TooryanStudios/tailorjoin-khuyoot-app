import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { firebaseService } from '../../services/firebase';

export const OrderSummary: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fabricSource, setFabricSource] = useState<'customer' | 'shop' | 'store' | 'collection'>('customer');
  const [selectedShop, setSelectedShop] = useState<string>('');
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [isSavingFabricSource, setIsSavingFabricSource] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (!orderId) {
          setError('No order ID provided');
          setIsLoading(false);
          return;
        }

        const orderData = await firebaseService.getOrder(orderId);
        
        if (orderData) {
          setOrder(orderData);
          // Load fabric source if already set
          if (orderData.fabricSource) {
            setFabricSource(orderData.fabricSource);
            setSelectedShop(orderData.selectedShop || '');
            setSelectedStore(orderData.selectedStore || '');
            setSelectedCollection(orderData.selectedCollection || '');
          }
        } else {
          setError('Order not found');
        }
      } catch (err) {
        console.error('Error loading order:', err);
        setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  const handleSaveFabricSource = async () => {
    if (!orderId) return;
    
    try {
      setIsSavingFabricSource(true);
      await firebaseService.updateOrder(orderId, {
        fabricSource,
        selectedShop: fabricSource === 'shop' ? selectedShop : null,
        selectedStore: fabricSource === 'store' ? selectedStore : null,
        selectedCollection: fabricSource === 'collection' ? selectedCollection : null,
      });
      
      // Update local state
      setOrder({
        ...order,
        fabricSource,
        selectedShop: fabricSource === 'shop' ? selectedShop : null,
        selectedStore: fabricSource === 'store' ? selectedStore : null,
        selectedCollection: fabricSource === 'collection' ? selectedCollection : null,
      });
    } catch (error) {
      console.error('Error saving fabric source:', error);
      alert('Failed to save fabric source');
    } finally {
      setIsSavingFabricSource(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white/70">جاري تحميل تفاصيل الطلب...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 rounded-2xl border border-red-500/30 p-8 text-center space-y-4">
          <div className="text-red-500 text-5xl">⚠️</div>
          <h2 className="text-xl font-bold text-white">الطلب غير موجود</h2>
          <p className="text-white/60">{error || 'تعذر تحميل تفاصيل الطلب'}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors group"
        >
          <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-sm font-semibold">رجوع</span>
        </button>

        {/* Success Header */}
        <div className="bg-gradient-to-r from-purple-600/20 to-purple-500/20 border border-purple-500/30 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">✨</div>
          <h1 className="text-3xl font-bold text-white mb-2">تم إنشاء الطلب بنجاح!</h1>
          <p className="text-white/70 text-lg">تم تقديم طلب الخياطة المخصص الخاص بك</p>
          <div className="mt-4 inline-flex items-center gap-2 bg-zinc-900/50 px-4 py-2 rounded-lg border border-white/10">
            <span className="text-white/50 text-sm">رقم الطلب:</span>
            <span className="text-purple-400 font-mono font-semibold">{orderId}</span>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden">
          <div className="bg-zinc-950 px-6 py-4 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">تفاصيل الطلب</h2>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Product Info */}
            <div className="flex gap-4">
              {order.productImage && (
                <div className="w-24 h-32 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                  <img
                    src={order.productImage}
                    alt={order.productName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <h3 className="text-lg font-semibold text-white">{order.productName}</h3>
                <p className="text-white/60 text-sm">{order.categoryName}</p>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                    order.status === 'processing' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    order.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    'bg-zinc-700 text-white/70'
                  }`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Measurements */}
            <div className="border-t border-white/10 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">القياسات</h3>
                <button
                  onClick={() => navigate(`/measurements/${order.productId}`)}
                  className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg text-sm font-semibold transition-colors border border-purple-500/30"
                >
                  تعديل القياسات
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {order.measurements && Object.entries(order.measurements).map(([key, value]: [string, any]) => (
                  <div key={key} className="bg-zinc-800 rounded-lg p-3 border border-white/5">
                    <p className="text-white/50 text-xs mb-1">{key}</p>
                    <p className="text-white font-semibold">{value} CM</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Fabric Source Selection */}
            <div className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">مصدر القماش</h3>
              
              {/* Fabric Source Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => setFabricSource('customer')}
                  className={`p-4 rounded-lg border transition-all text-left ${
                    fabricSource === 'customer'
                      ? 'bg-purple-600/20 border-purple-500/50 ring-2 ring-purple-500/30'
                      : 'bg-zinc-800 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      fabricSource === 'customer' ? 'border-purple-500 bg-purple-500' : 'border-white/30'
                    }`}>
                      {fabricSource === 'customer' && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">سأوفر القماش</p>
                      <p className="text-white/50 text-xs">أحضر قماشك الخاص</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setFabricSource('shop')}
                  className={`p-4 rounded-lg border transition-all text-left ${
                    fabricSource === 'shop'
                      ? 'bg-purple-600/20 border-purple-500/50 ring-2 ring-purple-500/30'
                      : 'bg-zinc-800 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      fabricSource === 'shop' ? 'border-purple-500 bg-purple-500' : 'border-white/30'
                    }`}>
                      {fabricSource === 'shop' && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">من محل</p>
                      <p className="text-white/50 text-xs">اختر من محل الأقمشة</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setFabricSource('store')}
                  className={`p-4 rounded-lg border transition-all text-left ${
                    fabricSource === 'store'
                      ? 'bg-purple-600/20 border-purple-500/50 ring-2 ring-purple-500/30'
                      : 'bg-zinc-800 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      fabricSource === 'store' ? 'border-purple-500 bg-purple-500' : 'border-white/30'
                    }`}>
                      {fabricSource === 'store' && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">من متجر</p>
                      <p className="text-white/50 text-xs">اختر من متجر الأقمشة</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setFabricSource('collection')}
                  className={`p-4 rounded-lg border transition-all text-left ${
                    fabricSource === 'collection'
                      ? 'bg-purple-600/20 border-purple-500/50 ring-2 ring-purple-500/30'
                      : 'bg-zinc-800 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      fabricSource === 'collection' ? 'border-purple-500 bg-purple-500' : 'border-white/30'
                    }`}>
                      {fabricSource === 'collection' && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">مجموعة محفوظة</p>
                      <p className="text-white/50 text-xs">استخدم من الأقمشة المحفوظة</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Conditional Selection Fields */}
              {fabricSource === 'shop' && (
                <div className="space-y-2 mb-4">
                  <label className="text-sm font-semibold text-white/70">اختر المحل</label>
                  <select
                    value={selectedShop}
                    onChange={(e) => setSelectedShop(e.target.value)}
                    className="w-full bg-zinc-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">اختر محل...</option>
                    <option value="shop1">محل 1</option>
                    <option value="shop2">محل 2</option>
                    <option value="shop3">محل 3</option>
                  </select>
                </div>
              )}

              {fabricSource === 'store' && (
                <div className="space-y-2 mb-4">
                  <label className="text-sm font-semibold text-white/70">اختر المتجر</label>
                  <select
                    value={selectedStore}
                    onChange={(e) => setSelectedStore(e.target.value)}
                    className="w-full bg-zinc-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">اختر متجر...</option>
                    <option value="store1">متجر 1</option>
                    <option value="store2">متجر 2</option>
                    <option value="store3">متجر 3</option>
                  </select>
                </div>
              )}

              {fabricSource === 'collection' && (
                <div className="space-y-2 mb-4">
                  <label className="text-sm font-semibold text-white/70">اختر المجموعة</label>
                  <select
                    value={selectedCollection}
                    onChange={(e) => setSelectedCollection(e.target.value)}
                    className="w-full bg-zinc-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">اختر مجموعة...</option>
                    <option value="collection1">مجموعة 1</option>
                    <option value="collection2">مجموعة 2</option>
                    <option value="collection3">مجموعة 3</option>
                  </select>
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={handleSaveFabricSource}
                disabled={isSavingFabricSource}
                className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white rounded-lg font-semibold transition-colors"
              >
                {isSavingFabricSource ? 'جاري الحفظ...' : 'حفظ مصدر القماش'}
              </button>
            </div>

            {/* Order Info */}
            <div className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">معلومات الطلب</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/50">تاريخ الإنشاء:</span>
                  <span className="text-white">{new Date(order.createdAt).toLocaleString('ar-SA')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">رقم المنتج:</span>
                  <span className="text-white font-mono text-xs">{order.productId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">رقم الفئة:</span>
                  <span className="text-white font-mono text-xs">{order.categoryId}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-semibold transition-colors border border-white/10"
          >
            العودة للرئيسية
          </button>
          <button
            onClick={() => navigate('/orders')}
            className="px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors"
          >
            عرض جميع الطلبات
          </button>
        </div>

        {/* Next Steps */}
        <div className="bg-zinc-900 rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">ماذا سيحدث بعد ذلك؟</h3>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 text-purple-400 font-bold">1</div>
              <div>
                <p className="text-white font-medium">مراجعة الطلب</p>
                <p className="text-white/60 text-sm">سيتم مراجعة طلبك من قبل فريقنا</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 text-purple-400 font-bold">2</div>
              <div>
                <p className="text-white font-medium">تعيين الخياط</p>
                <p className="text-white/60 text-sm">سنقوم بتعيين خياط خبير لطلبك</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 text-purple-400 font-bold">3</div>
              <div>
                <p className="text-white font-medium">الإنتاج</p>
                <p className="text-white/60 text-sm">سيتم تصنيع ثوبك المخصص بعناية</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 text-purple-400 font-bold">4</div>
              <div>
                <p className="text-white font-medium">التسليم</p>
                <p className="text-white/60 text-sm">سنخطرك عندما يكون طلبك جاهزاً</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
