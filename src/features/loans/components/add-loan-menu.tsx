'use client';

import { PenTool, PlusIcon, Sparkles } from 'lucide-react';
import { Button } from '@src/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@src/shared/components/ui/dropdown-menu';

interface AddLoanMenuProps {
  onManualAdd: () => void;
  onAIAdd: () => void;
}

export function AddLoanMenu({ onManualAdd, onAIAdd }: AddLoanMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="mono" className="gap-2 gradientButton">
          <PlusIcon className="h-4 w-4" />
          เพิ่มสินเชื่อ
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={onManualAdd} className="cursor-pointer">
          <PenTool className="h-4 w-4 mr-2" />
          <div className="flex flex-col">
            <span className="font-medium">กรอกด้วยตัวเอง</span>
            <span className="text-xs text-muted-foreground">
              กรอกข้อมูลด้วยตนเอง
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAIAdd} className="cursor-pointer">
          <Sparkles className="h-4 w-4 mr-2 text-primary" />
          <div className="flex flex-col">
            <span className="font-medium ai-gradient-text">AI</span>
            <span className="text-xs text-muted-foreground">
              อัพโหลดโฉนดให้ AI วิเคราะห์
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
