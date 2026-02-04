import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Share2, ArrowLeft, Bookmark, ArrowRight, MoreVertical, Star, MapPin, ShoppingBag, MessageCircle, Layers, Clock, Shirt, Ruler } from 'lucide-react';
import { Product, Tailor } from '../../../types';
import { StableImage } from '../../../components/StableImage';

interface MobileProductDetailsProps {
    product: Product;
    tailor: Tailor | null;
    productImages: string[];
    currentImageIndex: number;
    setCurrentImageIndex: (index: number) => void;
    isLiked: boolean;
    onLikeToggle: () => void;
    onBack: () => void;
    onStartTailoring: () => void;
    onAddToCart: () => void;
    template?: any;
}

export const MobileProductDetails: React.FC<MobileProductDetailsProps> = ({
    product,
    tailor,
    productImages,
    currentImageIndex,
    setCurrentImageIndex,
    isLiked,
    onLikeToggle,
    onBack,
    onStartTailoring,
    onAddToCart,
    template
}) => {
    const navigate = useNavigate();

    const formatOmr = (price: number | string | undefined): string => {
        if (!price) return '0.000';
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        return numPrice.toFixed(3);
    };

    // Touch handling for swipe
    const [touchStart, setTouchStart] = React.useState(0);
    const [touchEnd, setTouchEnd] = React.useState(0);

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe && currentImageIndex < productImages.length - 1) {
            setCurrentImageIndex(currentImageIndex + 1);
        }
        if (isRightSwipe && currentImageIndex > 0) {
            setCurrentImageIndex(currentImageIndex - 1);
        }

        setTouchStart(0);
        setTouchEnd(0);
    };

    return (
        <>
            <div className="min-h-screen bg-white dark:bg-[#0B0A13] pb-20 relative scrollbar-hide flex flex-col">
                {/* Hero Image Section - Fixed Background */}
                <div className="fixed inset-0 h-[60vh] z-0">
                    {/* Main Hero Image */}
                    {productImages.length > 0 ? (
                    <div className="absolute inset-0">
                        <StableImage 
                            src={productImages[currentImageIndex]} 
                            alt={product.name}
                            aspectClass="w-full h-full" 
                            className="w-full h-full" 
                            imgClassName="w-full h-full object-cover"
                        />
                    </div>
                ) : (
                    <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                        <ShoppingBag size={48} className="text-slate-400" />
                    </div>
                )}
                
                {/* Tempered Glass Overlay (On Top) */}
                <div className="absolute inset-0 bg-white/30 dark:bg-black/30 backdrop-blur-xl pointer-events-none" />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/95 via-white/70 via-white/40 via-white/20 to-transparent dark:from-[#0B0A13] dark:via-[#0B0A13]/95 dark:via-[#0B0A13]/70 dark:via-[#0B0A13]/40 dark:via-[#0B0A13]/20 dark:to-transparent pointer-events-none" />
                </div>

                {/* Main Content Scrollable Area */}
                <div className="relative z-10 w-full px-10 pt-10">
                    {/* Product Images Widget Card */}
                    <div 
                        className="relative w-full aspect-[9/16] rounded-[26px] overflow-hidden shadow-none border-none ring-0 outline-none mb-2"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        {/* Main Product Image Slider */}
                        {productImages.length > 0 ? (
                            <div 
                                className="flex w-full h-full transition-transform duration-300 ease-out"
                                style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
                            >
                                {productImages.map((img, index) => (
                                    <div key={index} className="w-full h-full flex-shrink-0">
                                        <StableImage 
                                            src={img} 
                                            alt={`${product.name} - ${index + 1}`}
                                            aspectClass="w-full h-full" 
                                            className="w-full h-full" 
                                            imgClassName="w-full h-full object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                                <ShoppingBag size={48} className="text-slate-400" />
                            </div>
                        )}

                        {/* Top Card Icons */}
                        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
                            <button 
                                onClick={onBack}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white transition-transform active:scale-95 border border-white/10"
                            >
                                <ArrowLeft size={16} />
                            </button>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={onLikeToggle}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white transition-transform active:scale-95 border border-white/10"
                                >
                                    <Bookmark size={16} className={isLiked ? 'fill-white' : ''} />
                                </button>
                                <button className="w-8 h-8 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white transition-transform active:scale-95 border border-white/10">
                                    <Share2 size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Image Indicators - Bottom of Card */}
                        {productImages.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10" dir="ltr">
                                {productImages.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentImageIndex(index)}
                                        className={`h-1.5 rounded-full transition-all ${
                                            index === currentImageIndex 
                                                ? 'w-8 bg-white' 
                                                : 'w-1.5 bg-white/40'
                                        }`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Content Section - now flows naturally */}
                    <div className="w-full flex flex-col items-center gap-2">
                        
                        {/* Primary Info Card - "The Big Rownt" */}
                        <div className="w-full bg-[#1A1A1A] dark:bg-white/5 rounded-2xl p-4 text-right" dir="rtl">
                            <div className="flex justify-between items-start">
                                {/* Right Side: Product Details */}
                                <div className="flex flex-col items-start gap-2">
                                    <h1 className="text-2xl font-bold text-white leading-tight max-w-[180px]">
                                        {product.name}
                                    </h1>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl font-medium text-purple-400">
                                            {formatOmr(product.price)} ر.ع
                                        </span>
                                        {product.originalPrice && (
                                            <span className="text-xs text-white/40 line-through">
                                                {formatOmr(product.originalPrice)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Left Side: Shop Details */}
                                {tailor && (
                                    <div 
                                        onClick={() => navigate(`/tailor/${tailor.id}`)}
                                        className="flex flex-col items-end gap-1 cursor-pointer pl-1"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-white text-sm">{tailor.name}</span>
                                            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-white/5">
                                                {tailor.image ? (
                                                    <StableImage 
                                                        src={tailor.image} 
                                                        alt={tailor.name}
                                                        aspectClass="h-full w-full" 
                                                        className="h-full w-full" 
                                                        imgClassName="object-cover w-full h-full" 
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full w-full">
                                                        <span className="text-xs text-white">?</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {tailor.location && (
                                            <div className="flex items-center gap-1 text-white/50 text-xs">
                                                <MapPin size={12} />
                                                {tailor.location}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1 text-white/50 text-xs mt-0.5">
                                            <Clock size={12} />
                                            <span>3-5 أيام</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions Block */}
                        <style>{`
                            @keyframes shimmer {
                                0% { transform: skewX(-12deg) translateX(-150%); }
                                40% { transform: skewX(-12deg) translateX(150%); }
                                100% { transform: skewX(-12deg) translateX(150%); }
                            }
                        `}</style>
                        <div className="w-full bg-[#1A1A1A] dark:bg-white/5 rounded-2xl p-2" dir="rtl">
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => navigate(`/designer-v2-1/${product.id}`, { state: { product } })}
                                    className="flex-1 relative overflow-hidden bg-white text-slate-900 h-12 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform text-sm"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-400/20 to-transparent" style={{ animation: 'shimmer 3s infinite' }} />
                                    <div className="relative z-10 flex items-center gap-2">
                                        <Shirt size={18} />
                                        تجربة القماش
                                    </div>
                                </button>
                                <button 
                                    onClick={() => navigate(`/measurements/${product.id}`, { state: { product } })}
                                    className="flex-1 bg-zinc-800 text-white h-12 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform text-sm"
                                >
                                    <Ruler size={18} />
                                    أخذ القياسات
                                </button>
                            </div>
                        </div>

                        {/* Stats Bar */}
                        <div className="w-full bg-[#1A1A1A] dark:bg-white/5 rounded-2xl p-4 flex items-center justify-between text-white/90">
                            <div className="flex flex-col items-center gap-1 flex-1 border-l border-white/10 first:border-0">
                                <span className="text-xs text-white/50">الفئة</span>
                                <span className="font-medium text-sm">{product.category || '-'}</span>
                            </div>
                            <div className="flex flex-col items-center gap-1 flex-1 border-l border-white/10">
                                <span className="text-xs text-white/50">التقييم</span>
                                <div className="flex items-center gap-1">
                                    <Star size={12} className="fill-amber-400 text-amber-400" />
                                    <span className="font-medium text-sm">{product.rating || '0.0'}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-1 flex-1 border-l border-white/10">
                                <span className="text-xs text-white/50">{product.fabric ? 'القماش' : 'اللون'}</span>
                                <span className="font-medium text-sm truncate max-w-[80px]">
                                    {product.fabric || product.color || '-'}
                                </span>
                            </div>
                        </div>
                        
                        {/* Measurement Template Preview */}
                        {template && template.points?.length > 0 && (
                            <div className="w-full bg-[#1A1A1A] dark:bg-white/5 rounded-2xl p-4 mt-2" dir="rtl">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-white text-base">توجيهات القياس</h3>
                                    <div className="flex items-center gap-2">
                                        <Ruler size={14} className="text-purple-400" />
                                        <span className="text-[10px] font-bold text-purple-400 bg-purple-400/10 px-2 py-1 rounded-full">{template.name}</span>
                                    </div>
                                </div>
                                
                                <div className="relative w-full aspect-[3/4] bg-white dark:bg-black rounded-2xl border border-white/5 shadow-inner overflow-hidden mb-4">
                                    {template.baseImageUrl ? (
                                        <img 
                                            src={template.baseImageUrl} 
                                            alt={template.name}
                                            className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-90"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-5">
                                            <img src="/logo_big.png?v=4" alt="" className="w-24 h-auto grayscale" />
                                        </div>
                                    )}
                                    
                                    {/* Point Overlays */}
                                    {template.points.map((point: any, idx: number) => {
                                        const order = point.order || idx + 1;
                                        return (
                                            <div 
                                                key={point.id}
                                                className="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold shadow-[0_0_8px_rgba(147,51,234,0.4)] ring-1 ring-white/50 z-10"
                                                style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
                                            >
                                                {order}
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    {template.points.slice(0, 6).map((point: any, idx: number) => (
                                        <div key={point.id} className="flex items-center gap-2 text-[10px] text-white/60 bg-white/5 p-2 rounded-lg border border-transparent">
                                            <span className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-[8px] shrink-0">
                                                {point.order || idx + 1}
                                            </span>
                                            <span className="truncate">{point.label || point.name}</span>
                                        </div>
                                    ))}
                                    {template.points.length > 6 && (
                                        <div className="col-span-2 text-center text-[10px] text-white/40 pt-1">
                                            + {template.points.length - 6} قياسات أخرى
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        {product.description && (
                            <div className="w-full mt-2 text-right px-2">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-lg">الوصف</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                    {product.description}
                                </p>
                            </div>
                        )}

                        {/* Inline Bottom Actions - Removed */}
                    </div>
                </div>
            </div>
        </>
    );
};
