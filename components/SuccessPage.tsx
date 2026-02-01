import React from 'react';
import { FinalDealStats } from '../types';
import { Trophy, TrendingDown, RefreshCw, ShoppingBag } from 'lucide-react';

interface SuccessPageProps {
  stats: FinalDealStats;
  onReset: () => void;
}

export const SuccessPage: React.FC<SuccessPageProps> = ({ stats, onReset }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 animate-in fade-in zoom-in-95 duration-500">
      
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Header with Confetti vibes */}
        <div className="bg-emerald-500 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
                <div className="absolute top-4 left-4 w-12 h-12 rounded-full bg-white"></div>
                <div className="absolute bottom-8 right-12 w-20 h-20 rounded-full bg-white"></div>
                <div className="absolute top-1/2 left-1/3 w-8 h-8 rounded-full bg-white"></div>
            </div>
            
            <div className="relative z-10 flex flex-col items-center">
                <div className="bg-white p-4 rounded-full shadow-lg mb-4">
                    <Trophy className="w-10 h-10 text-yellow-500 fill-yellow-500" />
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight mb-1">DEAL MADE!</h1>
                <p className="text-emerald-100 font-medium">You bought {stats.itemName}</p>
            </div>
        </div>

        <div className="p-6 space-y-6">
            
            {/* Final Price Big */}
            <div className="text-center">
                <p className="text-sm text-slate-400 font-semibold uppercase tracking-wider">Final Price</p>
                <p className="text-5xl font-black text-slate-800 tracking-tighter">{stats.finalPrice.toFixed(2)} €</p>
            </div>

            {/* Savings Cards */}
            <div className="grid grid-cols-1 gap-3">
                
                {/* Retail Savings */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <ShoppingBag className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">Saved vs Retail</p>
                            <p className="text-xs text-slate-400 line-through">{stats.retailPrice.toFixed(2)} €</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className={`text-xl font-bold ${stats.retailSavings > 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                            {stats.retailSavings > 0 ? '-' : ''}{Math.abs(stats.retailSavings).toFixed(2)} €
                        </p>
                    </div>
                </div>

                {/* Negotiation Savings (only if start offer existed and was higher) */}
                {stats.negotiationSavings > 0 && (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="bg-purple-100 p-2 rounded-lg">
                                <TrendingDown className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Negotiated Down</p>
                                <p className="text-xs text-slate-400">From Seller's Ask</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-bold text-emerald-600">
                                -{stats.negotiationSavings.toFixed(2)} €
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div className="pt-4">
                <button 
                  onClick={onReset}
                  className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 transition-transform active:scale-95 shadow-lg"
                >
                    <RefreshCw className="w-5 h-5" />
                    <span>Scan Another Item</span>
                </button>
            </div>

        </div>
      </div>
    </div>
  );
};