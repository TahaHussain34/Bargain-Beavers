import React, { useState } from 'react';
import { ImageUpload } from './components/ImageUpload';
import { AnalysisResult } from './components/AnalysisResult';
import { SuccessPage } from './components/SuccessPage';
import { Loader } from './components/Loader';
import { analyzeItemImage } from './services/geminiService';
import { AnalysisState } from './types';
import { ShoppingBag, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AnalysisState>({
    status: 'idle',
    data: null,
  });

  const handleImageSelected = async (base64: string, previewUrl: string) => {
    setState({ status: 'analyzing', data: null, imagePreview: previewUrl });
    
    try {
      const data = await analyzeItemImage(base64);
      setState({ status: 'success', data, imagePreview: previewUrl });
    } catch (error) {
      console.error(error);
      setState({ 
        status: 'error', 
        data: null, 
        imagePreview: previewUrl,
        error: "Couldn't analyze this item. Try a clearer photo." 
      });
    }
  };

  const handleReset = () => {
    setState({ status: 'idle', data: null });
  };

  const parsePriceString = (priceStr: string): number => {
    if (!priceStr) return 0;
    // Remove all currency symbols, spaces, etc.
    let clean = priceStr.replace(/[^\d.,-]/g, ''); 
    if (!clean || clean === '-') return 0;

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

    return parseFloat(clean) || 0;
  };

  const handleDealClosed = (finalPrice: number, sellerStartOffer?: number) => {
    if (!state.data) return;

    const retailPrice = parsePriceString(state.data.retail_price_new);
    const retailSavings = retailPrice - finalPrice;
    const negotiationSavings = sellerStartOffer ? (sellerStartOffer - finalPrice) : 0;

    setState({
        ...state,
        status: 'deal_closed',
        finalDealStats: {
            finalPrice,
            retailPrice,
            retailSavings,
            negotiationSavings,
            itemName: state.data.item_name,
            imagePreview: state.imagePreview
        }
    });
  };

  // Render Success Page if deal is closed
  if (state.status === 'deal_closed' && state.finalDealStats) {
      return <SuccessPage stats={state.finalDealStats} onReset={handleReset} />;
  }

  return (
    <div className="min-h-screen pb-12 flex flex-col items-center">
      {/* Navbar */}
      <div className="w-full bg-white border-b border-slate-200 sticky top-0 z-10 safe-top">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-slate-800 tracking-tight">apprAIser</h1>
          </div>
          {state.status === 'success' && (
             <button 
               onClick={handleReset}
               className="text-xs font-semibold text-blue-600 hover:text-blue-700"
             >
               New Scan
             </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="w-full max-w-md px-4 pt-6 flex-grow flex flex-col">
        
        {state.status === 'idle' && (
          <div className="flex-grow flex flex-col justify-center space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                Don't Overpay.<br/>
                <span className="text-blue-600">Ever Again.</span>
              </h2>
              <p className="text-slate-500 text-lg leading-relaxed">
                Snap a photo. Get instant fair prices and street-smart negotiation tactics.
              </p>
            </div>
            <ImageUpload onImageSelected={handleImageSelected} />
            
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-800">10s</p>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Analysis</p>
              </div>
              <div className="text-center border-l border-slate-100">
                <p className="text-2xl font-bold text-slate-800">AI</p>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Valuation</p>
              </div>
              <div className="text-center border-l border-slate-100">
                <p className="text-2xl font-bold text-slate-800">$$$</p>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Saved</p>
              </div>
            </div>
          </div>
        )}

        {state.status === 'analyzing' && (
          <div className="flex-grow flex items-center justify-center">
            <Loader />
          </div>
        )}

        {state.status === 'error' && (
          <div className="flex-grow flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95 duration-300">
            <div className="p-4 bg-rose-50 rounded-full">
              <AlertCircle className="w-12 h-12 text-rose-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Scan Failed</h3>
            <p className="text-slate-500">{state.error}</p>
            <button 
              onClick={handleReset}
              className="mt-4 bg-slate-900 text-white px-6 py-2 rounded-full font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {state.status === 'success' && state.data && (
          <div className="space-y-6 pb-20">
            <AnalysisResult 
                data={state.data} 
                imagePreview={state.imagePreview} 
                onDealClosed={handleDealClosed}
            />
          </div>
        )}

      </main>

      {/* Sticky Bottom Action for Success State */}
      {state.status === 'success' && (
        <div className="fixed bottom-6 z-20 w-full max-w-md px-4">
           <ImageUpload onImageSelected={handleImageSelected} isCompact />
        </div>
      )}
      
    </div>
  );
};

export default App;