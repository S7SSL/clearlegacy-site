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

export async function renderPdf(
  browserBinding: Fetcher,
  html: string,
  opts: PdfOptions = {},
): Promise<Uint8Array> {
  const options = { ...DEFAULT_OPTIONS, ...opts };
  const browser = await puppeteer.launch(browserBinding as any);
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
    // pdfBuf is Uint8Array on Workers.
    return pdfBuf instanceof Uint8Array ? pdfBuf : new Uint8Array(pdfBuf as any);
  } finally {
    await browser.close();
  }
}
