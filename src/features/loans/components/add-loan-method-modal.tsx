'use client'

import Image from 'next/image'
import { PenTool, Sparkles, X } from 'lucide-react'
import { Button } from '@src/shared/components/ui/button'

interface AddLoanMethodModalProps {
  isOpen: boolean
  onClose: () => void
  onManualAdd: () => void
  onAIAdd: () => void
}

export function AddLoanMethodModal({
  isOpen,
  onClose,
  onManualAdd,
  onAIAdd,
}: AddLoanMethodModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Overlay Background - Click to close */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-5xl animate-in zoom-in-95 duration-200">
        <div className="relative">
          {/* Close Button */}
          {/* <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute -top-14 right-0 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white z-10 transition-all hover:scale-110"
          >
            <X className="h-6 w-6" />
          </Button> */}

          {/* Content Card */}
          <div className="rounded-3xl p-8 md:p-16 shadow-2xl">
            {/* Header */}
            {/* <div className="text-center mb-16">
              <div className="flex justify-center mb-8">
                <div className="w-24 h-24">
                  <Image
                    src="/images/logo.png"
                    alt="InfiniteX Logo"
                    width={96}
                    height={96}
                    className="w-full h-full object-contain"
                    priority
                  />
                </div>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold gradientText mb-4">
                เพิ่มสินเชื่อ
              </h2>
              <p className="text-lg text-muted-foreground">
                เลือกวิธีการเพิ่มสินเชื่อที่คุณต้องการ
              </p>
            </div> */}

            {/* Options Grid */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Manual Option */}
              <button
                onClick={() => {
                  onManualAdd()
                  onClose()
                }}
                className="group relative overflow-hidden rounded-3xl border-2 border-border hover:border-primary transition-all duration-300 p-10 text-left bg-card hover:shadow-2xl hover:scale-[1.02]"
              >
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent dark:from-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Content */}
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                    <PenTool className="h-8 w-8 text-slate-600 dark:text-slate-400" />
                  </div>

                  <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                    กรอกด้วยตัวเอง
                  </h3>

                  <p className="text-muted-foreground mb-6">
                    กรอกข้อมูลสินเชื่อด้วยตนเองทีละขั้นตอน
                    เหมาะสำหรับผู้ที่ต้องการความแม่นยำสูง
                  </p>

                  <div className="flex items-center text-sm text-muted-foreground space-x-4">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                      <span>ควบคุมทุกรายละเอียด</span>
                    </div>
                  </div>
                </div>

                {/* Arrow Icon */}
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg
                    className="w-6 h-6 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>
              </button>

              {/* AI Option */}
              <button
                onClick={() => {
                  onAIAdd()
                  onClose()
                }}
                className="group relative overflow-hidden rounded-3xl border-2 border-primary/50 hover:border-primary transition-all duration-300 p-10 text-left bg-gradient-to-br from-primary/5 to-transparent hover:shadow-2xl hover:shadow-primary/30 hover:scale-[1.02]"
              >
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Sparkle Animation */}
                <div className="absolute top-4 right-4 opacity-50 group-hover:opacity-100 transition-opacity">
                  <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 group-hover:from-primary/30 group-hover:to-primary/10 transition-all">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-2xl font-bold ai-gradient-text">
                      กรอกโดย AI
                    </h3>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
                      แนะนำ
                    </span>
                  </div>

                  <p className="text-muted-foreground mb-6">
                    อัพโหลดรูปโฉนดแล้วให้ AI วิเคราะห์และกรอกข้อมูลให้อัตโนมัติ
                    รวดเร็วและแม่นยำ
                  </p>

                  <div className="flex items-center text-sm text-muted-foreground space-x-4">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-primary mr-2" />
                      <span>ประหยัดเวลา</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-primary mr-2" />
                      <span>แม่นยำสูง</span>
                    </div>
                  </div>
                </div>

                {/* Arrow Icon */}
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg
                    className="w-6 h-6 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

