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
      <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center space-y-2 animate-pulse">
        <Sparkles className="w-6 h-6 text-blue-500 animate-spin" />
        <p className="text-xs font-bold text-slate-500">Analyzing Seller's Tone...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {!isRecording ? (
        <button
          onClick={startRecording}
          className="w-full bg-slate-800 hover:bg-slate-900 active:bg-black text-white p-4 rounded-xl flex items-center justify-center space-x-3 transition-all shadow-md active:scale-95"
        >
          <div className="p-1.5 bg-slate-700 rounded-full">
            <Mic className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold">Record Seller's Answer</p>
            <p className="text-xs text-slate-400">Get an instant counter-tactic</p>
          </div>
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="w-full bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white p-4 rounded-xl flex items-center justify-center space-x-3 transition-all shadow-md animate-pulse"
        >
          <Square className="w-5 h-5 fill-current" />
          <span className="font-bold">Stop Recording</span>
        </button>
      )}
    </div>
  );
};