"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, File, X, CheckCircle } from "lucide-react";
import { cn, formatFileSize, isValidFileType } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  acceptedTypes?: string[];
  maxSize?: number; // in bytes
  className?: string;
}

export default function FileUpload({
  onFileSelect,
  acceptedTypes = ["application/pdf"],
  maxSize = 10 * 1024 * 1024, // 10MB
  className,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFile = (file: File) => {
    setError(null);

    // Validate file type
    if (!isValidFileType(file, acceptedTypes)) {
      setError("Please upload a PDF file only.");
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      setError(`File size must be less than ${formatFileSize(maxSize)}.`);
      return;
    }

    setUploadedFile(file);
    onFileSelect(file);

    // Simulate upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setUploadProgress(0);
    setError(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("w-full", className)}>
      {!uploadedFile ? (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
            dragActive
              ? "border-blue-400 bg-blue-50"
              : "border-gray-300 hover:border-blue-400 hover:bg-blue-50",
            error && "border-red-300 bg-red-50"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.join(",")}
            onChange={handleFileInput}
            className="hidden"
          />
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-1">
            Drag and drop a PDF file here, or click to select
          </p>
          <p className="text-xs text-gray-500">
            Maximum file size: {formatFileSize(maxSize)}
          </p>
        </div>
      ) : (
        <div className="border border-green-200 rounded-lg p-4 bg-green-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <File className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  {uploadedFile.name}
                </p>
                <p className="text-xs text-green-600">
                  {formatFileSize(uploadedFile.size)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {uploadProgress === 100 ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
              )}
              <button
                onClick={removeFile}
                className="text-green-600 hover:text-green-800 transition-colors"
                aria-label="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          {uploadProgress < 100 && (
            <div className="mt-2 w-full bg-green-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
