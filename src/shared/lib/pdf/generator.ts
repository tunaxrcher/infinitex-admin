/**
 * PDF Generator Utilities
 * Helper functions for generating PDF documents
 */

import React from 'react';
import { renderToStream } from '@react-pdf/renderer';

/**
 * Convert React PDF stream to buffer
 */
export async function streamToBuffer(
  stream: NodeJS.ReadableStream,
): Promise<Buffer> {
  const chunks: Uint8Array[] = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

/**
 * Render React component to PDF buffer
 */
export async function renderPDFToBuffer(
  component: React.ReactElement,
): Promise<Buffer> {
  const stream = await renderToStream(component);
  return streamToBuffer(stream);
}
