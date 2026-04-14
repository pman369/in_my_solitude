"use client";

import { useState } from "react";
import { Upload, FileText, AlertCircle } from "lucide-react";

interface FileDropZoneProps {
  accept:       string          // e.g. 'image/*' or 'application/pdf'
  maxSizeMB:    number
  onFileSelect: (file: File) => void
  label:        string
  preview?:     string | null   // image preview URL
  fileName?:    string          // PDF file name after selection
  error?:       string | null
}

export function FileDropZone({
  accept, maxSizeMB, onFileSelect, label, preview, fileName, error
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndSelect(file);
  }

  function validateAndSelect(file: File) {
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File must be under ${maxSizeMB}MB`);
      return;
    }
    // Simple extension check based on accept
    if (accept === 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please upload a PDF file');
      return;
    }
    onFileSelect(file);
  }

  return (
    <div className="space-y-2">
      <div
        className={`
          relative border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer
          flex flex-col items-center justify-center p-6 min-h-[160px] text-center
          ${isDragging ? 'border-[#C9A84C] bg-[#C9A84C]/5' : 'border-[#2A2A2A] hover:border-[#C9A84C]/40 bg-[#141414]'}
          ${(preview || fileName) ? 'border-solid border-[#C9A84C]/20' : ''}
          ${error ? 'border-red-500/50 bg-red-500/5' : ''}
        `}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById(`file-${label}`)?.click()}
        role="button"
        tabIndex={0}
        aria-label={`Upload ${label}`}
      >
        <input
          id={`file-${label}`}
          type="file"
          accept={accept}
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) validateAndSelect(file);
          }}
        />

        {/* Cover image preview */}
        {preview && (
          <div className="absolute inset-2 z-10 rounded-lg overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Cover preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
               <p className="text-white text-xs font-bold uppercase tracking-widest">Change Image</p>
            </div>
          </div>
        )}

        {/* PDF file name */}
        {fileName && !preview && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#C9A84C]/10 flex items-center justify-center text-[#C9A84C]">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#F0EDE6] max-w-[200px] truncate">{fileName}</p>
              <p className="text-[10px] uppercase tracking-widest text-[#9A9088]">PDF File Loaded</p>
            </div>
          </div>
        )}

        {/* Default state */}
        {!preview && !fileName && (
          <>
            <div className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center mb-4 text-[#9A9088] group-hover:text-[#C9A84C] transition-colors">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-sm text-[#F0EDE6] font-medium mb-1">Drag & drop or click to upload</p>
            <p className="text-xs text-[#9A9088]">{label} · Max {maxSizeMB}MB</p>
          </>
        )}
      </div>
      
      {error && (
        <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1 font-bold uppercase tracking-widest">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}
