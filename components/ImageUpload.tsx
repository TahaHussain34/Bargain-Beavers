import React, { useRef } from 'react';
import { Camera, Upload } from 'lucide-react';

interface ImageUploadProps {
  onImageSelected: (base64: string, previewUrl: string) => void;
  isCompact?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelected, isCompact = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Extract base64 data only (remove "data:image/jpeg;base64," prefix)
      const base64 = result.split(',')[1];
      onImageSelected(base64, result);
    };
    reader.readAsDataURL(file);
  };

  if (isCompact) {
    return (
      <div className="flex justify-center">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center space-x-2 bg-blue-600 active:bg-blue-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
        >
          <Camera className="w-5 h-5" />
          <span>Scan Another Item</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          capture="environment"
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />
      
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 transition-all hover:border-blue-500 hover:bg-blue-50"
      >
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="rounded-full bg-blue-100 p-4 text-blue-600 group-hover:bg-blue-200 transition-colors">
            <Camera className="h-10 w-10" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Take a Photo</h3>
            <p className="text-sm text-slate-500 mt-1">or upload from gallery</p>
          </div>
          <div className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            Supports fast negotiation
          </div>
        </div>
      </div>
    </div>
  );
};