import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { ConvertDocxOptions } from '@rendernest/shared';

export class DocxConverter {
  async convert(options: ConvertDocxOptions): Promise<Buffer> {
    const title = options.title || 'Document';
    const content = options.markdown || this.htmlToText(options.html || '');

    const paragraphs: Paragraph[] = [
      new Paragraph({
        text: title,
        heading: HeadingLevel.TITLE,
        spacing: { after: 300 },
      }),
    ];

    const lines = content.split('\n');

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        paragraphs.push(new Paragraph({ spacing: { after: 120 } }));
        continue;
      }

      if (line.startsWith('# ')) {
        paragraphs.push(
          new Paragraph({
            text: line.replace('# ', ''),
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
          })
        );
      } else if (line.startsWith('## ')) {
        paragraphs.push(
          new Paragraph({
            text: line.replace('## ', ''),
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );
      } else if (line.startsWith('### ')) {
        paragraphs.push(
          new Paragraph({
            text: line.replace('### ', ''),
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 160, after: 80 },
          })
        );
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        paragraphs.push(
          new Paragraph({
            bullet: { level: 0 },
            children: this.parseTextRuns(line.replace(/^[-*]\s+/, '')),
            spacing: { after: 60 },
          })
        );
      } else if (/^\d+\.\s+/.test(line)) {
        paragraphs.push(
          new Paragraph({
            children: this.parseTextRuns(line),
            spacing: { after: 60 },
          })
        );
      } else {
        paragraphs.push(
          new Paragraph({
            children: this.parseTextRuns(line),
            spacing: { after: 120 },
          })
        );
      }
    }

    const doc = new Document({
      title,
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
    });

    return await Packer.toBuffer(doc);
  }

  private parseTextRuns(text: string): TextRun[] {
    const runs: TextRun[] = [];
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

    for (const part of parts) {
      if (!part) continue;
      if (part.startsWith('**') && part.endsWith('**')) {
        runs.push(new TextRun({ text: part.slice(2, -2), bold: true }));
      } else if (part.startsWith('*') && part.endsWith('*')) {
        runs.push(new TextRun({ text: part.slice(1, -1), italics: true }));
      } else if (part.startsWith('`') && part.endsWith('`')) {
        runs.push(new TextRun({ text: part.slice(1, -1), font: 'Consolas' }));
      } else {
        runs.push(new TextRun({ text: part }));
      }
    }

    return runs.length > 0 ? runs : [new TextRun({ text })];
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n')
      .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n')
      .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n')
      .replace(/<li>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
  }
}
