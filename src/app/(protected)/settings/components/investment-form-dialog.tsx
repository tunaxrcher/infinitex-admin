'use client';
import Image from 'next/image';
import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useGetCurrentInvestment,
  useUpdateInvestment,
} from '@src/features/real-investment/hooks';
import {
  investmentUpdateSchema,
  type InvestmentUpdateSchema,
} from '@src/features/real-investment/validations';
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

export function InvestmentFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: investmentData, isLoading } = useGetCurrentInvestment();
  const updateInvestment = useUpdateInvestment();

  const currentInvestment = investmentData?.data?.investment || 0;

  const form = useForm<InvestmentUpdateSchema>({
    resolver: zodResolver(investmentUpdateSchema),
    defaultValues: {
      operation: 'edit',
      amount: 0,
    },
  });

  const operation = form.watch('operation');
  const amount = form.watch('amount');

  useEffect(() => {
    if (open) {
      form.reset({
        operation: 'edit',
        amount: 0,
      });
    }
  }, [open, form]);

  const onSubmit = (data: InvestmentUpdateSchema) => {
    updateInvestment.mutate(data, {
      onSuccess: () => {
        form.reset();
        onOpenChange(false);
      },
    });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
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
          ตั้งค่าทุน
          </DialogTitle>
          <DialogDescription>
          ทุนปัจจุบัน:{' '}
            <span className="font-semibold text-mono">
              {isLoading ? '...' : `฿${formatNumber(currentInvestment)}`}
            </span>
          </DialogDescription>
          <hr className="w-full border-border" />
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="operation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>การดำเนินการ</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกการดำเนินการ" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="edit">แก้ไข</SelectItem>
                      <SelectItem value="add">เพิ่ม</SelectItem>
                      <SelectItem value="subtract">ลบ</SelectItem>
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
                  <FormLabel>
                    {operation === 'edit' && 'ทุนใหม่'}
                    {operation === 'add' && 'จำนวนเงินที่ต้องการเพิ่ม'}
                    {operation === 'subtract' && 'จำนวนเงินที่ต้องการลบ'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder=""
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || '')
                      }
                    />
                  </FormControl>
                  {operation === 'add' && amount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      ทุนหลังเพิ่ม:{' '}
                      <span className="font-semibold text-mono">
                        ฿{formatNumber(Number(currentInvestment) + amount)}
                      </span>
                    </p>
                  )}
                  {operation === 'subtract' && amount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      ทุนหลังลบ:{' '}
                      <span className="font-semibold text-mono">
                        ฿{formatNumber(Number(currentInvestment) - amount)}
                      </span>
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              {/* <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                ยกเลิก
              </Button> */}
              <Button type="submit" className="gradientButton w-full" disabled={updateInvestment.isPending}>
                {updateInvestment.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

