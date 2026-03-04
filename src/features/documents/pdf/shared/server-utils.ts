import fs from 'fs';
import path from 'path';
import { Font } from '@react-pdf/renderer';

/* ── Font registration (shared across all PDF API routes) ── */
let pdfFontFamily = 'Helvetica';
let fontsReady = false;

export function ensureFonts(): string {
  if (fontsReady) return pdfFontFamily;
  try {
    const dir = path.join(process.cwd(), 'public', 'fonts');
    const regular = path.join(dir, 'THSarabunNew.ttf');
    const bold = path.join(dir, 'THSarabunNew Bold.ttf');
    if (fs.existsSync(regular) && fs.existsSync(bold)) {
      Font.register({
        family: 'SarabunPDF',
        fonts: [
          { src: regular, fontWeight: 'normal' },
          { src: bold, fontWeight: 'bold' },
        ],
      });
      pdfFontFamily = 'SarabunPDF';
    }
  } catch {
    // fallback to Helvetica
  }
  fontsReady = true;
  return pdfFontFamily;
}

/* ── Logo loader (reads from public/images/logo.png as base64) ── */
export function loadLogoBase64(): string | null {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png');
    if (fs.existsSync(logoPath)) {
      const logoData = fs.readFileSync(logoPath);
      return `data:image/png;base64,${logoData.toString('base64')}`;
    }
  } catch {
    // ถ้าอ่านไม่ได้จะไม่แสดงโลโก้
  }
  return null;
}
