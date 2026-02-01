import React, { useState, useEffect } from 'react';
import { ItemAnalysis, DealRating, NegotiationAdvice } from '../types';
import { CheckCircle2, AlertTriangle, XCircle, Tag, MessageCircle, ArrowRight, DollarSign, HandCoins, Minus, Plus, RefreshCw } from 'lucide-react';
import { AudioRecorder } from './AudioRecorder';
import { getNegotiationCoaching } from '../services/geminiService';

interface AnalysisResultProps {
  data: ItemAnalysis;
  imagePreview?: string;
  onDealClosed: (finalPrice: number, sellerStartOffer?: number) => void;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ data, imagePreview, onDealClosed }) => {
  const [advice, setAdvice] = useState<NegotiationAdvice | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualPrice, setManualPrice] = useState('');
  
  // New state for final deal
  const [finalAgreedPrice, setFinalAgreedPrice] = useState('');
  const [sellerStartOffer, setSellerStartOffer] = useState<number | undefined>(undefined);

  // Robust Price Parsing (Same logic as App.tsx)
  const parsePrice = (priceStr: string | undefined): number | undefined => {
    if (!priceStr) return undefined;
    let clean = priceStr.replace(/[^\d.,-]/g, '');
    if (!clean || clean === '-') return undefined;

    const lastComma = clean.lastIndexOf(',');
    const lastDot = clean.lastIndexOf('.');

    // Case 1: Both comma and dot exist
    if (lastComma !== -1 && lastDot !== -1) {
       if (lastComma > lastDot) {
           // 1.234,56 -> Euro format
           clean = clean.replace(/\./g, '').replace(',', '.');
       } else {
           // 1,234.56 -> US format
           clean = clean.replace(/,/g, '');
       }
    } 
    // Case 2: Only Comma
    else if (lastComma !== -1) {
       const parts = clean.split(',');
       // If last part is exactly 3 digits, assume thousands separator (e.g. 3,000)
       if (parts[parts.length - 1].length === 3) {
           clean = clean.replace(/,/g, '');
       } else {
           clean = clean.replace(',', '.');
       }
    }
    // Case 3: Only Dot
    else if (lastDot !== -1) {
       const parts = clean.split('.');
       // If last part is exactly 3 digits, assume thousands separator (Euro style: 3.000)
       // This handles the "3.000" -> 3000 case correctly
       if (parts[parts.length - 1].length === 3) {
           clean = clean.replace(/\./g, '');
       }
       // Else leave it as dot (decimal)
    }

    const val = parseFloat(clean);
    return isNaN(val) ? undefined : val;
  };

  const handleAudioRecorded = async (base64: string, mimeType: string) => {
    setIsProcessing(true);
    try {
      const coachingData = await getNegotiationCoaching(data, { type: 'audio', data: base64, mimeType });
      setAdvice(coachingData);
      
      // If gemini detected a price
      if (coachingData.detected_price) {
        const detected = parsePrice(coachingData.detected_price);
        if (detected !== undefined) {
             if (sellerStartOffer === undefined) setSellerStartOffer(detected);
             // Update the final price box to the latest detected price
             setFinalAgreedPrice(detected.toFixed(2));
        }
      }
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
      
      const price = parsePrice(manualPrice);
      if (price !== undefined) {
         if (sellerStartOffer === undefined) setSellerStartOffer(price);
         // Update the final price box to the latest manual price
         setFinalAgreedPrice(price.toFixed(2));
      }
    } catch (error) {
      console.error("Failed to get coaching:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinalDealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalAgreedPrice) return;
    const final = parseFloat(finalAgreedPrice); // Input is always dot separated now
    if (!isNaN(final)) {
      onDealClosed(final, sellerStartOffer);
    }
  };

  const adjustFinalPrice = (direction: number) => {
    const current = parseFloat(finalAgreedPrice) || 0;
    
    // Determine step size based on current value magnitude
    let step = 1;
    if (current < 3) {
      step = 0.10;
    }

    const next = Math.max(0, current + (direction * step));
    // Use toFixed(2) to ensure clean currency formatting (e.g. "2.50" instead of "2.5")
    setFinalAgreedPrice(next.toFixed(2));
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
    <div className="w-full max-w-md mx-auto space-y-3 animate-in slide-in-from-bottom-4 duration-500">
      
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
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
         <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Pricing Strategy</h3>
         
         <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-slate-400">Retail New: <span className="line-through decoration-rose-400/50">{data.retail_price_new} €</span></span>
            <span className="text-xs text-slate-400">Range: <span className="text-slate-600 font-semibold">{data.price_range} €</span></span>
         </div>

         {/* Improved Price Visualizer */}
         <div className="mt-1 mb-2">
            {/* Visual Bar Row */}
            <div className="flex items-center justify-between relative mb-3 px-2">
                {/* The Line Background */}
                <div className="absolute left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-100 via-blue-100 to-rose-100 rounded-full top-1/2 -translate-y-1/2 -z-0"></div>
                
                {/* Dot 1 - Start */}
                <div className="relative z-10 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white shadow-sm"></div>
                {/* Dot 2 - Target */}
                <div className="relative z-10 w-5 h-5 bg-blue-600 rounded-full ring-4 ring-white shadow-md"></div>
                {/* Dot 3 - Max */}
                <div className="relative z-10 w-3 h-3 bg-rose-500 rounded-full ring-2 ring-white shadow-sm"></div>
            </div>

            {/* Labels Row - No Overlap */}
            <div className="flex justify-between items-start text-center">
                 <div className="text-left w-1/3 pr-1">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Start</p>
                    <p className="text-lg font-bold text-slate-700 leading-none">{data.suggested_offer_price} €</p>
                 </div>
                 
                 <div className="text-center w-1/3 px-1 relative -top-1">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider">Target</p>
                    <p className="text-xl font-black text-slate-900 leading-none">{data.flea_market_fair_price} €</p>
                 </div>

                 <div className="text-right w-1/3 pl-1">
                    <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Max</p>
                    <p className="text-lg font-bold text-slate-700 leading-none">{data.walk_away_price} €</p>
                 </div>
            </div>
         </div>

         {/* Reasoning */}
         <div className="mt-4 pt-2 border-t border-slate-50">
             <p className="text-xs text-slate-500 italic leading-snug">
               <span className="font-semibold text-blue-600 not-italic mr-1">Why:</span>
               {data.price_reasoning}
             </p>
         </div>
      </div>

      {/* Seller Offer Input Section */}
      <div className="bg-slate-900 rounded-2xl p-4 shadow-xl text-white">
        <div className="mb-2">
             <h3 className="font-bold flex items-center text-base mb-0.5">
                 <DollarSign className="w-4 h-4 mr-2 text-yellow-400" />
                 Ask for Price
             </h3>
             <p className="text-xs text-slate-400 leading-tight">
                Ask for the price and record the answer or enter the answer below.
             </p>
         </div>

         {!advice ? (
           <div className="space-y-2">
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
                     type="text" 
                     value={manualPrice}
                     onChange={(e) => setManualPrice(e.target.value)}
                     placeholder="Enter price..."
                     className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 font-bold text-base placeholder:font-normal placeholder:text-slate-500"
                   />
                   <button 
                     type="submit"
                     disabled={isProcessing || !manualPrice}
                     className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm"
                   >
                     {isProcessing ? '...' : 'Evaluate'}
                   </button>
               </form>
           </div>
         ) : (
           <div className={`rounded-xl border p-3 animate-in slide-in-from-bottom-2 ${getVerdictColor(advice.verdict)}`}>
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/20">
                  <div className="flex items-center space-x-2">
                      <div className="bg-white/20 p-1.5 rounded-full">
                         {advice.verdict === 'Buy Now' ? <CheckCircle2 className="w-4 h-4 text-white" /> : 
                          advice.verdict === 'Walk Away' ? <XCircle className="w-4 h-4 text-white" /> : 
                          <MessageCircle className="w-4 h-4 text-white" />}
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-white/80 tracking-wider">Verdict</p>
                        <p className="text-lg font-black text-white leading-none">{advice.verdict.toUpperCase()}</p>
                      </div>
                  </div>
                  {advice.detected_price && (
                    <div className="text-right">
                       <p className="text-[10px] text-white/80">Offer</p>
                       <p className="font-bold text-white">{advice.detected_price} €</p>
                    </div>
                  )}
              </div>
              
              <div className="space-y-2">
                 <div className="bg-black/20 rounded-lg p-2">
                     <p className="text-[10px] text-white/60 uppercase font-bold tracking-wider mb-0.5">Tip</p>
                     <p className="text-xs text-white font-medium leading-relaxed">"{advice.suggested_counter}"</p>
                 </div>
                 <button 
                   onClick={() => { setAdvice(null); setManualPrice(''); }}
                   className="w-full bg-white/20 hover:bg-white/30 text-white font-bold py-3 rounded-xl text-sm transition-all border border-white/20 flex items-center justify-center gap-2 shadow-sm"
                 >
                   <RefreshCw className="w-4 h-4" />
                   <span>Ask for New Offer</span>
                 </button>
              </div>
           </div>
         )}
      </div>

      {/* Final Deal Section - Only shows after initial seller offer is recorded */}
      {sellerStartOffer !== undefined && (
        <div className="pt-2 animate-in slide-in-from-top-4 duration-700">
           <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
               <h3 className="font-bold text-emerald-900 flex items-center mb-2">
                   <HandCoins className="w-4 h-4 mr-2 text-emerald-600" />
                   Close the Deal
               </h3>
               <form onSubmit={handleFinalDealSubmit} className="space-y-2">
                  <div>
                     <label className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Agreed Final Price</label>
                     <div className="flex items-center space-x-2 mt-1">
                        <button 
                          type="button"
                          onClick={() => adjustFinalPrice(-1)}
                          className="p-3 bg-white border border-emerald-200 rounded-xl text-emerald-700 hover:bg-emerald-100 active:scale-95 transition-all shadow-sm flex-shrink-0"
                        >
                            <Minus className="w-5 h-5" />
                        </button>
                        
                        <div className="relative flex-grow">
                            <input 
                            type="number" 
                            step="0.01"
                            value={finalAgreedPrice}
                            onChange={(e) => setFinalAgreedPrice(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-white border border-emerald-200 text-slate-900 rounded-xl px-2 py-3 focus:outline-none focus:border-emerald-500 font-bold text-2xl text-center shadow-inner pr-8"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">€</span>
                        </div>

                        <button 
                          type="button"
                          onClick={() => adjustFinalPrice(1)}
                          className="p-3 bg-white border border-emerald-200 rounded-xl text-emerald-700 hover:bg-emerald-100 active:scale-95 transition-all shadow-sm flex-shrink-0"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                     </div>
                  </div>
                  <button 
                    type="submit"
                    disabled={!finalAgreedPrice}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-3 rounded-xl shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:shadow-none transition-all transform active:scale-95 text-sm"
                  >
                    Confirm Purchase
                  </button>
               </form>
           </div>
        </div>
      )}

      {/* Negotiation Playbook */}
      <div className="space-y-3 pt-2 pb-24">
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