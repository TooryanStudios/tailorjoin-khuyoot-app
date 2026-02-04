import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Ruler, HelpCircle, Video, Save, CheckCircle2, 
  ArrowRight, ShieldCheck, Info, ChevronRight,
  Maximize2, RulerIcon, Scissors
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { firebaseService } from '../../services/firebase';
import { MeasurementStudioCanvas } from './components/MeasurementStudioCanvas';
import { measurementService, MeasurementTemplate } from './services/measurementService';

export const StudioMeasurements: React.FC = () => {
  const { t, i18n } = useTranslation(['measurements', 'common']);
  const isAr = i18n.language === 'ar';
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as any;
  const { user } = useApp();

  const [productData, setProductData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [templates, setTemplates] = useState<MeasurementTemplate[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<MeasurementTemplate | null>(null);
  const [measurements, setMeasurements] = useState<Record<string, string>>(state?.measurements || {});
  const [activePointId, setActivePointId] = useState<string | null>(null);

  // Fetch data
  useEffect(() => {
    const loadData = async () => {
      if (!productId) return;
      setIsLoading(true);
      try {
        const [prod, allTemplates] = await Promise.all([
          firebaseService.getProduct(productId),
          measurementService.getTemplates()
        ]);
        setProductData(prod);
        setTemplates(allTemplates);
        
        // Auto-match template
        const match = allTemplates.find(t => t.id === prod?.categoryId || t.productType === prod?.category);
        setActiveTemplate(match || allTemplates[0]);
      } catch (err) {
        console.error("Error loading studio measurements:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [productId]);

  const handleSave = async () => {
    // Save logic
    const canEdit = state?.order?.canEdit !== false;
    if (!canEdit) {
      alert(t('measurements:orderLocked'));
      return;
    }
    // Implement save to Firebase/LocalState
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-zinc-950/50 backdrop-blur-md">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
          <span className="text-zinc-400 font-medium animate-pulse">Initializing Studio Measurements...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-white overflow-hidden font-sans">
      {/* Premium Header */}
      <div className="h-16 flex-shrink-0 px-4 flex items-center justify-between border-b border-white/5 bg-zinc-900/40 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Ruler size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">{t('measurements:enterYourMeasurements')}</h1>
            <p className="text-xs text-zinc-500 flex items-center gap-2">
              <ShieldCheck size={12} className="text-emerald-500" />
              {productData?.name || 'Custom Garment'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold transition-all">
            <Video size={16} />
            {t('common:watchVideo')}
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold shadow-lg shadow-emerald-500/10 transition-all active:scale-95"
          >
            <Save size={16} />
            {t('measurements:saveMeasurements')}
          </button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Left Side: Interactive Canvas */}
        <div className="flex-1 relative bg-[radial-gradient(circle_at_center,_#18181b_0%,_#09090b_100%)] overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center p-4">
            {activeTemplate && (
              <MeasurementStudioCanvas 
                template={activeTemplate}
                measurements={measurements}
                activePointId={activePointId}
                onPointSelect={setActivePointId}
                onMeasurementChange={(id, val) => setMeasurements(prev => ({ ...prev, [id]: val }))}
              />
            )}
          </div>
          
          {/* Overlay Guide Card */}
          <div className="absolute bottom-4 left-4 max-w-sm p-4 bg-zinc-900/80 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 flex-shrink-0">
                <Info size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">{t('measurements:precisionGuide')}</h4>
                <p className="text-xs text-zinc-400 leading-relaxed italic">
                  {t('measurements:precisionGuideDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Data Entry Panel */}
        <div className="w-[450px] flex-shrink-0 bg-zinc-900/30 border-l border-white/5 flex flex-col overflow-hidden backdrop-blur-sm">
          <div className="p-3 border-b border-white/5 bg-zinc-900/50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Input Metrics</span>
              <div className="flex bg-zinc-950 rounded-lg p-1">
                <button className="px-3 py-1 text-[10px] font-bold bg-zinc-800 rounded-md">CM</button>
                <button className="px-3 py-1 text-[10px] font-bold text-zinc-600">IN</button>
              </div>
            </div>

            {/* Template Selector Mini */}
            <div className="flex flex-wrap gap-2">
              {templates.map(tmp => (
                <button
                  key={tmp.id}
                  onClick={() => setActiveTemplate(tmp)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                    activeTemplate?.id === tmp.id 
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                    : 'bg-zinc-800/40 border-white/5 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tmp.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {activeTemplate?.points.map(point => (
              <div 
                key={point.id}
                onClick={() => setActivePointId(point.id)}
                className={`group p-4 rounded-2xl border transition-all cursor-pointer ${
                  activePointId === point.id 
                  ? 'bg-emerald-500/5 border-emerald-500/30 ring-1 ring-emerald-500/20' 
                  : 'bg-zinc-900/40 border-white/5 hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      activePointId === point.id ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      <Scissors size={14} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white leading-none">{point.label}</h3>
                      <span className="text-[10px] text-zinc-500">Ref: {point.id}</span>
                    </div>
                  </div>
                  {measurements[point.id] && (
                    <div className="text-emerald-500">
                      <CheckCircle2 size={16} />
                    </div>
                  )}
                </div>
                
                <div className="relative">
                  <input 
                    type="number" 
                    value={measurements[point.id] || ''}
                    placeholder="---"
                    onChange={(e) => setMeasurements(prev => ({ ...prev, [point.id]: e.target.value }))}
                    className="w-full h-12 bg-zinc-950 border border-white/5 rounded-xl px-4 text-emerald-400 font-mono text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all placeholder:text-zinc-800"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-700 uppercase">
                    cm
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 bg-zinc-900/60 border-t border-white/5">
            <button 
              onClick={handleSave}
              className="w-full h-14 bg-white text-zinc-950 font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-emerald-400 transition-all group active:scale-95"
            >
              {t('measurements:confirmAll')}
              <ArrowRight size={18} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
