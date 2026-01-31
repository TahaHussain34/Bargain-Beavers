import React, { useState } from 'react';
import { ImageUpload } from './components/ImageUpload';
import { AnalysisResult } from './components/AnalysisResult';
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

  return (
    <div className="min-h-screen pb-12 flex flex-col items-center">
      {/* Navbar */}
      <div className="w-full bg-white border-b border-slate-200 sticky top-0 z-10 safe-top">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-slate-800 tracking-tight">FleaMarket Hero</h1>
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
            <AnalysisResult data={state.data} imagePreview={state.imagePreview} />
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