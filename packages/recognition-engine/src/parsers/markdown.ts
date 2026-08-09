/**
 * Parser Markdown: usa remark + remark-gfm para parsear a AST y extraer
 * texto y tablas, luego delega al reconocedor compartido.
 */
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import { recognizeBlocks, type RecognitionResult } from '../recognize';
import { normalizeToSchedule } from '../normalize';
import type { Schedule } from '@canectt/schema';

// Tipos mínimos del AST mdast que usamos (evita depender de @types/mdast
// en el servicio de tipos de ESLint).
interface MdNode {
  type: string;
  value?: string;
  children?: MdNode[];
}
interface MdParent extends MdNode {
  children: MdNode[];
}

function isParent(node: MdNode): node is MdParent {
  return Array.isArray(node.children);
}

/** Convierte un AST de remark a texto plano, incluyendo tablas como texto alineado. */
function astToText(tree: MdNode): string {
  const lines: string[] = [];

  function visit(node: MdNode): void {
    if (node.type === 'text' && typeof node.value === 'string') {
      lines.push(node.value);
      return;
    }
    if (node.type === 'heading' && isParent(node)) {
      const text = node.children.map((c) => (typeof c.value === 'string' ? c.value : '')).join('');
      lines.push(text);
      return;
    }
    if (node.type === 'listItem' && isParent(node)) {
      const text = node.children
        .filter(isParent)
        .flatMap((c) => c.children.map((cc) => (typeof cc.value === 'string' ? cc.value : '')))
        .join(' ');
      lines.push(text);
      return;
    }
    if (node.type === 'table' && isParent(node)) {
      for (const row of node.children) {
        if (!isParent(row)) continue;
        const cells = row.children
          .filter(isParent)
          .map((cell) =>
            cell.children.map((c) => (typeof c.value === 'string' ? c.value : '')).join(''),
          );
        lines.push(cells.join('  '));
      }
      return;
    }
    if (node.type === 'paragraph' && isParent(node)) {
      const text = node.children.map((c) => (typeof c.value === 'string' ? c.value : '')).join('');
      lines.push(text);
      return;
    }
    if (isParent(node)) {
      for (const child of node.children) visit(child);
    }
  }

  visit(tree);
  return lines.join('\n');
}

export interface ParseMarkdownOptions {
  title?: string;
  timezone?: string;
}

/** Parsea un documento Markdown a un Schedule canónico. */
export function parseMarkdown(
  content: string,
  options: ParseMarkdownOptions = {},
): { schedule: Schedule; recognition: RecognitionResult } {
  const tree = remark().use(remarkGfm).parse(content) as unknown as MdNode;
  const text = astToText(tree);
  const recognition = recognizeBlocks(text);
  const schedule = normalizeToSchedule(recognition, {
    title: options.title,
    timezone: options.timezone,
  });
  return { schedule, recognition };
}
