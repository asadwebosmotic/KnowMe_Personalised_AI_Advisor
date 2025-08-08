import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, File, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadedFile {
  name: string;
  size: number;
  uploadedAt: Date;
}

interface FileUploadProps {
  onFileUpload: (file: File) => Promise<{ filename: string; chunks_stored: number; message: string }>;
  onFileDelete: (filename: string) => Promise<void>;
  uploadedFiles: UploadedFile[];
  isUploading: boolean;
}

export const FileUpload = ({ onFileUpload, onFileDelete, uploadedFiles, isUploading }: FileUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.includes('pdf')) {
      setUploadStatus({ type: 'error', message: 'Only PDF files are supported' });
      return;
    }

    try {
      const result = await onFileUpload(file);
      setUploadStatus({ 
        type: 'success', 
        message: `Successfully uploaded ${result.filename} (${result.chunks_stored} chunks stored)` 
      });
      setTimeout(() => setUploadStatus(null), 5000);
    } catch (error) {
      setUploadStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Upload failed' 
      });
      setTimeout(() => setUploadStatus(null), 5000);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileDelete = async (filename: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${filename}"?`);
    if (confirmed) {
      try {
        await onFileDelete(filename);
        setUploadStatus({ type: 'success', message: `Successfully deleted ${filename}` });
        setTimeout(() => setUploadStatus(null), 3000);
      } catch (error) {
        setUploadStatus({ 
          type: 'error', 
          message: error instanceof Error ? error.message : 'Delete failed' 
        });
        setTimeout(() => setUploadStatus(null), 5000);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Status */}
      {uploadStatus && (
        <div className={cn(
          "flex items-center gap-2 p-3 rounded-lg",
          uploadStatus.type === 'success' 
            ? "bg-emerald-green bg-opacity-10 text-emerald-green border border-emerald-green border-opacity-20"
            : "bg-error-red bg-opacity-10 text-error-red border border-error-red border-opacity-20"
        )}>
          {uploadStatus.type === 'success' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span className="text-sm">{uploadStatus.message}</span>
        </div>
      )}

      {/* Drag & Drop Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
          dragActive 
            ? "border-primary-indigo bg-primary-indigo bg-opacity-5" 
            : "border-border-light hover:border-primary-indigo",
          isUploading && "opacity-50 pointer-events-none"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 text-text-secondary mx-auto mb-4" />
        <p className="text-text-primary font-medium mb-2">
          Drag & drop your PDF here, or{" "}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-primary-indigo hover:underline"
            disabled={isUploading}
          >
            browse files
          </button>
        </p>
        <p className="text-text-secondary text-sm">PDF files only</p>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          className="hidden"
          disabled={isUploading}
        />
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-text-primary">Uploaded Documents</h4>
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div className="flex items-center gap-3">
                <File className="w-4 h-4 text-text-secondary" />
                <div>
                  <p className="text-sm font-medium text-text-primary">{file.name}</p>
                  <p className="text-xs text-text-secondary">
                    {formatFileSize(file.size)} • Uploaded {file.uploadedAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => handleFileDelete(file.name)}
                variant="ghost"
                size="sm"
                className="text-error-red hover:text-error-red hover:bg-error-red hover:bg-opacity-10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};