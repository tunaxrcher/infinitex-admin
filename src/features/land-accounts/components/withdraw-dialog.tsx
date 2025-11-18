'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { zodResolver } from '@hookform/resolvers/zod';
import { useWithdrawLandAccount } from '@src/features/land-accounts/hooks';
import {
  accountWithdrawSchema,
  type AccountWithdrawSchema,
} from '@src/features/land-accounts/validations';
import { useForm } from 'react-hook-form';
import { Button } from '@src/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@src/shared/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@src/shared/components/ui/form';
import { Input } from '@src/shared/components/ui/input';

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: { id: string; accountName: string; accountBalance: number } | null;
}

export function WithdrawDialog({
  open,
  onOpenChange,
  account,
}: WithdrawDialogProps) {
  const withdrawMutation = useWithdrawLandAccount();

  const form = useForm<AccountWithdrawSchema>({
    resolver: zodResolver(accountWithdrawSchema),
    defaultValues: {
      accountId: '',
      amount: 0,
      note: '',
    },
  });

  useEffect(() => {
    if (account && open) {
      form.reset({
        accountId: account.id,
        amount: 0,
        note: '',
      });
    }
  }, [account, open, form]);

  const onSubmit = (data: AccountWithdrawSchema) => {
    withdrawMutation.mutate(data, {
      onSuccess: () => {
        form.reset();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
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
            ลดเงินออกจากบัญชี
          </DialogTitle>
          <DialogDescription>
            {' '}
            ลดเงินออกจากบัญชี: {account?.accountName} (คงเหลือ: ฿
            {account?.accountBalance.toLocaleString('th-TH', {
              minimumFractionDigits: 2,
            })}
            )
          </DialogDescription>
          <hr className="w-full border-border" />
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>จำนวนเงิน</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>หมายเหตุ (ถ้ามี)</FormLabel>
                  <FormControl>
                    <Input placeholder="กรอกหมายเหตุ" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                className="gradientButton"
                disabled={withdrawMutation.isPending}
              >
                {withdrawMutation.isPending ? 'กำลังบันทึก...' : 'ลดเงิน'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
