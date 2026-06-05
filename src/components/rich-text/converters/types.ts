import type { DefaultNodeTypes } from '@payloadcms/richtext-lexical';

/**
 * Node types handled by the rich-text JSX converters.
 *
 * Currently covers all Payload default Lexical nodes (headings, paragraphs,
 * lists, links, uploads, tables, horizontal rules, line breaks). When a
 * collection adds custom blocks, widen this union and add a matching converter.
 */
export type NodeTypes = DefaultNodeTypes;
