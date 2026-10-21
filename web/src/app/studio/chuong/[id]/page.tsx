'use client';
import Link from 'next/link';
import { use, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { ArrowLeft, Bold, CalendarClock, Check, Coins, Heading2, Italic, Loader2, Maximize2, Minus, Quote, Redo2, Send, Strikethrough, Trash2, Undo2 } from 'lucide-react';
import { api } from '@/lib/api';
import { RequireAuth } from '@/components/require-auth';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input, Label } from '@/components/ui/misc';
import { useToast } from '@/components/toast';
import { cn } from '@/lib/utils';

function Tool({ on, active, children, label }: { on: () => void; active?: boolean; children: React.ReactNode; label: string }) {
  return <button onClick={on} aria-label={label} title={label} className={cn('grid size-9 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-bg-soft hover:text-fg', active && 'bg-fg text-bg hover:bg-fg hover:text-bg')}>{children}</button>;
}

function Editor({ id }: { id: string }) {
  const toast = useToast();
  const router = useRouter();
  const [ch, setCh] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState(0);
  const [saved, setSaved] = useState<'saved' | 'dirty' | 'saving'>('saved');
  const [pub, setPub] = useState(false);
  const [when, setWhen] = useState('');
  const [focus, setFocus] = useState(false);
  const [, force] = useState(0);
  const timer = useRef<any>(null);
  const saveRef = useRef<() => Promise<any>>(async () => {});
  const loaded = useRef(false);

  const schedule = () => { if (!loaded.current) return; setSaved('dirty'); clearTimeout(timer.current); timer.current = setTimeout(() => saveRef.current(), 2000); };
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit.configure({ heading: { levels: [2] } }), Placeholder.configure({ placeholder: 'Bắt đầu kể câu chuyện của bạn…' })],
    editorProps: { attributes: { class: 'tiptap font-serif text-[19px] leading-[1.9]' } },
    onUpdate: () => schedule(),
    onSelectionUpdate: () => force((x) => x + 1),
  });

  useEffect(() => {
    if (!editor) return;
    api(`/studio/chapters/${id}`).then((c) => {
      setCh(c); setTitle(c.title); setPrice(c.price);
      editor.commands.setContent(c.contentJson);
      setTimeout(() => { loaded.current = true; }, 0);
    }).catch((e) => toast(e.message, true));
  }, [id, editor]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback(async (extra: any = {}) => {
    if (!editor) return;
    setSaved('saving');
    try {
      const c = await api(`/studio/chapters/${id}`, { method: 'PATCH', body: { title, price, content: editor.getJSON(), ...extra } });
      setCh((o: any) => ({ ...o, ...c })); setSaved('saved'); return c;
    } catch (e: any) { toast(e.message, true); setSaved('dirty'); throw e; }
  }, [editor, id, title, price, toast]);
  saveRef.current = save;
  useEffect(() => { schedule(); }, [title, price]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); save(); } };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [save]);

  const words = editor ? (editor.getText().trim().match(/\S+/g) || []).length : 0;
  const publish = async (mode: 'now' | 'schedule' | 'draft') => {
    try {
      await save(mode === 'now' ? { status: 'PUBLISHED' } : mode === 'schedule' ? { status: 'SCHEDULED', publishAt: new Date(when).toISOString() } : { status: 'DRAFT' });
      toast(mode === 'now' ? 'Đã đăng chương! Người theo dõi sẽ nhận thông báo.' : mode === 'schedule' ? 'Đã hẹn giờ đăng' : 'Đã chuyển về nháp');
      setPub(false);
    } catch { /* toast shown */ }
  };
  const del = async () => { if (!confirm('Xoá chương này?')) return; try { await api(`/studio/chapters/${id}`, { method: 'DELETE' }); router.push(`/studio/truyen/${ch.story.id}`); } catch (e: any) { toast(e.message, true); } };
  const status = ch?.status;

  return (
    <div className="min-h-screen bg-bg">
      <header className={cn('glass sticky top-0 z-30 border-b border-line transition-opacity duration-500', focus && 'opacity-0 hover:opacity-100')}>
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <Link href={ch ? `/studio/truyen/${ch.story.id}` : '/studio'} className="grid size-9 place-items-center rounded-full hover:bg-bg-soft" aria-label="Quay lại"><ArrowLeft className="size-5" /></Link>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{ch?.story.title}</div>
            <div className="flex items-center gap-1.5 text-xs text-muted">
              {saved === 'saving' ? <><Loader2 className="size-3 animate-spin" />Đang lưu…</> : saved === 'dirty' ? 'Chưa lưu' : <><Check className="size-3 text-emerald-500" />Đã lưu nháp tự động</>}
              <span>· {words.toLocaleString('vi-VN')} chữ</span>
              {status && <span className={cn('ml-1 rounded-full px-2 py-0.5 font-semibold', status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-600' : status === 'SCHEDULED' ? 'bg-sky-500/10 text-sky-600' : 'bg-bg-soft')}>{status === 'PUBLISHED' ? 'Đã đăng' : status === 'SCHEDULED' ? `Hẹn ${new Date(ch.publishAt).toLocaleString('vi-VN')}` : 'Bản nháp'}</span>}
            </div>
          </div>
          <button onClick={() => setFocus(!focus)} className="hidden size-9 place-items-center rounded-full text-muted hover:bg-bg-soft sm:grid" title="Chế độ tập trung"><Maximize2 className="size-4" /></button>
          <Button variant="outline" size="sm" onClick={() => save()}>Lưu</Button>
          <Button size="sm" onClick={() => setPub(true)}><Send />{status === 'PUBLISHED' ? 'Cập nhật' : 'Đăng'}</Button>
        </div>
        <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 pb-2">
          <Tool label="In đậm" on={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')}><Bold className="size-4" /></Tool>
          <Tool label="In nghiêng" on={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')}><Italic className="size-4" /></Tool>
          <Tool label="Gạch ngang" on={() => editor?.chain().focus().toggleStrike().run()} active={editor?.isActive('strike')}><Strikethrough className="size-4" /></Tool>
          <span className="mx-1 h-5 w-px shrink-0 bg-line" />
          <Tool label="Tiêu đề" on={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive('heading')}><Heading2 className="size-4" /></Tool>
          <Tool label="Trích dẫn" on={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive('blockquote')}><Quote className="size-4" /></Tool>
          <Tool label="Ngắt cảnh" on={() => editor?.chain().focus().setHorizontalRule().run()}><Minus className="size-4" /></Tool>
          <span className="mx-1 h-5 w-px shrink-0 bg-line" />
          <Tool label="Hoàn tác" on={() => editor?.chain().focus().undo().run()}><Undo2 className="size-4" /></Tool>
          <Tool label="Làm lại" on={() => editor?.chain().focus().redo().run()}><Redo2 className="size-4" /></Tool>
          <div className="ml-auto flex shrink-0 items-center gap-2 pl-4 text-sm">
            <Coins className="size-4 text-gold" />
            <select value={price} onChange={(e) => setPrice(Number(e.target.value))} className="h-8 rounded-full border border-line bg-card px-3 text-sm outline-none" aria-label="Giá chương">
              {[0, 3, 4, 5, 6, 8, 10].map((v) => <option key={v} value={v}>{v === 0 ? 'Miễn phí' : `${v} xu`}</option>)}
            </select>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[720px] px-6 pb-40 pt-14">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tên chương"
          className="w-full bg-transparent font-serif text-4xl font-bold outline-none placeholder:text-muted/50" />
        <div className="mb-10 mt-2 text-sm text-muted">Chương {ch?.number}</div>
        <EditorContent editor={editor} />
      </main>

      <Dialog open={pub} onOpenChange={setPub} title="Đăng chương">
        <div className="space-y-3">
          <button onClick={() => publish('now')} className="flex w-full items-center gap-4 rounded-2xl border-2 border-brand bg-brand-soft/40 p-4 text-left">
            <Send className="size-5 text-brand" /><div><div className="font-semibold">Đăng ngay</div><div className="text-xs text-muted">Người theo dõi và độc giả có truyện trong tủ sẽ được thông báo.</div></div>
          </button>
          <div className="rounded-2xl border border-line p-4">
            <div className="flex items-center gap-4"><CalendarClock className="size-5 text-sky-500" /><div className="font-semibold">Hẹn giờ đăng</div></div>
            <Label className="mt-3">Thời điểm (giờ Việt Nam)</Label>
            <div className="flex gap-2"><Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /><Button variant="outline" disabled={!when} onClick={() => publish('schedule')}>Hẹn</Button></div>
          </div>
          {status === 'SCHEDULED' && <Button variant="ghost" className="w-full" onClick={() => publish('draft')}>Huỷ hẹn, chuyển về nháp</Button>}
          <div className="rounded-2xl bg-bg-soft p-4 text-xs text-muted">Giá chương: <b className="text-gold">{price ? `${price} xu` : 'Miễn phí'}</b>{price > 0 && ` · thuê 48h: ${Math.max(1, Math.ceil(price * 0.4))} xu · bạn nhận 70%`}</div>
          <button onClick={del} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-brand"><Trash2 className="size-4" />Xoá chương</button>
        </div>
      </Dialog>
    </div>
  );
}

export default function P({ params }: { params: Promise<{ id: string }> }) { const { id } = use(params); return <RequireAuth><Editor id={id} /></RequireAuth>; }
