import React, { useState, useEffect, useRef } from 'react';
import { PanelLeftClose, PanelLeftOpen, Download, ExternalLink } from 'lucide-react';

/**
 * PDFTestPage - A prototype for HTML-to-PDF conversion using html2pdf.js
 * Requirements:
 * 1. Split-screen layout (Editor vs Live Preview)
 * 2. Real-time PDF rendering (not just HTML)
 * 3. Page break and table splitting protection
 */
const PDFTestPage: React.FC = () => {
  const [formData, setFormData] = useState({
    title: 'Professional Service Report',
    date: new Date().toLocaleDateString(),
    description: 'This document serves as a high-fidelity prototype for testing HTML-to-PDF workflows within the Khuyoot platform. It demonstrates semantic structure, page breaks, and live-blob preview.',
  });
  const [loremCount, setLoremCount] = useState(0);
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const templateRef = useRef<HTMLDivElement>(null);

  // Requirement 1: Load html2pdf.js only on client side via CDN
  useEffect(() => {
    if ((window as any).html2pdf) {
      setIsLibraryLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = '/libs/html2pdf.bundle.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      console.log('✅ PDF Library Loaded');
      setIsLibraryLoaded(true);
    };
    script.onerror = () => {
      console.error('❌ Failed to load PDF library script');
      setLibraryError('Failed to load local PDF library from /libs/.');
    };
    document.body.appendChild(script);
  }, []);

  const generateBlob = async () => {
    if (!(window as any).html2pdf || !templateRef.current) return null;
    const element = templateRef.current;
    
    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5],
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    return (window as any).html2pdf().set(opt).from(element).output('blob');
  };

  const handleDownload = async () => {
    if (isGenerating || !isLibraryLoaded) return;
    setIsGenerating(true);
    try {
      const blob = await generateBlob();
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${formData.title.replace(/\s+/g, '_')}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('PDF Download Error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenInNewTab = async () => {
    if (isGenerating || !isLibraryLoaded) return;
    setIsGenerating(true);
    try {
      const blob = await generateBlob();
      if (blob) {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        // Note: We don't revoke here because the new tab needs it. 
        // In a real app, you might manage these URLs more strictly.
      }
    } catch (err) {
      console.error('PDF Preview Error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const addLorem = () => {
    setLoremCount(prev => prev + 50);
  };

  // Shared Template Component
  const DocumentContent = ({ isPrint = false }: { isPrint?: boolean }) => (
    <div 
      className={`bg-white text-black ${!isPrint ? 'shadow-2xl ring-1 ring-black/5' : ''}`}
      style={{ 
        width: isPrint ? '800px' : '100%', 
        minHeight: isPrint ? '1032px' : 'auto',
        padding: isPrint ? '60px' : '40px',
        backgroundColor: '#ffffff',
        color: '#000000',
        fontFamily: '"Inter", "Segoe UI", Roboto, sans-serif' // Match current React page font
      }}
    >
      <div style={{ marginBottom: '40px', borderBottom: '2px solid #3b82f6', paddingBottom: '20px' }}>
         <h1 style={{ fontSize: '42px', margin: 0, fontWeight: 900, letterSpacing: '-0.02em', color: '#1e293b' }}>KHUYOOT</h1>
         <p style={{ color: '#64748b', fontSize: '11px', marginTop: '8px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.1em' }}>PRECISION REPORT • {formData.date}</p>
      </div>

      <div style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '12px', fontWeight: 800, color: '#0f172a' }}>{formData.title}</h2>
        <div style={{ padding: '24px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
           <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>{formData.description}</p>
        </div>
      </div>

      {loremCount > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>Verification Log Trace</h3>
          {Array.from({ length: loremCount }).map((_, i) => (
             <p key={i} style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px', fontFamily: 'monospace' }}>
               {`>> TRACE_ID_${(i+1).toString().padStart(3, '0')}: VALIDATING PAGE OVERFLOW BUFFER... STATUS: OK`}
             </p>
          ))}
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
         <thead>
           <tr style={{ backgroundColor: '#1e293b' }}>
             <th style={{ padding: '12px 15px', textAlign: 'left', color: 'white', fontSize: '10px', textTransform: 'uppercase', fontWeight: 900 }}>Module Component</th>
             <th style={{ padding: '12px 15px', textAlign: 'right', color: 'white', fontSize: '10px', textTransform: 'uppercase', fontWeight: 900 }}>Status</th>
           </tr>
         </thead>
         <tbody>
           {[
             { label: 'PDF Library Runtime', desc: 'Local bundle execution check', status: 'READY' },
             { label: 'Client-Side Hydration', desc: 'React state-to-DOM sync', status: 'ACTIVE' },
             { label: 'Sheet Break Engine', desc: 'Multi-page row distribution', status: 'VALIDATING' },
           ].map((row, i) => (
             <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
               <td style={{ padding: '15px', fontSize: '13px' }}>
                 <strong style={{ display: 'block', color: '#0f172a' }}>{row.label}</strong>
                 <span style={{ fontSize: '11px', color: '#94a3b8' }}>{row.desc}</span>
               </td>
               <td style={{ padding: '15px', textAlign: 'right', fontSize: '11px', fontWeight: 800, color: row.status === 'READY' ? '#10b981' : row.status === 'ACTIVE' ? '#3b82f6' : '#f59e0b' }}>
                 {row.status}
               </td>
             </tr>
           ))}
         </tbody>
      </table>

      <div style={{ marginTop: 'auto', paddingTop: '30px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
        <p style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: 700, letterSpacing: '0.25em' }}>KHUYOOT INTERACTIVE STUDIO • INTERNAL LABS v1.1</p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .page-break { page-break-after: always; }
        .avoid-break { page-break-inside: avoid; }
      `}} />
    </div>
  );

  return (
    <div className="flex h-screen bg-[#070709] text-zinc-100 font-sans selection:bg-blue-500/30 overflow-hidden">
      {/* 2. Side Panel */}
      <div 
        className={`flex-shrink-0 flex flex-col border-r border-white/5 bg-[#0e0e11] transition-all duration-300 ease-in-out relative ${isPanelCollapsed ? 'w-0 overflow-hidden' : 'w-[420px]'}`}
      >
        <div className="flex-1 flex flex-col min-w-[420px]">
          <div className="p-8 border-b border-white/5 bg-white/[0.01]">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-black tracking-tighter text-white flex items-center gap-2">
                <div className="w-2.5 h-6 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                PDF STUDIO
              </h1>
              <button 
                onClick={() => setIsPanelCollapsed(true)}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 text-zinc-500 hover:text-white transition-all"
                title="Collapse Sidebar"
              >
                <PanelLeftClose size={18} />
              </button>
            </div>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2 opacity-50">Component Forge • v1.2</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Primary Title</label>
                <input 
                  type="text" 
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-blue-500/50 transition-all font-bold placeholder:text-zinc-700"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Document Narrative</label>
                <textarea 
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-blue-500/50 transition-all min-h-[160px] leading-relaxed custom-scrollbar"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>

            <div className="pt-4 space-y-4">
              <button 
                onClick={handleDownload}
                disabled={isGenerating || !isLibraryLoaded}
                className="w-full bg-blue-600 disabled:opacity-50 text-white px-4 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all flex items-center justify-center gap-2"
              >
                <Download size={14} />
                Download PDF
              </button>

              <button 
                onClick={addLorem}
                className="w-full bg-white/5 text-zinc-400 px-4 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all border border-dashed border-white/10"
              >
                + Inject Stress Rows
              </button>
            </div>

            {!isLibraryLoaded && !libraryError && (
               <div className="flex items-center justify-center gap-2 py-4">
                 <div className="w-3 h-3 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                 <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Warming Engine...</p>
               </div>
            )}
            {libraryError && (
               <p className="text-[10px] text-red-500 text-center font-bold bg-red-500/10 p-4 rounded-xl border border-red-500/20">{libraryError}</p>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Preview Viewport */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-[#070709]">
        {/* Floating Utility Toolbar */}
        <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-20 pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            {isPanelCollapsed && (
              <button 
                onClick={() => setIsPanelCollapsed(false)}
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#0f0f12] border border-white/5 text-zinc-500 hover:text-white transition-all shadow-2xl"
                title="Expand Sidebar"
              >
                <PanelLeftOpen size={20} />
              </button>
            )}
            <div className="h-12 px-5 flex items-center gap-3 rounded-xl bg-[#0f0f12]/80 backdrop-blur-xl border border-white/5 shadow-2xl">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Live Stream</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <button 
              onClick={handleOpenInNewTab}
              disabled={isGenerating || !isLibraryLoaded}
              className="h-12 px-6 flex items-center gap-2 rounded-xl bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all shadow-2xl disabled:opacity-50"
            >
              <ExternalLink size={14} />
              Open In New Tab
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pt-32 pb-12 md:px-12 lg:px-24 custom-scrollbar">
          <div className="mx-auto max-w-[900px]">
            <div className="transition-all duration-500">
              <DocumentContent />
            </div>
          </div>
        </div>

        {/* Floating Generation Indicator */}
        {isGenerating && (
          <div className="absolute bottom-8 right-8 px-6 py-4 rounded-2xl bg-blue-600 shadow-2xl shadow-blue-500/20 border border-blue-400/20 flex items-center gap-4 z-50 animate-in fade-in slide-in-from-bottom-4">
             <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
             <span className="text-xs font-black uppercase tracking-widest text-white">Rendering PDF Engine...</span>
          </div>
        )}
      </div>

      {/* 3. Printing Shadow Instance */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, pointerEvents: 'none' }}>
        <div ref={templateRef}>
           <DocumentContent isPrint />
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}} />
    </div>
  );
};

export default PDFTestPage;
