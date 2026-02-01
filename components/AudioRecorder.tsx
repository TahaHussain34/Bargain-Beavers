import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2, Sparkles } from 'lucide-react';

interface AudioRecorderProps {
  onAudioRecorded: (base64: string, mimeType: string) => void;
  isProcessing: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onAudioRecorded, isProcessing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          onAudioRecorded(base64, 'audio/webm');
        };
        reader.readAsDataURL(blob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please ensure permissions are granted.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  if (isProcessing) {
    return (
      <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center space-y-2 animate-pulse">
        <Sparkles className="w-5 h-5 text-blue-500 animate-spin" />
        <p className="text-xs font-bold text-slate-500">Analyzing...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {!isRecording ? (
        <button
          onClick={startRecording}
          className="w-full bg-white hover:bg-slate-50 text-slate-900 p-4 rounded-xl flex items-center justify-center space-x-3 transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)] hover:shadow-[0_0_20px_rgba(255,255,255,0.25)] active:scale-95 group"
        >
          <div className="p-2 bg-blue-100 group-hover:bg-blue-200 rounded-full transition-colors">
            <Mic className="w-5 h-5 text-blue-700" />
          </div>
          <div className="text-left">
            <p className="text-base font-black">Record Seller's Answer</p>
            <p className="text-xs text-slate-500 font-medium">Tap to start listening</p>
          </div>
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="w-full bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white p-4 rounded-xl flex items-center justify-center space-x-3 transition-all shadow-lg shadow-rose-900/50 animate-pulse"
        >
          <Square className="w-5 h-5 fill-current" />
          <span className="font-bold text-base">Stop Recording</span>
        </button>
      )}
    </div>
  );
};