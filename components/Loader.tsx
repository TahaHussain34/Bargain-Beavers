import React from 'react';
import { ScanSearch, Loader2 } from 'lucide-react';

export const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 animate-in fade-in duration-500">
      <div className="relative">
        <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20 animate-ping"></div>
        <div className="relative bg-white p-4 rounded-full shadow-xl border-4 border-blue-100">
          <ScanSearch className="w-12 h-12 text-blue-600 animate-pulse" />
        </div>
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-slate-800">Analyzing Item...</h3>
        <div className="flex items-center justify-center space-x-2 text-slate-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Checking online markets</span>
        </div>
        <p className="text-xs text-slate-400">Identifying brand & flaws...</p>
      </div>
    </div>
  );
};