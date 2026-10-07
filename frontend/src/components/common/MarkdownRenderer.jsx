import React, { useState } from 'react';

/**
 * Format inline markdown tokens: bold (**text**), italic (*text*), code (`code`), links
 */
export function formatInlineText(text) {
  if (!text) return '';

  // Split by inline code blocks first
  const parts = [];
  const codeRegex = /(`[^`]+`)/g;
  const segments = text.split(codeRegex);

  segments.forEach((seg, sIdx) => {
    if (seg.startsWith('`') && seg.endsWith('`') && seg.length >= 2) {
      parts.push(
        <code key={`code-${sIdx}`} className="inline-code">
          {seg.slice(1, -1)}
        </code>
      );
      return;
    }

    // Process bold + italic in segment
    // Match bold: **...** or __...__
    const boldRegex = /(\*\*[^*]+\*\*|__[^_]+__)/g;
    const subSegments = seg.split(boldRegex);

    subSegments.forEach((sub, bIdx) => {
      if ((sub.startsWith('**') && sub.endsWith('**')) || (sub.startsWith('__') && sub.endsWith('__'))) {
        const inner = sub.slice(2, -2);
        parts.push(
          <strong key={`bold-${sIdx}-${bIdx}`} className="markdown-bold">
            {formatItalics(inner, `${sIdx}-${bIdx}`)}
          </strong>
        );
      } else {
        parts.push(formatItalics(sub, `${sIdx}-${bIdx}`));
      }
    });
  });

  return parts;
}

function formatItalics(text, keyPrefix) {
  if (typeof text !== 'string') return text;
  const italicRegex = /(\*[^*]+\*|_[^_]+_)/g;
  const parts = text.split(italicRegex);

  return parts.map((part, idx) => {
    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      if (part.length > 2) {
        return <em key={`italic-${keyPrefix}-${idx}`}>{part.slice(1, -1)}</em>;
      }
    }
    return part;
  });
}

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span className="code-lang-tag">{language || 'text'}</span>
        <button
          type="button"
          className="btn-copy-code"
          onClick={handleCopy}
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Copied!</span>
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="code-block-content">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/**
 * Parses multi-line markdown content into structured React elements.
 * Handles headings (####, ###, ##, #), lists, blockquotes, code blocks, tables, and paragraphs.
 */
export const MarkdownRenderer = ({ content = '' }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockBuffer = [];

  let currentList = null; // { type: 'ul' | 'ol', items: [] }

  const flushList = () => {
    if (currentList) {
      if (currentList.type === 'ul') {
        elements.push(
          <ul key={`list-${elements.length}`} className="markdown-ul">
            {currentList.items.map((item, i) => (
              <li key={i}>{formatInlineText(item)}</li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`list-${elements.length}`} className="markdown-ol">
            {currentList.items.map((item, i) => (
              <li key={i}>{formatInlineText(item)}</li>
            ))}
          </ol>
        );
      }
      currentList = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check code block fence
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        elements.push(
          <CodeBlock
            key={`code-${elements.length}`}
            language={codeBlockLang}
            code={codeBlockBuffer.join('\n')}
          />
        );
        inCodeBlock = false;
        codeBlockLang = '';
        codeBlockBuffer = [];
      } else {
        // Start of code block
        flushList();
        inCodeBlock = true;
        codeBlockLang = trimmed.slice(3).trim();
        codeBlockBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockBuffer.push(line);
      continue;
    }

    // Empty lines flush active lists
    if (!trimmed) {
      flushList();
      continue;
    }

    // Headings: #####, ####, ###, ##, #
    if (trimmed.startsWith('##### ')) {
      flushList();
      elements.push(
        <h5 key={`h5-${elements.length}`} className="markdown-h5">
          {formatInlineText(trimmed.slice(6))}
        </h5>
      );
      continue;
    }

    if (trimmed.startsWith('#### ')) {
      flushList();
      elements.push(
        <h4 key={`h4-${elements.length}`} className="markdown-h4">
          {formatInlineText(trimmed.slice(5))}
        </h4>
      );
      continue;
    }

    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={`h3-${elements.length}`} className="markdown-h3">
          {formatInlineText(trimmed.slice(4))}
        </h3>
      );
      continue;
    }

    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={`h2-${elements.length}`} className="markdown-h2">
          {formatInlineText(trimmed.slice(3))}
        </h2>
      );
      continue;
    }

    if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h1 key={`h1-${elements.length}`} className="markdown-h1">
          {formatInlineText(trimmed.slice(2))}
        </h1>
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      flushList();
      elements.push(
        <blockquote key={`quote-${elements.length}`} className="markdown-quote">
          {formatInlineText(trimmed.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Unordered list item (- item, * item, • item)
    const ulMatch = trimmed.match(/^[-*•]\s+(.*)$/);
    if (ulMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(ulMatch[1]);
      continue;
    }

    // Ordered list item (1. item, 2. item)
    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (olMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(olMatch[2]);
      continue;
    }

    // Horizontal rule (--- or ***)
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      flushList();
      elements.push(<hr key={`hr-${elements.length}`} className="markdown-hr" />);
      continue;
    }

    // Standard paragraph line
    flushList();
    elements.push(
      <p key={`p-${elements.length}`} className="markdown-p">
        {formatInlineText(line)}
      </p>
    );
  }

  // Final flush
  flushList();
  if (inCodeBlock && codeBlockBuffer.length > 0) {
    elements.push(
      <CodeBlock
        key={`code-${elements.length}`}
        language={codeBlockLang}
        code={codeBlockBuffer.join('\n')}
      />
    );
  }

  return <div className="markdown-body">{elements}</div>;
};

export default MarkdownRenderer;

