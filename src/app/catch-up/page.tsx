'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, Newspaper } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';

interface ArticleItem {
  title: string;
  description: string;
  url: string;
  source: string;
  image?: string;
  published_at?: string;
  country?: string;
}

export default function CatchUpPage() {
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/news?limit=15', { cache: 'no-store' });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || 'Failed to load news');
        }
        const data = await response.json();
        setArticles(Array.isArray(data?.articles) ? data.articles : []);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <a
                href="/dashboard"
                className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </a>
              <div className="h-6 w-px bg-slate-600"></div>
              <div className="flex items-center">
                <Newspaper className="h-6 w-6 text-indigo-400 mr-2" />
                <h1 className="text-2xl font-bold text-white">Catch-up</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="bg-slate-800 rounded-lg shadow-lg p-8 text-center border border-slate-700">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-2 text-slate-400">Fetching the latest financial headlines...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-200 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.slice(0, 15).map((article, idx) => (
              <a
                key={`${article.url}-${idx}`}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-slate-800 border border-slate-700 rounded-lg overflow-hidden hover:border-indigo-600 transition-colors flex flex-col"
                title={article.title}
              >
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-white font-semibold leading-snug group-hover:text-indigo-400">
                    {article.title}
                  </h3>
                  {article.description && (
                    <p className="mt-2 text-slate-400 text-sm line-clamp-3">
                      {article.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center text-slate-400 text-xs justify-between">
                    <span>{article.source || 'Source'}</span>
                    {article.published_at && (
                      <span>{new Date(article.published_at).toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <span className="inline-flex items-center text-indigo-400 text-sm">
                    Read more <ExternalLink className="h-4 w-4 ml-1" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


