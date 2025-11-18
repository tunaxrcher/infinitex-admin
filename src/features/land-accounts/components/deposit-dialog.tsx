'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDepositLandAccount } from '@src/features/land-accounts/hooks';
import {
  accountDepositSchema,
  type AccountDepositSchema,
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

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: { id: string; accountName: string } | null;
}

export function DepositDialog({
  open,
  onOpenChange,
  account,
}: DepositDialogProps) {
  const depositMutation = useDepositLandAccount();

  const form = useForm<AccountDepositSchema>({
    resolver: zodResolver(accountDepositSchema),
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

  const onSubmit = (data: AccountDepositSchema) => {
    depositMutation.mutate(data, {
      onSuccess: () => {
        form.reset();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เพิ่มเงินเข้าบัญชี</DialogTitle>
          <DialogDescription>
            เพิ่มเงินเข้าบัญชี: {account?.accountName}
          </DialogDescription>
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
              <Button type="submit" disabled={depositMutation.isPending}>
                {depositMutation.isPending ? 'กำลังบันทึก...' : 'เพิ่มเงิน'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
