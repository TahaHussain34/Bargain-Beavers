import React, { useState } from 'react';
import { ItemAnalysis, DealRating, NegotiationAdvice } from '../types';
import { CheckCircle2, AlertTriangle, XCircle, Tag, MessageCircle, ArrowRight, DollarSign } from 'lucide-react';
import { AudioRecorder } from './AudioRecorder';
import { getNegotiationCoaching } from '../services/geminiService';

interface AnalysisResultProps {
  data: ItemAnalysis;
  imagePreview?: string;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ data, imagePreview }) => {
  const [advice, setAdvice] = useState<NegotiationAdvice | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualPrice, setManualPrice] = useState('');

  const handleAudioRecorded = async (base64: string, mimeType: string) => {
    setIsProcessing(true);
    try {
      const coachingData = await getNegotiationCoaching(data, { type: 'audio', data: base64, mimeType });
      setAdvice(coachingData);
    } catch (error) {
      console.error("Failed to get coaching:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualPriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPrice) return;
    setIsProcessing(true);
    try {
      const coachingData = await getNegotiationCoaching(data, { type: 'text', data: manualPrice });
      setAdvice(coachingData);
    } catch (error) {
      console.error("Failed to get coaching:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getVerdictColor = (verdict: string) => {
    if (verdict === 'Buy Now') return 'bg-emerald-500 border-emerald-600';
    if (verdict === 'Walk Away') return 'bg-rose-600 border-rose-700';
    return 'bg-blue-600 border-blue-700';
  };

  // Dynamic Overlay Logic
  const getOverlayStatus = () => {
    // Priority 1: Real-time advice based on seller's offer
    if (advice?.verdict) {
      switch (advice.verdict) {
        case 'Buy Now': return { color: 'bg-emerald-500', icon: <CheckCircle2 className="w-3 h-3" />, text: 'BUY NOW' };
        case 'Negotiate': return { color: 'bg-amber-500', icon: <AlertTriangle className="w-3 h-3" />, text: 'NEGOTIATE' };
        case 'Walk Away': return { color: 'bg-rose-500', icon: <XCircle className="w-3 h-3" />, text: 'WALK AWAY' };
      }
    }
    
    // Priority 2: Initial estimation (Fallback)
    switch (data.deal_rating) {
      case DealRating.Green: return { color: 'bg-emerald-500', icon: <CheckCircle2 className="w-3 h-3" />, text: 'POTENTIAL BUY' };
      case DealRating.Yellow: return { color: 'bg-amber-500', icon: <AlertTriangle className="w-3 h-3" />, text: 'CAUTION' };
      case DealRating.Red: return { color: 'bg-rose-500', icon: <XCircle className="w-3 h-3" />, text: 'RISKY' };
      default: return { color: 'bg-slate-500', icon: null, text: 'ANALYZED' };
    }
  };

  const overlay = getOverlayStatus();

  return (
    <div className="w-full max-w-md mx-auto space-y-5 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Card - Smaller Image */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {imagePreview && (
          <div className="h-32 w-full bg-slate-100 relative">
            <img 
              src={imagePreview} 
              alt="Analyzed item" 
              className="w-full h-full object-cover"
            />
            {/* Dynamic Overlay */}
            <div className={`absolute top-3 right-3 px-2 py-1 rounded-full flex items-center space-x-1 text-[10px] font-bold shadow-sm text-white ${overlay.color} transition-colors duration-500`}>
              {overlay.icon}
              <span>{overlay.text}</span>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <h2 className="text-lg font-bold text-white leading-tight shadow-black drop-shadow-md">{data.item_name}</h2>
              <div className="flex items-center space-x-2 text-white/80 text-[10px] mt-0.5">
                 <Tag className="w-3 h-3" />
                 <span>Condition: {data.estimated_condition}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pricing Strategy Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
         <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Pricing Strategy</h3>
         
         <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Retail New: <span className="line-through decoration-rose-400/50">{data.retail_price_new}</span></span>
            <span className="text-xs text-slate-400">Market Range: <span className="text-slate-600 font-semibold">{data.price_range}</span></span>
         </div>

         <div className="relative pt-6 pb-2">
            {/* Visual Bar */}
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div className="w-1/3 bg-emerald-400"></div>
                <div className="w-1/3 bg-blue-500"></div>
                <div className="w-1/3 bg-rose-400"></div>
            </div>
            
            {/* Markers */}
            <div className="absolute top-0 left-0 w-1/3 text-center -ml-4">
                <p className="text-[10px] font-bold text-emerald-600 uppercase">Start</p>
                <p className="text-lg font-bold text-slate-800 leading-none">{data.suggested_offer_price}</p>
            </div>
            <div className="absolute top-0 left-1/3 w-1/3 text-center">
                 <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-slate-300"></div>
                 <div className="relative bg-white border border-blue-100 px-2 py-0.5 rounded shadow-sm inline-block -mt-6">
                    <p className="text-[10px] font-bold text-blue-600 uppercase">Target</p>
                 </div>
                 <p className="text-lg font-black text-blue-600 leading-none mt-2">{data.flea_market_fair_price}</p>
            </div>
            <div className="absolute top-0 right-0 w-1/3 text-center -mr-4">
                <p className="text-[10px] font-bold text-rose-600 uppercase">Max</p>
                <p className="text-lg font-bold text-rose-600 leading-none">{data.walk_away_price}</p>
            </div>
         </div>
      </div>

      {/* Seller Offer Input Section */}
      <div className="bg-slate-900 rounded-2xl p-5 shadow-xl text-white">
        <div className="mb-4">
             <h3 className="font-bold flex items-center text-lg mb-1">
                 <DollarSign className="w-5 h-5 mr-2 text-yellow-400" />
                 Ask for Price
             </h3>
             <p className="text-sm text-slate-400">
                Ask for the price and record the answer or enter the answer below.
             </p>
         </div>

         {!advice ? (
           <div className="space-y-4">
               <AudioRecorder onAudioRecorded={handleAudioRecorded} isProcessing={isProcessing} />
               
               <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-700"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                      <span className="bg-slate-900 px-2 text-slate-500 font-bold uppercase">OR</span>
                  </div>
              </div>

               <form onSubmit={handleManualPriceSubmit} className="flex space-x-2">
                   <input 
                     type="number" 
                     value={manualPrice}
                     onChange={(e) => setManualPrice(e.target.value)}
                     placeholder="Enter price..."
                     className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 font-bold text-lg placeholder:font-normal placeholder:text-slate-500"
                   />
                   <button 
                     type="submit"
                     disabled={isProcessing || !manualPrice}
                     className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                   >
                     {isProcessing ? '...' : 'Evaluate'}
                   </button>
               </form>
           </div>
         ) : (
           <div className={`rounded-xl border p-4 animate-in slide-in-from-bottom-2 ${getVerdictColor(advice.verdict)}`}>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/20">
                  <div className="flex items-center space-x-2">
                      <div className="bg-white/20 p-1.5 rounded-full">
                         {advice.verdict === 'Buy Now' ? <CheckCircle2 className="w-5 h-5 text-white" /> : 
                          advice.verdict === 'Walk Away' ? <XCircle className="w-5 h-5 text-white" /> : 
                          <MessageCircle className="w-5 h-5 text-white" />}
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-white/80 tracking-wider">Verdict</p>
                        <p className="text-xl font-black text-white leading-none">{advice.verdict.toUpperCase()}</p>
                      </div>
                  </div>
                  {advice.detected_price && (
                    <div className="text-right">
                       <p className="text-[10px] text-white/80">Offer</p>
                       <p className="font-bold text-white">{advice.detected_price}</p>
                    </div>
                  )}
              </div>
              
              <div className="space-y-3">
                 <div className="bg-black/20 rounded-lg p-3">
                     <p className="text-[10px] text-white/60 uppercase font-bold tracking-wider mb-1">Tip</p>
                     <p className="text-sm text-white font-medium leading-relaxed">"{advice.suggested_counter}"</p>
                 </div>
                 <button 
                   onClick={() => { setAdvice(null); setManualPrice(''); }}
                   className="w-full text-center text-xs text-white/60 hover:text-white underline"
                 >
                   Reset & Check New Offer
                 </button>
              </div>
           </div>
         )}
      </div>

      {/* Negotiation Playbook */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-bold text-slate-900 px-1">Negotiation Playbook</h3>
        
        {/* Step 1: Open */}
        <div className="bg-white p-4 rounded-xl border-l-4 border-emerald-400 shadow-sm">
           <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">Step 1: The Icebreaker</span>
           </div>
           <p className="text-slate-700 font-medium">"{data.negotiation_scripts.the_icebreaker}"</p>
        </div>

        {/* Step 2: Leverage */}
        <div className="bg-white p-4 rounded-xl border-l-4 border-blue-500 shadow-sm">
           <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">Step 2: The Logic</span>
           </div>
           <p className="text-slate-700 font-medium mb-2">"{data.negotiation_scripts.the_data_play}"</p>
           <div className="space-y-1 mt-2 pt-2 border-t border-slate-100">
              {data.negotiation_arguments.map((arg, i) => (
                  <div key={i} className="flex items-start text-xs text-slate-500">
                    <ArrowRight className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                    {arg}
                  </div>
              ))}
           </div>
        </div>

        {/* Step 3: Close */}
        <div className="bg-white p-4 rounded-xl border-l-4 border-slate-800 shadow-sm">
           <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded uppercase">Step 3: The Closer</span>
           </div>
           <p className="text-slate-800 font-bold">"{data.negotiation_scripts.the_closer}"</p>
        </div>
      </div>

    </div>
  );
};