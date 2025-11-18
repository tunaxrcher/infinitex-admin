'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTransferLandAccount } from '@src/features/land-accounts/hooks';
import {
  accountTransferSchema,
  type AccountTransferSchema,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@src/shared/components/ui/select';

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: { id: string; accountName: string }[];
  fromAccount: { id: string; accountName: string } | null;
}

export function TransferDialog({
  open,
  onOpenChange,
  accounts,
  fromAccount,
}: TransferDialogProps) {
  const transferMutation = useTransferLandAccount();

  const form = useForm<AccountTransferSchema>({
    resolver: zodResolver(accountTransferSchema),
    defaultValues: {
      fromAccountId: '',
      toAccountId: '',
      amount: 0,
      note: '',
    },
  });

  useEffect(() => {
    if (fromAccount && open) {
      form.reset({
        fromAccountId: fromAccount.id,
        toAccountId: '',
        amount: 0,
        note: '',
      });
    }
  }, [fromAccount, open, form]);

  const onSubmit = (data: AccountTransferSchema) => {
    transferMutation.mutate(data, {
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
          <DialogTitle>โอนเงินระหว่างบัญชี</DialogTitle>
          <DialogDescription>
            โอนเงินจากบัญชีหนึ่งไปยังอีกบัญชีหนึ่ง
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fromAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>จากบัญชี</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกบัญชีต้นทาง" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.accountName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="toAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ไปยังบัญชี</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกบัญชีปลายทาง" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts
                        .filter((acc) => acc.id !== form.watch('fromAccountId'))
                        .map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.accountName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              <Button type="submit" disabled={transferMutation.isPending}>
                {transferMutation.isPending ? 'กำลังโอน...' : 'โอนเงิน'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
