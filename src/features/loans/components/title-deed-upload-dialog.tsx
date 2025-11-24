'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { AlertTriangle, Loader2, Sparkles, Upload, X } from 'lucide-react';
import { Button } from '@src/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@src/shared/components/ui/dialog';
import { Progress } from '@src/shared/components/ui/progress';

interface TitleDeedUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (result: any) => void;
  onSkip: () => void;
}

export function TitleDeedUploadDialog({
  isOpen,
  onClose,
  onUploadComplete,
  onSkip,
}: TitleDeedUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('ไฟล์มีขนาดใหญ่เกิน 10MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    setError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 200);

      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/loans/title-deed/analyze', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการวิเคราะห์โฉนด');
      }

      const result = await response.json();

      // Wait a moment to show 100% progress
      await new Promise((resolve) => setTimeout(resolve, 500));

      onUploadComplete(result);
    } catch (err: any) {
      clearInterval(progressInterval!);
      console.error('[TitleDeedUpload] Upload failed:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการอัพโหลด');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      handleRemoveFile();
      setError(null);
      setUploadProgress(0);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" showCloseButton={!isUploading}>
        <DialogHeader className="flex flex-col items-center gap-4 pb-4">
          <div className="flex justify-center">
            <Image
              src="/images/logo.png"
              alt="Logo"
              width={120}
              height={40}
              className="object-contain"
            />
          </div>
          <DialogTitle className="text-center gradientText">
            อัพโหลดโฉนดที่ดิน
          </DialogTitle>
          <DialogDescription className="text-center">
            อัพโหลดรูปโฉนดเพื่อให้ AI วิเคราะห์ข้อมูลโดยอัตโนมัติ
          </DialogDescription>
          <hr className="w-full border-border" />
        </DialogHeader>

        <div className="space-y-4">
          {!selectedFile && !isUploading && (
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">คลิกเพื่ออัพโหลดรูปโฉนด</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    รองรับไฟล์ JPG, PNG (สูงสุด 10MB)
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedFile && !isUploading && (
            <div className="space-y-3">
              <div className="relative rounded-lg overflow-hidden border-2 border-primary">
                <img
                  src={previewUrl!}
                  alt="Preview"
                  className="w-full h-64 object-contain bg-accent/50"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">
                  ไฟล์: <span className="font-medium">{selectedFile.name}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  ขนาด:{' '}
                  <span className="font-medium">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </p>
              </div>
            </div>
          )}

          {isUploading && (
            <div className="space-y-4 py-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-16 h-16">
                  <Image
                    src="/images/logo.png"
                    alt="Loading"
                    width={64}
                    height={64}
                    className="w-full h-full object-contain animate-pulse"
                  />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-sm font-semibold ai-gradient-text">
                    AI กำลังวิเคราะห์โฉนด...
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    กรุณารอสักครู่ ระบบกำลังประมวลผลข้อมูล
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">
                    กำลังดำเนินการ...
                  </span>
                  <span className="font-medium">
                    {Math.round(uploadProgress)}%
                  </span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        <DialogFooter className="flex gap-2">
          {/* <Button
            variant="outline"
            onClick={onSkip}
            disabled={isUploading}
            className="flex-1"
          >
            กรอกด้วยตัวเอง
          </Button> */}
          {selectedFile && !isUploading && (
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="flex-1 gradientButton"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              วิเคราะห์ด้วย AI
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
