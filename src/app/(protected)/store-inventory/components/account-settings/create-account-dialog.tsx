'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateLandAccount } from '@src/features/land-accounts/hooks';
import {
  landAccountCreateSchema,
  type LandAccountCreateSchema,
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

interface CreateAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateAccountDialog({
  open,
  onOpenChange,
}: CreateAccountDialogProps) {
  const createMutation = useCreateLandAccount();

  const form = useForm<LandAccountCreateSchema>({
    resolver: zodResolver(landAccountCreateSchema),
    defaultValues: {
      accountName: '',
      accountBalance: 0,
    },
  });

  const onSubmit = (data: LandAccountCreateSchema) => {
    createMutation.mutate(data, {
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
          <DialogTitle>เพิ่มบัญชีใหม่</DialogTitle>
          <DialogDescription>
            กรอกข้อมูลบัญชีที่ต้องการเพิ่มเข้าระบบ
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
                  <FormLabel>ยอดเงินเริ่มต้น</FormLabel>
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
