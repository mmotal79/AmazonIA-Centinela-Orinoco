import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  return (
    <div className={`space-y-3 leading-relaxed text-slate-200 ${className}`}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-base font-bold text-white tracking-wide border-b border-slate-700/60 pb-1.5 mt-3 mb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-bold text-sky-300 tracking-wide mt-3 mb-1.5 flex items-center gap-1.5">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider mt-2.5 mb-1">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs font-semibold text-emerald-300 mt-2 mb-1">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-xs text-slate-200 leading-relaxed mb-2">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 my-2 text-xs text-slate-200 pl-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 my-2 text-xs text-slate-200 pl-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-xs leading-relaxed text-slate-200">
              <span className="text-slate-200">{children}</span>
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-white">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-slate-300">
              {children}
            </em>
          ),
          hr: () => (
            <hr className="border-slate-800 my-3" />
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-sky-500 pl-3 py-1 bg-sky-950/20 text-slate-300 italic text-xs my-2 rounded-r">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-lg border border-slate-800">
              <table className="min-w-full divide-y divide-slate-800 text-xs text-left">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#0b1420] text-slate-300 font-mono text-[11px] uppercase">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-slate-800/60 bg-[#070b10]">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-slate-900/50 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 font-semibold text-slate-300 border-b border-slate-800">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-slate-200 text-xs">
              {children}
            </td>
          ),
          code: ({ children }) => (
            <code className="bg-[#0f172a] text-sky-300 px-1.5 py-0.5 rounded font-mono text-[11px] border border-slate-800">
              {children}
            </code>
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  );
};
