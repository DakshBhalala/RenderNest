'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
}

export default function CodeBlock({ code, language = 'bash', filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-lg border border-zinc-800 bg-[#0c0e15] overflow-hidden text-xs">
      {filename && (
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-2 bg-zinc-900/50 text-zinc-400 font-mono">
          <span>{filename}</span>
          <span className="text-[10px] uppercase tracking-wider text-zinc-400">{language}</span>
        </div>
      )}
      <div className="relative p-4 font-mono text-zinc-300 overflow-x-auto leading-relaxed">
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 flex items-center gap-1 rounded bg-zinc-800/80 px-2 py-1 text-[11px] text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
        <pre>{code}</pre>
      </div>
    </div>
  );
}
