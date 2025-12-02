'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { Edit2, FileUp, Printer, Trash2, Upload, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  useCreateDocument,
  useDeleteDocument,
  useGenerateDocNumber,
  useGetDocumentList,
  useUpdateDocument,
} from '@src/features/documents/hooks';
import { useGetLandAccountList } from '@src/features/land-accounts/hooks';
import { Button } from '@src/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@src/shared/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@src/shared/components/ui/tabs';
import { Textarea } from '@src/shared/components/ui/textarea';

// ============================================
// TYPES
// ============================================

interface VoucherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'receipt' | 'payment';
}

// Form schema for voucher
const voucherFormSchema = z.object({
  docNumber: z.string().min(1, 'กรุณากรอกเลขที่ใบสำคัญ'),
  docDate: z.string().min(1, 'กรุณาเลือกวันที่'),
  title: z.string().min(1, 'กรุณาเลือกหมวดหมู่'),
  price: z.number().min(0, 'จำนวนเงินต้องมากกว่าหรือเท่ากับ 0'),
  cashFlowName: z.string().min(1, 'กรุณาเลือกบัญชีบริษัท'),
  note: z.string().optional(),
});

type VoucherFormValues = z.infer<typeof voucherFormSchema>;

// Document from API
interface DocumentItem {
  id: string;
  docNumber: string;
  docDate: string;
  title: string;
  price: number;
  note?: string;
  cashFlowName: string;
  username?: string;
  createdAt: string;
}

// ============================================
// VOUCHER FORM SECTION
// ============================================

