import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'RenderNest — The Web Data & Rendering Infrastructure API',
    template: '%s | RenderNest',
  },
  description:
    'One unified developer API for screenshots, PDFs, structured extraction, Markdown, page inspection, and visual analysis.',
  keywords: [
    'developer API',
    'web scraping',
    'screenshot api',
    'pdf rendering',
    'structured data extraction',
    'html to markdown',
    'page inspection',
    'visual regression',
  ],
  authors: [{ name: 'RenderNest' }],
  metadataBase: new URL(process.env.APP_URL || 'https://rendernest.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://rendernest.com',
    title: 'RenderNest — Turn the web into data, documents, and images',
    description:
      'One unified API for screenshots, PDFs, structured extraction, Markdown, page inspection, and analysis.',
    siteName: 'RenderNest',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RenderNest — Web Data & Rendering API',
    description:
      'One unified developer API for screenshots, PDFs, structured extraction, Markdown, page inspection, and analysis.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#090a0f] text-zinc-100 selection:bg-brand-500/20 selection:text-brand-100 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
