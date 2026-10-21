import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn = (...i: ClassValue[]) => twMerge(clsx(i));

export const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { notation: n >= 10000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(n);
export const vnd = (n: number) => `${new Intl.NumberFormat('vi-VN').format(n)}đ`;

export function ago(d: string | Date | null | undefined) {
  if (!d) return '';
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 0) return `sau ${Math.ceil(-s / 3600)} giờ`;
  if (s < 60) return 'vừa xong';
  if (s < 3600) return `${Math.floor(s / 60)} phút trước`;
  if (s < 86400) return `${Math.floor(s / 3600)} giờ trước`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} ngày trước`;
  return new Date(d).toLocaleDateString('vi-VN');
}

export const AGE_LABEL: Record<string, string> = { ALL: 'Mọi lứa tuổi', T13: '13+', T16: '16+', T18: '18+' };
export const STATUS_LABEL: Record<string, string> = { ONGOING: 'Đang ra', COMPLETED: 'Hoàn thành', HIATUS: 'Tạm ngưng' };
