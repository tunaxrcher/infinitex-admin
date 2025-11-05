'use client';

import { useState } from 'react';
import { Button } from '@src/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@src/shared/components/ui/dialog';
import { Label } from '@src/shared/components/ui/label';
import { Textarea } from '@src/shared/components/ui/textarea';

interface RejectLoanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reviewNotes: string) => void;
  isLoading?: boolean;
}

export function RejectLoanDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: RejectLoanDialogProps) {
  const [reviewNotes, setReviewNotes] = useState('');

  const handleConfirm = () => {
    if (!reviewNotes.trim()) {
      alert('กรุณาระบุเหตุผลการยกเลิก');
      return;
    }
    onConfirm(reviewNotes);
    setReviewNotes(''); // Reset after confirm
  };

  const handleCancel = () => {
    setReviewNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>ยกเลิกสินเชื่อ</DialogTitle>
          <DialogDescription>
            กรุณาระบุเหตุผลการยกเลิกสินเชื่อ ข้อมูลนี้จะถูกบันทึกไว้ในระบบ
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="reviewNotes" className="text-sm">
              เหตุผลการยกเลิก <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reviewNotes"
              placeholder="ระบุเหตุผล เช่น เอกสารไม่ครบถ้วน, ข้อมูลไม่ถูกต้อง, ลูกค้าขอยกเลิก..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="min-h-[120px]"
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            ยกเลิก
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading || !reviewNotes.trim()}
          >
            {isLoading ? 'กำลังบันทึก...' : 'ยืนยันการยกเลิก'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

