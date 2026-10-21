'use client';
/** Tiny dependency-free SVG charts. */
export function AreaChart({ data, height = 180, color = 'var(--brand)', label }: { data: { x: string; y: number }[]; height?: number; color?: string; label?: (v: number) => string }) {
  const w = 600, h = height, pad = 24;
  if (!data.length) return <div className="grid place-items-center text-sm text-muted" style={{ height }}>Chưa có dữ liệu</div>;
  const max = Math.max(1, ...data.map((d) => d.y));
  const pts = data.map((d, i) => [pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1), h - pad - (d.y / max) * (h - pad * 2)]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
  const id = `g${Math.abs(color.length * 31 + data.length)}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".35" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      {[0.25, 0.5, 0.75, 1].map((t) => <line key={t} x1={pad} x2={w - pad} y1={h - pad - t * (h - pad * 2)} y2={h - pad - t * (h - pad * 2)} stroke="var(--line)" strokeDasharray="3 4" />)}
      <path d={`${line} L${pts[pts.length - 1][0]},${h - pad} L${pts[0][0]},${h - pad} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill="var(--card)" stroke={color} strokeWidth="2"><title>{data[i].x}: {label ? label(data[i].y) : data[i].y}</title></circle>)}
      <text x={pad} y={h - 4} fontSize="11" fill="var(--muted)">{data[0].x.slice(5)}</text>
      <text x={w - pad} y={h - 4} fontSize="11" fill="var(--muted)" textAnchor="end">{data[data.length - 1].x.slice(5)}</text>
      <text x={pad} y={14} fontSize="11" fill="var(--muted)">{label ? label(max) : max}</text>
    </svg>
  );
}

export function fillDays(rows: { day: string; [k: string]: any }[], key: string, days: number) {
  const m = new Map(rows.map((r) => [r.day, r[key]]));
  const out: { x: string; y: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5 + 7 * 3600e3).toISOString().slice(0, 10);
    out.push({ x: d, y: m.get(d) || 0 });
  }
  return out;
}
