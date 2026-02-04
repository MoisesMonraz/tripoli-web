"use client";

import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { BLOCKS, INLINES, MARKS } from '@contentful/rich-text-types';
import Image from 'next/image';

// Helper to extract plain text from a node for detection
const getPlainText = (node) => {
  if (!node || !node.content) return '';
  return node.content
    .map((child) => {
      if (child.nodeType === 'text') return child.value || '';
      if (child.content) return getPlainText(child);
      return '';
    })
    .join('');
};

const renderOptions = {
  renderMark: {
    [MARKS.BOLD]: (text) => (
      <strong className="font-extrabold text-slate-950 dark:text-slate-50">
        {text}
      </strong>
    ),
    [MARKS.ITALIC]: (text) => <em className="italic">{text}</em>,
    [MARKS.CODE]: (text) => (
      <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] text-slate-800 dark:bg-slate-800 dark:text-slate-200">
        {text}
      </code>
    ),
  },
  renderNode: {
    [BLOCKS.PARAGRAPH]: (node, children) => {
      const plainText = getPlainText(node);
      const isSources = plainText.toLowerCase().startsWith('fuentes');
      const isNumberedSubtitle = /^\d+\./.test(plainText.trim()); // Detects "1.", "2.", etc.

      // Detect short bold-only paragraphs (section titles like "El Horizonte Inmediato")
      // A paragraph is a "bold subtitle" if: it's short (<100 chars) AND all content is bold
      const isBoldSubtitle = plainText.length < 100 &&
        node.content &&
        node.content.length === 1 &&
        node.content[0].marks?.some(m => m.type === 'bold');

      if (isSources) {
        // Smaller font for the sources section with "Fuentes consultadas:" in bold, all italic
        return (
          <p className="mb-5 font-serif text-xs italic leading-relaxed text-slate-700 md:mb-8 md:text-[0.85rem] md:leading-[1.85] dark:text-slate-300">
            <strong className="font-extrabold text-slate-950 dark:text-slate-50">Fuentes consultadas:</strong>
            {' '}{plainText.replace(/^fuentes\s*consultadas:\s*/i, '')}
          </p>
        );
      }

      if (isNumberedSubtitle || isBoldSubtitle) {
        // Subtitle: reduced bottom margin (62.5% less) to group with its paragraph
        return (
          <p className="mb-[0.5rem] mt-8 font-serif text-base leading-relaxed text-slate-700 md:mb-3 md:mt-10 md:text-[1.125rem] md:leading-[1.85] dark:text-slate-300">
            {children}
          </p>
        );
      }

      // Normal paragraph styling (including closing paragraph)
      return (
        <p className="mb-5 font-serif text-base leading-relaxed text-slate-700 first:mt-0 md:mb-8 md:text-[1.125rem] md:leading-[1.85] dark:text-slate-300">
          {children}
        </p>
      );
    },
    [BLOCKS.HEADING_1]: (node, children) => (
      <h2 className="mb-[0.5rem] mt-10 font-sans text-xl font-extrabold leading-tight tracking-tight text-slate-900 md:mb-3 md:mt-14 md:text-3xl dark:text-slate-100">
        {children}
      </h2>
    ),
    [BLOCKS.HEADING_2]: (node, children) => (
      <h2 className="mb-[0.5rem] mt-10 font-sans text-xl font-extrabold leading-tight tracking-tight text-slate-900 md:mb-3 md:mt-14 md:text-3xl dark:text-slate-100">
        {children}
      </h2>
    ),
    [BLOCKS.HEADING_3]: (node, children) => (
      <h3 className="mb-[0.5rem] mt-8 font-sans text-lg font-bold leading-snug text-slate-900 md:mb-3 md:mt-10 md:text-2xl dark:text-slate-100">
        {children}
      </h3>
    ),
    [BLOCKS.HEADING_4]: (node, children) => (
      <h4 className="mb-[0.5rem] mt-6 font-sans text-base font-bold text-slate-900 md:mb-3 md:mt-8 md:text-xl dark:text-slate-100">
        {children}
      </h4>
    ),
    [BLOCKS.UL_LIST]: (node, children) => (
      <ul className="mb-5 space-y-2 pl-5 font-serif text-base leading-relaxed text-slate-700 md:mb-8 md:space-y-3 md:text-[1.125rem] md:leading-[1.85] dark:text-slate-300 article-ul">
        {children}
      </ul>
    ),
    [BLOCKS.OL_LIST]: (node, children) => (
      <ol className="mb-5 list-decimal space-y-2 pl-6 font-serif text-base leading-relaxed text-slate-700 md:mb-8 md:space-y-3 md:text-[1.125rem] md:leading-[1.85] dark:text-slate-300">
        {children}
      </ol>
    ),
    [BLOCKS.LIST_ITEM]: (node, children) => (
      <li className="pl-1">
        {children}
      </li>
    ),
    [BLOCKS.QUOTE]: (node, children) => (
      <blockquote className="relative my-6 border-l-[3px] border-slate-800 py-1 pl-5 md:my-10 md:pl-6 dark:border-slate-200">
        <div className="font-serif text-lg italic leading-relaxed text-slate-600 md:text-xl dark:text-slate-300">
          {children}
        </div>
      </blockquote>
    ),
    [BLOCKS.HR]: () => (
      <hr className="my-8 border-none text-center before:text-2xl before:tracking-[1em] before:text-slate-300 before:content-['···'] md:my-12 dark:before:text-slate-600" />
    ),
    [BLOCKS.EMBEDDED_ASSET]: (node) => {
      const target = node.data.target;
      const fields = target?.fields || {};

      // Handle both resolved format and locale-specific format (e.g., fields.title['en-US'])
      const getFieldValue = (field) => {
        if (!field) return '';
        if (typeof field === 'string') return field;
        // If it's an object with locale keys, get the first value
        if (typeof field === 'object') {
          const values = Object.values(field);
          return values[0] || '';
        }
        return '';
      };

      // Get file URL - handle both formats
      let imageUrl = '';
      if (fields.file?.url) {
        imageUrl = `https:${fields.file.url}`;
      } else if (fields.file && typeof fields.file === 'object') {
        const fileData = Object.values(fields.file)[0];
        if (fileData?.url) {
          imageUrl = `https:${fileData.url}`;
        }
      }

      const title = getFieldValue(fields.title);
      const description = getFieldValue(fields.description);

      if (!imageUrl) return null;

      return (
        <figure className="my-6 md:my-10">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md">
            <Image
              src={imageUrl}
              alt={description || title || 'Article image'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              quality={85}
            />
          </div>
          {(title || description) && (
            <figcaption className="mt-3 text-center font-sans text-sm text-slate-500 dark:text-slate-400">
              {description || title}
            </figcaption>
          )}
        </figure>
      );
    },
    [INLINES.HYPERLINK]: (node, children) => (
      <a
        href={node.data.uri}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#00BFFF] underline decoration-[#00BFFF]/30 underline-offset-2 transition-colors hover:text-[#0099CC] hover:decoration-[#0099CC]/50"
      >
        {children}
      </a>
    ),
  },
};

export default function ArticleContent({ content, className = "article-body" }) {
  if (!content) {
    return (
      <div className="py-16 text-center font-sans text-slate-400">
        <p>No content available.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {documentToReactComponents(content, renderOptions)}
    </div>
  );
}
