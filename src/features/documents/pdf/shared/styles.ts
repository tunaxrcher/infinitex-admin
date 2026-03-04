import { StyleSheet as PdfStyleSheet } from '@react-pdf/renderer';

export const pdfStyles = PdfStyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
    fontSize: 12,
    color: '#1f2937',
    fontFamily: 'Helvetica',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  muted: { color: '#6b7280', fontSize: 10 },
  textRight: { textAlign: 'right' },
  receiptTitleTh: { fontSize: 34, fontWeight: 700, lineHeight: 1.1 },
  receiptTitleEn: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  tableBlueTitle: {
    color: '#1d4ed8',
    fontSize: 18,
    fontWeight: 700,
    marginTop: 22,
  },
  box: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'solid',
    padding: 8,
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderBottomStyle: 'solid',
    paddingVertical: 5,
  },
  noBottom: { borderBottomWidth: 0 },
});
