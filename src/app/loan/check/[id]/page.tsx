// src/app/loan/check/[id]/page.tsx
import { LoanCheckPage } from './components/loan-check-page';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LoanCheckPage loanApplicationId={id} />;
}