function VoucherFormSection({
  docType,
  editingDoc,
  onCancelEdit,
  onSuccess,
}: {
  docType: 'RECEIPT' | 'PAYMENT_VOUCHER';
  editingDoc: DocumentItem | null;
  onCancelEdit: () => void;
  onSuccess: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const createMutation = useCreateDocument();
  const updateMutation = useUpdateDocument();
  const generateDocNumberMutation = useGenerateDocNumber();

  // Get land accounts for dropdown
  const { data: accountsData } = useGetLandAccountList({
    page: 1,
    limit: 100,
  });

  const accounts = accountsData?.data || [];

  const form = useForm<VoucherFormValues>({
    resolver: zodResolver(voucherFormSchema),
    defaultValues: {
      docNumber: '',
      docDate: format(new Date(), 'yyyy-MM-dd'),
      title: '',
      price: 0,
      cashFlowName: '',
      note: '',
    },
  });

  // Generate document number when form loads
  useEffect(() => {
    if (!editingDoc) {
      generateDocNumberMutation.mutate(
        { docType: docType === 'RECEIPT' ? 'RECEIPT' : 'PAYMENT_VOUCHER' },
        {
          onSuccess: (response) => {
            form.setValue('docNumber', response.data.docNumber);
          },
        },
      );
    }
  }, [docType, editingDoc]);

  // Set form values when editing
  useEffect(() => {
    if (editingDoc) {
      form.reset({
        docNumber: editingDoc.docNumber,
        docDate: format(new Date(editingDoc.docDate), 'yyyy-MM-dd'),
        title: editingDoc.title,
        price: Number(editingDoc.price),
        cashFlowName: editingDoc.cashFlowName,
        note: editingDoc.note || '',
      });
    }
  }, [editingDoc, form]);

  // Reset form when docType changes
  useEffect(() => {
    if (!editingDoc) {
      form.reset({
        docNumber: '',
        docDate: format(new Date(), 'yyyy-MM-dd'),
        title: '',
        price: 0,
        cashFlowName: '',
        note: '',
      });
      generateDocNumberMutation.mutate(
        { docType: docType === 'RECEIPT' ? 'RECEIPT' : 'PAYMENT_VOUCHER' },
        {
          onSuccess: (response) => {
            form.setValue('docNumber', response.data.docNumber);
          },
        },
      );
    }
  }, [docType]);

  const openCategorySelector = () => {
    const x = (window.screen.width - 800) / 2;
    const y = (window.screen.height - 600) / 2;
    const categoryType = docType === 'RECEIPT' ? 'RECEIPT' : 'PAYMENT_VOUCHER';
    
    // Create callback function to receive selected category
    (window as any).__onCategorySelected = (category: { title: string }) => {
      form.setValue('title', category.title);
      delete (window as any).__onCategorySelected;
    };

    window.open(
      `/category-selector?docType=${categoryType}`,
      'DF',
      `menubar=no,toolbar=no,location=no,scrollbars=yes,status=no,resizable=no,height=600,width=800,left=${x},top=${y}`,
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const onSubmit = (data: VoucherFormValues) => {
    if (editingDoc) {
      updateMutation.mutate(
        {
          id: editingDoc.id,
          data: {
            docDate: data.docDate,
            title: data.title,
            price: data.price,
            cashFlowName: data.cashFlowName,
            note: data.note,
          },
        },
        {
          onSuccess: () => {
            onCancelEdit();
            onSuccess();
            // Reset and regenerate doc number
            form.reset({
              docNumber: '',
              docDate: format(new Date(), 'yyyy-MM-dd'),
              title: '',
              price: 0,
              cashFlowName: '',
              note: '',
            });
            generateDocNumberMutation.mutate(
              { docType: docType === 'RECEIPT' ? 'RECEIPT' : 'PAYMENT_VOUCHER' },
              {
                onSuccess: (response) => {
                  form.setValue('docNumber', response.data.docNumber);
                },
              },
            );
          },
        },
      );
    } else {
      createMutation.mutate(
        {
          docType,
          docNumber: data.docNumber,
          docDate: data.docDate,
          title: data.title,
          price: data.price,
          cashFlowName: data.cashFlowName,
          note: data.note,
        },
        {
          onSuccess: () => {
            onSuccess();
            // Reset and regenerate doc number
            form.reset({
              docNumber: '',
              docDate: format(new Date(), 'yyyy-MM-dd'),
              title: '',
              price: 0,
              cashFlowName: '',
              note: '',
            });
            generateDocNumberMutation.mutate(
              { docType: docType === 'RECEIPT' ? 'RECEIPT' : 'PAYMENT_VOUCHER' },
              {
                onSuccess: (response) => {
                  form.setValue('docNumber', response.data.docNumber);
                },
              },
            );
          },
        },
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Document Number */}
          <FormField
            control={form.control}
            name="docNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>เลขที่ใบสำคัญ</FormLabel>
                <FormControl>
                  <Input {...field} readOnly className="bg-muted" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date */}
          <FormField
            control={form.control}
            name="docDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>วันที่</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Category */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>รายการ (หมวดหมู่)</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Input
                    {...field}
                    placeholder="พิมพ์หรือเลือกหมวดหมู่"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={openCategorySelector}
                  >
                    ค้นหา
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Amount */}
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>จำนวนเงิน</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
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

        {/* Note */}
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>หมายเหตุ</FormLabel>
              <FormControl>
                <Textarea placeholder="หมายเหตุ (ถ้ามี)" {...field} rows={2} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Company Account */}
        <FormField
          control={form.control}
          name="cashFlowName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>บัญชีบริษัท</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกบัญชีบริษัท" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {accounts.map((account: any) => (
                    <SelectItem key={account.id} value={account.accountName}>
                      <div className="flex items-center justify-between w-full gap-4">
                        <span>{account.accountName}</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          ({Number(account.accountBalance).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* File Upload */}
        <div className="space-y-2">
          <FormLabel>อัพโหลดไฟล์</FormLabel>
          <div
            className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploadedFile ? (
              <div className="flex items-center justify-center gap-2">
                <FileUp className="h-5 w-5 text-primary" />
                <span className="text-sm">{uploadedFile.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadedFile(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="h-8 w-8" />
                <span className="text-sm">คลิกเพื่ออัพโหลดไฟล์</span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          {editingDoc && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onCancelEdit();
                form.reset({
                  docNumber: '',
                  docDate: format(new Date(), 'yyyy-MM-dd'),
                  title: '',
                  price: 0,
                  cashFlowName: '',
                  note: '',
                });
                generateDocNumberMutation.mutate(
                  { docType: docType === 'RECEIPT' ? 'RECEIPT' : 'PAYMENT_VOUCHER' },
                  {
                    onSuccess: (response) => {
                      form.setValue('docNumber', response.data.docNumber);
                    },
                  },
                );
              }}
            >
              ยกเลิกการแก้ไข
            </Button>
          )}
          <Button
            type="submit"
            className="flex-1 gradientButton"
            disabled={isPending}
          >
            {isPending
              ? 'กำลังบันทึก...'
              : editingDoc
                ? 'ยืนยันแก้ไข'
                : 'บันทึก'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ============================================
// VOUCHER HISTORY SECTION
// ============================================

function VoucherHistorySection({
  docType,
  onEdit,
}: {
  docType: 'RECEIPT' | 'PAYMENT_VOUCHER';
  onEdit: (doc: DocumentItem) => void;
}) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const deleteMutation = useDeleteDocument();

  const { data: documentsData, refetch } = useGetDocumentList({
    docType,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page: 1,
    limit: 50,
    sortBy: 'docDate',
    sortOrder: 'desc',
  });

  const documents: DocumentItem[] = documentsData?.data || [];

  const handleDelete = (id: string) => {
    if (confirm('ยืนยันการลบข้อมูล?')) {
      deleteMutation.mutate(id);
    }
  };

  const handlePrint = (doc: DocumentItem) => {
    // Open print window
    const printContent = `
      <html>
        <head>
          <title>พิมพ์ใบสำคัญ</title>
          <style>
            body { font-family: 'TH Sarabun New', sans-serif; padding: 20px; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            .header { text-align: center; margin-bottom: 20px; }
            .amount { font-size: 24px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${docType === 'RECEIPT' ? 'ใบสำคัญรับ' : 'ใบสำคัญจ่าย'}</h1>
            <p>เลขที่: ${doc.docNumber}</p>
            <p>วันที่: ${format(new Date(doc.docDate), 'dd/MM/yyyy', { locale: th })}</p>
          </div>
          <table>
            <tr><th>รายการ</th><td>${doc.title}</td></tr>
            <tr><th>หมายเหตุ</th><td>${doc.note || '-'}</td></tr>
            <tr><th>บัญชี</th><td>${doc.cashFlowName}</td></tr>
            <tr><th>จำนวนเงิน</th><td class="amount">${Number(doc.price).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</td></tr>
          </table>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: th });
    } catch {
      return dateStr;
    }
  };

  const formatAmount = (amount: number) => {
    return Number(amount).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm">
        ประวัติ{docType === 'RECEIPT' ? 'ใบสำคัญรับ' : 'ใบสำคัญจ่าย'}
      </h3>

      {/* Date Filters */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">วันที่เริ่มต้น</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">ถึงวันที่</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          ค้นหา
        </Button>
      </div>

      {/* History Table */}
      <div className="rounded-md border max-h-64 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              <TableHead className="text-xs">เลขที่</TableHead>
              <TableHead className="text-xs">วันที่</TableHead>
              <TableHead className="text-xs">รายการ</TableHead>
              <TableHead className="text-xs">รายละเอียด</TableHead>
              <TableHead className="text-xs text-right">จำนวนเงิน</TableHead>
              <TableHead className="text-xs">ผู้ทำรายการ</TableHead>
              <TableHead className="text-xs text-center">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  ไม่พบข้อมูล
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="text-xs font-mono">{doc.docNumber}</TableCell>
                  <TableCell className="text-xs">{formatDate(doc.docDate)}</TableCell>
                  <TableCell className="text-xs">{doc.title}</TableCell>
                  <TableCell className="text-xs max-w-[100px] truncate">
                    {doc.note || '-'}
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono">
                    {formatAmount(doc.price)}
                  </TableCell>
                  <TableCell className="text-xs">{doc.username || '-'}</TableCell>
                  <TableCell className="text-xs">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => onEdit(doc)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handlePrint(doc)}
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(doc.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ============================================
// MAIN VOUCHER DIALOG
// ============================================

export function VoucherDialog({
  open,
  onOpenChange,
  defaultTab = 'receipt',
}: VoucherDialogProps) {
  const [activeTab, setActiveTab] = useState<'receipt' | 'payment'>(defaultTab);
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);

  // Update active tab when defaultTab changes
  useEffect(() => {
    setActiveTab(defaultTab);
    setEditingDoc(null);
  }, [defaultTab, open]);

  const handleEdit = (doc: DocumentItem) => {
    setEditingDoc(doc);
  };

  const handleCancelEdit = () => {
    setEditingDoc(null);
  };

  const handleSuccess = () => {
    setEditingDoc(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
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
            ใบสำคัญรับ/จ่าย
          </DialogTitle>
          <DialogDescription>
            บันทึกและจัดการใบสำคัญรับ/จ่าย
          </DialogDescription>
          <hr className="w-full border-border" />
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as 'receipt' | 'payment');
            setEditingDoc(null);
          }}
        >
  <div className="flex justify-center mb-">
  <TabsList className="w-1/2">
    <TabsTrigger value="receipt" className="flex-1">
      ใบสำคัญรับ
    </TabsTrigger>
    <TabsTrigger value="payment" className="flex-1">
      ใบสำคัญจ่าย
    </TabsTrigger>
  </TabsList>
</div>

          {/* Receipt Voucher Tab */}
          <TabsContent value="receipt" className="space-y-6">
            <VoucherFormSection
              docType="RECEIPT"
              editingDoc={editingDoc}
              onCancelEdit={handleCancelEdit}
              onSuccess={handleSuccess}
            />
            <hr className="border-border" />
            <VoucherHistorySection docType="RECEIPT" onEdit={handleEdit} />
          </TabsContent>

          {/* Payment Voucher Tab */}
          <TabsContent value="payment" className="space-y-6">
            <VoucherFormSection
              docType="PAYMENT_VOUCHER"
              editingDoc={editingDoc}
              onCancelEdit={handleCancelEdit}
              onSuccess={handleSuccess}
            />
            <hr className="border-border" />
            <VoucherHistorySection docType="PAYMENT_VOUCHER" onEdit={handleEdit} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

