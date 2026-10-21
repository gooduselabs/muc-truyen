import { Reader } from './reader';
export default async function ReaderPage({ params }: { params: Promise<{ slug: string; n: string }> }) {
  const { slug, n } = await params;
  return <Reader slug={slug} n={Number(n)} />;
}
