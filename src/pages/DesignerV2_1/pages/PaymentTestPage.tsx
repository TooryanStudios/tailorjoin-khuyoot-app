import React, { useState } from 'react';
import { useAuth } from '../../../auth/useAuth';
import { motion } from 'framer-motion';
import { Shield, CreditCard, Send, CheckCircle2, AlertCircle, ArrowLeft, Zap, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * PaymentTestPage 
 * A dedicated internal tool to test Thawani payment fulfillment.
 */
export const PaymentTestPage: React.FC = () => {
  const { user, idToken } = useAuth();
  const navigate = useNavigate();
  const [targetUid, setTargetUid] = useState(user?.uid || '');
  const [amountOmr, setAmountOmr] = useState(0.1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [realProcessing, setRealProcessing] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

  const simulatePayment = async () => {
    if (!targetUid) {
      setStatus({ type: 'error', message: 'Please enter a Target UID' });
      return;
    }

    setIsProcessing(true);
    setStatus({ type: null, message: '' });

    try {
      // 1 OMR = 1000 Small Units
      // 1 OMR = 100 Credits (ratio used in app)
      const credits = Math.round(amountOmr * 100);
      
      const payload = {
        event_type: 'checkout.cleared',
        data: {
          session_id: 'test_session_' + Date.now(),
          client_reference_id: targetUid,
          total_amount: Math.round(amountOmr * 1000), 
          metadata: {
            userId: targetUid,
            credits: credits,
            packageName: `Manual Test Pack (${amountOmr} OMR)`
          }
        }
      };

      const resp = await fetch('http://localhost:8788/api/payments/thawani/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await resp.json();
      
      if (resp.ok && result.ok) {
        setStatus({ type: 'success', message: `Successfully simulated ${amountOmr} OMR payment! Granted ${credits} credits to ${targetUid}.` });
      } else {
        setStatus({ type: 'error', message: result.error || 'Failed to fulfill credits.' });
      }
    } catch (e: any) {
      setStatus({ type: 'error', message: e.message || 'Network error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const startRealPayment = async () => {
    setRealProcessing(true);
    setStatus({ type: null, message: '' });

    try {
      // Use the 'test' package we added to CREDIT_PACKAGES
      const resp = await fetch('http://localhost:8788/api/payments/thawani/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken || window.localStorage.getItem('khuyoot:auth:token') || ''}`
        },
        body: JSON.stringify({
          amount: amountOmr,
          packageName: `UAT Test Pack ${amountOmr} OMR`,
          successUrl: window.location.origin + '/designer?payment=success',
          cancelUrl: window.location.origin + '/designer?payment=cancel',
          metadata: {
            credits: Math.round(amountOmr * 100),
            packageName: `UAT Test Pack (${amountOmr} OMR)`
          }
        })
      });

      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.error || 'Failed to initiate payment');
      }

      const { checkout_url } = await resp.json();
      window.location.href = checkout_url;
    } catch (e: any) {
      setRealProcessing(false);
      setStatus({ type: 'error', message: e.message || 'Payment initiation failed' });
    }
  };

  return (
    <div className="h-screen bg-[#020202] text-white flex flex-col overflow-y-auto custom-scrollbar selection:bg-purple-500/30">
      <div className="w-full max-w-2xl mx-auto py-20 px-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-all mb-12 group bg-white/5 px-4 py-2 rounded-xl border border-white/5 hover:border-white/10"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-widest">Back to Studio</span>
        </button>

        <div className="bg-[#0f0f12] border border-white/10 rounded-[32px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 blur-[120px] pointer-events-none" />

          <div className="flex items-center gap-5 mb-10 relative">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
              <Shield className="text-purple-400" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight leading-none mb-2">Thawani Debug</h1>
              <p className="text-zinc-500 text-sm font-medium tracking-wide">Developer Sandbox & Simulation</p>
            </div>
          </div>

          <div className="space-y-8 relative">
            {/* Simulation Block */}
            <div className="space-y-6 bg-white/[0.02] p-6 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">1. Local Simulation (Instant)</span>
              </div>
              
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Target User ID (UID)</label>
                <div className="relative group">
                  <input 
                    type="text" 
                    value={targetUid}
                    onChange={(e) => setTargetUid(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-purple-500/50 transition-all font-mono text-xs placeholder:text-zinc-700"
                    placeholder="UID..."
                  />
                  <button 
                    onClick={() => setTargetUid(user?.uid || '')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] bg-zinc-800 hover:bg-zinc-700 font-black px-2.5 py-1.5 rounded-lg text-zinc-400 border border-white/5 transition-colors"
                  >
                    USE MINE
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Choose Simulation Amount</label>
                <div className="grid grid-cols-3 gap-3">
                  {[0.1, 0.5, 1.0].map((val) => (
                    <button
                      key={val}
                      onClick={() => setAmountOmr(val)}
                      className={`py-3.5 rounded-xl border text-xs font-black transition-all ${
                        amountOmr === val 
                          ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_30px_rgba(147,51,234,0.3)] scale-[1.02]' 
                          : 'bg-black/20 border-white/5 text-zinc-500 hover:border-white/20 hover:text-zinc-300'
                      }`}
                    >
                      {val} OMR
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={simulatePayment}
                disabled={isProcessing}
                className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black tracking-widest uppercase transition-all active:scale-[0.98] shadow-xl ${
                  isProcessing 
                    ? 'bg-zinc-900 text-zinc-700 cursor-not-allowed border border-white/5' 
                    : 'bg-white text-black hover:bg-purple-50'
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <Zap size={18} fill="currentColor" />
                    <span>Instant Credit Fulfillment</span>
                  </>
                )}
              </button>

              {status.type && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-5 rounded-xl border flex items-start gap-3 ${
                    status.type === 'success' 
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
                      : 'bg-red-500/5 border-red-500/20 text-red-400'
                  }`}
                >
                  {status.type === 'success' ? <CheckCircle2 size={20} className="mt-0.5" /> : <AlertCircle size={20} className="mt-0.5" />}
                  <div className="text-sm font-bold leading-snug">{status.message}</div>
                </motion.div>
              )}
            </div>

            <div className="h-px bg-white/5" />

            {/* Real Checkout Section */}
            <div className="space-y-6 bg-purple-500/[0.03] p-6 rounded-2xl border border-purple-500/10">
              <div className="flex items-center gap-2 mb-2">
                 <div className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">2. Real Redirection Flow</span>
              </div>

              <button
                onClick={startRealPayment}
                disabled={realProcessing}
                className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black tracking-widest uppercase transition-all active:scale-[0.98] shadow-xl border-2 border-dashed ${
                  realProcessing 
                    ? 'bg-zinc-900 text-zinc-700 cursor-not-allowed border-white/5' 
                    : 'bg-purple-600/20 text-purple-200 border-purple-500/30 hover:bg-purple-600/30 hover:border-purple-500/50'
                }`}
              >
                {realProcessing ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <CreditCard size={18} />
                    <span>Launch Actual UAT Test Pack ({amountOmr} OMR)</span>
                  </>
                )}
              </button>

              <div className="space-y-4">
                <div>
                  <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Shield size={12} />
                    <span>Thawani UAT Test Credentials</span>
                  </div>
                  <div className="bg-black/60 p-5 rounded-2xl border border-white/10 font-mono text-xs space-y-2.5 shadow-inner">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-600 font-bold">CARD NUMBER</span> 
                      <span className="text-purple-400 font-black tracking-widest bg-purple-500/10 px-2 py-1 rounded">4000 0000 0000 0001</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-600 font-bold">EXPIRY DATE</span> 
                      <span className="text-purple-400 font-black tracking-widest bg-purple-500/10 px-2 py-1 rounded">12/26</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-600 font-bold">CVV</span> 
                      <span className="text-purple-400 font-black tracking-widest bg-purple-500/10 px-2 py-1 rounded">123</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-600 font-bold">PIN</span> 
                      <span className="text-purple-400 font-black tracking-widest bg-purple-500/10 px-2 py-1 rounded">1234</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-[10px] text-zinc-600 leading-relaxed text-center px-4 italic">
                  Khuyoot never sees or stores card data. REDIRECTION TO UATCHECKOUT.THAWANI.OM
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
