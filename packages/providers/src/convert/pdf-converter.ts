import { IBrowserProvider } from '../browser/browser-provider';
import { ConvertPdfOptions } from '@rendernest/shared';

export class PdfConverter {
  constructor(private browserProvider: IBrowserProvider) {}

  async convert(options: ConvertPdfOptions): Promise<Buffer> {
    let htmlContent = options.html;

    if (options.markdown && !htmlContent) {
      htmlContent = this.markdownToStyledHtml(options.markdown, options.title);
    }

    if (!htmlContent) {
      throw new Error('Either html or markdown content must be provided.');
    }

    const { buffer } = await this.browserProvider.pdf({
      html: htmlContent,
      format: options.format || 'A4',
      landscape: options.landscape || false,
      print_background: true,
      margin: {
        top: '24px',
        right: '24px',
        bottom: '24px',
        left: '24px',
      },
    });

    return buffer;
  }

  private markdownToStyledHtml(markdown: string, title?: string): string {
    // Simple fast Markdown to HTML parser for styled document rendering
    let html = markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/^\s*\n\*/gm, '<ul>\n*')
      .replace(/^(\*.+)\s*\n([^\*])/gm, '$1\n</ul>\n\n$2')
      .replace(/^\* (.*$)/gim, '<li>$1</li>')
      .replace(/^\s*\n\d\./gm, '<ol>\n1.')
      .replace(/^(\d\..+)\s*\n([^\d\.])/gm, '$1\n</ol>\n\n$2')
      .replace(/^\d\.\s(.*$)/gim, '<li>$1</li>')
      .replace(/\n\n/gim, '</p><p>')
      .replace(/\n/gim, '<br />');

    html = `<p>${html}</p>`;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title || 'Converted Document'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono&display=swap');
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 { font-size: 28px; font-weight: 700; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-top: 24px; color: #111827; }
    h2 { font-size: 22px; font-weight: 600; margin-top: 20px; color: #1f2937; }
    h3 { font-size: 18px; font-weight: 600; margin-top: 16px; color: #374151; }
    p { margin: 12px 0; }
    code { font-family: 'JetBrains Mono', monospace; background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
    pre { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; overflow-x: auto; }
    blockquote { border-left: 4px solid #3b82f6; margin: 16px 0; padding-left: 16px; color: #4b5563; font-style: italic; }
    ul, ol { padding-left: 24px; margin: 12px 0; }
    li { margin-bottom: 6px; }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
  }
}
