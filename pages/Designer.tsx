import React, { useState } from 'react';
import { Sparkles, PenTool, Upload, Wand2, Scissors, Check, Share2, ZoomIn, Palette, Shirt, Layers, User, ImageIcon } from 'lucide-react';
import { Button } from '../components/Button';
import { ImageLibraryPicker } from '../components/ImageLibraryPicker';

type DesignMode = 'template' | 'sketch';

export const Designer = () => {
  const [activeMode, setActiveMode] = useState<DesignMode>('template');
  const [selectedTemplate, setSelectedTemplate] = useState('dishdasha');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [showTechPack, setShowTechPack] = useState(false);
  const [showImageLibrary, setShowImageLibrary] = useState(false);

  const TEMPLATES = [
    { id: 'dishdasha', name: 'دشداشة', icon: Shirt },
    { id: 'abaya', name: 'عباية', icon: Layers },
    { id: 'dress', name: 'فستان', icon: Sparkles },
    { id: 'suit', name: 'بدلة', icon: User },
  ];

  const handleGenerate = () => {
    if (!prompt && activeMode === 'sketch') return;
    setIsGenerating(true);
    // Simulate AI Generation
    setTimeout(() => {
      setGeneratedImage(
        activeMode === 'template' 
        ? 'https://picsum.photos/500/700?random=template' 
        : 'https://picsum.photos/500/700?random=sketch'
      );
      setIsGenerating(false);
    }, 2500);
  };

  return (
    <div className="pb-24 pt-4 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-500 dark:from-blue-400 dark:to-purple-400">
              استوديو المصمم الذكي
            </h1>
            <Sparkles className="text-purple-500" size={24} />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            حوّل خيالك إلى حقيقة تقنية بمساعدة الذكاء الاصطناعي
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="bg-white dark:bg-slate-800 p-1.5 rounded-xl flex mb-8 shadow-sm border border-slate-200 dark:border-white/5">
          <button
            onClick={() => setActiveMode('template')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeMode === 'template' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-400'
            }`}
          >
            <Palette size={16} />
            قوالب ذكية
          </button>
          <button
            onClick={() => setActiveMode('sketch')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeMode === 'sketch' 
                ? 'bg-purple-600 text-white shadow-md' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-400'
            }`}
          >
            <PenTool size={16} />
            رسم AI
          </button>
        </div>

        {/* Main Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left: Input / Controls */}
          <div className="space-y-6">
            
            {/* Template Selection */}
            {activeMode === 'template' && (
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-800 dark:text-white mb-3">اختر الهيكل الأساسي</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                      className={`flex flex-col items-center justify-center min-w-[80px] p-3 rounded-xl border transition-all ${
                        selectedTemplate === t.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-500 text-slate-500'
                      }`}
                    >
                      <t.icon size={24} className="mb-2" />
                      <span className="text-xs font-medium">{t.name}</span>
                    </button>
                  ))}
                </div>
                
                {/* Fabric Simulator Mockup */}
                <div className="mt-4">
                  <h3 className="font-bold text-slate-800 dark:text-white mb-3">محاكي الأقمشة</h3>
                  <div className="flex gap-2">
                    {['حرير', 'قطن', 'صوف', 'كتان'].map((fabric) => (
                      <button key={fabric} className="px-3 py-1.5 text-xs rounded-full border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300">
                        {fabric}
                      </button>
                    ))}
                  </div>
                </div>

                {/* اختيار من المكتبة */}
                <div className="mt-4">
                  <button
                    onClick={() => setShowImageLibrary(true)}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
                  >
                    <ImageIcon size={18} />
                    اختر صورة من المكتبة
                  </button>
                </div>
              </div>
            )}

            {/* AI Sketch Input */}
            {activeMode === 'sketch' && (
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setShowImageLibrary(true)}
                    className="border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-xl p-6 flex flex-col items-center justify-center text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
                  >
                    <ImageIcon size={32} className="mb-2" />
                    <span className="text-xs font-medium">اختر من المكتبة</span>
                  </button>
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
                    <Upload size={32} className="mb-2" />
                    <span className="text-xs font-medium">ارفع صورة سكتش</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 block">وصف التصميم (للمصمم الذكي)</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="مثال: فستان سهرة أحمر، أكمام طويلة واسعة، قماش حرير لامع، تطريز ذهبي على الخصر..."
                    className="w-full h-24 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none"
                  />
                </div>
              </div>
            )}

            <Button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`w-full py-4 text-lg font-bold shadow-lg ${
                activeMode === 'sketch' 
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700' 
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
              }`}
            >
              {isGenerating ? (
                <span className="flex items-center gap-2 animate-pulse">
                  <Sparkles size={20} className="animate-spin" /> جاري التخيل...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Wand2 size={20} /> تخيل التصميم
                </span>
              )}
            </Button>

          </div>

          {/* Right: Preview / Result */}
          <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden group">
            
            {generatedImage ? (
              <>
                <img src={generatedImage} alt="Generated Design" className="w-full h-full object-cover" />
                <div className="absolute bottom-4 left-0 w-full flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="bg-white/90 dark:bg-black/80 text-slate-900 dark:text-white p-2 rounded-full shadow-lg backdrop-blur-sm hover:scale-110 transition-transform">
                    <ZoomIn size={20} />
                  </button>
                  <button className="bg-white/90 dark:bg-black/80 text-slate-900 dark:text-white p-2 rounded-full shadow-lg backdrop-blur-sm hover:scale-110 transition-transform">
                    <Share2 size={20} />
                  </button>
                  <button 
                    onClick={() => setShowTechPack(true)}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-full shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all flex items-center gap-2 font-bold text-sm"
                  >
                    <Scissors size={16} />
                    البطاقة الفنية
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center text-slate-400 p-8">
                <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Shirt size={40} className="opacity-50" />
                </div>
                <p className="font-medium">المعاينة ستظهر هنا</p>
                <p className="text-xs mt-2 opacity-70">ابدأ باختيار القالب أو وصف التصميم</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Image Library Picker Modal */}
      {showImageLibrary && (
        <ImageLibraryPicker 
          onSelect={(imageUrl) => {
            console.log('✅ تم اختيار صورة من المكتبة:', imageUrl);
            setGeneratedImage(imageUrl);
          }}
          onClose={() => setShowImageLibrary(false)}
        />
      )}

      {/* Tech Pack Modal (Overlay) */}
      {showTechPack && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowTechPack(false)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">البطاقة الفنية (Tech Pack)</h2>
                <p className="text-xs text-slate-500">جاهزة للإرسال للخياط</p>
              </div>
              <button onClick={() => setShowTechPack(false)} className="text-slate-400 hover:text-red-500">إغلاق</button>
            </div>
            
            <div className="p-6 grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                  <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2 text-sm">تحليل الأبعاد</h3>
                  <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                    <li className="flex justify-between"><span>الياقة:</span> <span>4 سم (دائرية)</span></li>
                    <li className="flex justify-between"><span>الخياطة:</span> <span>مخفية</span></li>
                    <li className="flex justify-between"><span>الكم:</span> <span>مفتوح 15 سم</span></li>
                  </ul>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                  <h3 className="font-bold text-slate-800 dark:text-white mb-2 text-sm">القماش المقترح</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">كتان ياباني أصلي - يحتاج 3.5 متر (عرضين)</p>
                </div>
              </div>
              
              <div className="bg-slate-900 p-4 rounded-xl flex items-center justify-center relative">
                 {/* Blueprint effect */}
                 <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px'}}></div>
                 <img src={generatedImage!} alt="Blueprint" className="w-full h-full object-contain filter grayscale contrast-125 invert opacity-90" />
                 <span className="absolute bottom-2 right-2 text-[10px] text-white/50 font-mono">BLUEPRINT_V1.0</span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <Button className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 text-white transition-all">
                <Check size={18} /> إرسال للخياط
              </Button>
              <Button variant="outline" onClick={() => setShowTechPack(false)}>تعديل</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};