import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = process.env.MEDIASTACK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Server misconfiguration: missing MEDIASTACK_API_KEY' }, { status: 500 });
    }

    const limitParam = parseInt(searchParams.get('limit') || '10', 10);
    const limit = Math.min(Math.max(limitParam, 1), 15);

    const params = new URLSearchParams();
    params.set('access_key', apiKey);
    params.set('countries', 'in');
    params.set('languages', 'en');
    params.set('categories', 'business');
    params.set('limit', String(limit));
    params.set('sort', 'published_desc');

    const url = `http://api.mediastack.com/v1/news?${params.toString()}`;

    const response = await fetch(url, { 
      next: { revalidate: 60 },
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({ error: 'Failed to fetch news', details: text }, { status: 502 });
    }
    const data = await response.json();
    const articles = Array.isArray(data?.data) ? data.data : [];

    type IncomingArticle = {
      title?: string;
      description?: string;
      url?: string;
      source?: string;
      image?: string;
      published_at?: string;
      country?: string;
    };

    const sanitized = articles.slice(0, limit).map((a: IncomingArticle) => ({
      title: a?.title ?? '',
      description: a?.description ?? '',
      url: a?.url ?? '',
      source: a?.source ?? '',
      image: a?.image ?? '',
      published_at: a?.published_at ?? '',
      country: a?.country ?? '',
    }));

    return NextResponse.json({ 
      articles: sanitized,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}


