import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, Trash2, Plus, Minus, Heart, Tag, 
  ArrowRight, Package, Truck, CreditCard, MapPin, 
  AlertCircle, CheckCircle2, Gift, Percent
} from 'lucide-react';
import { Button } from '../components/Button';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  tailorName: string;
  size?: string;
  color?: string;
}

const MOCK_CART_ITEMS: CartItem[] = [
  {
    id: '1',
    name: 'دشداشة عمانية بيضاء',
    price: 45.0,
    quantity: 2,
    image: 'https://picsum.photos/200/250?random=1',
    tailorName: 'خياط الأصالة',
    size: 'L',
    color: 'أبيض'
  },
  {
    id: '2',
    name: 'عباية سوداء فاخرة',
    price: 85.0,
    quantity: 1,
    image: 'https://picsum.photos/200/250?random=2',
    tailorName: 'دار الحرير',
    size: 'M',
    color: 'أسود'
  },
  {
    id: '3',
    name: 'جاكيت رسمي',
    price: 120.0,
    quantity: 1,
    image: 'https://picsum.photos/200/250?random=3',
    tailorName: 'المقص الذهبي',
    size: 'XL',
    color: 'رمادي'
  }
];

export const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>(MOCK_CART_ITEMS);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  const updateQuantity = (id: string, change: number) => {
    setCartItems(items =>
      items.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item
      )
    );
  };

  const removeItem = (id: string) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const applyPromoCode = () => {
    if (promoCode.toLowerCase() === 'khuyoot10') {
      setPromoApplied(true);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = promoApplied ? subtotal * 0.1 : 0;
  const shipping = subtotal > 100 ? 0 : 5;
  const total = subtotal - discount + shipping;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pb-24">
        <div className="text-center max-w-md">
          <div className="w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart size={64} className="text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
            سلتك فارغة
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            لم تضف أي منتجات بعد. ابدأ بإضافة منتجاتك المفضلة!
          </p>
          <Button onClick={() => navigate('/jackets')}>
            تصفح المنتجات
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 px-4 md:px-6 lg:px-8 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowRight size={20} />
            <span>العودة</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <ShoppingCart className="text-blue-600 dark:text-blue-400" size={32} />
                سلة التسوق
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                لديك {cartItems.length} {cartItems.length === 1 ? 'منتج' : 'منتجات'} في السلة
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
              >
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-24 h-28 md:w-32 md:h-36 object-cover rounded-lg"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">
                          {item.name}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {item.tailorName}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {/* Size & Color */}
                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 mb-3">
                      {item.size && <span>المقاس: {item.size}</span>}
                      {item.color && (
                        <>
                          <span>•</span>
                          <span>اللون: {item.color}</span>
                        </>
                      )}
                    </div>

                    {/* Quantity & Price */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-8 text-center font-medium text-slate-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <div className="text-left">
                        <div className="font-bold text-lg text-slate-900 dark:text-white">
                          {(item.price * item.quantity).toFixed(2)} ر.ع
                        </div>
                        {item.quantity > 1 && (
                          <div className="text-xs text-slate-500 dark:text-slate-500">
                            {item.price.toFixed(2)} ر.ع للقطعة
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Promo Code */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-amber-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="text-amber-600 dark:text-amber-400" size={20} />
                <h3 className="font-bold text-slate-900 dark:text-white">
                  كود الخصم
                </h3>
              </div>
              
              {promoApplied ? (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 size={18} />
                  <span className="text-sm font-medium">تم تطبيق الخصم 10%</span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="أدخل كود الخصم"
                    className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                  <button
                    onClick={applyPromoCode}
                    className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors"
                  >
                    تطبيق
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 sticky top-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                ملخص الطلب
              </h2>

              <div className="space-y-3 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>المجموع الفرعي</span>
                  <span className="font-medium">{subtotal.toFixed(2)} ر.ع</span>
                </div>
                
                {discount > 0 && (
                  <div className="flex items-center justify-between text-green-600 dark:text-green-400">
                    <span className="flex items-center gap-1">
                      <Percent size={14} />
                      الخصم
                    </span>
                    <span className="font-medium">-{discount.toFixed(2)} ر.ع</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Truck size={14} />
                    الشحن
                  </span>
                  <span className="font-medium">
                    {shipping === 0 ? 'مجاني' : `${shipping.toFixed(2)} ر.ع`}
                  </span>
                </div>

                {subtotal > 100 && (
                  <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                    <Gift size={14} />
                    <span>تهانينا! حصلت على شحن مجاني</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-lg font-bold text-slate-900 dark:text-white mb-6">
                <span>الإجمالي</span>
                <span className="text-2xl text-blue-600 dark:text-blue-400">
                  {total.toFixed(2)} ر.ع
                </span>
              </div>

              <Button
                onClick={() => navigate('/checkout')}
                className="w-full mb-4"
              >
                <CreditCard size={18} className="ml-2" />
                إتمام الطلب
              </Button>

              <button
                onClick={() => navigate('/jackets')}
                className="w-full py-3 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium"
              >
                متابعة التسوق
              </button>

              {/* Info */}
              <div className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-start gap-2">
                  <Package size={16} className="mt-0.5 flex-shrink-0" />
                  <span>توصيل سريع خلال 2-3 أيام عمل</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                  <span>ضمان استرجاع خلال 14 يوم</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>دفع آمن ومشفر 100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
