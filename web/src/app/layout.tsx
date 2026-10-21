import type { Metadata } from 'next';
import { Be_Vietnam_Pro, Lora } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from '@/components/toast';
import { Footer, Header } from '@/components/header';

const ui = Be_Vietnam_Pro({ subsets: ['vietnamese', 'latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-ui', display: 'swap' });
const read = Lora({ subsets: ['vietnamese', 'latin'], weight: ['400', '500', '600', '700'], style: ['normal', 'italic'], variable: '--font-read', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Mực — Đọc & viết truyện Việt', template: '%s · Mực' },
  description: 'Cộng đồng đọc và viết truyện của người Việt: truyện gốc, bình luận theo đoạn, chờ là miễn phí, ủng hộ tác giả.',
};

const themeScript = `try{var t=localStorage.getItem('muc_theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${ui.variable} ${read.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className="paper min-h-screen">
        <AuthProvider>
          <ToastProvider>
            <Header />
            <main>{children}</main>
            <Footer />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
