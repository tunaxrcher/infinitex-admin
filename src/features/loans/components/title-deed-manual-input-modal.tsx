'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { AlertTriangle, Check, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@src/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@src/shared/components/ui/dialog';
import { Input } from '@src/shared/components/ui/input';
import { Label } from '@src/shared/components/ui/label';
import { Progress } from '@src/shared/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@src/shared/components/ui/select';

interface Province {
  pvcode: string;
  pvnamethai: string;
  pvnameeng: string;
}

interface Amphur {
  pvcode: string;
  amcode: string;
  amnamethai: string;
  amnameeng: string;
}

interface TitleDeedManualInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSkip: (formData?: {
    pvCode: string;
    amCode: string;
    parcelNo: string;
  }) => void;
  onConfirm: (data: {
    pvCode: string;
    amCode: string;
    parcelNo: string;
  }) => Promise<void>;
  initialData?: {
    pvCode?: string;
    amCode?: string;
    parcelNo?: string;
  };
  errorMessage?: string;
  provinces: Province[];
  amphurs: Amphur[];
}

export function TitleDeedManualInputModal({
  isOpen,
  onClose,
  onSkip,
  onConfirm,
  initialData,
  errorMessage,
  provinces,
  amphurs,
}: TitleDeedManualInputModalProps) {
  const [selectedProvince, setSelectedProvince] = useState<string>(
    initialData?.pvCode || '',
  );
  const [selectedAmphur, setSelectedAmphur] = useState<string>(
    initialData?.amCode || '',
  );
  const [parcelNumber, setParcelNumber] = useState<string>(
    initialData?.parcelNo || '',
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchProgress, setSearchProgress] = useState<number>(0);

  // Filter amphurs based on selected province
  const filteredAmphurs = amphurs.filter(
    (amphur) => amphur.pvcode === selectedProvince && amphur.amcode !== '00',
  );

  // Reset amphur when province changes (but not if we have initial amCode)
  useEffect(() => {
    if (!initialData?.pvCode || !initialData?.amCode) {
      setSelectedAmphur('');
    }
  }, [selectedProvince, initialData?.pvCode, initialData?.amCode]);

  // Simulate progress bar during search
  useEffect(() => {
    if (isLoading) {
      setSearchProgress(0);
      const interval = setInterval(() => {
        setSearchProgress((prev) => {
          if (prev >= 97) {
            clearInterval(interval);
            return 97; // Wait at 97% until response
          }
          // Progress faster at start, slower near end
          const increment = prev < 50 ? 8 : prev < 80 ? 4 : 2;
          return Math.min(prev + increment, 97);
        });
      }, 300);

      return () => clearInterval(interval);
    } else {
      setSearchProgress(0);
    }
  }, [isLoading]);

  const handleConfirm = async () => {
    if (!selectedProvince || !selectedAmphur || !parcelNumber.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('การค้นหาข้อมูลใช้เวลานานเกินไป')),
          30000,
        ),
      );

      await Promise.race([
        onConfirm({
          pvCode: selectedProvince,
          amCode: selectedAmphur,
          parcelNo: parcelNumber.trim(),
        }),
        timeoutPromise,
      ]);

      // Complete the progress bar after receiving response
      setSearchProgress(100);

      // Show 100% completion for a moment before closing
      await new Promise((resolve) => setTimeout(resolve, 800));
    } catch (error) {
      console.error('[Modal] Confirm failed:', error);
      // Error handling is done in the parent component
      // Reset progress on error
      setSearchProgress(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    // Send current form data if any fields are filled
    if (selectedProvince || selectedAmphur || parcelNumber.trim()) {
      onSkip({
        pvCode: selectedProvince,
        amCode: selectedAmphur,
        parcelNo: parcelNumber.trim(),
      });
    } else {
      onSkip();
    }
  };

  const canConfirm =
    selectedProvince && selectedAmphur && parcelNumber.trim() && !isLoading;

  // Get province name for display
  const selectedProvinceName =
    provinces.find((p) => p.pvcode === selectedProvince)?.pvnamethai || '';

  return (
    <Dialog open={isOpen} onOpenChange={isLoading ? undefined : onClose}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
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
          <DialogTitle className="text-center text-xl gradientText">
            {initialData?.pvCode || initialData?.amCode || initialData?.parcelNo
              ? 'ตรวจสอบข้อมูลโฉนดที่ดิน'
              : 'กรอกข้อมูลโฉนดที่ดิน'}
          </DialogTitle>
          <DialogDescription>
            {/* กรอกข้อมูลบัญชีที่ต้องการเพิ่มเข้าระบบ */}
          </DialogDescription>
          <hr className="w-full border-border" />
        </DialogHeader>
        {isLoading && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
            <div className="flex flex-col items-center space-y-6 text-center px-6 py-8">
              {/* AI Loading Animation */}
              <Image
                src="/images/logo.png"
                alt="InfiniteX Logo"
                width={50}
                height={50}
                className="w-50 h-50 object-contain"
                priority
              />
              {/* Title */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold ai-gradient-text">
                  {searchProgress >= 100
                    ? 'ค้นหาข้อมูลสำเร็จ!'
                    : searchProgress >= 97
                      ? 'กำลังรอผลตอบกลับ...'
                      : 'AI กำลังค้นหาข้อมูลโฉนดที่ดิน'}
                </h3>
                <hr />
                <p className="text-sm text-muted-foreground">
                  {searchProgress >= 100
                    ? 'พบข้อมูลโฉนดที่ดินในระบบเรียบร้อยแล้ว'
                    : searchProgress >= 97
                      ? 'รอผลการตรวจสอบจากระบบกรมที่ดิน...'
                      : 'กำลังเชื่อมต่อกับระบบกรมที่ดิน กรุณารอสักครู่...'}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-xs space-y-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">
                    กำลังดำเนินการ...
                  </span>
                  <span className="font-medium">
                    {Math.round(searchProgress)}%
                  </span>
                </div>
                <Progress value={searchProgress} className="h-2" />

                {/* Progress Steps */}
                <div className="text-xs text-muted-foreground space-y-2 text-left">
                  {searchProgress > 10 && (
                    <div className="flex items-center animate-in fade-in slide-in-from-left-2">
                      <Check className="h-3 w-3 mr-2 text-green-400 flex-shrink-0" />
                      <span>เชื่อมต่อกับระบบกรมที่ดิน</span>
                    </div>
                  )}
                  {searchProgress > 30 && (
                    <div className="flex items-center animate-in fade-in slide-in-from-left-2">
                      <Check className="h-3 w-3 mr-2 text-green-400 flex-shrink-0" />
                      <span>
                        ตรวจสอบโฉนดเลขที่ {parcelNumber} จังหวัด{' '}
                        {selectedProvinceName}
                      </span>
                    </div>
                  )}
                  {searchProgress > 55 && (
                    <div className="flex items-center animate-in fade-in slide-in-from-left-2">
                      <Check className="h-3 w-3 mr-2 text-green-400 flex-shrink-0" />
                      <span>กำลังดึงข้อมูล</span>
                    </div>
                  )}
                  {searchProgress > 75 && (
                    <div className="flex items-center animate-in fade-in slide-in-from-left-2">
                      <Check className="h-3 w-3 mr-2 text-green-400 flex-shrink-0" />
                      <span>กำลังคำนวณข้อมูลพื้นที่</span>
                    </div>
                  )}
                  {searchProgress > 90 && searchProgress < 97 && (
                    <div className="flex items-center animate-in fade-in slide-in-from-left-2">
                      <Check className="h-3 w-3 mr-2 text-green-400 flex-shrink-0" />
                      <span>เกือบเสร็จสิ้น...</span>
                    </div>
                  )}
                  {searchProgress >= 97 && searchProgress < 100 && (
                    <div className="flex items-center animate-in fade-in slide-in-from-left-2">
                      <Loader2 className="h-3 w-3 mr-2 text-blue-400 flex-shrink-0 animate-spin" />
                      <span>กำลังรอผลตอบกลับจากระบบ...</span>
                    </div>
                  )}
                  {searchProgress >= 100 && (
                    <div className="flex items-center animate-in fade-in slide-in-from-left-2">
                      <Check className="h-3 w-3 mr-2 text-green-400 flex-shrink-0" />
                      <span className="font-medium text-green-400">
                        ค้นหาข้อมูลสำเร็จ!
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        <DialogHeader>
          <DialogDescription className="text-center">
            {isLoading
              ? 'กำลังค้นหาข้อมูลโฉนดจากระบบกรมที่ดิน กรุณารอสักครู่...'
              : initialData?.pvCode ||
                  initialData?.amCode ||
                  initialData?.parcelNo
                ? 'ระบบได้ตรวจสอบข้อมูลจากโฉนดแล้ว กรุณาตรวจสอบความถูกต้องเพิ่มเติมเพื่อยืนยันการค้นหาข้อมูล'
                : errorMessage ||
                  'ระบบไม่สามารถอ่านข้อมูลจากโฉนดได้ กรุณากรอกข้อมูลด้วยตนเอง'}
          </DialogDescription>
        </DialogHeader>
        <div
          className={`space-y-4 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          {/* Province Select - Always shown first */}
          <div className="space-y-2">
            <Label htmlFor="province">จังหวัด *</Label>
            <Select
              value={selectedProvince}
              onValueChange={setSelectedProvince}
              disabled={!!initialData?.pvCode || isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกจังหวัด" />
              </SelectTrigger>
              <SelectContent>
                {provinces
                  .filter((province) => province.pvcode !== '00')
                  .map((province) => (
                    <SelectItem key={province.pvcode} value={province.pvcode}>
                      {province.pvnamethai}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {/* {initialData?.pvCode && (
              <p className="text-xs text-blue-600">
                ✓ ระบบวิเคราะห์ได้: {selectedProvinceName}
              </p>
            )} */}
            {!selectedProvince && !initialData?.pvCode && !isLoading && (
              <p className="text-xs text-muted-foreground">
                กรุณาเลือกจังหวัดเพื่อดำเนินการต่อ
              </p>
            )}
          </div>
          <hr />

          {/* Amphur Select - Show only after province is selected */}
          {selectedProvince && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
              <Label htmlFor="amphur">
                อำเภอ *
                {initialData?.amCode && (
                  <span className="text-xs text-amber-600 font-normal ml-2">
                    (กรุณาตรวจเช็คความถูกต้อง)
                  </span>
                )}
                {filteredAmphurs.length > 0 && !initialData?.amCode && (
                  <span className="text-xs text-muted-foreground font-normal">
                    ({filteredAmphurs.length} อำเภอ)
                  </span>
                )}
              </Label>
              <Select
                value={selectedAmphur}
                onValueChange={setSelectedAmphur}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกอำเภอ" />
                </SelectTrigger>
                <SelectContent>
                  {filteredAmphurs.map((amphur) => (
                    <SelectItem key={amphur.amcode} value={amphur.amcode}>
                      {amphur.amnamethai}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* {initialData?.amCode && selectedAmphur === initialData.amCode && (
                <p className="text-xs text-blue-600">
                  ✓ ระบบวิเคราะห์ได้:{' '}
                  {
                    filteredAmphurs.find((a) => a.amcode === selectedAmphur)
                      ?.amnamethai
                  }
                </p>
              )} */}
              {filteredAmphurs.length === 0 && (
                <p className="text-xs text-amber-600">
                  ไม่พบข้อมูลอำเภอในจังหวัดนี้
                </p>
              )}
              {!selectedAmphur && filteredAmphurs.length > 0 && !isLoading && (
                <p className="text-xs text-muted-foreground">กรุณาเลือกอำเภอ</p>
              )}
            </div>
          )}

          {/* Parcel Number Input - Show only after amphur is selected */}
          {selectedProvince && selectedAmphur && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
              <Label htmlFor="parcelNo">
                เลขโฉนด *
                {initialData?.parcelNo && (
                  <span className="text-xs text-amber-600 font-normal ml-2">
                    (กรุณาตรวจเช็คความถูกต้อง)
                  </span>
                )}
              </Label>
              <Input
                id="parcelNo"
                value={parcelNumber}
                onChange={(e) => setParcelNumber(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canConfirm) {
                    handleConfirm();
                  }
                }}
                placeholder="กรอกเลขโฉนด"
                disabled={isLoading}
                autoFocus
              />
              {/* {initialData?.parcelNo &&
                parcelNumber === initialData.parcelNo && (
                  <p className="text-xs text-blue-600">
                    ✓ ระบบวิเคราะห์ได้: {parcelNumber}
                  </p>
                )} */}
              {!parcelNumber.trim() && !isLoading && (
                <p className="text-xs text-muted-foreground">
                  กรอกเลขโฉนดเพื่อค้นหาข้อมูล
                </p>
              )}
            </div>
          )}

          <hr />
          {/* Summary - Show when all fields are filled */}
          {selectedProvince &&
            selectedAmphur &&
            parcelNumber.trim() &&
            !isLoading && (
              <div className="bg-muted/50 rounded-lg p-3 animate-in slide-in-from-top-2 duration-300">
                <p className="text-sm font-medium mb-2">ข้อมูลที่จะค้นหา:</p>
                <div className="text-xs space-y-1">
                  <p>จังหวัด: {selectedProvinceName}</p>
                  <p>
                    อำเภอ:{' '}
                    {
                      filteredAmphurs.find((a) => a.amcode === selectedAmphur)
                        ?.amnamethai
                    }
                  </p>
                  <p>เลขโฉนด: {parcelNumber}</p>
                </div>
              </div>
            )}

          {/* Loading state message */}
          {isLoading && (
            <div className="text-center py-2">
              <p className="text-xs text-primary font-medium">
                กำลังประมวลผล กรุณาอย่าปิดหน้าต่างนี้
              </p>
            </div>
          )}
        </div>
        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={isLoading}
            className="flex-1"
          >
            ข้าม
          </Button>

          {/* Show confirm button only when all fields are filled */}
          {selectedProvince && selectedAmphur && parcelNumber.trim() && (
            <Button
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="flex-1 animate-in slide-in-from-right-2 duration-300 gradientButton"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังค้นหา...
                </>
              ) : (
                'ยืนยัน'
              )}
            </Button>
          )}

          {/* Show helper text when not all fields are filled */}
          {(!selectedProvince || !selectedAmphur || !parcelNumber.trim()) &&
            !isLoading && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs text-muted-foreground text-center">
                  {!selectedProvince
                    ? 'เลือกจังหวัดเพื่อดำเนินการต่อ'
                    : !selectedAmphur
                      ? 'เลือกอำเภอเพื่อดำเนินการต่อ'
                      : 'กรอกเลขโฉนดเพื่อค้นหาข้อมูล'}
                </p>
              </div>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
