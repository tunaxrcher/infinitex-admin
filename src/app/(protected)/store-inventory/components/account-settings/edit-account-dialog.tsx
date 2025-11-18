'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpdateLandAccount } from '@src/features/land-accounts/hooks';
import {
  landAccountUpdateSchema,
  type LandAccountUpdateSchema,
} from '@src/features/land-accounts/validations';
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

interface EditAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: { id: string; accountName: string; accountBalance: number } | null;
}

export function EditAccountDialog({
  open,
  onOpenChange,
  account,
}: EditAccountDialogProps) {
  const updateMutation = useUpdateLandAccount();

  const form = useForm<LandAccountUpdateSchema>({
    resolver: zodResolver(landAccountUpdateSchema),
    defaultValues: {
      accountName: '',
      accountBalance: 0,
    },
  });

  useEffect(() => {
    if (account && open) {
      form.reset({
        accountName: account.accountName,
        accountBalance: account.accountBalance,
      });
    }
  }, [account, open, form]);

  const onSubmit = (data: LandAccountUpdateSchema) => {
    if (!account) return;

    updateMutation.mutate(
      { id: account.id, data },
      {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>แก้ไขบัญชี</DialogTitle>
          <DialogDescription>
            แก้ไขข้อมูลบัญชีและยอดเงิน
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="accountName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อบัญชี</FormLabel>
                  <FormControl>
                    <Input placeholder="กรอกชื่อบัญชี" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ยอดเงิน</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
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
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

