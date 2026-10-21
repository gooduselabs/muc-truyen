import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { sget } from '@/lib/api';
import { StoryClient } from './story-client';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const s = await sget(`/stories/${(await params).slug}`);
  return s ? { title: s.title, description: s.synopsis.slice(0, 160) } : {};
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await sget(`/stories/${slug}`);
  if (!story) notFound();
  const recs = (await sget(`/discover/recommend?story=${story.id}`)) || [];
  return <StoryClient initial={story} recs={recs} />;
}
