'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useGetLandAccountList } from '@src/features/land-accounts/hooks';
import { z } from 'zod';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@src/shared/components/ui/select';

const approveLoanSchema = z.object({
  landAccountId: z.string().min(1, 'กรุณาเลือกบัญชีสำหรับจ่ายสินเชื่อ'),
});

type ApproveLoanSchema = z.infer<typeof approveLoanSchema>;

interface ApproveLoanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (landAccountId: string) => void;
  isPending?: boolean;
}

export function ApproveLoanDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: ApproveLoanDialogProps) {
  const { data: landAccountsData } = useGetLandAccountList({
    page: 1,
    limit: 1000,
  });

  const form = useForm<ApproveLoanSchema>({
    resolver: zodResolver(approveLoanSchema),
    defaultValues: {
      landAccountId: '',
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const onSubmit = (data: ApproveLoanSchema) => {
    onConfirm(data.landAccountId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>อนุมัติสินเชื่อ</DialogTitle>
          <DialogDescription>
            เลือกบัญชีที่จะใช้จ่ายสินเชื่อนี้
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="landAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>บัญชีสำหรับจ่ายสินเชื่อ</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกบัญชี" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {landAccountsData?.data?.map((account: any) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.accountName} (฿
                          {Number(account.accountBalance).toLocaleString('th-TH', {
                            minimumFractionDigits: 2,
                          })}
                          )
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'กำลังอนุมัติ...' : 'อนุมัติสินเชื่อ'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

