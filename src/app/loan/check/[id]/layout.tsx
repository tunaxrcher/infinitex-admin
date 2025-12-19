// src/app/loan/check/[id]/layout.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ตรวจสอบสินเชื่อ | InfiniteX',
  description: 'หน้าตรวจสอบและอนุมัติสินเชื่อ',
};

export default function LoanCheckLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
