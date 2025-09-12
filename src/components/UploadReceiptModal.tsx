'use client';

import { useState } from 'react';
import { X, UploadCloud } from 'lucide-react';

interface UploadReceiptModalProps {
  onClose: () => void;
  onCreated: (expense: any) => void;
}

export default function UploadReceiptModal({ onClose, onCreated }: UploadReceiptModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rawText, setRawText] = useState('');

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const f = e.target.files?.[0] || null;
    setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!file) {
      setError('Please choose an image of the receipt.');
      return;
    }
    setLoading(true);
    try {
      // Client-side OCR (dynamic import to play nice with Turbopack)
      const Tesseract = await import('tesseract.js');
      const workerRes = await Tesseract.recognize(file, 'eng');
      const text = workerRes.data.text?.trim() || '';
      if (!text) {
        setError('Could not read text from the image.');
        return;
      }
      setRawText(text);

      // Send text for categorization + saving
      const res = await fetch('/api/ocr/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Failed to categorize receipt');
        return;
      }
      onCreated(data.expense);
      onClose();
    } catch (err) {
      setError('Network error, please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-md w-full border border-slate-700">
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Scan Receipt</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-300">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded">{error}</div>
          )}
          <div className="flex items-center justify-center w-full">
            <label htmlFor="file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer border-slate-600 hover:border-blue-500 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="h-8 w-8 text-slate-400" />
                <p className="mb-2 text-sm text-slate-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-slate-500">PNG, JPG or JPEG</p>
              </div>
              <input id="file" type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            </label>
          </div>
          {file && (
            <p className="text-xs text-slate-400">Selected: {file.name}</p>
          )}
          <div className="flex space-x-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded-md hover:bg-slate-700 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">{loading ? 'Scanning...' : 'Scan & Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}


