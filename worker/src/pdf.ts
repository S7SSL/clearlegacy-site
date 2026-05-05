/**
 * Render HTML → PDF via Cloudflare Browser Rendering API using @cloudflare/puppeteer.
 *
 * Requires:
 *   - Workers Paid plan
 *   - Browser Rendering enabled on the account
 *   - `browser = { binding = "BROWSER" }` in wrangler.toml
 *
 * Docs: https://developers.cloudflare.com/browser-rendering/platform/puppeteer/
 */

import puppeteer from '@cloudflare/puppeteer';
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';

export interface PdfOptions {
  // A4 at 96 DPI: 794x1123 px. We use puppeteer's format instead.
  format?: 'A4' | 'Letter';
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  printBackground?: boolean;
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
}

const DEFAULT_OPTIONS: PdfOptions = {
  format: 'A4',
  margin: { top: '20mm', right: '20mm', bottom: '22mm', left: '20mm' },
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<span></span>',
  footerTemplate: `
    <div style="width:100%;font-size:9px;color:#666;padding:0 20mm;display:flex;justify-content:space-between;">
      <span>Last Will and Testament</span>
      <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    </div>`,
};

// Diagonal "CLEARLEGACY.CO.UK" stamp drawn across the centre of every page.
// Deters casual copy/paste reuse of the will template by a third party who
// gets hold of a delivered PDF. pdf-lib does not support PDF encryption, so
// hard copy/print/modify restrictions are not enforceable here without a
// large WASM dependency — the watermark is the deterrent.
const WATERMARK_TEXT = 'CLEARLEGACY.CO.UK';
const WATERMARK_FONT_SIZE = 56;
const WATERMARK_OPACITY = 0.12;
const WATERMARK_ANGLE_DEGREES = 30;

async function applyWatermark(pdfBytes: Uint8Array): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBytes);
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const textWidth = font.widthOfTextAtSize(WATERMARK_TEXT, WATERMARK_FONT_SIZE);
  const textHeight = font.heightAtSize(WATERMARK_FONT_SIZE);

  const angleRad = (WATERMARK_ANGLE_DEGREES * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  for (const page of pdf.getPages()) {
    const { width, height } = page.getSize();
    // Place the text so its geometric centre lands on the page centre after
    // rotation around its lower-left baseline corner (pdf-lib's pivot point).
    const x = width / 2 - (textWidth / 2) * cos + (textHeight / 2) * sin;
    const y = height / 2 - (textWidth / 2) * sin - (textHeight / 2) * cos;

    page.drawText(WATERMARK_TEXT, {
      x,
      y,
      size: WATERMARK_FONT_SIZE,
      font,
      color: rgb(0.55, 0.55, 0.55),
      opacity: WATERMARK_OPACITY,
      rotate: degrees(WATERMARK_ANGLE_DEGREES),
    });
  }

  return await pdf.save();
}

export async function renderPdf(
  browserBinding: Fetcher,
  html: string,
  opts: PdfOptions = {},
): Promise<Uint8Array> {
  const options = { ...DEFAULT_OPTIONS, ...opts };
  const browser = await puppeteer.launch(browserBinding as any);
  let pdfBytes: Uint8Array;
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuf = await page.pdf({
      format: options.format,
      margin: options.margin,
      printBackground: options.printBackground,
      displayHeaderFooter: options.displayHeaderFooter,
      headerTemplate: options.headerTemplate,
      footerTemplate: options.footerTemplate,
      preferCSSPageSize: false,
    });
    pdfBytes = pdfBuf instanceof Uint8Array ? pdfBuf : new Uint8Array(pdfBuf as any);
  } finally {
    await browser.close();
  }

  return await applyWatermark(pdfBytes);
}
