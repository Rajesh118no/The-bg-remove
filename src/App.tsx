/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Moon, Sun, Upload, Image as ImageIcon, Download, Loader2, Trash2 } from 'lucide-react';
import { removeBackground as imglyRemoveBackground, Config } from '@imgly/background-removal';
import { cn } from './lib/utils';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize theme based on system preference
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    setError(null);
    setProcessedImage(null);
    setProgress(0);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const removeBackground = async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const config: Config = {
        progress: (key, current, total) => {
          const percent = Math.round((current / total) * 100);
          setProgress(percent);
        },
      };

      const imageBlob = await fetch(originalImage).then((r) => r.blob());
      const blob = await imglyRemoveBackground(imageBlob, config);
      const url = URL.createObjectURL(blob);
      setProcessedImage(url);
    } catch (err) {
      console.error('Error removing background:', err);
      setError('Failed to remove background. Please try again with a different image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const reset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;
    
    const a = document.createElement('a');
    a.href = processedImage;
    a.download = 'background-removed.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <ImageIcon size={18} />
            </div>
            <h1 className="font-semibold text-lg tracking-tight">BgRemover</h1>
          </div>
          
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 flex flex-col">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Remove Image Background
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            100% automatically and free. Works locally in your browser so your images never leave your device.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {!originalImage ? (
          <div
            className={cn(
              "flex-1 min-h-[400px] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-8 transition-all duration-200",
              isDragging 
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10" 
                : "border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-900/50"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4">
              <Upload size={32} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Upload an image</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-center">
              Drag and drop a file here, or click to browse
            </p>
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm">
              Select File
            </button>
            <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
              Supports JPG, PNG, WebP
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <button 
                onClick={reset}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                <Trash2 size={16} />
                Start over
              </button>
              
              {!processedImage && !isProcessing && (
                <button 
                  onClick={removeBackground}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2"
                >
                  Remove Background
                </button>
              )}
              
              {processedImage && (
                <button 
                  onClick={downloadImage}
                  className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2"
                >
                  <Download size={18} />
                  Download HD
                </button>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Original Image */}
              <div className="flex flex-col gap-3">
                <h3 className="font-medium text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider">Original</h3>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden aspect-square flex items-center justify-center relative border border-slate-200 dark:border-slate-700">
                  <img 
                    src={originalImage} 
                    alt="Original" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>

              {/* Processed Image */}
              <div className="flex flex-col gap-3">
                <h3 className="font-medium text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider">Result</h3>
                <div className="bg-checkerboard rounded-2xl overflow-hidden aspect-square flex items-center justify-center relative border border-slate-200 dark:border-slate-700">
                  {processedImage ? (
                    <img 
                      src={processedImage} 
                      alt="Processed" 
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : isProcessing ? (
                    <div className="flex flex-col items-center gap-4 bg-white/80 dark:bg-slate-900/80 p-6 rounded-2xl backdrop-blur-sm">
                      <Loader2 size={32} className="animate-spin text-blue-600" />
                      <div className="text-center">
                        <p className="font-medium mb-1">Removing background...</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {progress > 0 ? `Loading models... ${progress}%` : 'Initializing...'}
                        </p>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-2">
                        <div 
                          className="h-full bg-blue-600 transition-all duration-300 ease-out"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 dark:text-slate-500 flex flex-col items-center gap-3">
                      <ImageIcon size={48} className="opacity-20" />
                      <p>Click "Remove Background" to process</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
