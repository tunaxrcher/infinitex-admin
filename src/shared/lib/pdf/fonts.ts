/**
 * Font configuration for React PDF
 * Using thsarabun font from public/fonts
 */

import { Font } from '@react-pdf/renderer';

let fontsRegistered = false;

export function registerFonts() {
  // Register only once to avoid errors
  if (fontsRegistered) {
    return;
  }

  try {
    // Use filesystem path for server-side rendering
    const fontPath = process.cwd() + '/public/fonts';

    Font.register({
      family: 'thsarabun',
      fonts: [
        {
          src: `${fontPath}/THSarabunNew.ttf`,
          fontWeight: 'normal',
          fontStyle: 'normal',
        },
        {
          src: `${fontPath}/THSarabunNew Bold.ttf`,
          fontWeight: 'bold',
          fontStyle: 'normal',
        },
        {
          src: `${fontPath}/THSarabunNew Italic.ttf`,
          fontWeight: 'normal',
          fontStyle: 'italic',
        },
        {
          src: `${fontPath}/THSarabunNew BoldItalic.ttf`,
          fontWeight: 'bold',
          fontStyle: 'italic',
        },
      ],
    });

    fontsRegistered = true;
    console.log('thsarabun fonts registered successfully from:', fontPath);
  } catch (error) {
    console.error('Failed to register thsarabun fonts:', error);
  }
}

// Use thsarabun font (supports Thai)
export const THAI_FONT = 'thsarabun';
