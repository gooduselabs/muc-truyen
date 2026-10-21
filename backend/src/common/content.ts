/** Helpers for Vietnamese text and Tiptap documents (pure, unit-tested). */

export function normalizeVi(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
}

export function slugify(s: string): string {
  return normalizeVi(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'truyen';
}

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function inline(nodes: any[] = []): string {
  return nodes.map((n) => {
    if (n.type === 'hardBreak') return '<br/>';
    if (n.type !== 'text') return '';
    let t = esc(n.text || '');
    for (const m of n.marks || []) {
      if (m.type === 'bold') t = `<strong>${t}</strong>`;
      else if (m.type === 'italic') t = `<em>${t}</em>`;
      else if (m.type === 'strike') t = `<s>${t}</s>`;
    }
    return t;
  }).join('');
}

export interface Paragraph { type: 'p' | 'h' | 'quote' | 'hr'; html: string; text: string }

/** Flattens a Tiptap/ProseMirror JSON doc into addressable paragraphs (index = comment anchor). */
export function toParagraphs(doc: any): Paragraph[] {
  const out: Paragraph[] = [];
  const walk = (nodes: any[] = [], quote = false) => {
    for (const n of nodes) {
      if (n.type === 'paragraph' || n.type === 'heading') {
        const html = inline(n.content);
        const text = html.replace(/<[^>]+>/g, '');
        if (!text.trim()) continue;
        out.push({ type: quote ? 'quote' : n.type === 'heading' ? 'h' : 'p', html, text });
      } else if (n.type === 'horizontalRule') out.push({ type: 'hr', html: '', text: '' });
      else if (n.type === 'blockquote') walk(n.content, true);
      else if (n.content) walk(n.content, quote);
    }
  };
  walk(doc?.content || []);
  return out;
}

export function wordCount(ps: Paragraph[]): number {
  return ps.reduce((a, p) => a + (p.text.trim() ? p.text.trim().split(/\s+/).length : 0), 0);
}

/** Builds a Tiptap doc from plain text (blank-line separated) — used by seed + import. */
export function docFromText(text: string): any {
  return {
    type: 'doc',
    content: text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean).map((b) =>
      b === '***' ? { type: 'horizontalRule' } : { type: 'paragraph', content: [{ type: 'text', text: b.replace(/\n/g, ' ') }] }),
  };
}
